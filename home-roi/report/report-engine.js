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
        ? "При парке до 500 рабочих мест быстрее всего окупаются быстрые победы: прозрачность лицензий и отказ от ручных «обходов» инвентаризации."
        : seg === "mid"
          ? "На масштабе 500–5000 рабочих мест основной эффект даёт связка SAM + жизненный цикл оборудования: меньше лишних закупок и меньше рутины для ИТ."
          : "На enterprise-масштабе критичны нормализация ПО (в т.ч. СУБД), импортозамещение без двойных закупок и автоматизация аудитов — без единого реестра потери 20–40% ИТ-бюджета типичны.";

    var driverLine =
      dom === "licenses"
        ? "Главный источник по вашим данным: оптимизация ПО и лицензий, " +
          f.licenses +
          " в год."
        : dom === "labor"
          ? "Главный источник по вашим данным: меньше трудозатрат ИТ на инвентаризацию и аудит, " +
            f.labor +
            " в год. Ручной аудит превращается в выгрузку готового отчёта."
          : "Главный источник по вашим данным: управление оборудованием — апгрейд вместо преждевременной замены и переиспользование компонентов, " +
            f.assets +
            " в год.";

    var forExec = [
      "Экономия около " +
        f.save +
        " в год, Инферит ИТМен стоит около " +
        f.cost +
        ".",
      "Окупается примерно за " + f.pay.replace("около ", "") + ".",
      "Один достоверный реестр активов вместо разрозненных выгрузок. Это основа для решений по CAPEX и OPEX.",
      seg === "mid"
        ? "При вашем масштабе основной эффект дают SAM и учёт жизненного цикла оборудования: меньше лишних закупок, меньше рутины для ИТ."
        : scaleLine,
    ];

    var forFinance = [
      "Экономия по трём направлениям: ПО " +
        f.licenses +
        ", оборудование " +
        f.assets +
        ", труд ИТ " +
        f.labor +
        ".",
      "Формула прозрачна: доли от бюджета на ПО, стоимости парка и ФОТ ИТ (допущения выше).",
      "Данные об использовании ПО и нормализованный каталог позволяют закупать лицензии по факту использования, а не по числу установок.",
      "Пилот на одном сегменте инфраструктуры фиксирует точку отсчёта и показывает эффект за 1–3 месяца.",
    ];

    var forSecurity = [
      "Полный охват контура убирает «серую зону» неучтённых устройств и ПО.",
      "Нормализация ПО и контроль установок закрывают лицензионные риски до прихода вендора с проверкой.",
      "История изменений конфигурации нужна как доказательная база при разборе инцидентов.",
      seg === "enterprise"
        ? "На крупном масштабе отдельно выделяем аудит тяжёлых лицензий (СУБД и др.) и импортозамещение без двойных трат."
        : "Даже на среднем масштабе единый реестр ускоряет реакцию ИБ и снижает риск теневого ПО.",
    ];

    var recommendations = [
      {
        title: "Навести порядок в лицензиях (SAM)",
        text: "Сверить установленное и используемое ПО, убрать то, что не запускалось больше 90 дней, привести названия к единому SKU (Инферит ИТМен + Призма данных).",
      },
      {
        title: "Пересмотреть жизненный цикл оборудования",
        text: "Менять ПК по факту загрузки CPU, RAM и диска и по требованиям ПО, а не только по сроку амортизации. Собирать пул комплектующих для повторного использования.",
      },
      {
        title: "Автоматизировать инвентаризацию",
        text: "Заменить периодические «проекты по инвентаризации» на непрерывный сбор данных: агенты, сеть, AD или FreeIPA. По нашим кейсам время на аудит сокращается кратно.",
      },
    ];

    var nextSteps = [
      "Согласовать периметр пилота: подразделение, площадка или сегмент сети.",
      "Развернуть сбор данных и зафиксировать точку отсчёта: лицензии, парк оборудования, время на аудит.",
      "Через 1–3 месяца получить отчёт о реальной экономии по трём направлениям и решить, тиражировать ли решение на всю компанию.",
    ];

    var savingsIntro =
      driverLine +
      (seg === "mid"
        ? " При таком масштабе (500–5000 рабочих мест) основной эффект дают учёт лицензий (SAM) и учёт жизненного цикла оборудования. Компания меньше тратит на лишние закупки, а ИТ меньше занимается рутиной."
        : " " + scaleLine);

    var savingsBullets = [
      "ПО и лицензии: " +
        f.licenses +
        " (" +
        Math.round(calc.assumptions.pctLicenses * 100) +
        "% бюджета на ПО)",
      "Оборудование: " +
        f.assets +
        " (" +
        Math.round(calc.assumptions.pctAssets * 100) +
        "% от расчётной стоимости парка)",
      "Труд ИТ-команды: " +
        f.labor +
        " (" +
        String(calc.assumptions.pctIt * 100).replace(".", ",") +
        "% ФОТ ИТ)",
    ];

    var assumptionsNote =
      "Это осторожная оценка. Мы взяли экономию на ПО " +
      Math.round(calc.assumptions.pctLicenses * 100) +
      "% годового бюджета лицензий, на оборудовании " +
      Math.round(calc.assumptions.pctAssets * 100) +
      "% от расчётной стоимости парка (" +
      calc.assumptions.assetCostPerEndpoint.toLocaleString("ru-RU") +
      " ₽ на рабочее место в год), на труде ИТ " +
      String(calc.assumptions.pctIt * 100).replace(".", ",") +
      "% ФОТ при ставке " +
      calc.assumptions.avgItSalaryMonth.toLocaleString("ru-RU") +
      " ₽ в месяц. В презентации «Обоснование Инферит ИТМен» цифры выше: экономия на ПО до 20%, время на аудит сокращается кратно. Здесь мы намеренно занизили эффект, чтобы отчёт было проще защитить перед руководством.";

    return {
      scaleLine: scaleLine,
      driverLine: driverLine,
      savingsIntro: savingsIntro,
      savingsBullets: savingsBullets,
      assumptionsNote: assumptionsNote,
      forExec: forExec,
      forFinance: forFinance,
      forSecurity: forSecurity,
      recommendations: recommendations,
      nextSteps: nextSteps,
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
