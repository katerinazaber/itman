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

  /** Мультипликаторы зрелости по квизу (0.7–1.35), см. docs/roi-quiz-spec.md */
  function quizMultipliers(quiz) {
    var q = quiz || {};
    var mLic = 1;
    var mAst = 1;
    var mLab = 1;
    var weak = [];

    switch (q.licenses) {
      case "manual":
        mLic = 1.35;
        weak.push("licenses");
        break;
      case "install_only":
        mLic = 1.2;
        weak.push("licenses");
        break;
      case "partial_sam":
        mLic = 1.0;
        break;
      case "usage_sam":
        mLic = 0.75;
        break;
      default:
        break;
    }

    switch (q.freshness) {
      case "rare":
        mLab = 1.35;
        weak.push("labor");
        break;
      case "month":
        mLab = 1.15;
        weak.push("labor");
        break;
      case "week":
        mLab = 0.95;
        break;
      case "live":
        mLab = 0.7;
        break;
      default:
        break;
    }

    switch (q.hardware) {
      case "amort":
        mAst = 1.3;
        weak.push("assets");
        break;
      case "ticket":
        mAst = 1.15;
        weak.push("assets");
        break;
      case "mixed":
        mAst = 1.0;
        break;
      case "fact":
        mAst = 0.75;
        break;
      default:
        break;
    }

    switch (q.truth) {
      case "no":
        mLic *= 1.08;
        mAst *= 1.08;
        mLab *= 1.12;
        weak.push("config");
        break;
      case "partial":
        mLic *= 1.04;
        mLab *= 1.05;
        weak.push("config");
        break;
      case "yes_slow":
        mLab *= 1.08;
        weak.push("labor");
        break;
      case "yes_fast":
        mLic *= 0.95;
        mLab *= 0.9;
        break;
      default:
        break;
    }

    // unique weak
    var seen = {};
    weak = weak.filter(function (w) {
      if (seen[w]) return false;
      seen[w] = true;
      return true;
    });

    return {
      licenses: Math.min(1.4, Math.max(0.65, mLic)),
      assets: Math.min(1.4, Math.max(0.65, mAst)),
      labor: Math.min(1.4, Math.max(0.65, mLab)),
      weak: weak,
    };
  }

  var QUIZ_LABELS = {
    licenses: {
      manual: "Списки / Excel / «по запросу»",
      install_only: "Инвентаризация установок без usage",
      partial_sam: "Частичный SAM / отдельные вендоры",
      usage_sam: "Установки + usage / нормализация",
    },
    freshness: {
      rare: "Раз в квартал и реже / проектно",
      month: "Раз в месяц",
      week: "Раз в неделю",
      live: "Непрерывно / автоматически",
    },
    hardware: {
      amort: "По сроку амортизации / плановой замене",
      ticket: "По заявкам пользователей / инцидентам",
      mixed: "Смешанно: план + точечный апгрейд",
      fact: "По факту конфигурации и требований ПО",
    },
    truth: {
      no: "Нет, нужно собирать из разных мест",
      partial: "Частично, по отдельным контурам",
      yes_slow: "Да, но долго / вручную",
      yes_fast: "Да, данные под рукой",
    },
  };

  var WEAK_COPY = {
    licenses: {
      title: "ПО и лицензии",
      text: "Слабый контроль SAM: риск оплаты неиспользуемого ПО и слепых продлений. ITIL: IT asset management + Measurement and reporting.",
    },
    assets: {
      title: "Оборудование",
      text: "Закупки скорее «по сроку», чем по факту железа — преждевременная замена вместо апгрейда. ITIL: IT asset management / lifecycle.",
    },
    labor: {
      title: "Трудозатраты на учёт",
      text: "Инвентаризация редкая или ручная — аудиты съедают часы ИТ. ITIL: Service configuration management + Continual improvement.",
    },
    config: {
      title: "Единый источник правды",
      text: "Нет одного подтверждаемого реестра — решения по бюджету и ИБ на разрозненных выгрузках. ITIL: Service configuration management (путь к CMDB).",
    },
  };

  function calculate(inputs) {
    var endpoints = Math.max(0, Number(inputs.endpoints || 0));
    var itStaff = Math.max(0, Number(inputs.itStaff || 0));
    var budget = Math.max(0, Number(inputs.budget || 0));
    var quiz = inputs.quiz || {};
    var mult = quizMultipliers(quiz);

    var pctL = PCT_LICENSES * mult.licenses;
    var pctA = PCT_ASSETS * mult.assets;
    var pctI = PCT_IT * mult.labor;
    // потолок ближе к материалам обоснования
    pctL = Math.min(0.18, pctL);
    pctA = Math.min(0.1, pctA);
    pctI = Math.min(0.03, pctI);

    var savingsLicenses = budget * pctL;
    var assetsBase = endpoints * ASSET_COST_PER_ENDPOINT_PER_YEAR;
    var savingsAssets = assetsBase * pctA;
    var payroll = itStaff * AVG_IT_SALARY_PER_MONTH * 12;
    var savingsLabor = payroll * pctI;

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
      inputs: {
        endpoints: endpoints,
        itStaff: itStaff,
        budget: budget,
        quiz: quiz,
      },
      quizLabels: {
        licenses: QUIZ_LABELS.licenses[quiz.licenses] || "—",
        freshness: QUIZ_LABELS.freshness[quiz.freshness] || "—",
        hardware: QUIZ_LABELS.hardware[quiz.hardware] || "—",
        truth: QUIZ_LABELS.truth[quiz.truth] || "—",
      },
      weak: mult.weak,
      assumptions: {
        pctLicenses: pctL,
        pctAssets: pctA,
        pctIt: pctI,
        basePctLicenses: PCT_LICENSES,
        basePctAssets: PCT_ASSETS,
        basePctIt: PCT_IT,
        mult: mult,
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
        ? "При парке до 500 рабочих мест быстрее всего окупаются быстрые победы: прозрачность лицензий и отказ от ручных «обходов» инвентаризации."
        : seg === "mid"
          ? "На масштабе 500–5000 рабочих мест основной эффект даёт связка SAM + жизненный цикл оборудования: меньше лишних закупок и меньше рутины для ИТ."
          : "На enterprise-масштабе критичны нормализация ПО (в т.ч. СУБД), импортозамещение без двойных закупок и автоматизация аудитов — без единого реестра потери 20–40% ИТ-бюджета типичны.";

    var driverLine =
      dom === "licenses"
        ? "По вашим данным главный рычаг экономии — оптимизация ПО и лицензий (~" +
          f.licenses +
          " в год при консервативной оценке " +
          Math.round(calc.assumptions.pctLicenses * 100) +
          "% от бюджета на ПО)."
        : dom === "labor"
          ? "По вашим данным главный рычаг — снижение трудозатрат ИТ на инвентаризацию и аудит (~" +
            f.labor +
            " в год). Ручной аудит превращается в выгрузку отчёта."
          : "По вашим данным заметный вклад даёт управление оборудованием: апгрейд вместо преждевременной замены и переиспользование компонентов (~" +
            f.assets +
            " в год).";

    var forExec = [
      "Потенциальная экономия ориентировочно " +
        f.save +
        " в год при оценке стоимости ИТМен ~" +
        f.cost +
        ".",
      "Срок окупаемости по модели: " + f.pay + ".",
      "Один подтверждаемый реестр активов вместо нескольких выгрузок — основа для решений по CAPEX/OPEX.",
      scaleLine,
    ];

    var forFinance = [
      "Детализация экономии: ПО " +
        f.licenses +
        ", оборудование " +
        f.assets +
        ", трудозатраты " +
        f.labor +
        ".",
      "Формула прозрачна: доли от бюджета ПО, оценочной стоимости парка и ФОТ ИТ (см. допущения в отчёте).",
      "Данные usage и нормализованный каталог ПО позволяют закупать по факту использования, а не по числу установок.",
      "Пилот на сегменте инфраструктуры фиксирует baseline и измеряет эффект за 1–3 месяца.",
    ];

    var forSecurity = [
      "Полный охват контура снижает «серую зону» устройств и ПО вне учёта.",
      "Нормализация ПО и контроль установок помогают закрывать лицензионные и комплаенс-риски до аудита вендора.",
      "История изменений конфигурации даёт доказательную базу для Change / Incident.",
      seg === "enterprise"
        ? "На крупном масштабе отдельно выделяем аудит тяжёлых лицензий (СУБД и др.) и импортозамещение без двойных трат."
        : "Даже на среднем масштабе единый реестр ускоряет ответы ИБ и снижает риск «теневого» ПО.",
    ];

    var recommendations = [];
    var weak = calc.weak || [];

    function hasWeak(k) {
      return weak.indexOf(k) !== -1;
    }

    if (hasWeak("licenses") || dom === "licenses" || calc.inputs.budget >= 5e6) {
      recommendations.push({
        title: "Оптимизация лицензий и SAM",
        text: "Ввести контроль установленного vs используемого ПО; вычистить неиспользуемое (ориентир — ПО без запусков >90 дней); нормализовать названия до эталонного SKU (ИТМен + Призма данных).",
      });
    }
    if (hasWeak("assets") || dom === "assets" || calc.inputs.endpoints >= 500) {
      recommendations.push({
        title: "Жизненный цикл оборудования",
        text: "Решения о замене ПК принимать по факту CPU/RAM/диска и требованиям ПО, а не только по сроку амортизации; формировать пул комплектующих для переиспользования.",
      });
    }
    if (hasWeak("labor") || hasWeak("config") || dom === "labor" || calc.inputs.itStaff >= 15) {
      recommendations.push({
        title: "Автоматизация инвентаризации и аудита",
        text: "Перевести периодические «проекты инвентаризации» в непрерывный сбор: агенты + сеть + AD/FreeIPA. Трудозатраты на аудит в материалах кейсов сокращаются кратно.",
      });
    }
    if (hasWeak("config")) {
      recommendations.push({
        title: "Единый источник правды (путь к CMDB)",
        text: "Свести разрозненные списки в один подтверждаемый реестр с историей атрибутов — база для финансов, ИБ и ITSM. Без этого CMDB быстро станет ещё одним «кладбищем» данных.",
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

    var gaps = weak.map(function (k) {
      return WEAK_COPY[k];
    }).filter(Boolean);

    if (gaps.length) {
      forExec.unshift(
        "По самооценке зрелости учёта выделены зоны риска: " +
          gaps
            .map(function (g) {
              return g.title;
            })
            .join(", ") +
          "."
      );
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
      gaps: gaps,
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
    quizMultipliers: quizMultipliers,
    QUIZ_LABELS: QUIZ_LABELS,
    WEAK_COPY: WEAK_COPY,
    fmtRub: fmtRub,
    fmtRubShort: fmtRubShort,
    paybackLabel: paybackLabel,
  };
})(typeof window !== "undefined" ? window : globalThis);
