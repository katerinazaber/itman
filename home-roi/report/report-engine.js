/**
 * ROI report engine — расчёт + персонализация отчёта.
 * Модель Base 2026 — тот же расчёт, что в лид-магните (roi-embed.js) и в
 * ITMen_ROI_Model_2026.xlsx. Вход: устройства / ПК и серверы / виртуализация /
 * сотрудники учёта (FTE) / % продления / % докупки ПО.
 */
(function (global) {
  "use strict";

  /* ===== Модель Base 2026 (синхрон с roi-embed.js / ITMen_ROI_Model_2026.xlsx) ===== */
  var CONST = {
    pricePerDevice: 2000,
    salaryGross: 200000,
    unusedRate: 0.1,
    opexShareFromY2: 0.3,
    implPersonMonths: 3,
    computeShareDefault: 0.8,
    addressableShare: 0.5,
    laborCapture: 0.25,
    hwCapture: 0.03,
    licY2ShareOfAddressable: 0.7,
    laborY2Mult: 1.6,
    hwY2Mult: 1.67,
    inventoryBenefitPerDevice: 900,
    inventoryCaptureY1: 0.35,
    inventoryCaptureY2: 0.5,
    otherFteWeight: 0.35,
  };

  var COSTS = {
    "100-1000": { noVirt: { sw: 24000, hw: 32000 }, virt: { sw: 27000, hw: 27000 } },
    "1000-5000": { noVirt: { sw: 21500, hw: 29000 }, virt: { sw: 24000, hw: 24500 } },
    "5000-20000": { noVirt: { sw: 19000, hw: 26000 }, virt: { sw: 21500, hw: 22000 } },
    "20000+": { noVirt: { sw: 16500, hw: 22500 }, virt: { sw: 19000, hw: 19000 } },
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function band(n) {
    if (n >= 20000) return "20000+";
    if (n >= 5000) return "5000-20000";
    if (n >= 1000) return "1000-5000";
    return "100-1000";
  }
  function estimateFte(computeEp, otherEp) {
    var weighted = computeEp + otherEp * CONST.otherFteWeight;
    return Math.round(clamp(0.3 + weighted / 8000, 0.3, 3) * 10) / 10;
  }
  function unitCosts(computeEp, virtMode) {
    var b = band(Math.max(computeEp, 1));
    var row = COSTS[b] || COSTS["100-1000"];
    if (virtMode === "low") return row.noVirt;
    if (virtMode === "high") return row.virt;
    return {
      sw: Math.round((row.noVirt.sw + row.virt.sw) / 2),
      hw: Math.round((row.noVirt.hw + row.virt.hw) / 2),
    };
  }
  var VIRT_LABEL = { low: "небольшая часть", mid: "примерно половина", high: "большинство" };

  function fmtRub(n) {
    if (!isFinite(n)) return "—";
    return (
      Math.round(n).toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽"
    );
  }

  function fmtRubShort(n) {
    if (!isFinite(n)) return "—";
    var abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(".", ",") + " млрд ₽";
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " млн ₽";
    if (abs >= 1e3) return Math.round(n / 1e3).toLocaleString("ru-RU") + " тыс. ₽";
    return fmtRub(n);
  }

  function fmtNum(n, digits) {
    if (!isFinite(n)) return "—";
    return (Math.round(n * 10 ** digits) / 10 ** digits)
      .toString()
      .replace(".", ",");
  }

  function paybackLabel(months) {
    if (!isFinite(months) || months <= 0) return "—";
    if (months < 12) {
      var m = Math.max(1, Math.round(months));
      if (m === 1) return "около 1 месяца";
      if (m < 5) return "около " + m + " месяцев";
      return Math.round(months) + " месяцев";
    }
    var years = months / 12;
    var v = fmtNum(years, 1);
    var n = Number(String(v).replace(",", "."));
    if (n === 1) return v + " год";
    if (n >= 2 && n < 5) return v + " года";
    return v + " лет";
  }

  function segmentOf(devices) {
    if (devices < 500) return "smb";
    if (devices < 5000) return "mid";
    return "enterprise";
  }

  function calculate(inputs) {
    var devices = Math.max(0, Number(inputs.devices || 0));
    var computeInput = Math.max(0, Number(inputs.compute || 0));
    var virt = (inputs.virt || "high").toLowerCase();
    if (virt !== "low" && virt !== "mid" && virt !== "high") virt = "high";
    var fteInput = Number(inputs.fte || 0);
    var extendPct = clamp(Number(inputs.extendPct || 0), 0, 100);
    var buyPct = clamp(Number(inputs.buyPct || 0), 0, 100);

    var computeEp = computeInput;
    var computeSynth = false;
    if (computeEp <= 0 && devices > 0) {
      computeEp = Math.round(devices * CONST.computeShareDefault);
      computeSynth = true;
    }
    computeEp = Math.min(computeEp, devices || computeEp);
    var otherEp = Math.max(0, devices - computeEp);

    var units = unitCosts(computeEp, virt);
    var swBudget = Math.round(computeEp * units.sw);
    var hwBudget = Math.round(computeEp * units.hw);

    var fte = fteInput;
    var fteSynth = false;
    if (!isFinite(fte) || fte <= 0) {
      fte = estimateFte(computeEp, otherEp);
      fteSynth = true;
    }

    var cashEventPct = clamp(extendPct + buyPct, 0, 100);
    var cashEventShare = cashEventPct / 100;

    var unusedPool = swBudget * CONST.unusedRate;
    var addressable = unusedPool * CONST.addressableShare;
    var licY1 = addressable * cashEventShare;
    var licY2 = addressable * CONST.licY2ShareOfAddressable;
    var hwY1 = hwBudget * CONST.hwCapture;
    var hwY2 = hwY1 * CONST.hwY2Mult;

    var laborY1 = fte * CONST.salaryGross * 12 * CONST.laborCapture;
    var laborY2 = laborY1 * CONST.laborY2Mult;

    var invPool = devices * CONST.inventoryBenefitPerDevice;
    var invY1 = invPool * CONST.inventoryCaptureY1;
    var invY2 = invPool * CONST.inventoryCaptureY2;

    var saveY1 = licY1 + laborY1 + hwY1 + invY1;
    var saveY2 = licY2 + laborY2 + hwY2 + invY2;
    var saveY3 = saveY2 * 1.05;
    var save3y = saveY1 + saveY2 + saveY3;

    var capex = devices * CONST.pricePerDevice;
    var opexY1 = (CONST.implPersonMonths / 12) * CONST.salaryGross;
    var opexY2 = capex * CONST.opexShareFromY2;
    var opexY3 = capex * CONST.opexShareFromY2;
    var investY1 = capex + opexY1;
    var investY2 = opexY2;
    var investY3 = opexY3;
    var invest3y = investY1 + investY2 + investY3;

    var monthly = saveY1 / 12;
    var paybackMonths = monthly > 0 ? investY1 / monthly : Infinity;
    var paybackYears = isFinite(paybackMonths) ? paybackMonths / 12 : NaN;
    var roi3y = investY1 > 0 ? ((save3y - invest3y) / investY1) * 100 : NaN;

    var parts = [
      { key: "licenses", label: "ПО и лицензии", value: licY1 },
      { key: "labor", label: "Трудозатраты учёта", value: laborY1 },
      { key: "hw", label: "Техника и парк устройств", value: hwY1 },
      { key: "inventory", label: "Полнота учёта активов", value: invY1 },
    ].sort(function (a, b) {
      return b.value - a.value;
    });

    return {
      inputs: {
        devices: devices,
        compute: computeInput,
        virt: virt,
        fte: fteInput,
        extendPct: extendPct,
        buyPct: buyPct,
        // legacy alias, использовалось в старых ссылках
        endpoints: devices,
        itStaff: Math.round(fte),
      },
      computed: {
        computeEp: computeEp,
        otherEp: otherEp,
        computeSynth: computeSynth,
        fte: fte,
        fteSynth: fteSynth,
        virtLabel: VIRT_LABEL[virt] || VIRT_LABEL.high,
      },
      assumptions: {
        unusedRate: CONST.unusedRate,
        addressableShare: CONST.addressableShare,
        laborCapture: CONST.laborCapture,
        hwCapture: CONST.hwCapture,
        inventoryCaptureY1: CONST.inventoryCaptureY1,
        salaryGross: CONST.salaryGross,
        pricePerDevice: CONST.pricePerDevice,
        swUnit: units.sw,
        hwUnit: units.hw,
      },
      breakdown: {
        licenses: licY1,
        labor: laborY1,
        hw: hwY1,
        inventory: invY1,
      },
      breakdownY2: {
        licenses: licY2,
        labor: laborY2,
        hw: hwY2,
        inventory: invY2,
      },
      dominant: parts[0].key,
      savingsTotal: saveY1,
      saveY1: saveY1,
      saveY2: saveY2,
      saveY3: saveY3,
      save3y: save3y,
      capex: capex,
      opexY1: opexY1,
      opexY2: opexY2,
      opexY3: opexY3,
      investY1: investY1,
      investY2: investY2,
      investY3: investY3,
      invest3y: invest3y,
      swBudget: swBudget,
      hwBudget: hwBudget,
      roi: roi3y,
      paybackMonths: paybackMonths,
      paybackYears: paybackYears,
      segment: segmentOf(devices),
      fmt: {
        save: fmtRubShort(saveY1),
        saveFull: fmtRub(saveY1),
        saveY2: fmtRubShort(saveY2),
        saveY3: fmtRubShort(saveY3),
        save3y: fmtRubShort(save3y),
        cost: fmtRubShort(investY1),
        costFull: fmtRub(investY1),
        invest3y: fmtRubShort(invest3y),
        roi: isFinite(roi3y) ? fmtNum(roi3y, 0) + "%" : "—",
        pay: paybackLabel(paybackMonths),
        licenses: fmtRubShort(licY1),
        labor: fmtRubShort(laborY1),
        hw: fmtRubShort(hwY1),
        inventory: fmtRubShort(invY1),
        budget: fmtRubShort(swBudget),
        devices: devices.toLocaleString("ru-RU"),
        compute: computeEp.toLocaleString("ru-RU"),
        fte: fmtNum(fte, 1),
      },
    };
  }

  /** Банк рекомендаций / аргументов по ответам */
  function buildNarrative(calc) {
    var seg = calc.segment;
    var dom = calc.dominant;
    var f = calc.fmt;
    var devices = calc.inputs.devices;
    var fte = calc.computed.fte;

    var scaleLine =
      seg === "smb"
        ? "При таком масштабе (до 500 устройств) основной эффект дают прозрачность лицензий и отказ от ручной инвентаризации. Компания меньше тратит на лишние закупки, а команда учёта меньше занимается рутиной."
        : seg === "mid"
          ? "При таком масштабе (500–5000 устройств) основной эффект дают учёт лицензий (SAM) и учёт жизненного цикла оборудования. Компания меньше тратит на лишние закупки, а команда учёта меньше занимается рутиной."
          : "При таком масштабе (более 5000 устройств) основной эффект дают нормализация ПО, учёт лицензий (SAM), управление жизненным циклом оборудования и автоматизация аудитов. Компания меньше тратит на лишние закупки, а команда учёта меньше занимается рутиной.";

    var driverLine =
      dom === "licenses"
        ? "Главный источник экономии по вашим данным — оптимизация ПО и лицензий, около " +
          f.licenses +
          " в год. Данные об использовании ПО позволяют закупать лицензии по факту использования, а не «про запас»."
        : dom === "labor"
          ? "Главный источник экономии по вашим данным: меньше трудозатрат на учёт техники и лицензий, " +
            f.labor +
            " в год. Ручной аудит превращается в выгрузку готового отчёта."
          : dom === "hw"
            ? "Главный источник экономии по вашим данным — управление жизненным циклом техники, около " +
              f.hw +
              " в год. Решения о замене и апгрейде принимаются по факту состояния парка, а не «на глаз»."
            : "Главный источник экономии по вашим данным — устранение потерь из-за неполного учёта активов, около " +
              f.inventory +
              " в год. Единый достоверный реестр вместо разрозненных и устаревших выгрузок.";

    var forExec = [
      "Экономия около " + f.save + " в год (1-й год), за 3 года — " + f.save3y + ".",
      "Окупается примерно за " + f.pay.replace(/^около\s+/, "") + ".",
      "Один достоверный реестр ИТ-активов вместо разрозненных выгрузок.",
      seg === "smb"
        ? "При вашем масштабе инфраструктуры основной эффект дают прозрачность лицензий и автоматизация инвентаризации: так происходит меньше лишних закупок и снижаются рутинные операции по учёту."
        : seg === "mid"
          ? "При вашем масштабе инфраструктуры основной эффект даёт SAM-подход и учёт жизненного цикла оборудования: так происходит меньше лишних закупок и снижаются рутинные операции по учёту."
          : "При вашем масштабе инфраструктуры основной эффект дают SAM-подход, нормализация ПО и учёт жизненного цикла оборудования: так происходит меньше лишних закупок и снижаются рутинные операции по учёту.",
    ];

    var forFinance = [
      "Экономия 1-го года раскладывается на четыре статьи: ПО около " +
        f.licenses +
        ", техника около " +
        f.hw +
        ", труд команды учёта около " +
        f.labor +
        ", полнота учёта активов около " +
        f.inventory +
        ".",
      "Формула считается на базе оценённого бюджета на ПО (по числу ПК/серверов и уровню виртуализации), парка устройств и ФОТ команды учёта.",
      "Инвестиции в 1-й год " + f.cost + " включают лицензию ИТМен на парк устройств и внедрение; во 2–3 годы — сопровождение.",
      "Пилот на одном сегменте инфраструктуры фиксирует точку отсчёта, и уже через 1–3 месяца виден реальный эффект.",
    ];

    var forSecurity = [
      "Полный охват контура помогает фиксировать ИТ-активы в «серых зонах» и закрытых сегментах сети: неучтённые устройства и ПО становятся видны.",
      "Нормализация ПО и контроль установок закрывают лицензионные риски и вопросы ИБ.",
      "История изменений конфигурации служит доказательной базой при разборе инцидентов.",
      "Даже при среднем масштабе инфраструктуры единый реестр ускоряет реакцию ИБ и снижает риск использования запрещённого ПО.",
    ];

    var recommendations = [];
    if (dom === "licenses" || calc.inputs.extendPct + calc.inputs.buyPct >= 30) {
      recommendations.push({
        title: "Оптимизация лицензий и SAM",
        text: "Ввести контроль установленного vs используемого ПО; вычистить неиспользуемое (ориентир — ПО без запусков >90 дней); нормализовать названия до эталонного SKU (ИТМен + Призма данных).",
      });
    }
    if (dom === "hw" || devices >= 500) {
      recommendations.push({
        title: "Жизненный цикл оборудования",
        text: "Решения о замене ПК и серверов принимать по факту CPU/RAM/диска и требованиям ПО, а не только по сроку амортизации; формировать пул комплектующих для переиспользования.",
      });
    }
    if (dom === "labor" || fte >= 15) {
      recommendations.push({
        title: "Автоматизация инвентаризации и аудита",
        text: "Перевести периодические «проекты инвентаризации» в непрерывный сбор: агенты + сеть + AD/FreeIPA. Трудозатраты команды учёта на аудит в материалах кейсов сокращаются кратно.",
      });
    }
    if (dom === "inventory" || devices >= 1000) {
      recommendations.push({
        title: "Единый реестр активов",
        text: "Свести оборудование, ПО и лицензии в один достоверный реестр с историей изменений — вместо периодических «инвентаризационных проектов» и разрозненных таблиц.",
      });
    }
    if (seg === "enterprise") {
      recommendations.push({
        title: "Импортозамещение без лишних закупок",
        text: "Сначала карта «что реально используется», затем план миграции — чтобы не закупать лицензии и железо «с запасом» на выведенные из эксплуатации системы.",
      });
    }
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Единый источник правды",
        text: "Свести разрозненные списки устройств и ПО в один реестр с историей атрибутов — это база и для финансов, и для ИБ, и для ITSM/CMDB.",
      });
    }

    var nextSteps = [
      "Согласовать периметр пилота (подразделение / площадка / сегмент сети).",
      "Развернуть сбор данных и зафиксировать baseline: лицензии, парк устройств, трудозатраты команды учёта.",
      "Через 1–3 месяца — отчёт об экономии по четырём направлениям и решение о тиражировании.",
    ];

    // ITIL 4 Foundation (из БЗ) + контекст РИТМ (российский свод практик управления ИТ)
    var itilCore = [
      {
        practice: "Service configuration management",
        ru: "Управление конфигурациями сервиса",
        why: "Единый подтверждаемый реестр устройств и ПО вместо нескольких выгрузок; история атрибутов для CMDB/ITSM.",
      },
      {
        practice: "IT asset management",
        ru: "Управление ИТ-активами",
        why: "Учёт активов и лицензий, обоснование закупок, контроль «установлено vs куплено/используется».",
      },
      {
        practice: "Change control",
        ru: "Контроль изменений",
        why: "История изменений конфигурации — доказательная база для Change и разбора инцидентов.",
      },
      {
        practice: "Measurement and reporting",
        ru: "Измерение и отчётность",
        why: "Usage ПО и регулярные отчёты для руководства вместо ручных обходов.",
      },
    ];

    var itilFocus =
      dom === "licenses"
        ? [
            itilCore[1],
            itilCore[3],
            itilCore[0],
            {
              practice: "Service financial management",
              ru: "Финансовое управление сервисами",
              why: "Прозрачная картина затрат на ПО и лицензии для бюджетирования и продлений.",
            },
          ]
        : dom === "labor"
          ? [
              itilCore[0],
              {
                practice: "Continual improvement",
                ru: "Непрерывное улучшение",
                why: "Данные инвентаризации питают ITSM/BI и цикл улучшений без «проектов аудита» каждый квартал.",
              },
              itilCore[2],
              itilCore[3],
            ]
          : dom === "hw"
            ? [
                itilCore[1],
                itilCore[0],
                {
                  practice: "Capacity and performance management",
                  ru: "Управление мощностью и производительностью",
                  why: "Решения апгрейд vs замена по факту железа и требованиям ПО, а не только по сроку амортизации.",
                },
                itilCore[2],
              ]
            : [itilCore[0], itilCore[1], itilCore[3], itilCore[2]];

    if (seg === "enterprise") {
      itilFocus.push({
        practice: "Information security management",
        ru: "Управление информационной безопасностью",
        why: "Снижение «серой зоны» устройств и теневого ПО — меньше слепых зон для ИБ и комплаенса.",
      });
    }

    var ritm = {
      title: "РИТМ — российский контур практик управления ИТ",
      blurb:
        "Параллельно с ITIL 4 в РФ развивается проект РИТМ: общедоступный свод знаний по управлению ИТ на простом русском языке, с практическими процессами, ролями и артефактами. ИТМен не подменяет методологию — он даёт фактический контур данных, без которого и ITIL, и российские практики работают «вслепую».",
      link: "https://public.ritm.digital/project-definition/ustav-proekta",
      points: [
        "РИТМ нацелен на практичность и универсальность для организаций разного масштаба и зрелости.",
        "ИТМен закрывает «данные для практик»: активы, ПО, изменения, usage — то, что затем входит в процессы и KPI.",
        "В связке с Призмой данных нормализация ПО усиливает SAM и лицензионный контур — критично для аудитов и импортозамещения.",
      ],
    };

    var potentialShare =
      calc.swBudget > 0 ? (calc.saveY1 / calc.swBudget) * 100 : NaN;

    var directions = [
      {
        key: "licenses",
        title: "Оптимизация лицензий",
        value: calc.breakdown.licenses,
        formatted: f.licenses,
        formula:
          f.budget +
          " × " +
          Math.round(calc.assumptions.unusedRate * 100) +
          "% неиспользуемых × " +
          Math.round(calc.assumptions.addressableShare * 100) +
          "% адресных × " +
          Math.round(calc.inputs.extendPct + calc.inputs.buyPct) +
          "% (продление + докупка) = " +
          f.licenses,
        logic:
          "Диапазон основан на модельном потенциале перехода от учёта по факту закупки к управлению лицензиями на основе данных об использовании.",
        factors: [
          "неиспользуемые и избыточные лицензии",
          "дублирование программного обеспечения",
          "неэффективное распределение лицензий",
          "отсутствие данных о фактическом использовании",
        ],
        verification:
          "ИТМен сопоставляет установленное ПО, пользователей, лицензии и фактическое использование.",
      },
      {
        key: "labor",
        title: "Снижение ручных трудозатрат на учёт",
        value: calc.breakdown.labor,
        formatted: f.labor,
        formula:
          fmtNum(calc.computed.fte, 1) +
          " FTE × " +
          fmtRub(calc.assumptions.salaryGross) +
          " × 12 × " +
          String(calc.assumptions.laborCapture * 100).replace(".", ",") +
          "% = " +
          f.labor,
        logic:
          "Модель учитывает только небольшую долю ФОТ команды учёта, которая может приходиться на ручной сбор, сверку и актуализацию данных.",
        factors: [
          "ручной сбор информации",
          "подготовка инвентаризационных отчётов",
          "сверка данных из разных систем",
          "поиск информации по устройствам",
        ],
        verification:
          "ИТМен автоматизирует сбор, агрегацию и нормализацию данных об ИТ-активах.",
      },
      {
        key: "hw",
        title: "Управление жизненным циклом техники",
        value: calc.breakdown.hw,
        formatted: f.hw,
        formula:
          f.compute +
          " ПК и серверов × " +
          fmtRub(calc.assumptions.hwUnit) +
          " × " +
          Math.round(calc.assumptions.hwCapture * 100) +
          "% = " +
          f.hw,
        logic:
          "Оценка отражает консервативный потенциал более обоснованных решений по жизненному циклу оборудования и связанным закупкам.",
        factors: [
          "закупки техники без полной информации о состоянии парка",
          "несвоевременная замена и апгрейд компонентов",
          "избыточные закупки «про запас»",
          "отсутствие данных об использовании ресурсов",
        ],
        verification:
          "ИТМен фиксирует конфигурацию, возраст и состояние оборудования — для обоснованных решений о замене или апгрейде.",
      },
      {
        key: "inventory",
        title: "Снижение потерь из-за неполной картины",
        value: calc.breakdown.inventory,
        formatted: f.inventory,
        formula:
          f.devices +
          " устройств × " +
          fmtRub(CONST.inventoryBenefitPerDevice) +
          " × " +
          Math.round(CONST.inventoryCaptureY1 * 100) +
          "% = " +
          f.inventory,
        logic:
          "Оценка отражает консервативный потенциал устранения потерь от неполного и неактуального учёта активов.",
        factors: [
          "закупки без полной информации о текущих активах",
          "дублирование оборудования и записей",
          "невозможность быстро определить владельца актива",
          "ошибки и расхождения в реестрах",
        ],
        verification:
          "ИТМен объединяет сведения об активах и показывает их состав, владельцев, конфигурации и историю изменений.",
      },
    ];

    var priorities = directions
      .slice()
      .sort(function (a, b) {
        return b.value - a.value;
      })
      .map(function (item, index) {
        return {
          rank: index + 1,
          key: item.key,
          title: item.title,
          formatted: item.formatted,
        };
      });

    var validationQuestions = [
      {
        question: "Сколько ПО реально установлено?",
        answer: "ИТМен автоматически собирает данные с рабочих мест и серверов.",
      },
      {
        question: "Сколько лицензий реально используется?",
        answer: "Сопоставляем лицензии с пользователями и фактическим использованием.",
      },
      {
        question: "Где есть дублирование?",
        answer: "Объединяем данные из разных источников и нормализуем ПО.",
      },
      {
        question: "Какие активы отсутствуют в учёте?",
        answer: "Обнаруживаем устройства и ПО вне текущего реестра.",
      },
      {
        question: "Сколько времени команда учёта тратит на ручную работу?",
        answer: "Сравниваем текущий процесс с автоматизированным сбором данных.",
      },
    ];

    var stakeholderCases = [
      {
        role: "Генеральный директор",
        metric: f.save + " / год",
        title: "Управляемый потенциал вместо разрозненных инициатив",
        rationale:
          "Предварительная модель показывает совокупный потенциал оптимизации при сроке окупаемости " +
          f.pay +
          ". Единая картина ИТ-активов позволяет связать решения по ПО, технике и ресурсам команды учёта с измеримым бизнес-эффектом.",
      },
      {
        role: "ИТ-директор",
        metric:
          f.devices +
          " устройств · " +
          fmtNum(calc.computed.fte, 1) +
          " FTE учёта",
        title: "Контроль инфраструктуры и снижение ручной нагрузки",
        rationale:
          "ИТМен собирает и нормализует данные в едином реестре, показывает состав и использование активов. Это сокращает ручные сверки, повышает качество решений и даёт основу для управления ИТ-бюджетом.",
      },
      {
        role: "Финансы",
        metric:
          f.licenses + " ПО · " + f.hw + " техника · " + f.labor + " труд · " + f.inventory + " учёт",
        title: "Прозрачная структура экономического эффекта",
        rationale:
          "Каждая статья связана с известной базой и формулой. Фактические данные об использовании позволяют обосновывать закупки и продления, а пилот — подтвердить эффект до масштабирования.",
      },
      {
        role: "Информационная безопасность",
        metric: "Риски не включены в денежный итог",
        title: "Меньше слепых зон в ПО и инфраструктуре",
        rationale:
          "Полный охват, нормализация ПО и история изменений помогают выявлять неучтённые активы, запрещённое ПО и отклонения. Эффект оценивается отдельно после анализа фактического контура.",
      },
    ];

    return {
      scaleLine: scaleLine,
      driverLine: driverLine,
      forExec: forExec,
      forFinance: forFinance,
      forSecurity: forSecurity,
      recommendations: recommendations.slice(0, 4),
      nextSteps: nextSteps,
      itilFocus: itilFocus.slice(0, 5),
      ritm: ritm,
      potentialShare: potentialShare,
      directions: directions,
      priorities: priorities,
      confidence: {
        level: "Ориентировочный",
        score: 35,
        known: [
          "количество устройств в инфраструктуре",
          "доля ПК и серверов, уровень виртуализации",
          "команда учёта техники и лицензий (FTE)",
          "план продления и докупки лицензий",
        ],
        unknown: [
          "фактический состав ПО",
          "количество и типы лицензий",
          "реальное использование",
          "дублирование активов",
          "распределение затрат",
        ],
      },
      validationQuestions: validationQuestions,
      stakeholderCases: stakeholderCases,
    };
  }

  function buildReportModel(inputs, meta) {
    var calc = calculate(inputs || {});
    var narrative = buildNarrative(calc);
    return {
      meta: meta || {},
      calc: calc,
      narrative: narrative,
      generatedAt: new Date(),
    };
  }

  global.ItmenRoiReport = {
    calculate: calculate,
    buildNarrative: buildNarrative,
    buildReportModel: buildReportModel,
    fmtRub: fmtRub,
    fmtRubShort: fmtRubShort,
    paybackLabel: paybackLabel,
  };
})(typeof window !== "undefined" ? window : globalThis);
