(function () {
  "use strict";

  var root = null;

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
        "Формула расчета и объяснение, откуда взяты исходные цифры"
      ],
      proof: "Перед согласованием сверьте расчет с выгрузками из учетных систем, договорами, счетами и замерами времени. Проверьте, что один и тот же эффект не учтен дважды.",
      say: [
        "У каждого показателя будет источник данных и понятная формула. Сначала сверим данные учета с фактическим использованием и договорными расходами, затем зафиксируем расчет.",
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
      main: "Свяжите активы и программные версии с конкретными уязвимостями, возможным ущербом и мерами устранения. Финансовая оценка риска должна опираться на понятные исходные данные.",
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

  function $(id) { return root ? root.querySelector("#ibc-" + id) : null; }

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
      '<div class="role-quote"><strong>Пример формулировки для обсуждения:</strong> ' + a.say[0] + '</div>' +
      '<div class="role-quote"><strong>Чего избегать:</strong> ' + a.avoid + '</div>';
  }

  function renderAudience() {
    var a = AUDIENCE[state.audience];
    root.querySelectorAll(".audience-card").forEach(function (card) {
      var active = card.dataset.audience === state.audience;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var box = $("audienceArg");
    if (box && a) box.innerHTML = roleHtml(a, a.title);
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

    root.querySelectorAll(".tab").forEach(function (tab) {
      var active = tab.dataset.audience === state.audience;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    setText("resultRoleTitle", a.roleName);
    var detail = $("resultArgs");
    if (detail) detail.innerHTML = roleHtml(a, a.title);

    setText("docMeta",
      numberText(state.workstations) + " рабочих мест · " +
      numberText(state.assets) + " ИТ-активов · адресат: " + a.roleName);
    setText("docTotal", c.cashSavings === null ? "Не рассчитано" : money(c.cashSavings) + " / год");
  }

  function showStep(n) {
    readInputs();
    state.step = n;
    root.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active");
    });
    var screen = $("screen-" + n);
    if (screen) screen.classList.add("active");
    if (n >= 1 && n <= 6) {
      var pct = (n / 6) * 100;
      root.querySelectorAll("[data-progress]").forEach(function (el) { el.style.width = pct + "%"; });
      root.querySelectorAll("[data-step-label]").forEach(function (el) { el.textContent = "Шаг " + n + " из 6"; });
    }
    if (n === 2 || n === 3 || n === 4) renderLive();
    if (n === 5) renderAudience();
    if (n === 6) renderResult();
    if (document.documentElement.classList.contains("itam-bc-full")) {
      root.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      var top = root.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.pageYOffset + top - 80, behavior: "smooth" });
    }
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

  function resetForm() {
    NUMERIC_FIELDS.forEach(function (key) { state[key] = null; });
    state.audience = "ceo";
    syncInputs();
    renderLive();
    showStep(0);
  }

  function bind() {
    syncInputs();
    root.querySelectorAll("[data-go]").forEach(function (button) {
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
    root.querySelectorAll("input[data-state]").forEach(function (input) {
      input.addEventListener("input", function () { readInputs(); renderLive(); });
    });
    root.querySelectorAll(".audience-card").forEach(function (card) {
      card.addEventListener("click", function () {
        state.audience = card.dataset.audience;
        renderAudience();
      });
    });
    root.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.audience = tab.dataset.audience;
        renderResult();
      });
    });
    var btnDoc = $("btnDownloadDoc");
    var btnReset = $("btnReset");
    if (btnDoc) btnDoc.addEventListener("click", downloadDoc);
    if (btnReset) btnReset.addEventListener("click", resetForm);
  }

  var FONTS_URL = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=PT+Sans:wght@400;700&display=swap";
  var CSS = "#itamBc h1,#itamBc h2,#itamBc h3,#itamBc h4,#itamBc p,#itamBc li,#itamBc label,#itamBc span,#itamBc strong,#itamBc small,#itamBc a,#itamBc ol,#itamBc ul { color: inherit; font-family: inherit; letter-spacing: inherit; text-shadow: none; }\n#itamBc { --paper: #f4e9d3;\n  --paper-light: #fffdf7;\n  --paper-dark: #e4d3b5;\n  --ink: #19344a;\n  --ink-soft: #52616b;\n  --red: #c43c27;\n  --red-dark: #9e2d1d;\n  --line: #c9bba2;\n  --blue-light: #e8edf0;\n  --shadow: 5px 5px 0 rgba(25, 52, 74, 0.15);\n  --heading: \"Oswald\", \"Arial Narrow\", sans-serif;\n  --body: \"PT Sans\", Arial, sans-serif; }\n#itamBc * { box-sizing: border-box; margin: 0; padding: 0; }\n#itamBc { min-height: 100vh;\n  background-color: var(--paper);\n  background-image:\n    repeating-linear-gradient(0deg, rgba(25,52,74,.025) 0, rgba(25,52,74,.025) 1px, transparent 1px, transparent 5px),\n    linear-gradient(135deg, rgba(255,255,255,.32), transparent 48%);\n  color: var(--ink);\n  font-family: var(--body);\n  -webkit-font-smoothing: antialiased; }\n#itamBc button,#itamBc input { font: inherit; }\n#itamBc button { color: inherit; }\n#itamBc a { color: inherit; }\n#itamBc .page { max-width: 1120px; margin: 0 auto; padding: 24px 22px 54px; }\n#itamBc .topbar { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:26px; }\n#itamBc .logo img { height: 34px; width:auto; display:block; }\n#itamBc .topbar-note { font: 600 14px var(--heading); letter-spacing:.07em; color:var(--ink-soft); text-align:right; }\n#itamBc .screen { display:none; }\n#itamBc .screen.active { display:block; }\n#itamBc .hero-card,#itamBc .wizard-card { border:1px solid #cdbda4; background:var(--paper-light); box-shadow:0 2px 7px rgba(48,38,22,.07); }\n#itamBc .hero-grid { display:grid; grid-template-columns:1fr; min-height:auto; }\n#itamBc .hero-left { padding:43px 46px 36px; max-width:820px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:20px; }\n#itamBc .eyebrow,#itamBc .section-kicker { font:600 13px var(--heading); letter-spacing:.09em; text-transform:uppercase; }\n#itamBc .eyebrow.red,#itamBc .section-kicker { color:var(--red); }\n#itamBc .hero-left h1 { max-width:760px; font:700 clamp(38px,5vw,64px)/1.08 var(--heading); text-transform:uppercase; letter-spacing:.005em; }\n#itamBc .hero-left h1 .heading-blue { color:var(--ink); }\n#itamBc .hero-left h1 .heading-red { color:var(--red); }\n#itamBc .hero-left .lead { max-width:48ch; color:var(--ink-soft); font-size:19px; line-height:1.45; }\n#itamBc .features { list-style:none; display:grid; gap:12px; width:100%; max-width:620px; margin:2px 0 4px; }\n#itamBc .features li { display:flex; align-items:center; gap:13px; font-size:16px; font-weight:700; }\n#itamBc .feat-icon { width:40px; height:36px; display:grid; place-items:center; flex-shrink:0; background:var(--red); color:var(--paper-light); font:600 17px var(--heading); }\n#itamBc .hero-right { position:relative; overflow:hidden; padding:44px 34px; display:flex; flex-direction:column; justify-content:center; gap:18px; color:var(--paper-light); background:var(--ink); }\n#itamBc .hero-right::before { content:\"\"; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(135deg, transparent 0 34px, rgba(244,233,211,.065) 34px 36px); }\n#itamBc .hero-right::after { content:\"\"; position:absolute; width:180px; height:180px; border:20px solid var(--red); transform:rotate(45deg); right:-106px; top:-92px; opacity:.88; }\n#itamBc .poster-mark { align-self:flex-start; position:relative; z-index:1; padding:9px 13px; color:var(--paper-light); background:var(--red); font:700 23px/.95 var(--heading); transform:rotate(-4deg); }\n#itamBc .poster-kicker { position:relative; z-index:1; margin-top:14px; color:#e9cfa8; font:600 15px var(--heading); letter-spacing:.08em; }\n#itamBc .poster-step { display:flex; align-items:center; gap:16px; position:relative; z-index:1; padding:14px 0; border-bottom:1px solid rgba(244,233,211,.34); }\n#itamBc .poster-step span { color:#ed7149; font:700 27px var(--heading); }\n#itamBc .poster-step strong { font-size:17px; font-weight:700; }\n#itamBc .poster-bottom { z-index:1; margin-top:16px; color:var(--paper); font:600 13px var(--heading); letter-spacing:.06em; }\n#itamBc .btn { min-height:44px; display:inline-flex; align-items:center; justify-content:center; gap:10px; border:2px solid var(--ink); border-radius:2px; padding:11px 18px; cursor:pointer; font:700 15px var(--body); transition:transform .12s ease, box-shadow .12s ease, background .12s ease; }\n#itamBc .btn:focus-visible,#itamBc .audience-card:focus-visible,#itamBc .tab:focus-visible { outline:3px solid #df7654; outline-offset:3px; }\n#itamBc .btn:active { transform:translate(2px,2px); box-shadow:none; }\n#itamBc .btn-primary { background:var(--red); color:var(--paper-light); border-color:var(--red-dark); box-shadow:3px 3px 0 var(--ink); }\n#itamBc .btn-primary:hover { background:var(--red-dark); }\n#itamBc .btn-ghost { background:transparent; color:var(--ink); border-color:var(--line); box-shadow:none; }\n#itamBc .btn-ghost:hover { background:#f5ecdc; border-color:var(--ink); }\n#itamBc .btn-lg { padding:14px 24px; font-size:17px; }\n#itamBc .wizard-card { padding:30px 36px 28px; }\n#itamBc .progress-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:9px; color:var(--ink-soft); font-size:13px; font-weight:700; }\n#itamBc .progress-bar { height:8px; background:#e5dccb; margin-bottom:26px; border:1px solid var(--line); }\n#itamBc .progress-bar > span { display:block; height:100%; background:var(--red); transition:width .2s ease; }\n#itamBc .section-kicker { margin-bottom:9px; }\n#itamBc .wizard-card h2 { font:600 clamp(28px,3vw,37px)/1.16 var(--heading); text-transform:uppercase; margin-bottom:11px; }\n#itamBc .wizard-card .sub { max-width:78ch; margin-bottom:23px; color:var(--ink-soft); font-size:16px; line-height:1.5; }\n#itamBc .fields { display:grid; gap:17px; }\n#itamBc .fields-2 { grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px 20px; }\n#itamBc .field { min-width:0; }\n#itamBc .field-wide { grid-column:1/-1; }\n#itamBc .field label { display:block; margin-bottom:7px; font-size:14px; font-weight:700; line-height:1.35; }\n#itamBc .field input { width:100%; min-height:47px; padding:11px 13px; border:1px solid #d6c7ae; border-bottom:2px solid #cdb89a; border-radius:3px; background:#fffaf2; color:var(--ink); font-size:16px; outline:none; box-shadow:inset 0 1px 2px rgba(68,50,28,.04); }\n#itamBc .field input::placeholder { color:#8b918e; opacity:1; font-size:14px; font-weight:400; }\n#itamBc .field input:focus { border-color:#c43c27; border-bottom-color:#c43c27; box-shadow:0 0 0 2px rgba(196,60,39,.08); }\n#itamBc .field-note { margin-top:15px; color:var(--ink-soft); font-size:13px; line-height:1.45; }\n#itamBc .formula-strip { margin-top:18px; padding:12px 14px; border-left:4px solid var(--red); background:#f1e5ce; color:var(--ink-soft); font-size:14px; line-height:1.5; }\n#itamBc .formula-strip strong { color:var(--ink); }\n#itamBc .live-box { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:20px; padding:16px 18px; border:1px solid var(--ink); }\n#itamBc .live-box.red { background:#f7e1d5; border-left:6px solid var(--red); }\n#itamBc .live-box.navy { background:#e8edf0; border-left:6px solid var(--ink); }\n#itamBc .live-box.compact { margin-top:13px; padding:12px 14px; }\n#itamBc .live-box > div { display:flex; flex-direction:column; gap:4px; }\n#itamBc .live-label { font-size:15px; font-weight:700; line-height:1.35; }\n#itamBc .live-box small { font-size:12px; line-height:1.35; color:var(--ink-soft); }\n#itamBc .live-box strong { text-align:right; font:600 clamp(19px,2.7vw,28px)/1.15 var(--heading); }\n#itamBc .section-block { margin-top:16px; padding:19px; background:#faf3e6; border:1px solid var(--line); }\n#itamBc .block-heading { display:flex; align-items:flex-start; gap:13px; margin-bottom:15px; }\n#itamBc .block-heading > span { flex:0 0 31px; height:31px; display:grid; place-items:center; background:var(--red); color:white; font:600 17px var(--heading); }\n#itamBc .block-heading h3 { font:600 22px/1.2 var(--heading); text-transform:uppercase; margin-bottom:4px; }\n#itamBc .block-heading p { color:var(--ink-soft); font-size:14px; line-height:1.45; }\n#itamBc .nav-row { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:28px; padding-top:19px; border-top:1px solid var(--line); }\n#itamBc .audience-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; margin:3px 0 20px; }\n#itamBc .audience-card { position:relative; display:grid; grid-template-columns:58px minmax(0,1fr); align-items:center; column-gap:13px; min-height:126px; padding:16px; text-align:left; cursor:pointer; border:1px solid var(--line); border-top:4px solid var(--ink); border-radius:0; background:#fffdf7; transition:background .12s,border-color .12s; }\n#itamBc .audience-card:hover { border-color:var(--red); }\n#itamBc .audience-card.active { border:2px solid var(--red); border-top-width:5px; background:#f8e7d9; box-shadow:3px 3px 0 rgba(25,52,74,.18); }\n#itamBc .audience-number { position:absolute; right:10px; top:7px; color:#b5a993; font:600 12px var(--heading); }\n#itamBc .audience-card .ico { grid-row:1/4; width:52px; height:52px; display:grid; place-items:center; background:var(--ink); color:var(--paper-light); font:600 20px var(--heading); }\n#itamBc .audience-card.active .ico { background:var(--red); }\n#itamBc .audience-card h3 { padding-right:20px; font-size:16px; font-weight:700; line-height:1.25; }\n#itamBc .audience-card p { align-self:start; padding-right:5px; margin-top:5px; color:var(--ink-soft); font-size:13px; line-height:1.35; }\n#itamBc .arg-box { padding:21px 23px; border:1px solid var(--line); border-top:5px solid var(--red); background:#fffdf7; }\n#itamBc .arg-box .label { margin-bottom:8px; color:var(--red); font:600 13px var(--heading); letter-spacing:.07em; text-transform:uppercase; }\n#itamBc .arg-box h3 { margin-bottom:10px; font:600 25px/1.2 var(--heading); }\n#itamBc .arg-box .role-intro { margin-bottom:16px; color:var(--ink-soft); font-size:15px; line-height:1.5; }\n#itamBc .arg-columns { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:17px; }\n#itamBc .arg-columns h4 { margin-bottom:8px; font:600 17px var(--heading); text-transform:uppercase; }\n#itamBc .arg-box ul { list-style:none; display:grid; gap:8px; }\n#itamBc .arg-box li { position:relative; padding-left:18px; font-size:14px; line-height:1.45; }\n#itamBc .arg-box li::before { content:\"→\"; position:absolute; left:0; top:0; color:var(--red); font-weight:700; }\n#itamBc .arg-box .role-quote { margin-top:17px; padding:13px 15px; background:#f4e9d3; border-left:4px solid var(--ink); font-size:14px; line-height:1.5; }\n#itamBc .total-hero { display:flex; justify-content:space-between; align-items:center; gap:22px; padding:21px 23px; margin:0 0 9px; border:2px solid var(--ink); background:var(--ink); color:var(--paper-light); }\n#itamBc .total-hero > div { display:flex; flex-direction:column; gap:5px; }\n#itamBc .total-label { font:600 20px/1.2 var(--heading); text-transform:uppercase; }\n#itamBc .total-hero small { max-width:70ch; color:#e4d3b5; font-size:13px; line-height:1.4; }\n#itamBc .total-hero strong { flex-shrink:0; color:#f0a07f; font:600 clamp(27px,4vw,39px)/1.15 var(--heading); text-align:right; }\n#itamBc .result-caveat { margin:0 0 22px; color:var(--ink-soft); font-size:13px; line-height:1.45; }\n#itamBc .metric-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }\n#itamBc .metric-card { min-width:0; padding:17px 16px 16px; background:#fffdf7; border:1px solid var(--line); border-top:4px solid var(--line); }\n#itamBc .metric-card.red-edge { border-top-color:var(--red); }\n#itamBc .metric-card.blue-edge { border-top-color:var(--ink); }\n#itamBc .metric-card > p { color:var(--red); font:600 12px var(--heading); letter-spacing:.06em; margin-bottom:8px; }\n#itamBc .metric-card h3 { min-height:44px; margin-bottom:12px; font:600 20px/1.15 var(--heading); text-transform:uppercase; }\n#itamBc .metric-card strong { display:block; margin-bottom:7px; font:600 clamp(18px,2vw,24px)/1.15 var(--heading); overflow-wrap:anywhere; }\n#itamBc .metric-card small { display:block; color:var(--ink-soft); font-size:12px; line-height:1.4; }\n#itamBc .payback-panel { margin-top:16px; padding:17px 20px; border:1px solid var(--line); background:#f6eddc; }\n#itamBc .payback-panel h3 { margin-bottom:6px; font:600 21px var(--heading); text-transform:uppercase; }\n#itamBc .payback-panel p { color:var(--ink-soft); font-size:14px; line-height:1.45; }\n#itamBc .payback-panel .payback-values { display:flex; flex-wrap:wrap; gap:12px 30px; margin-top:10px; }\n#itamBc .payback-panel .payback-values strong { display:block; font:600 22px var(--heading); color:var(--red); }\n#itamBc .payback-panel .payback-values span { font-size:12px; color:var(--ink-soft); }\n#itamBc .result-role { margin-top:25px; }\n#itamBc .result-role-head { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-bottom:14px; }\n#itamBc .result-role-head .section-kicker { margin:0 0 3px; }\n#itamBc .result-role-head h3 { font:600 26px var(--heading); text-transform:uppercase; }\n#itamBc .stamp { display:inline-block; transform:rotate(-5deg); padding:7px 9px; border:2px solid var(--red); color:var(--red); font:600 13px var(--heading); white-space:nowrap; }\n#itamBc .tabs { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:0; }\n#itamBc .tab { padding:8px 11px; border:1px solid var(--line); border-bottom:0; border-radius:0; background:#f3ead9; color:var(--ink); font:700 13px var(--body); cursor:pointer; }\n#itamBc .tab.active { border-color:var(--red); background:var(--red); color:#fffdf7; }\n#itamBc .tabs + .arg-box { margin-top:0; }\n#itamBc .doc-preview { margin-top:25px; border:2px solid var(--ink); background:#fffdf7; }\n#itamBc .doc-cover { position:relative; overflow:hidden; min-height:215px; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:10px; padding:28px; background:var(--ink); color:var(--paper-light); }\n#itamBc .doc-cover::after { content:\"\"; position:absolute; width:220px; height:220px; right:-92px; top:-115px; border:26px solid var(--red); transform:rotate(45deg); }\n#itamBc .doc-cover .eyebrow { color:#e7b18f; }\n#itamBc .doc-cover h3 { position:relative; z-index:1; font:600 37px/1.1 var(--heading); text-transform:uppercase; }\n#itamBc .doc-cover > p:not(.eyebrow) { position:relative; z-index:1; font-size:14px; color:#e5d7bf; }\n#itamBc .cover-total { display:flex; align-items:baseline; flex-wrap:wrap; gap:10px; position:relative; z-index:1; margin-top:4px; }\n#itamBc .cover-total span { font-size:13px; color:#e5d7bf; }\n#itamBc .cover-total strong { color:#f0a07f; font:600 25px var(--heading); }\n#itamBc .doc-body { padding:22px 25px 25px; }\n#itamBc .doc-body > h3 { margin-bottom:12px; font:600 22px var(--heading); text-transform:uppercase; }\n#itamBc .doc-toc { list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:11px 24px; margin-bottom:22px; }\n#itamBc .doc-toc li { display:flex; gap:10px; align-items:flex-start; color:var(--ink-soft); font-size:14px; line-height:1.4; }\n#itamBc .doc-toc li span { flex:0 0 26px; color:var(--red); font:600 19px var(--heading); }\n#itamBc .download-row { display:flex; gap:12px; flex-wrap:wrap; padding-top:18px; border-top:1px solid var(--line); }\n#itamBc .note { margin-top:15px; color:var(--ink-soft); font-size:12px; line-height:1.5; }\n@media (max-width: 900px) {\n#itamBc .hero-grid { grid-template-columns:1fr; }\n#itamBc .hero-left { padding:34px 28px; }\n#itamBc .hero-right { padding:28px; }\n#itamBc .poster-mark { display:none; }\n#itamBc .poster-kicker { margin-top:0; }\n#itamBc .metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }\n}\n@media (max-width: 620px) {\n#itamBc .page { padding:13px 11px 28px; }\n#itamBc .topbar { margin-bottom:14px; }\n#itamBc .logo img { height:29px; }\n#itamBc .topbar-note { font-size:11px; }\n#itamBc .hero-left { padding:29px 20px; gap:17px; }\n#itamBc .hero-left h1 { font-size:42px; }\n#itamBc .hero-left .lead { font-size:17px; }\n#itamBc .hero-right { padding:23px 20px; gap:10px; }\n#itamBc .poster-step { padding:10px 0; }\n#itamBc .wizard-card { padding:22px 17px 20px; }\n#itamBc .wizard-card h2 { font-size:29px; }\n#itamBc .wizard-card .sub { font-size:15px; }\n#itamBc .fields-2,#itamBc .audience-grid,#itamBc .arg-columns,#itamBc .metric-grid,#itamBc .doc-toc { grid-template-columns:1fr; }\n#itamBc .field-wide { grid-column:auto; }\n#itamBc .audience-card { min-height:105px; }\n#itamBc .live-box { align-items:flex-start; flex-direction:column; }\n#itamBc .live-box strong { text-align:left; }\n#itamBc .total-hero { align-items:flex-start; flex-direction:column; }\n#itamBc .total-hero strong { text-align:left; }\n#itamBc .metric-card h3 { min-height:0; }\n#itamBc .result-role-head { align-items:flex-start; }\n#itamBc .tabs { gap:5px; }\n#itamBc .tab { font-size:12px; padding:8px 9px; }\n#itamBc .doc-cover { padding:22px 18px; }\n#itamBc .doc-cover h3 { font-size:31px; }\n#itamBc .doc-body { padding:19px 17px; }\n#itamBc .nav-row { align-items:stretch; }\n#itamBc .nav-row .btn { flex:1; padding-left:10px; padding-right:10px; }\n}\n#itamBc .hero-bottom { display:flex;\n  justify-content:space-between;\n  gap:12px;\n  padding:13px 30px;\n  background:#e9dcc3;\n  color:var(--ink);\n  font:600 12px var(--heading);\n  letter-spacing:.07em;\n  border-top:1px solid var(--line); }\n@media (max-width: 620px) {\n#itamBc .hero-left { padding:29px 20px; }\n#itamBc .hero-bottom { flex-direction:column; gap:5px; padding:12px 20px; }\n}\n#itamBc { min-height: 0; width: 100%; line-height: normal; text-align: left; box-shadow: 0 0 0 100vmax var(--paper); clip-path: inset(0 -100vmax); }\nhtml.itam-bc-full, html.itam-bc-full body { overflow: hidden !important; }\nhtml.itam-bc-full #itamBc { position: fixed !important; inset: 0; z-index: 2147483000; min-height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; box-shadow: none; clip-path: none; }\n";
  var HTML = "<div class=\"page\"><div class=\"topbar\">\n      <a class=\"logo\" href=\"https://itman.ru/\" aria-label=\"Инферит ИТМен\">\n        <img src=\"https://katerinazaber.github.io/itman/itam-business-case/assets/brand.svg\" alt=\"Инферит ИТМен\" />\n      </a>\n      <div class=\"topbar-note\">ITAMDAY 2026</div>\n    </div><div class=\"main\">\n      <section class=\"screen active\" id=\"ibc-screen-0\">\n        <div class=\"hero-card\">\n          <div class=\"hero-grid\">\n            <div class=\"hero-left\">\n              <p class=\"eyebrow red\">БЕСПЛАТНЫЙ КАЛЬКУЛЯТОР</p>\n              <h1>Как обосновать<br><span class=\"heading-blue\">внедрение решения</span><br><span class=\"heading-red\">перед руководством</span></h1>\n              <p class=\"lead\">Посчитайте расходы, оцените потери и подготовьте аргументы для руководителя.</p>\n              <ul class=\"features\">\n                <li><span class=\"feat-icon\">01</span><span>Расходы на лицензии и поддержку</span></li>\n                <li><span class=\"feat-icon\">02</span><span>Стоимость ручного учета ИТ-активов</span></li>\n                <li><span class=\"feat-icon\">03</span><span>Потери от простоя и риски</span></li>\n              </ul>\n              <button type=\"button\" class=\"btn btn-primary btn-lg\" data-go=\"1\">Начать расчет <span aria-hidden=\"true\">→</span></button>\n            </div>\n          </div>\n          <div class=\"hero-bottom\">\n            <span>01 / ДАННЫЕ</span><span>02 / РАСЧЕТ</span><span>03 / ОБОСНОВАНИЕ</span>\n          </div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-1\">\n        <div class=\"wizard-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 1 из 6</span><span>Инфраструктура</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:16.6%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 01 / ИСХОДНЫЕ ДАННЫЕ</p>\n          <h2>Сначала определим масштаб ИТ-инфраструктуры</h2>\n          <p class=\"sub\">Укажите актуальные данные по вашей инфраструктуре. Если точных значений нет, поставьте 0.</p>\n          <div class=\"fields fields-2\">\n            <div class=\"field\"><label for=\"ibc-workstations\">Рабочие места, шт.</label><input id=\"ibc-workstations\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Например, 5000\" /></div>\n            <div class=\"field\"><label for=\"ibc-assets\">ИТ-активы, шт.</label><input id=\"ibc-assets\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Например, 7200\" /></div>\n            <div class=\"field\"><label for=\"ibc-licensesTotal\">Лицензии ПО, шт.</label><input id=\"ibc-licensesTotal\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество по учету\" /></div>\n            <div class=\"field\"><label for=\"ibc-products\">Программные продукты, шт.</label><input id=\"ibc-products\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество продуктов\" /></div>\n          </div>\n          <p class=\"field-note\">Эти значения описывают масштаб инфраструктуры. Они не влияют на расчет экономии сами по себе.</p>\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"0\">К началу</button><button type=\"button\" class=\"btn btn-primary\" data-go=\"2\">К лицензиям →</button></div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-2\">\n        <div class=\"wizard-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 2 из 6</span><span>Лицензии</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:33.3%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 02 / РАСХОДЫ НА ПО</p>\n          <h2>Сколько стоит неиспользуемое ПО?</h2>\n          <p class=\"sub\">Введите число оплачиваемых лицензий, их среднюю годовую стоимость и примерную долю неиспользуемых лицензий. Расчет произведен по формуле: число лицензий × годовая цена × доля неиспользуемых лицензий.</p>\n          <div class=\"fields\">\n            <div class=\"field\"><label for=\"ibc-licenseCount\">Количество оплачиваемых лицензий, шт.</label><input id=\"ibc-licenseCount\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество лицензий\" /></div>\n            <div class=\"field\"><label for=\"ibc-licensePrice\">Средняя стоимость лицензии за год, ₽</label><input id=\"ibc-licensePrice\" data-state type=\"number\" min=\"0\" step=\"100\" placeholder=\"Рублей в год за одну лицензию\" /></div>\n            <div class=\"field\"><label for=\"ibc-unusedPct\">Неиспользуемые лицензии, %</label><input id=\"ibc-unusedPct\" data-state type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" placeholder=\"От 0 до 100\" /></div>\n          </div>\n          <div class=\"live-box red\"><div><span class=\"live-label\">Потенциальное сокращение расходов на лицензии</span><small>При условии, что эти лицензии можно не продлевать</small></div><strong id=\"ibc-liveLicenses\">Заполните поля</strong></div>\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"1\">← Назад</button><button type=\"button\" class=\"btn btn-primary\" data-go=\"3\">К трудозатратам →</button></div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-3\">\n        <div class=\"wizard-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 3 из 6</span><span>Ручные операции</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:50%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 03 / ТРУДОЗАТРАТЫ</p>\n          <h2>Сколько времени уходит на учет активов?</h2>\n          <p class=\"sub\">Это примерная оценка стоимости высвобождаемого времени, а не точная цифра сокращения зарплатных расходов. Расчет произведен по формуле: разница часов × стоимость часа × число специалистов × 12 месяцев.</p>\n          <div class=\"fields fields-2\">\n            <div class=\"field\"><label for=\"ibc-specialists\">Специалисты, чел.</label><input id=\"ibc-specialists\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество сотрудников\" /></div>\n            <div class=\"field\"><label for=\"ibc-hourRate\">Стоимость рабочего часа, ₽</label><input id=\"ibc-hourRate\" data-state type=\"number\" min=\"0\" step=\"50\" placeholder=\"Затраты на один час\" /></div>\n            <div class=\"field\"><label for=\"ibc-hoursMonth\">Часов на одного специалиста сейчас, в месяц</label><input id=\"ibc-hoursMonth\" data-state type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"Часы в месяц\" /></div>\n            <div class=\"field\"><label for=\"ibc-hoursAfter\">Часов на одного специалиста после изменений, в месяц</label><input id=\"ibc-hoursAfter\" data-state type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"Оставшиеся часы\" /></div>\n          </div>\n          <div class=\"live-box navy\"><div><span class=\"live-label\">Стоимость высвобождаемого времени</span><small>В год, при указанных трудозатратах</small></div><strong id=\"ibc-liveManual\">Заполните поля</strong></div>\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"2\">← Назад</button><button type=\"button\" class=\"btn btn-primary\" data-go=\"4\">К потерям и риску →</button></div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-4\">\n        <div class=\"wizard-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 4 из 6</span><span>Потери и риск</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:66.6%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 04 / ДОПОЛНИТЕЛЬНЫЕ ПОКАЗАТЕЛИ</p>\n          <h2>Какие расходы и потери можно выявить?</h2>\n          <p class=\"sub\">Заполняйте те блоки, по которым есть данные. Экономия, стоимость времени, потери от простоя и риск показываются отдельно.</p>\n\n          <div class=\"section-block\">\n            <div class=\"block-heading\"><span>А</span><div><h3>Поддержка списанных активов</h3><p>Расходы, которые можно предотвратить после сверки учета и договоров.</p></div></div>\n            <div class=\"fields fields-2\">\n              <div class=\"field\"><label for=\"ibc-retiredCount\">Списанные активы на поддержке, шт.</label><input id=\"ibc-retiredCount\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество\" /></div>\n              <div class=\"field\"><label for=\"ibc-retiredCost\">Поддержка одного актива за год, ₽</label><input id=\"ibc-retiredCost\" data-state type=\"number\" min=\"0\" step=\"100\" placeholder=\"Рублей в год\" /></div>\n            </div>\n            <div class=\"live-box red compact\"><div><span class=\"live-label\">Потенциально предотвращаемые расходы</span><small>В год</small></div><strong id=\"ibc-liveRetired\">Заполните поля</strong></div>\n          </div>\n\n          <div class=\"section-block\">\n            <div class=\"block-heading\"><span>Б</span><div><h3>Потери от простоя</h3><p>Оценка последствий недоступности критичных систем для бизнеса.</p></div></div>\n            <div class=\"fields fields-2\">\n              <div class=\"field\"><label for=\"ibc-downtimeHours\">Часов простоя за год</label><input id=\"ibc-downtimeHours\" data-state type=\"number\" min=\"0\" step=\"0.5\" placeholder=\"Часы за год\" /></div>\n              <div class=\"field\"><label for=\"ibc-downtimeRate\">Потери бизнеса за час простоя, ₽</label><input id=\"ibc-downtimeRate\" data-state type=\"number\" min=\"0\" step=\"1000\" placeholder=\"Рублей за час\" /></div>\n            </div>\n            <div class=\"live-box navy compact\"><div><span class=\"live-label\">Потенциальные потери от простоя</span><small>За год; не прибавляются к экономии</small></div><strong id=\"ibc-liveDowntime\">Заполните поля</strong></div>\n          </div>\n\n          <div class=\"section-block\">\n            <div class=\"block-heading\"><span>В</span><div><h3>Стоимость ИТ-риска</h3><p>Ожидаемый ущерб: вероятность инцидента за год × финансовый ущерб.</p></div></div>\n            <div class=\"fields fields-2\">\n              <div class=\"field\"><label for=\"ibc-riskAssets\">Активы, затронутые риском, шт. (необязательно)</label><input id=\"ibc-riskAssets\" data-state type=\"number\" min=\"0\" step=\"1\" placeholder=\"Количество активов\" /></div>\n              <div class=\"field\"><label for=\"ibc-riskProbability\">Вероятность инцидента за год, %</label><input id=\"ibc-riskProbability\" data-state type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" placeholder=\"От 0 до 100\" /></div>\n              <div class=\"field field-wide\"><label for=\"ibc-riskImpact\">Возможный финансовый ущерб при инциденте, ₽</label><input id=\"ibc-riskImpact\" data-state type=\"number\" min=\"0\" step=\"1000\" placeholder=\"Оценка ущерба\" /></div>\n            </div>\n            <div class=\"live-box navy compact\"><div><span class=\"live-label\">Ожидаемая стоимость риска</span><small>В год; оценка зависит от качества исходных данных</small></div><strong id=\"ibc-liveRisk\">Заполните поля</strong></div>\n          </div>\n\n          <div class=\"section-block\">\n            <div class=\"block-heading\"><span>Г</span><div><h3>Стоимость проекта</h3><p>Заполните, если известны цена внедрения и ежегодные расходы на решение.</p></div></div>\n            <div class=\"fields fields-2\">\n              <div class=\"field\"><label for=\"ibc-implementationCost\">Внедрение, ₽ (разово)</label><input id=\"ibc-implementationCost\" data-state type=\"number\" min=\"0\" step=\"10000\" placeholder=\"Стоимость внедрения\" /></div>\n              <div class=\"field\"><label for=\"ibc-annualSupportCost\">Лицензии и сопровождение, ₽ / год</label><input id=\"ibc-annualSupportCost\" data-state type=\"number\" min=\"0\" step=\"1000\" placeholder=\"Ежегодные расходы\" /></div>\n            </div>\n            <p class=\"field-note\">Срок окупаемости можно рассчитать только при наличии стоимости проекта и данных о сокращаемых расходах. Стоимость высвобождаемого времени в этот расчет не включается.</p>\n          </div>\n\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"3\">← Назад</button><button type=\"button\" class=\"btn btn-primary\" data-go=\"5\">Выбрать адресата →</button></div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-5\">\n        <div class=\"wizard-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 5 из 6</span><span>Адресат</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:83.3%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 05 / АРГУМЕНТЫ</p>\n          <h2>Перед кем предстоит защищать внедрение решения?</h2>\n          <p class=\"sub\">Выберите руководителя подразделения. Расчеты останутся прежними, а рекомендации и аргументы изменятся с учетом его KPI и задач.</p>\n          <div class=\"audience-grid\">\n            <button type=\"button\" class=\"audience-card active\" data-audience=\"ceo\" aria-pressed=\"true\">\n              <span class=\"audience-number\">01</span><div class=\"ico\">CEO</div><h3>Генеральный директор</h3><p>Результат для бизнеса и потери, которых можно избежать</p>\n            </button>\n            <button type=\"button\" class=\"audience-card\" data-audience=\"cfo\" aria-pressed=\"false\">\n              <span class=\"audience-number\">02</span><div class=\"ico\">₽</div><h3>Финансовый директор</h3><p>Расходы, бюджет проекта и срок окупаемости</p>\n            </button>\n            <button type=\"button\" class=\"audience-card\" data-audience=\"fin\" aria-pressed=\"false\">\n              <span class=\"audience-number\">03</span><div class=\"ico\">✓</div><h3>Финансовый контролер</h3><p>Источники данных, формулы и допущения</p>\n            </button>\n            <button type=\"button\" class=\"audience-card\" data-audience=\"ib\" aria-pressed=\"false\">\n              <span class=\"audience-number\">04</span><div class=\"ico\">ИБ</div><h3>Руководитель ИБ</h3><p>Затронутые активы, риск и меры устранения</p>\n            </button>\n          </div>\n          <div class=\"arg-box\" id=\"ibc-audienceArg\" aria-live=\"polite\"></div>\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"4\">← Назад</button><button type=\"button\" class=\"btn btn-primary\" data-go=\"6\">Посмотреть обоснование →</button></div>\n        </div>\n      </section>\n\n      <section class=\"screen\" id=\"ibc-screen-6\">\n        <div class=\"wizard-card result-card\">\n          <div class=\"progress-head\"><span data-step-label>Шаг 6 из 6</span><span>Обоснование</span></div>\n          <div class=\"progress-bar\"><span data-progress style=\"width:100%\"></span></div>\n          <p class=\"section-kicker\">РАЗДЕЛ 06 / РЕЗУЛЬТАТ</p>\n          <h2>Расчеты и аргументы для руководства</h2>\n          <p class=\"sub\">Показатели разделены по смыслу. Проверьте исходные данные перед использованием документа.</p>\n\n          <div class=\"total-hero\">\n            <div><span class=\"total-label\">Потенциал сокращения и предотвращения расходов</span><small>Только лицензии и поддержка списанных активов; по заполненным разделам</small></div>\n            <strong id=\"ibc-totalValue\">Заполните данные</strong>\n          </div>\n          <p class=\"result-caveat\" id=\"ibc-totalCaveat\">Потенциальный эффект требует проверки по данным учета и договорам.</p>\n\n          <div class=\"metric-grid\">\n            <article class=\"metric-card red-edge\"><p>01 / ЛИЦЕНЗИИ</p><h3>Неиспользуемое ПО</h3><strong id=\"ibc-resultLic\">Не рассчитано</strong><small>Потенциал сокращения расходов за год</small></article>\n            <article class=\"metric-card red-edge\"><p>02 / ПОДДЕРЖКА</p><h3>Списанные активы</h3><strong id=\"ibc-resultRetired\">Не рассчитано</strong><small>Расходы, которых можно избежать за год</small></article>\n            <article class=\"metric-card blue-edge\"><p>03 / ВРЕМЯ</p><h3>Ручные операции</h3><strong id=\"ibc-resultManual\">Не рассчитано</strong><small>Стоимость высвобождаемого времени за год</small></article>\n            <article class=\"metric-card blue-edge\"><p>04 / ПРОСТОЙ</p><h3>Потери бизнеса</h3><strong id=\"ibc-resultDowntime\">Не рассчитано</strong><small>Потенциальные потери за год, отдельно от экономии</small></article>\n            <article class=\"metric-card blue-edge\"><p>05 / РИСК</p><h3>Ожидаемый ущерб</h3><strong id=\"ibc-resultRisk\">Не рассчитано</strong><small>Вероятность инцидента × возможный ущерб</small></article>\n            <article class=\"metric-card\"><p>06 / ПРОЕКТ</p><h3>Стоимость внедрения</h3><strong id=\"ibc-resultImplementation\">Не указана</strong><small id=\"ibc-resultSupportCost\">Ежегодные расходы: не указаны</small></article>\n          </div>\n\n          <div class=\"payback-panel\" id=\"ibc-paybackPanel\">\n            <h3>Окупаемость проекта</h3>\n            <p>Укажите стоимость внедрения, ежегодные расходы на решение и сокращаемые расходы, чтобы рассчитать окупаемость.</p>\n          </div>\n\n          <div class=\"result-role\">\n            <div class=\"result-role-head\"><div><p class=\"section-kicker\">АРГУМЕНТЫ ДЛЯ ВЫБРАННОГО АДРЕСАТА</p><h3 id=\"ibc-resultRoleTitle\">Генеральный директор</h3></div><span class=\"stamp\">ИТАМ / 01</span></div>\n            <div class=\"tabs\">\n              <button type=\"button\" class=\"tab active\" data-audience=\"ceo\">CEO</button>\n              <button type=\"button\" class=\"tab\" data-audience=\"cfo\">Финансовый директор</button>\n              <button type=\"button\" class=\"tab\" data-audience=\"fin\">Финансовый контролер</button>\n              <button type=\"button\" class=\"tab\" data-audience=\"ib\">Руководитель ИБ</button>\n            </div>\n            <div class=\"arg-box\" id=\"ibc-resultArgs\" aria-live=\"polite\"></div>\n          </div>\n\n          <div class=\"doc-preview\">\n            <div class=\"doc-cover\">\n              <p class=\"eyebrow\">ШАБЛОН БИЗНЕС-ОБОСНОВАНИЯ</p>\n              <h3>Обоснование внедрения решения</h3>\n              <p id=\"ibc-docMeta\">—</p>\n              <div class=\"cover-total\"><span>Потенциал сокращения расходов</span><strong id=\"ibc-docTotal\">—</strong></div>\n            </div>\n            <div class=\"doc-body\">\n              <h3>Содержание документа</h3>\n              <ol class=\"doc-toc\">\n                <li><span>01</span> Исходная ситуация</li>\n                <li><span>02</span> Расчет показателей</li>\n                <li><span>03</span> Аргументы для выбранного руководителя</li>\n                <li><span>04</span> Данные для проверки</li>\n                <li><span>05</span> Следующие действия</li>\n              </ol>\n              <div class=\"download-row\">\n                <button type=\"button\" class=\"btn btn-primary\" id=\"ibc-btnDownloadDoc\">Скачать DOC</button>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"nav-row\"><button type=\"button\" class=\"btn btn-ghost\" data-go=\"5\">← К адресату</button><button type=\"button\" class=\"btn btn-primary\" id=\"ibc-btnReset\">Начать заново</button></div>\n        </div>\n      </section>\n    </div></div>";

  function mount() {
    if (!document.getElementById("itamBcStyle")) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONTS_URL;
      document.head.appendChild(link);
      var style = document.createElement("style");
      style.id = "itamBcStyle";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    root.removeAttribute("style");
    root.innerHTML = HTML;
  }

  function boot(attempt) {
    root = document.getElementById("itamBc");
    if (!root) {
      if (attempt < 80) setTimeout(function () { boot(attempt + 1); }, 150);
      return;
    }
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    mount();
    if (window.self === window.top) {
      document.body.appendChild(root);
      document.documentElement.classList.add("itam-bc-full");
    }
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(0); });
  } else {
    boot(0);
  }
})();