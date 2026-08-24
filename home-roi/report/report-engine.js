/**
 * ROI report engine — расчёт + персонализация отчёта.
 * Источники допущений: «Обоснование_ИТМен…», БЗ (ITAM/SAM/трудозатраты).
 * Консервативные доли — ориентир для лид-магнита, не гарантия.
 */
(function (global) {
  "use strict";

  var PCT_LICENSES = 0.1; // до ~10% бюджета ПО (в материалах 10–20%)
  var PCT_ASSETS = 0.05; // доля «апгрейд вместо замены»
  var PCT_IT = 0.015; // доля ФОТ ИТ на рутину инвентаризации/аудита
  var ASSET_COST_PER_ENDPOINT_PER_YEAR = 3000;
  var AVG_IT_SALARY_PER_MONTH = 200000;
  var ITMEN_12_PRICING = [
    { max: 5000, perEndpoint: 1050 },
    { max: 25000, perEndpoint: 950 },
    { max: 50000, perEndpoint: 850 },
  ];

  function getItmenPerEndpointPrice(endpoints) {
    var n = Math.max(0, Number(endpoints || 0));
    for (var i = 0; i < ITMEN_12_PRICING.length; i++) {
      if (n <= ITMEN_12_PRICING[i].max) return ITMEN_12_PRICING[i].perEndpoint;
    }
    return 750;
  }

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

  function paybackLabel(years) {
    if (!isFinite(years) || years <= 0) return "—";
    if (years < 1) {
      var months = Math.max(1, Math.round(years * 12));
      if (months === 1) return "около 1 месяца";
      if (months < 5) return "около " + months + " месяцев";
      return "около " + months + " месяцев";
    }
    var v = fmtNum(years, 1);
    var n = Number(String(v).replace(",", "."));
    if (n === 1) return v + " год";
    if (n >= 2 && n < 5) return v + " года";
    return v + " лет";
  }

  function segmentOf(endpoints) {
    if (endpoints < 500) return "smb";
    if (endpoints < 5000) return "mid";
    return "enterprise";
  }

  function calculate(inputs) {
    var endpoints = Math.max(0, Number(inputs.endpoints || 0));
    var itStaff = Math.max(0, Number(inputs.itStaff || 0));
    var budget = Math.max(0, Number(inputs.budget || 0));

    var savingsLicenses = budget * PCT_LICENSES;
    var assetsBase = endpoints * ASSET_COST_PER_ENDPOINT_PER_YEAR;
    var savingsAssets = assetsBase * PCT_ASSETS;
    var payroll = itStaff * AVG_IT_SALARY_PER_MONTH * 12;
    var savingsLabor = payroll * PCT_IT;

    var savingsTotal = savingsLicenses + savingsAssets + savingsLabor;
    var pricePer = getItmenPerEndpointPrice(endpoints);
    var itmenCost = endpoints * pricePer;

    var roi =
      itmenCost > 0 ? ((savingsTotal - itmenCost) / itmenCost) * 100 : NaN;
    var paybackYears = savingsTotal > 0 ? itmenCost / savingsTotal : NaN;

    var parts = [
      { key: "licenses", label: "ПО и лицензии", value: savingsLicenses },
      { key: "assets", label: "Оборудование", value: savingsAssets },
      { key: "labor", label: "Трудозатраты ИТ", value: savingsLabor },
    ].sort(function (a, b) {
      return b.value - a.value;
    });

    return {
      inputs: { endpoints: endpoints, itStaff: itStaff, budget: budget },
      assumptions: {
        pctLicenses: PCT_LICENSES,
        pctAssets: PCT_ASSETS,
        pctIt: PCT_IT,
        assetCostPerEndpoint: ASSET_COST_PER_ENDPOINT_PER_YEAR,
        avgItSalaryMonth: AVG_IT_SALARY_PER_MONTH,
        pricePerEndpoint: pricePer,
      },
      breakdown: {
        licenses: savingsLicenses,
        assets: savingsAssets,
        labor: savingsLabor,
        assetsBase: assetsBase,
        payroll: payroll,
      },
      dominant: parts[0].key,
      savingsTotal: savingsTotal,
      itmenCost: itmenCost,
      roi: roi,
      paybackYears: paybackYears,
      segment: segmentOf(endpoints),
      fmt: {
        save: fmtRubShort(savingsTotal),
        saveFull: fmtRub(savingsTotal),
        cost: fmtRubShort(itmenCost),
        costFull: fmtRub(itmenCost),
        roi: isFinite(roi) ? fmtNum(roi, 0) + "%" : "—",
        pay: paybackLabel(paybackYears),
        licenses: fmtRubShort(savingsLicenses),
        assets: fmtRubShort(savingsAssets),
        labor: fmtRubShort(savingsLabor),
        budget: fmtRubShort(budget),
      },
    };
  }

  /** Банк рекомендаций / аргументов по ответам */
  function buildNarrative(calc) {
    var seg = calc.segment;
    var dom = calc.dominant;
    var f = calc.fmt;

    var scaleLine =
      seg === "smb"
        ? "При таком масштабе (до 500 рабочих мест) основной эффект дают прозрачность лицензий и отказ от ручной инвентаризации. Компания меньше тратит на лишние закупки, а ИТ меньше занимается рутиной."
        : seg === "mid"
          ? "При таком масштабе (500–5000 рабочих мест) основной эффект дают учёт лицензий (SAM) и учёт жизненного цикла оборудования. Компания меньше тратит на лишние закупки, а ИТ меньше занимается рутиной."
          : "При таком масштабе (более 5000 рабочих мест) основной эффект дают нормализация ПО, учёт лицензий (SAM), управление жизненным циклом оборудования и автоматизация аудитов. Компания меньше тратит на лишние закупки, а ИТ меньше занимается рутиной.";

    var driverLine =
      dom === "licenses"
        ? "Главный источник экономии по вашим данным — оптимизация ПО и лицензий, около " +
          f.licenses +
          " в год. Данные об использовании ПО позволяют закупать лицензии по факту использования."
        : dom === "labor"
          ? "Главный источник экономии по вашим данным: меньше трудозатрат ИТ на инвентаризацию и аудит, " +
            f.labor +
            " в год. Ручной аудит превращается в выгрузку готового отчёта."
          : "Главный источник экономии по вашим данным — управление оборудованием, около " +
            f.assets +
            " в год. Апгрейд вместо преждевременной замены и переиспользование компонентов сокращают лишние закупки.";

    var forExec = [
      "Экономия около " + f.save + " в год.",
      "Окупается примерно за " + f.pay.replace(/^около\s+/, "") + ".",
      "Один достоверный реестр ИТ-активов вместо разрозненных выгрузок.",
      seg === "smb"
        ? "При вашем масштабе инфраструктуры основной эффект дают прозрачность лицензий и автоматизация инвентаризации: так происходит меньше лишних закупок и снижаются рутинные ИТ-операции."
        : seg === "mid"
          ? "При вашем масштабе инфраструктуры основной эффект даёт SAM-подход и учёт жизненного цикла оборудования: так происходит меньше лишних закупок и снижаются рутинные ИТ-операции."
          : "При вашем масштабе инфраструктуры основной эффект дают SAM-подход, нормализация ПО и учёт жизненного цикла оборудования: так происходит меньше лишних закупок и снижаются рутинные ИТ-операции.",
    ];

    var forFinance = [
      "Экономия разделяется на три статьи: ПО около " +
        f.licenses +
        ", оборудование около " +
        f.assets +
        ", труд ИТ около " +
        f.labor +
        ".",
      "Формула считается на базе долей от бюджета на ПО, стоимости парка и ФОТ ИТ.",
      "Данные об использовании ПО и единый нормализованный каталог позволяют закупать лицензии по факту использования, а не по количеству установок.",
      "Пилот на одном сегменте инфраструктуры фиксирует точку отсчёта, и уже через 1–3 месяца виден реальный эффект.",
    ];

    var forSecurity = [
      "Полный охват контура помогает фиксировать ИТ-активы в «серых зонах» и закрытых сегментах сети: неучтённые устройства и ПО становятся видны.",
      "Нормализация ПО и контроль установок закрывают лицензионные риски и вопросы ИБ.",
      "История изменений конфигурации служит доказательной базой при разборе инцидентов.",
      "Даже при среднем масштабе инфраструктуры единый реестр ускоряет реакцию ИБ и снижает риск использования запрещённого ПО.",
    ];

    var recommendations = [];
    if (dom === "licenses" || calc.inputs.budget >= 5e6) {
      recommendations.push({
        title: "Оптимизация лицензий и SAM",
        text: "Ввести контроль установленного vs используемого ПО; вычистить неиспользуемое (ориентир — ПО без запусков >90 дней); нормализовать названия до эталонного SKU (ИТМен + Призма данных).",
      });
    }
    if (dom === "assets" || calc.inputs.endpoints >= 500) {
      recommendations.push({
        title: "Жизненный цикл оборудования",
        text: "Решения о замене ПК принимать по факту CPU/RAM/диска и требованиям ПО, а не только по сроку амортизации; формировать пул комплектующих для переиспользования.",
      });
    }
    if (dom === "labor" || calc.inputs.itStaff >= 15) {
      recommendations.push({
        title: "Автоматизация инвентаризации и аудита",
        text: "Перевести периодические «проекты инвентаризации» в непрерывный сбор: агенты + сеть + AD/FreeIPA. Трудозатраты на аудит в материалах кейсов сокращаются кратно.",
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
      "Развернуть сбор данных и зафиксировать baseline: лицензии, парк, трудозатраты на аудит.",
      "Через 1–3 месяца — отчёт об экономии по трём направлениям и решение о тиражировании.",
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
          : [
              itilCore[1],
              itilCore[0],
              {
                practice: "Capacity and performance management",
                ru: "Управление мощностью и производительностью",
                why: "Решения апгрейд vs замена по факту железа и требованиям ПО, а не только по сроку амортизации.",
              },
              itilCore[2],
            ];

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
      calc.inputs.budget > 0
        ? (calc.savingsTotal / calc.inputs.budget) * 100
        : NaN;

    var directions = [
      {
        key: "licenses",
        title: "Оптимизация лицензий",
        value: calc.breakdown.licenses,
        formatted: f.licenses,
        formula:
          f.budget +
          " × " +
          Math.round(calc.assumptions.pctLicenses * 100) +
          "% = " +
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
        title: "Снижение ручных трудозатрат ИТ",
        value: calc.breakdown.labor,
        formatted: f.labor,
        formula:
          calc.inputs.itStaff.toLocaleString("ru-RU") +
          " сотрудников × " +
          fmtRub(calc.assumptions.avgItSalaryMonth) +
          " × 12 × " +
          String(calc.assumptions.pctIt * 100).replace(".", ",") +
          "% = " +
          f.labor,
        logic:
          "Модель учитывает только небольшую долю ФОТ ИТ, которая может приходиться на ручной сбор, сверку и актуализацию данных.",
        factors: [
          "ручной сбор информации",
          "подготовка инвентаризационных отчётов",
          "сверка данных из разных систем",
          "поиск информации по рабочим местам",
        ],
        verification:
          "ИТМен автоматизирует сбор, агрегацию и нормализацию данных об ИТ-активах.",
      },
      {
        key: "assets",
        title: "Снижение потерь из-за неполной картины",
        value: calc.breakdown.assets,
        formatted: f.assets,
        formula:
          calc.inputs.endpoints.toLocaleString("ru-RU") +
          " рабочих мест × " +
          fmtRub(calc.assumptions.assetCostPerEndpoint) +
          " × " +
          Math.round(calc.assumptions.pctAssets * 100) +
          "% = " +
          f.assets,
        logic:
          "Оценка отражает консервативный потенциал более обоснованных решений по жизненному циклу оборудования и связанным закупкам.",
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
        question: "Сколько времени ИТ-команда тратит на ручную работу?",
        answer: "Сравниваем текущий процесс с автоматизированным сбором данных.",
      },
    ];

    var businessOutcomes = [
      {
        role: "Финансовый директор",
        outcome: "Понимание, где можно сократить ИТ-расходы.",
      },
      {
        role: "ИТ-директор",
        outcome: "Единая картина инфраструктуры и контроль ИТ-бюджета.",
      },
      {
        role: "ИБ",
        outcome: "Контроль ПО и изменений в инфраструктуре.",
      },
      {
        role: "Закупки",
        outcome: "Данные для обоснования закупок и продлений.",
      },
      {
        role: "ИТ-команда",
        outcome: "Меньше ручного сбора и сверки данных.",
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
          "размер инфраструктуры",
          "размер ИТ-команды",
          "бюджет на ПО",
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
      businessOutcomes: businessOutcomes,
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
