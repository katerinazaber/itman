(function () {
  "use strict";

  var state = {
    step: 0,
    workstations: null,
    assets: null,
    licensesTotal: null,
    products: null,
    licenseCount: null,
    licensePrice: null,
    unusedPct: null,
    specialists: null,
    hoursMonth: null,
    hourRate: null,
    hoursAfter: null,
    retiredCount: null,
    retiredCost: null,
    downtimeHours: null,
    downtimeRate: null,
    riskAssets: null,
    riskProbability: null,
    riskImpact: null,
    implementationCost: null,
    annualSupportCost: null,
    audience: "ceo"
  };

  var NUMERIC_FIELDS = [
    "workstations", "assets", "licensesTotal", "products",
    "licenseCount", "licensePrice", "unusedPct",
    "specialists", "hoursMonth", "hourRate", "hoursAfter",
    "retiredCount", "retiredCost", "downtimeHours", "downtimeRate",
    "riskAssets", "riskProbability", "riskImpact",
    "implementationCost", "annualSupportCost"
  ];

  var AUDIENCE = {
    ceo: {
      title: "CEO",
      roleName: "Генеральный директор",
      short: "Результат для бизнеса",
      question: "Что изменится для компании?",
      main: "Покажите, какие расходы можно предотвратить, как ИТ влияет на непрерывность работы и какие ресурсы можно направить на задачи развития.",
      points: [
        "Расходы на лицензии и поддержку, от которых можно отказаться после проверки",
        "Потери бизнеса из-за простоя критичных систем",
        "Возможность повторно использовать имеющиеся активы вместо новой закупки",
        "Предсказуемость будущих расходов на замену и продление"
      ],
      proof: "Покажите размер эффекта и период расчета. Отдельно обозначьте подтвержденные суммы, предотвращаемые расходы и возможные потери.",
      say: [
        "Сначала оценим, какие ИТ-ресурсы используются неэффективно и какие расходы можно предотвратить.",
        "Отдельно покажем, во что бизнесу обходится простой критичных систем.",
        "Сопоставим возможный эффект со стоимостью проекта, когда будут известны затраты на внедрение."
      ],
      avoid: "Не начинайте разговор с числа устройств или перечня функций. Покажите, как учет активов помогает принимать решения о расходах и снижает потери бизнеса."
    },
    cfo: {
      title: "CFO",
      roleName: "Финансовый директор",
      short: "Расходы и бюджет",
      question: "Сколько потратим и что сможем сократить?",
      main: "Сведите к понятным суммам потенциальные расходы на неиспользуемые лицензии и поддержку списанных активов. Сопоставьте их со стоимостью внедрения и дальнейшего использования решения.",
      points: [
        "Количество и стоимость лицензий, которые можно не продлевать",
        "Платежи по поддержке списанного оборудования",
        "Разовые затраты на внедрение и ежегодные расходы на решение",
        "Срок окупаемости на основе подтвержденного сокращения расходов"
      ],
      proof: "Покажите суммы в рублях за год, разовые затраты и ежегодные платежи. Срок окупаемости считайте только при заполненных данных о затратах и потенциальном сокращении расходов.",
      say: [
        "Разберем расходы на лицензии и поддержку, по которым есть основания пересмотреть закупки или продления.",
        "Покажем отдельно разовую стоимость проекта и будущие ежегодные расходы.",
        "После проверки исходных данных рассчитаем срок окупаемости на основе потенциального сокращения денежных расходов."
      ],
      avoid: "Не складывайте высвобождаемое рабочее время и стоимость простоя с прямой экономией. Не указывайте ROI без стоимости проекта и ежегодных расходов."
    },
    fin: {
      title: "Финансовый контролер",
      roleName: "Финансовый контролер",
      short: "Проверяемость расчетов",
      question: "Откуда взялась каждая цифра?",
      main: "Для каждого показателя укажите исходные значения, период, формулу и источник данных. Оценки и неподтвержденные предположения должны быть заметно отделены от фактических расходов.",
      points: [
        "Число лицензий, факт использования и цена по договору",
        "Список списанных активов и платежи за поддержку",
        "Трудозатраты, частота операций и стоимость рабочего часа",
        "Проверяемая формула и объяснение каждого допущения"
      ],
      proof: "Перед согласованием сверьте расчет с выгрузками из учетных систем, договорами, счетами и замерами времени. Проверьте, что один и тот же эффект не учтен дважды.",
      say: [
        "Для каждой суммы укажем формулу и список исходных данных, которые нужно проверить.",
        "Отделим подтвержденные расходы от предварительной оценки и потенциальных потерь.",
        "Сверим расчет с первичными данными до того, как включать эффект в бюджет."
      ],
      avoid: "Не представляйте оценочный процент как подтвержденный факт. Не оставляйте итоговую сумму без формулы и источника данных."
    },
    ib: {
      title: "Руководитель ИБ",
      roleName: "Руководитель информационной безопасности",
      short: "Активы и риски",
      question: "Какие активы под угрозой и что с этим делать?",
      main: "Свяжите активы и программные версии с конкретными уязвимостями, возможным ущербом и мерами устранения. Финансовая оценка риска должна опираться на понятные допущения.",
      points: [
        "Активы, затронутые риском, и критичность этих активов",
        "Уязвимости, устаревшие версии ПО и запрещенное ПО",
        "Приоритет и стоимость обновления, замены или другой меры",
        "Вероятность инцидента и возможный финансовый ущерб"
      ],
      proof: "Свяжите конкретный актив, риск, действие по снижению риска, срок и стоимость. Укажите источник оценки вероятности и размера ущерба.",
      say: [
        "Начнем с активов, которые затронуты риском, и проверим актуальность сведений о них.",
        "Определим, какие меры требуются и сколько будет стоить устранение выявленных проблем.",
        "Отдельно оценим возможный ущерб; эту сумму не будем считать гарантированной экономией."
      ],
      avoid: "Не ограничивайтесь общим обещанием повысить безопасность. Нужны активы, описание риска, мера реагирования и обоснование ее приоритета."
    }
  };

  function $(id) { return document.getElementById(id); }

  function money(value) {
    if (value === null || value === undefined || !isFinite(value)) return "Не рассчитано";
    return Math.round(value).toLocaleString("ru-RU") + " ₽";
  }

  function moneyPerYear(value) {
    return value === null || value === undefined ? "Заполните поля" : money(value) + " / год";
  }

  function numberText(value) {
    return value === null || value === undefined || !isFinite(value) ? "не указано" : Number(value).toLocaleString("ru-RU");
  }

  function hasValues(keys) {
    return keys.every(function (key) {
      return state[key] !== null && state[key] !== undefined && isFinite(Number(state[key]));
    });
  }

  function calc() {
    var lic = hasValues(["licenseCount", "licensePrice", "unusedPct"])
      ? Math.max(0, state.licenseCount) * Math.max(0, state.licensePrice) * (Math.min(100, Math.max(0, state.unusedPct)) / 100)
      : null;
    var manual = hasValues(["specialists", "hoursMonth", "hourRate", "hoursAfter"])
      ? Math.max(0, state.hoursMonth - state.hoursAfter) * Math.max(0, state.hourRate) * Math.max(0, state.specialists) * 12
      : null;
    var retired = hasValues(["retiredCount", "retiredCost"])
      ? Math.max(0, state.retiredCount) * Math.max(0, state.retiredCost)
      : null;
    var downtime = hasValues(["downtimeHours", "downtimeRate"])
      ? Math.max(0, state.downtimeHours) * Math.max(0, state.downtimeRate)
      : null;
    var risk = hasValues(["riskProbability", "riskImpact"])
      ? (Math.min(100, Math.max(0, state.riskProbability)) / 100) * Math.max(0, state.riskImpact)
      : null;
    var savingsParts = [lic, retired].filter(function (v) { return v !== null; });
    var cashSavings = savingsParts.length ? savingsParts.reduce(function (sum, v) { return sum + v; }, 0) : null;
    var netAnnualCashEffect = cashSavings !== null && state.annualSupportCost !== null
      ? cashSavings - Math.max(0, state.annualSupportCost)
      : null;
    var paybackMonths = state.implementationCost !== null && state.implementationCost > 0 && netAnnualCashEffect > 0
      ? (state.implementationCost / netAnnualCashEffect) * 12
      : null;
    var firstYearRoi = state.implementationCost !== null && state.implementationCost > 0 && netAnnualCashEffect !== null
      ? ((netAnnualCashEffect - state.implementationCost) / state.implementationCost) * 100
      : null;
    return {
      lic: lic,
      manual: manual,
      retired: retired,
      downtime: downtime,
      risk: risk,
      cashSavings: cashSavings,
      savingsParts: savingsParts.length,
      netAnnualCashEffect: netAnnualCashEffect,
      paybackMonths: paybackMonths,
      firstYearRoi: firstYearRoi
    };
  }

  function syncInputs() {
    NUMERIC_FIELDS.forEach(function (key) {
      var el = $(key);
      if (el) el.value = state[key] === null ? "" : state[key];
    });
  }

  function readInputs() {
    NUMERIC_FIELDS.forEach(function (key) {
      var el = $(key);
      if (!el) return;
      var raw = String(el.value).trim().replace(/\s/g, "").replace(",", ".");
      if (raw === "") {
        state[key] = null;
        return;
      }
      var value = Number(raw);
      state[key] = isFinite(value) ? Math.max(0, value) : null;
    });
    if (state.unusedPct !== null) state.unusedPct = Math.min(100, Math.max(0, state.unusedPct));
    if (state.riskProbability !== null) state.riskProbability = Math.min(100, Math.max(0, state.riskProbability));
  }

  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = value;
  }

  function renderLive() {
    var c = calc();
    setText("liveLicenses", moneyPerYear(c.lic));
    setText("liveManual", moneyPerYear(c.manual));
    setText("liveRetired", moneyPerYear(c.retired));
    setText("liveDowntime", moneyPerYear(c.downtime));
    setText("liveRisk", moneyPerYear(c.risk));
  }

  function listHtml(items) {
    return "<ul>" + items.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul>";
  }

  function roleHtml(a, label) {
    return '<div class="label">' + label + '</div>' +
      '<h3>«' + a.question + '»</h3>' +
      '<p class="role-intro">' + a.main + '</p>' +
      '<div class="arg-columns">' +
        '<div><h4>Что важно показать</h4>' + listHtml(a.points) + '</div>' +
        '<div><h4>Что подтвердить</h4><p class="role-intro">' + a.proof + '</p></div>' +
      '</div>' +
      '<div class="role-quote"><strong>Как начать разговор:</strong> ' + a.say[0] + '</div>' +
      '<div class="role-quote"><strong>Чего избегать:</strong> ' + a.avoid + '</div>';
  }

  function renderAudience() {
    var a = AUDIENCE[state.audience];
    document.querySelectorAll(".audience-card").forEach(function (card) {
      var active = card.dataset.audience === state.audience;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var box = $("audienceArg");
    if (box && a) box.innerHTML = roleHtml(a, "РЕКОМЕНДАЦИИ / " + a.roleName.toUpperCase());
  }

  function renderPayback(c) {
    var panel = $("paybackPanel");
    if (!panel) return;
    if (state.implementationCost === null || state.annualSupportCost === null || c.cashSavings === null) {
      panel.innerHTML = "<h3>Окупаемость проекта</h3><p>Для расчета нужны три значения: потенциальное сокращение расходов, стоимость внедрения и ежегодные расходы на решение. Стоимость высвобождаемого времени и возможные потери в окупаемость не включены.</p>";
      return;
    }
    if (c.netAnnualCashEffect <= 0) {
      panel.innerHTML = "<h3>Окупаемость проекта</h3><p>По введенным данным потенциальное сокращение расходов не превышает ежегодные расходы на решение. Уточните исходные значения или оцените дополнительные подтвержденные источники сокращения расходов.</p>";
      return;
    }
    var roi = c.firstYearRoi === null ? "Не рассчитан" : c.firstYearRoi.toFixed(1).replace(".", ",") + "%";
    var payback = c.paybackMonths === null ? "Не рассчитан" : c.paybackMonths.toFixed(1).replace(".", ",") + " мес.";
    panel.innerHTML = '<h3>Окупаемость по сокращаемым расходам</h3>' +
      '<p>Предварительная оценка. В расчет включены только потенциальные расходы на лицензии и поддержку списанных активов, за вычетом ежегодных расходов на решение.</p>' +
      '<div class="payback-values"><div><strong>' + payback + '</strong><span>Ориентировочный срок окупаемости</span></div>' +
      '<div><strong>' + roi + '</strong><span>Расчетный ROI первого года</span></div>' +
      '<div><strong>' + money(c.netAnnualCashEffect) + '</strong><span>Годовой эффект после текущих ежегодных расходов</span></div></div>';
  }

  function renderResult() {
    var c = calc();
    var a = AUDIENCE[state.audience];
    setText("totalValue", c.cashSavings === null ? "Заполните данные" : money(c.cashSavings) + " / год");
    var caveat = "В сумму входят только лицензии и поддержка списанных активов. Все значения требуют проверки.";
    if (c.savingsParts === 1) caveat = "Сумма рассчитана только по одному заполненному разделу. Заполните данные по лицензиям и поддержке, если хотите учесть оба источника.";
    if (c.savingsParts === 0) caveat = "Заполните данные по лицензиям и/или поддержке списанных активов, чтобы рассчитать потенциальное сокращение расходов.";
    setText("totalCaveat", caveat);
    setText("resultLic", moneyPerYear(c.lic));
    setText("resultRetired", moneyPerYear(c.retired));
    setText("resultManual", moneyPerYear(c.manual));
    setText("resultDowntime", moneyPerYear(c.downtime));
    setText("resultRisk", moneyPerYear(c.risk));
    setText("resultImplementation", state.implementationCost === null ? "Не указана" : money(state.implementationCost));
    setText("resultSupportCost", "Ежегодные расходы: " + (state.annualSupportCost === null ? "не указаны" : money(state.annualSupportCost)));
    renderPayback(c);

    document.querySelectorAll(".tab").forEach(function (tab) {
      var active = tab.dataset.audience === state.audience;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    setText("resultRoleTitle", a.roleName);
    var detail = $("resultArgs");
    if (detail) detail.innerHTML = roleHtml(a, "АРГУМЕНТЫ / " + a.roleName.toUpperCase());

    setText("docMeta",
      numberText(state.workstations) + " рабочих мест · " +
      numberText(state.assets) + " ИТ-активов · адресат: " + a.roleName);
    setText("docTotal", c.cashSavings === null ? "Не рассчитано" : money(c.cashSavings) + " / год");
  }

  function showStep(n) {
    readInputs();
    state.step = n;
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active");
    });
    var screen = $("screen-" + n);
    if (screen) screen.classList.add("active");
    if (n >= 1 && n <= 6) {
      var pct = (n / 6) * 100;
      document.querySelectorAll("[data-progress]").forEach(function (el) { el.style.width = pct + "%"; });
      document.querySelectorAll("[data-step-label]").forEach(function (el) { el.textContent = "Шаг " + n + " из 6"; });
    }
    if (n === 2 || n === 3 || n === 4) renderLive();
    if (n === 5) renderAudience();
    if (n === 6) renderResult();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char];
    });
  }

  function valueOrMissing(value, suffix) {
    return value === null ? "Не рассчитано: не заполнены исходные данные" : money(value) + (suffix || "");
  }

  function buildReportHtml() {
    var c = calc();
    var a = AUDIENCE[state.audience];
    var rows = [
      ["Потенциал сокращения расходов на лицензии", valueOrMissing(c.lic, " в год"), "Возможное сокращение расходов"],
      ["Поддержка списанных активов", valueOrMissing(c.retired, " в год"), "Расходы, которых можно избежать"],
      ["Стоимость высвобождаемого времени", valueOrMissing(c.manual, " в год"), "Стоимость рабочего времени; не прямая экономия"],
      ["Потенциальные потери от простоя", valueOrMissing(c.downtime, " в год"), "Возможные потери; не прибавляются к экономии"],
      ["Ожидаемая стоимость ИТ-риска", valueOrMissing(c.risk, " в год"), "Вероятность инцидента × возможный ущерб"]
    ];
    var tableRows = rows.map(function (row) {
      return "<tr><td>" + escapeHtml(row[0]) + "</td><td>" + escapeHtml(row[1]) + "</td><td>" + escapeHtml(row[2]) + "</td></tr>";
    }).join("");
    var metricList = listHtml(a.points);
    var quotes = listHtml(a.say);
    var checks = [
      "Сверить число оплачиваемых лицензий, факт использования и цены с отчетами и договорами.",
      "Проверить списанные активы и действующие договоры поддержки.",
      "Подтвердить трудозатраты и стоимость рабочего часа у владельцев процесса.",
      "Оценить стоимость простоя по критичным бизнес-процессам.",
      "Зафиксировать источник оценки вероятности инцидента и возможного ущерба.",
      "Уточнить разовую стоимость внедрения и ежегодные расходы на решение.",
      "Проверить, что один и тот же эффект не учтен в нескольких строках."
    ];
    var projectCosts = "<p>Стоимость внедрения: " + (state.implementationCost === null ? "не указана" : escapeHtml(money(state.implementationCost))) +
      ". Ежегодные расходы на лицензии и сопровождение: " + (state.annualSupportCost === null ? "не указаны" : escapeHtml(money(state.annualSupportCost))) + ".</p>";
    var paybackText = c.paybackMonths === null
      ? "Срок окупаемости не рассчитан: не хватает исходных данных или годовой эффект после ежегодных расходов не положительный."
      : "Ориентировочный срок окупаемости: " + c.paybackMonths.toFixed(1).replace(".", ",") + " месяца. Расчет учитывает только потенциальное сокращение денежных расходов.";
    return "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"UTF-8\"><title>Обоснование внедрения ITAM</title>" +
      "<style>body{font-family:Arial,sans-serif;max-width:920px;margin:32px auto;padding:0 20px;color:#19344a;line-height:1.55;background:#fffdf7}h1,h2,h3{font-family:Arial,sans-serif;text-transform:uppercase}h1{font-size:31px;line-height:1.2;border-bottom:8px solid #c43c27;padding-bottom:15px}h2{font-size:20px;margin-top:28px;padding:8px 10px;background:#19344a;color:#fffdf7}h3{font-size:16px;margin-top:18px}p{margin:10px 0}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}td,th{border:1px solid #c9bba2;padding:9px;text-align:left;vertical-align:top}th{background:#e4d3b5}ul{padding-left:22px}li{margin:6px 0}.sum{padding:16px;border:2px solid #19344a;background:#f4e9d3;font-size:19px;font-weight:bold}.sub{font-size:12px;color:#52616b}</style></head><body>" +
      "<p style=\"font-size:12px;letter-spacing:2px;color:#c43c27;font-weight:bold\">ИНФЕРИТ ИТМЕН / ITAM</p>" +
      "<h1>Обоснование внедрения ITAM</h1>" +
      "<p><strong>Адресат:</strong> " + escapeHtml(a.roleName) + "</p>" +
      "<p><strong>Масштаб:</strong> " + escapeHtml(numberText(state.workstations)) + " рабочих мест; " + escapeHtml(numberText(state.assets)) + " ИТ-активов; " + escapeHtml(numberText(state.licensesTotal)) + " лицензий по учету; " + escapeHtml(numberText(state.products)) + " программных продуктов.</p>" +
      "<h2>1. Исходная ситуация</h2><p>" + escapeHtml(a.main) + "</p><p><strong>Вопрос руководителя:</strong> " + escapeHtml(a.question) + "</p>" +
      "<h2>2. Расчет показателей</h2>" +
      "<div class=\"sum\">Потенциал сокращения и предотвращения расходов по заполненным разделам: " + escapeHtml(c.cashSavings === null ? "не рассчитан" : money(c.cashSavings) + " в год") + "</div>" +
      "<p class=\"sub\">Сумма включает только лицензии и поддержку списанных активов. Высвобождаемое время, простой и риск показаны отдельно.</p>" +
      "<table><thead><tr><th>Показатель</th><th>Значение</th><th>Интерпретация</th></tr></thead><tbody>" + tableRows + "</tbody></table>" +
      "<h3>Стоимость проекта и окупаемость</h3>" + projectCosts + "<p>" + escapeHtml(paybackText) + "</p>" +
      "<h2>3. Аргументы для " + escapeHtml(a.roleName) + "</h2><p>" + escapeHtml(a.proof) + "</p>" + metricList + "<h3>Как начать обсуждение</h3>" + quotes +
      "<h2>4. Что проверить перед согласованием</h2>" + listHtml(checks) +
      "<h2>5. Следующий шаг</h2><p>Сверить исходные значения с владельцами данных, подтвердить потенциальные расходы и оценить стоимость проекта. После проверки сформировать план пилота на выбранном сегменте инфраструктуры.</p>" +
      "<p class=\"sub\">Все суммы являются оценкой по введенным данным. Потенциальный ущерб и стоимость высвобождаемого времени не являются гарантированной экономией. Документ не заменяет проверку расчетов и договорных условий.</p>" +
      "</body></html>";
  }

  function downloadBlob(filename, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadDoc() {
    downloadBlob("Obosnovanie-vnedreniya-ITAM.doc", "application/msword", buildReportHtml());
  }

  function downloadPptx() {
    if (typeof PptxGenJS === "undefined") {
      downloadBlob("Obosnovanie-vnedreniya-ITAM.html", "text/html;charset=utf-8", buildReportHtml());
      alert("Не удалось загрузить библиотеку PPTX. Скачан HTML-документ, который можно открыть в браузере или Word.");
      return;
    }
    var c = calc();
    var a = AUDIENCE[state.audience];
    var pptx = new PptxGenJS();
    pptx.defineLayout({ name: "ITAM_16x9", width: 13.333, height: 7.5 });
    pptx.layout = "ITAM_16x9";
    pptx.author = "Инферит ИТМен";
    pptx.subject = "Обоснование внедрения ITAM";
    pptx.title = "Обоснование внедрения ITAM";
    var C = { paper: "F4E9D3", white: "FFFDF7", ink: "19344A", red: "C43C27", muted: "52616B", line: "C9BBA2" };

    function baseSlide() {
      var slide = pptx.addSlide();
      slide.background = { color: C.paper };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.16, line: { color: C.red, transparency: 100 }, fill: { color: C.red } });
      slide.addText("ИНФЕРИТ ИТМЕН  /  ITAM", { x: 0.55, y: 0.32, w: 5, h: 0.25, fontFace: "Arial", fontSize: 10, bold: true, charSpacing: 1.5, color: C.red, margin: 0 });
      return slide;
    }
    function addBullets(slide, lines, x, y, w, h) {
      slide.addText(lines.map(function (t) { return { text: t, options: { bullet: { indent: 12 }, hanging: 3, breakLine: true } }; }), {
        x: x, y: y, w: w, h: h, fontFace: "Arial", fontSize: 15, color: C.ink, breakLine: false, paraSpaceAfterPt: 8, valign: "top", margin: 0.06
      });
    }

    var s1 = baseSlide();
    s1.addText("ОБОСНОВАНИЕ\nВНЕДРЕНИЯ ITAM", { x: 0.6, y: 1.25, w: 8.8, h: 1.6, fontFace: "Arial", fontSize: 33, bold: true, color: C.ink, breakLine: false, margin: 0 });
    s1.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.1, w: 0.12, h: 1.35, line: { color: C.red, transparency: 100 }, fill: { color: C.red } });
    s1.addText("Адресат: " + a.roleName, { x: 0.9, y: 3.15, w: 8.5, h: 0.45, fontFace: "Arial", fontSize: 19, bold: true, color: C.ink, margin: 0 });
    s1.addText("Потенциал сокращения расходов", { x: 0.9, y: 3.8, w: 6.2, h: 0.32, fontFace: "Arial", fontSize: 13, color: C.muted, margin: 0 });
    s1.addText(c.cashSavings === null ? "Не рассчитан" : money(c.cashSavings) + " / год", { x: 0.9, y: 4.16, w: 7.3, h: 0.7, fontFace: "Arial", fontSize: 27, bold: true, color: C.red, margin: 0 });
    s1.addText("В сумму входят только лицензии и поддержка списанных активов.", { x: 0.9, y: 5.08, w: 8.8, h: 0.5, fontFace: "Arial", fontSize: 13, color: C.muted, margin: 0 });
    s1.addText("РАСЧЕТЫ / " + new Date().toLocaleDateString("ru-RU"), { x: 0.6, y: 6.8, w: 5, h: 0.25, fontFace: "Arial", fontSize: 10, color: C.muted, margin: 0 });

    var s2 = baseSlide();
    s2.addText("РАСЧЕТНЫЕ ПОКАЗАТЕЛИ", { x: 0.6, y: 0.85, w: 12, h: 0.55, fontFace: "Arial", fontSize: 26, bold: true, color: C.ink, margin: 0 });
    s2.addTable([
      [{ text: "Показатель", options: { bold: true, fill: C.ink, color: C.white } }, { text: "Значение", options: { bold: true, fill: C.ink, color: C.white } }, { text: "Тип показателя", options: { bold: true, fill: C.ink, color: C.white } }],
      ["Лицензии", c.lic === null ? "Не рассчитано" : money(c.lic) + " / год", "Потенциальное сокращение расходов"],
      ["Поддержка списанных активов", c.retired === null ? "Не рассчитано" : money(c.retired) + " / год", "Предотвращаемые расходы"],
      ["Ручные операции", c.manual === null ? "Не рассчитано" : money(c.manual) + " / год", "Стоимость высвобождаемого времени"],
      ["Простой", c.downtime === null ? "Не рассчитано" : money(c.downtime) + " / год", "Потенциальные потери"],
      ["ИТ-риск", c.risk === null ? "Не рассчитано" : money(c.risk) + " / год", "Ожидаемый ущерб"]
    ], { x: 0.6, y: 1.65, w: 12.0, colW: [3.4, 3.1, 5.5], border: { pt: 0.7, color: C.line }, fontFace: "Arial", fontSize: 12, color: C.ink, margin: 0.1, rowH: 0.62 });
    s2.addText("Не суммируйте стоимость времени, простой и риск с прямым сокращением расходов.", { x: 0.65, y: 5.95, w: 12, h: 0.55, fontFace: "Arial", fontSize: 14, bold: true, color: C.red, margin: 0 });

    var s3 = baseSlide();
    s3.addText("АРГУМЕНТЫ ДЛЯ РУКОВОДИТЕЛЯ", { x: 0.6, y: 0.85, w: 12, h: 0.55, fontFace: "Arial", fontSize: 25, bold: true, color: C.ink, margin: 0 });
    s3.addText(a.roleName + "  /  " + a.question, { x: 0.6, y: 1.55, w: 12, h: 0.55, fontFace: "Arial", fontSize: 18, bold: true, color: C.red, margin: 0 });
    s3.addText(a.main, { x: 0.6, y: 2.2, w: 11.8, h: 1.0, fontFace: "Arial", fontSize: 15, color: C.ink, margin: 0.05, valign: "top", breakLine: false });
    addBullets(s3, a.points, 0.65, 3.25, 11.8, 2.0);
    s3.addText("Проверка: " + a.proof, { x: 0.65, y: 5.55, w: 11.9, h: 0.9, fontFace: "Arial", fontSize: 12, color: C.muted, margin: 0.05, valign: "top" });

    var s4 = baseSlide();
    s4.addText("ПЕРЕД СОГЛАСОВАНИЕМ", { x: 0.6, y: 0.85, w: 12, h: 0.55, fontFace: "Arial", fontSize: 26, bold: true, color: C.ink, margin: 0 });
    addBullets(s4, [
      "Сверить количество лицензий, факт использования и договорные цены.",
      "Подтвердить списанные активы и действующие договоры поддержки.",
      "Проверить трудозатраты и стоимость рабочего часа.",
      "Обосновать оценку простоя и вероятность ИТ-инцидента.",
      "Уточнить стоимость внедрения и ежегодные расходы.",
      "Не учитывать один и тот же эффект дважды."
    ], 0.7, 1.65, 11.8, 3.9);
    s4.addShape(pptx.ShapeType.rect, { x: 0.6, y: 5.9, w: 12, h: 0.9, line: { color: C.ink, width: 1 }, fill: { color: "E4D3B5" } });
    s4.addText("Следующий шаг: сверить исходные данные с ИТ, финансами, закупками и владельцами бизнес-процессов.", { x: 0.85, y: 6.08, w: 11.5, h: 0.5, fontFace: "Arial", fontSize: 13, bold: true, color: C.ink, margin: 0.02 });
    pptx.writeFile({ fileName: "Obosnovanie-vnedreniya-ITAM.pptx" });
  }

  function resetForm() {
    NUMERIC_FIELDS.forEach(function (key) { state[key] = null; });
    state.audience = "ceo";
    syncInputs();
    renderLive();
    showStep(0);
  }

  function bind() {
    syncInputs();
    document.querySelectorAll("[data-go]").forEach(function (button) {
      button.addEventListener("click", function () {
        readInputs();
        if (state.unusedPct !== null && (state.unusedPct < 0 || state.unusedPct > 100)) {
          alert("Доля неиспользуемых лицензий должна быть от 0 до 100%."); return;
        }
        if (state.riskProbability !== null && (state.riskProbability < 0 || state.riskProbability > 100)) {
          alert("Вероятность инцидента должна быть от 0 до 100%."); return;
        }
        showStep(Number(button.dataset.go));
      });
    });
    document.querySelectorAll("input[data-state]").forEach(function (input) {
      input.addEventListener("input", function () { readInputs(); renderLive(); });
    });
    document.querySelectorAll(".audience-card").forEach(function (card) {
      card.addEventListener("click", function () {
        state.audience = card.dataset.audience;
        renderAudience();
      });
    });
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.audience = tab.dataset.audience;
        renderResult();
      });
    });
    var btnDoc = $("btnDownloadDoc");
    var btnPpt = $("btnDownloadPpt");
    var btnReset = $("btnReset");
    if (btnDoc) btnDoc.addEventListener("click", downloadDoc);
    if (btnPpt) btnPpt.addEventListener("click", downloadPptx);
    if (btnReset) btnReset.addEventListener("click", resetForm);
  }

  document.addEventListener("DOMContentLoaded", bind);
})();