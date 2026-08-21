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

  /** Мультипликаторы по квизу финансы/ИБ/руководство — docs/roi-quiz-spec.md */
  function quizMultipliers(quiz) {
    var q = quiz || {};
    var mLic = 1;
    var mAst = 1;
    var mLab = 1;
    var weak = [];

    // Финансы: usage лицензий
    switch (q.usage) {
      case "unknown":
        mLic = 1.35;
        weak.push("finance_usage");
        break;
      case "installs":
        mLic = 1.2;
        weak.push("finance_usage");
        break;
      case "partial":
        mLic = 1.05;
        break;
      case "known":
        mLic = 0.75;
        break;
      default:
        break;
    }

    // Финансы: база бюджета / перераспределение
    switch (q.budget_basis) {
      case "gut":
        mAst = 1.25;
        mLic *= 1.1;
        weak.push("finance_budget");
        break;
      case "requests":
        mAst = 1.15;
        weak.push("finance_budget");
        break;
      case "lists":
        mAst = 1.0;
        break;
      case "facts":
        mAst = 0.75;
        mLic *= 0.95;
        break;
      default:
        break;
    }

    // ИБ: закрытые сегменты
    switch (q.segments) {
      case "closed":
        mLab *= 1.2;
        weak.push("security_segments");
        break;
      case "some":
        mLab *= 1.1;
        weak.push("security_segments");
        break;
      case "unknown":
        mLab *= 1.15;
        weak.push("security_segments");
        break;
      case "no":
        break;
      default:
        break;
    }

    // ИБ: запрещённое / теневое ПО
    switch (q.shadow) {
      case "none":
        mLic *= 1.15;
        weak.push("security_shadow");
        break;
      case "reactive":
        mLic *= 1.1;
        weak.push("security_shadow");
        break;
      case "policy":
        break;
      case "active":
        mLic *= 0.9;
        break;
      default:
        break;
    }

    // Руководство: проекты / миграции
    switch (q.projects) {
      case "often":
        mLab *= 1.2;
        mAst *= 1.1;
        weak.push("exec_projects");
        break;
      case "sometimes":
        mLab *= 1.1;
        weak.push("exec_projects");
        break;
      case "rare":
        break;
      case "no":
        mLab *= 0.9;
        break;
      default:
        break;
    }

    // Руководство: простои после изменений
    switch (q.downtime) {
      case "often":
        mLab *= 1.2;
        weak.push("exec_downtime");
        break;
      case "sometimes":
        mLab *= 1.1;
        weak.push("exec_downtime");
        break;
      case "rare":
        break;
      case "no":
        mLab *= 0.9;
        break;
      default:
        break;
    }

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
    usage: {
      unknown: "Не знаем, что реально используется",
      installs: "Знаем установки, не usage",
      partial: "Usage по отдельным продуктам",
      known: "Видим использование по ключевому ПО",
    },
    budget_basis: {
      gut: "Оценка «на глаз» / прошлый год + %",
      requests: "По заявкам подразделений",
      lists: "По спискам и срокам амортизации",
      facts: "По факту парка, usage и потребностей",
    },
    segments: {
      no: "Закрытых сегментов нет / всё видно",
      some: "Есть отдельные труднодоступные зоны",
      closed: "Есть закрытые / изолированные периметры",
      unknown: "Не знаем границы видимости",
    },
    shadow: {
      none: "Нет контроля запрещённого / теневого ПО",
      reactive: "Узнаём после инцидента или аудита",
      policy: "Есть политика, проверка выборочная",
      active: "Регулярно выявляем и блокируем",
    },
    projects: {
      often: "Часто срываются / дорожают из‑за сюрпризов в инфраструктуре",
      sometimes: "Иногда не хватает полной картины",
      rare: "Редко",
      no: "Картина достаточна для проектов",
    },
    downtime: {
      often: "Часто: «после изменений что‑то отвалилось»",
      sometimes: "Бывает, причину ищем долго",
      rare: "Редко",
      no: "Изменения прозрачны, простоев мало",
    },
  };

  var WEAK_COPY = {
    finance_usage: {
      audience: "Финансы",
      title: "Неиспользуемые лицензии и ПО",
      text: "Нет ясной картины usage: часть бюджета уходит на ПО, которое стоит, но не запускается. Типичный кейс БЗ: «куплено 500 — используется 320». ИТМен + Призма дают установки и фактическое использование для перераспределения бюджета.",
    },
    finance_budget: {
      audience: "Финансы",
      title: "Бюджет без опоры на факт",
      text: "Закупки и перераспределение ИТ-денег идут без подтверждаемого реестра активов. Риск — переплата за железо «по сроку» и лицензии «с запасом». Нужны данные для CFO: почему именно эта закупка.",
    },
    security_segments: {
      audience: "ИБ",
      title: "Закрытые сегменты вне видимости",
      text: "Обычные системы инвентаризации часто не добираются в изолированные периметры. «Серые» устройства и ПО вне учёта — слепая зона ИБ. ИТМен рассчитан на сбор в условиях ограничений ИБ (агенты, разные каналы, интеграция источников).",
    },
    security_shadow: {
      audience: "ИБ",
      title: "Запрещённое и теневое ПО",
      text: "Без регулярного выявления нелегитимных установок политики безопасности остаются на бумаге. Нужен факт: что установлено в сети, в т.ч. в обход стандарта — для ИБ и комплаенса.",
    },
    exec_projects: {
      audience: "Руководство",
      title: "ИТ-проекты без полной картины",
      text: "Миграции, импортозамещение и M&A буксуют, когда нет точного списка «что и где менять». Двойные закупки и срыв сроков — следствие разрозненных данных, а не «слабой команды».",
    },
    exec_downtime: {
      audience: "Руководство",
      title: "Простои и сбои процессов",
      text: "Инциденты «после выходных что‑то сломалось» без истории изменений бьют по бизнес-процессам и SLA. Нужна доказательная база: что изменилось на CI и когда — чтобы сервисы работали предсказуемо.",
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
        usage: QUIZ_LABELS.usage[quiz.usage] || "—",
        budget_basis: QUIZ_LABELS.budget_basis[quiz.budget_basis] || "—",
        segments: QUIZ_LABELS.segments[quiz.segments] || "—",
        shadow: QUIZ_LABELS.shadow[quiz.shadow] || "—",
        projects: QUIZ_LABELS.projects[quiz.projects] || "—",
        downtime: QUIZ_LABELS.downtime[quiz.downtime] || "—",
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

    if (hasWeak("finance_usage") || hasWeak("finance_budget") || dom === "licenses") {
      recommendations.push({
        title: "Для финансов: usage и перераспределение бюджета",
        text: "Зафиксировать, какое ПО реально запускается; убрать из плана закупок простой; закупки железа — по факту конфигурации, не только по амортизации. Это прямой рычаг оптимизации ИТ-бюджета.",
      });
    }
    if (hasWeak("security_segments") || hasWeak("security_shadow")) {
      recommendations.push({
        title: "Для ИБ: закрытые периметры и теневое ПО",
        text: "Закрыть «серую зону» в изолированных сегментах (агенты / допустимые каналы сбора) и регулярно выявлять запрещённые установки — иначе политика безопасности не опирается на факт.",
      });
    }
    if (hasWeak("exec_projects") || hasWeak("exec_downtime") || dom === "labor") {
      recommendations.push({
        title: "Для руководства: проекты без сюрпризов и меньше простоев",
        text: "Единый реестр + история изменений: миграции и импортозамещение с точным периметром; инциденты «после изменений» разбираются по факту, а не по мнениям — бизнес-процессы стабильнее.",
      });
    }
    if (hasWeak("finance_usage") || calc.inputs.budget >= 5e6) {
      recommendations.push({
        title: "SAM и нормализация ПО",
        text: "Нормализовать названия до эталонного SKU (ИТМен + Призма), сопоставить установки с лицензиями и usage — основа для переговоров с вендорами и аудитов.",
      });
    }
    if (seg === "enterprise") {
      recommendations.push({
        title: "Импортозамещение без двойных закупок",
        text: "Сначала карта «что реально используется», затем план миграции — чтобы не финансировать выведенные из эксплуатации системы.",
      });
    }
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Единый источник правды",
        text: "Свести разрозненные списки устройств и ПО в один реестр с историей атрибутов — база для финансов, ИБ и ITSM/CMDB.",
      });
    }

    var gaps = weak
      .map(function (k) {
        return WEAK_COPY[k];
      })
      .filter(Boolean);

    if (gaps.length) {
      forExec.unshift(
        "По самооценке выделены зоны риска для бизнеса: " +
          gaps
            .map(function (g) {
              return g.title;
            })
            .join("; ") +
          "."
      );
    }

    // Усиление аргументов под аудитории по ответам квиза
    if (hasWeak("finance_usage") || hasWeak("finance_budget")) {
      forFinance.unshift(
        "По ответам: бюджет на ПО/железо пока слабо опирается на usage и факт парка — здесь основной потенциал перераспределения средств."
      );
    }
    if (hasWeak("security_segments") || hasWeak("security_shadow")) {
      forSecurity.unshift(
        "По ответам: есть риск слепых зон (закрытые сегменты и/или слабый контроль запрещённого ПО) — приоритет для ИБ до аудита и инцидента."
      );
    }
    if (hasWeak("exec_projects") || hasWeak("exec_downtime")) {
      forExec.push(
        "Снижение простоев и предсказуемость ИТ-проектов — прямой эффект единого реестра и истории изменений для бизнес-процессов."
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
    if (hasWeak("security_segments") || hasWeak("security_shadow")) {
      itilFocus.unshift({
        practice: "Information security management",
        ru: "Управление информационной безопасностью",
        why: "Закрытые сегменты и контроль нелегитимного ПО — приоритет по вашим ответам для ИБ.",
      });
    }
    if (hasWeak("exec_downtime")) {
      itilFocus.unshift({
        practice: "Change control",
        ru: "Контроль изменений",
        why: "История изменений конфигурации снижает простои «после правок» и ускоряет разбор инцидентов.",
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
