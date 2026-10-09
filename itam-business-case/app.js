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
    riskProbability: null,
    riskImpact: null,
    audience: "ceo"
  };

  var INPUTS = [
    "workstations", "assets", "licensesTotal", "products", "licenseCount",
    "licensePrice", "unusedPct", "specialists", "hoursMonth", "hourRate",
    "hoursAfter", "retiredCount", "retiredCost", "downtimeHours",
    "downtimeRate", "riskProbability", "riskImpact"
  ];

  var AUDIENCE = {
    ceo: {
      title: "CEO",
      short: "Результат для бизнеса",
      question: "Что изменится для компании?",
      main: "Руководителю важно понять, как ИТ влияет на бизнес-результат, какие расходы можно предотвратить и какие ресурсы освободить для задач развития.",
      focus: [
        "Расходы, которых можно избежать без ущерба для работы компании.",
        "Потери бизнеса из-за недоступности критичных ИТ-систем.",
        "Возможность высвободить ресурсы для других задач.",
        "Предсказуемость будущих закупок, продлений и замен."
      ],
      proof: [
        "Показать связь ИТ-расходов с конкретными бизнес-процессами.",
        "Отделить подтвержденное сокращение расходов от расчетных потерь и высвобождаемого времени.",
        "Указать, что компания сможет сделать с высвобожденными ресурсами."
      ],
      say: "Проект позволит проверить, какие ИТ-ресурсы используются неэффективно, какие расходы можно предотвратить и как сократить потери бизнеса из-за недоступности критичных систем.",
      verify: "Согласовать с владельцами бизнес-процессов критичные системы, последствия простоя и направления, куда можно перенаправить высвобожденные ресурсы."
    },
    cfo: {
      title: "CFO",
      short: "Деньги и бюджет",
      question: "Сколько потратим и что получим?",
      main: "Финансовому директору нужны сумма и структура расходов, потенциальный эффект в рублях, стоимость проекта и понятный период, за который этот эффект ожидается.",
      focus: [
        "Сокращение затрат на неиспользуемые лицензии, ненужные продления и поддержку списанных активов.",
        "Стоимость ручных операций и потенциальных потерь от простоя.",
        "Стоимость внедрения и дальнейшего использования решения.",
        "Срок окупаемости и ROI, если собраны все необходимые данные."
      ],
      proof: [
        "Показывать ежегодные и разовые затраты раздельно.",
        "Сравнить потенциальный эффект со стоимостью проекта и владения.",
        "Не включать предотвращенный ущерб в гарантированную экономию."
      ],
      say: "Расчет показывает потенциальные расходы, которые можно сократить, и стоимость времени, которое высвободится. Для оценки окупаемости сопоставим эти показатели со стоимостью внедрения и последующей эксплуатации.",
      verify: "Подтвердить цены по договорам и закупкам, методику оценки рабочего часа, стоимость внедрения, регулярные платежи и период получения эффекта."
    },
    fin: {
      title: "Финансовый контролер",
      short: "Проверяемость расчетов",
      question: "Откуда взялась каждая цифра?",
      main: "Контролеру важно проследить путь от первичных данных до итогового показателя, повторить расчет и убедиться, что одна и та же выгода не учтена дважды.",
      focus: [
        "Источник каждого исходного значения: учетная система, договор, счет или замер времени.",
        "Формула, единицы измерения и период расчета.",
        "Разделение фактических данных и допущений.",
        "Отсутствие двойного учета экономии и предотвращенных потерь."
      ],
      proof: [
        "Добавить к каждой метрике формулу и перечень исходных данных.",
        "Сверить количество лицензий и факт использования, а расходы — с договорами.",
        "Показать, какие значения еще требуется подтвердить."
      ],
      say: "Каждый показатель должен иметь источник, формулу и список допущений. Сначала сверим данные учета с фактическим использованием и договорными расходами, затем зафиксируем расчет.",
      verify: "Проверить источники данных, актуальность периода, договорные суммы, фактическое использование и то, не учтен ли один эффект одновременно в нескольких показателях."
    },
    ib: {
      title: "Руководитель ИБ",
      short: "Активы и риски",
      question: "Какие активы под угрозой и что нужно сделать?",
      main: "Руководителю ИБ нужно видеть, какие конкретно активы затронуты проблемой, насколько она существенна, какие меры снизят риск и сколько эти меры будут стоить.",
      focus: [
        "Полнота перечня активов и контроль версий программного обеспечения.",
        "Уязвимости, запрещенное ПО и несоответствие требованиям.",
        "Приоритеты устранения и сроки выполнения мер.",
        "Стоимость устранения риска и обоснованная оценка возможного ущерба."
      ],
      proof: [
        "Связать риск с конкретным активом, версией или уязвимостью.",
        "Указать действие: обновление, замена, ограничение доступа или другая мера.",
        "Отдельно показать стоимость меры и ожидаемый ущерб при инциденте."
      ],
      say: "Обоснование связывает ИТ-активы с выявленными уязвимостями, мерами устранения и их стоимостью. Это поможет определить приоритеты и обосновать бюджет на снижение наиболее существенных рисков.",
      verify: "Сверить перечень активов и версий, подтвердить критичность и вероятность инцидента, оценить возможный ущерб и согласовать стоимость мер с ответственными за ИБ и ИТ."
    }
  };

  function $(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmt(value) {
    if (value === null || value === undefined || value === "" || !Number.isFinite(value)) return "—";
    return Math.round(value).toLocaleString("ru-RU") + " ₽";
  }

  function fmtNumber(value) {
    if (value === null || value === undefined || value === "" || !Number.isFinite(value)) return "не указано";
    return value.toLocaleString("ru-RU");
  }

  function calc() {
    var lic = state.licenseCount !== null && state.licensePrice !== null && state.unusedPct !== null
      ? state.licenseCount * state.licensePrice * (state.unusedPct / 100) : null;
    var manual = state.hoursMonth !== null && state.hoursAfter !== null && state.hourRate !== null && state.specialists !== null
      ? Math.max(0, state.hoursMonth - state.hoursAfter) * state.hourRate * state.specialists * 12 : null;
    var retired = state.retiredCount !== null && state.retiredCost !== null
      ? state.retiredCount * state.retiredCost : null;
    var downtime = state.downtimeHours !== null && state.downtimeRate !== null
      ? state.downtimeHours * state.downtimeRate : null;
    var risk = state.riskProbability !== null && state.riskImpact !== null
      ? state.riskImpact * (state.riskProbability / 100) : null;
    return { lic: lic, manual: manual, retired: retired, downtime: downtime, risk: risk };
  }

  function readInputs() {
    INPUTS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var raw = String(el.value || "").trim();
      if (!raw) { state[id] = null; return; }
      var value = Number(raw.replace(/\s/g, "").replace(",", "."));
      state[id] = Number.isFinite(value) && value >= 0 ? value : null;
    });
  }

  function syncInputs() {
    INPUTS.forEach(function (id) {
      var el = $(id);
      if (el) el.value = state[id] === null ? "" : state[id];
    });
  }

  function renderLive() {
    var c = calc();
    var bindings = [
      ["liveLicenses", c.lic],
      ["liveManual", c.manual],
      ["liveRetired", c.retired],
      ["liveDowntime", c.downtime],
      ["liveRisk", c.risk]
    ];
    bindings.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.textContent = pair[1] === null ? "Заполните данные" : fmt(pair[1]) + " / год";
    });
  }

  function listHtml(items) {
    return "<ul>" + items.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>";
  }

  function renderAudience() {
    var audience = AUDIENCE[state.audience];
    if (!audience) return;
    document.querySelectorAll(".audience-card").forEach(function (card) {
      var active = card.dataset.audience === state.audience;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var box = $("audienceArg");
    if (!box) return;
    box.innerHTML =
      '<div class="label">Главный вопрос · ' + escapeHtml(audience.title) + "</div>" +
      "<h3>«" + escapeHtml(audience.question) + "»</h3>" +
      '<p class="arg-intro">' + escapeHtml(audience.main) + "</p>" +
      '<div class="arg-columns">' +
        '<div><p class="arg-subhead">Что важно руководителю</p>' + listHtml(audience.focus) + "</div>" +
        '<div><p class="arg-subhead">Что показать в обосновании</p>' + listHtml(audience.proof) + "</div>" +
      "</div>" +
      '<div class="arg-quote"><strong>Формулировка для обсуждения</strong><br>' + escapeHtml(audience.say) + "</div>" +
      '<p class="arg-check"><strong>Перед защитой проверить:</strong> ' + escapeHtml(audience.verify) + "</p>";
  }

  function renderResult() {
    var c = calc();
    var audience = AUDIENCE[state.audience];
    var values = [
      ["resultLic", c.lic],
      ["resultManual", c.manual],
      ["resultRetired", c.retired],
      ["resultDowntime", c.downtime],
      ["resultRisk", c.risk]
    ];
    values.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.textContent = pair[1] === null ? "Нет данных" : fmt(pair[1]);
    });

    document.querySelectorAll(".tab").forEach(function (tab) {
      var active = tab.dataset.audience === state.audience;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var detail = $("resultArgs");
    if (detail && audience) {
      detail.innerHTML =
        '<div class="label">Аргументы для ' + escapeHtml(audience.title) + "</div>" +
        "<h3>«" + escapeHtml(audience.question) + "»</h3>" +
        '<p class="arg-intro">' + escapeHtml(audience.main) + "</p>" +
        '<div class="arg-columns">' +
          '<div><p class="arg-subhead">На чем сделать акцент</p>' + listHtml(audience.focus) + "</div>" +
          '<div><p class="arg-subhead">Что подтвердить</p>' + listHtml(audience.proof) + "</div>" +
        "</div>" +
        '<div class="arg-quote"><strong>Формулировка для обсуждения</strong><br>' + escapeHtml(audience.say) + "</div>" +
        '<p class="arg-check"><strong>Перед защитой проверить:</strong> ' + escapeHtml(audience.verify) + "</p>";
    }

    var meta = $("docMeta");
    if (meta && audience) {
      meta.textContent = "Адресат: " + audience.title +
        " · Рабочие места: " + fmtNumber(state.workstations) +
        " · ИТ-активы: " + fmtNumber(state.assets);
    }
    renderLive();
  }

  function showStep(number) {
    readInputs();
    state.step = number;
    document.querySelectorAll(".screen").forEach(function (screen) { screen.classList.remove("active"); });
    var active = $("screen-" + number);
    if (active) active.classList.add("active");
    if (number >= 1 && number <= 6) {
      document.querySelectorAll("[data-progress]").forEach(function (el) { el.style.width = (number / 6 * 100) + "%"; });
      document.querySelectorAll("[data-step-label]").forEach(function (el) { el.textContent = "Шаг " + number + " из 6"; });
    }
    if (number >= 2 && number <= 4) renderLive();
    if (number === 5) renderAudience();
    if (number === 6) renderResult();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reportTableRow(label, value, formula, type) {
    return "<tr><td>" + escapeHtml(label) + "</td><td>" + escapeHtml(value === null ? "Нет данных" : fmt(value)) +
      "</td><td>" + escapeHtml(formula) + "</td><td>" + escapeHtml(type) + "</td></tr>";
  }

  function buildReportHtml() {
    var c = calc();
    var audience = AUDIENCE[state.audience];
    var metrics = [
      reportTableRow("Неиспользуемые лицензии", c.lic, "Количество × годовая цена × доля неиспользуемых", "Потенциал сокращения расходов"),
      reportTableRow("Ручные операции", c.manual, "Разница часов × стоимость часа × специалисты × 12", "Стоимость высвобождаемого времени"),
      reportTableRow("Поддержка списанных активов", c.retired, "Количество активов × годовая стоимость поддержки", "Расходы, которые можно проверить и прекратить"),
      reportTableRow("Простой ИТ-систем", c.downtime, "Часы простоя за год × оценка потерь за час", "Потенциальные потери бизнеса"),
      reportTableRow("ИТ-риск", c.risk, "Вероятность инцидента за год × потенциальный ущерб", "Ожидаемый ущерб, не экономия")
    ].join("");
    var infra = "<ul>" +
      "<li>Рабочие места: " + escapeHtml(fmtNumber(state.workstations)) + "</li>" +
      "<li>ИТ-активы: " + escapeHtml(fmtNumber(state.assets)) + "</li>" +
      "<li>Лицензии ПО по масштабу: " + escapeHtml(fmtNumber(state.licensesTotal)) + "</li>" +
      "<li>Программные продукты: " + escapeHtml(fmtNumber(state.products)) + "</li></ul>";
    return "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"UTF-8\"><title>Обоснование внедрения ITAM</title>" +
      "<style>body{font-family:Arial,sans-serif;max-width:920px;margin:34px auto;padding:0 22px;color:#202A31;line-height:1.55}" +
      "h1,h2,h3{color:#19344A}h1{font-size:30px;text-transform:uppercase}h2{margin-top:30px;font-size:20px}h3{font-size:16px}" +
      ".kicker{font-weight:bold;color:#C43C27;text-transform:uppercase;letter-spacing:2px}.lead{font-size:18px}" +
      "table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}th{background:#19344A;color:#FFFDF7}" +
      "td,th{border:1px solid #D4C4A8;padding:10px;text-align:left;vertical-align:top}tr:nth-child(even){background:#F8F0E2}" +
      ".panel{background:#F4E9D3;border-left:5px solid #C43C27;padding:16px 18px;margin:18px 0}.note{font-size:12px;color:#65717A}</style></head><body>" +
      '<p class="kicker">Инферит ИТМен · ITAM</p><h1>Обоснование внедрения ITAM</h1>' +
      "<p class=\"lead\">Для адресата: <strong>" + escapeHtml(audience.title) + "</strong></p>" +
      "<p><strong>Главный вопрос:</strong> " + escapeHtml(audience.question) + "</p>" +
      "<h2>1. Масштаб и текущая ситуация</h2>" + infra +
      "<h2>2. Расчетные показатели</h2>" +
      "<p>Показатели не складываются в общий итог: они описывают разные типы эффекта и риска.</p>" +
      "<table><thead><tr><th>Показатель</th><th>Расчет за год</th><th>Формула</th><th>Как трактовать</th></tr></thead><tbody>" + metrics + "</tbody></table>" +
      "<h2>3. Аргументы для руководителя</h2><div class=\"panel\"><h3>Что важно</h3>" + listHtml(audience.focus) +
      "<h3>Что показать</h3>" + listHtml(audience.proof) + "<h3>Формулировка для обсуждения</h3><p>" + escapeHtml(audience.say) + "</p></div>" +
      "<h2>4. Что подтвердить перед защитой</h2>" + listHtml([
        "Сверить число лицензий, их фактическое использование и даты продления.",
        "Проверить стоимость поддержки по действующим договорам и статусы активов.",
        "Подтвердить трудозатраты и стоимость часа с руководителями ИТ и финансов.",
        "Согласовать оценку потерь от простоя с владельцами бизнес-процессов.",
        "Подтвердить вероятность инцидента и потенциальный ущерб по данным службы ИБ.",
        "Добавить стоимость внедрения и эксплуатации решения до расчета срока окупаемости и ROI."
      ]) +
      "<h2>5. Следующий шаг</h2><p>Выбрать участок инфраструктуры, зафиксировать исходные показатели, сверить источники данных с ИТ, финансами, закупками и ИБ, затем уточнить расчеты.</p>" +
      "<p class=\"note\">Оценка предварительная. Потенциальные расходы, стоимость высвобождаемого времени, потери от простоя и ожидаемый ущерб от риска не являются взаимозаменяемыми показателями. Подтвердите исходные значения перед принятием решения.</p>" +
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
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadDoc() {
    downloadBlob("ITAM-obosnovanie.doc", "application/msword", buildReportHtml());
  }

  function downloadPptx() {
    if (typeof PptxGenJS === "undefined") {
      downloadBlob("ITAM-obosnovanie.html", "text/html;charset=utf-8", buildReportHtml());
      window.alert("Библиотека PowerPoint не загрузилась. Вместо презентации скачан отчет HTML, его можно открыть в браузере или Word.");
      return;
    }

    var c = calc();
    var audience = AUDIENCE[state.audience];
    var pptx = new PptxGenJS();
    pptx.defineLayout({ name: "ITAM_16_9", width: 13.333, height: 7.5 });
    pptx.layout = "ITAM_16_9";
    pptx.author = "Инферит ИТМен";
    pptx.subject = "Обоснование внедрения ITAM";
    pptx.title = "Обоснование внедрения ITAM";
    pptx.company = "Инферит ИТМен";

    var paper = "F4E9D3", light = "FFFDF7", red = "C43C27", navy = "19344A", muted = "65717A", line = "D4C4A8";
    function addHeader(slide, title) {
      slide.background = { color: paper };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: red }, line: { color: red } });
      slide.addText("ИНФЕРИТ ИТМЕН  /  ITAM", { x: 0.55, y: 0.32, w: 7.6, h: 0.25, fontFace: "PT Sans", fontSize: 10, bold: true, color: red, charSpacing: 1.2, margin: 0 });
      slide.addText(title, { x: 0.55, y: 0.72, w: 12, h: 0.6, fontFace: "Oswald", fontSize: 26, bold: true, color: navy, margin: 0.02, breakLine: false });
      slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 1.42, w: 12.1, h: 0, line: { color: line, width: 1 } });
    }

    var s1 = pptx.addSlide();
    s1.background = { color: navy };
    s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: red }, line: { color: red } });
    s1.addText("ИНФЕРИТ ИТМЕН  /  ITAM", { x: 0.85, y: 0.7, w: 8, h: 0.3, fontFace: "PT Sans", fontSize: 12, bold: true, color: "F0C7A8", charSpacing: 1.5, margin: 0 });
    s1.addText("ОБОСНОВАНИЕ\nВНЕДРЕНИЯ ITAM", { x: 0.85, y: 1.65, w: 11.4, h: 1.8, fontFace: "Oswald", fontSize: 36, bold: true, color: light, margin: 0.02, breakLine: false });
    s1.addText("Для адресата: " + audience.title, { x: 0.9, y: 3.75, w: 10.8, h: 0.4, fontFace: "PT Sans", fontSize: 20, color: "F0C7A8", margin: 0 });
    s1.addText("Расчетные показатели по расходам, трудозатратам, простоям и ИТ-рискам", { x: 0.9, y: 4.45, w: 11.1, h: 0.8, fontFace: "PT Sans", fontSize: 17, color: light, breakLine: false, margin: 0 });
    s1.addShape(pptx.ShapeType.rect, { x: 0.9, y: 6.25, w: 3.2, h: 0.48, fill: { color: red }, line: { color: red } });
    s1.addText("ДАННЫЕ → РАСЧЕТ → РЕШЕНИЕ", { x: 1.05, y: 6.37, w: 2.9, h: 0.2, fontFace: "Oswald", fontSize: 11, bold: true, color: light, margin: 0 });

    var s2 = pptx.addSlide();
    addHeader(s2, "Показатели за год");
    s2.addText("Не складывайте показатели в одну сумму: каждый описывает отдельный вид эффекта.", { x: 0.6, y: 1.62, w: 12, h: 0.38, fontFace: "PT Sans", fontSize: 13, color: muted, margin: 0 });
    var rows = [
      [{ text: "Показатель", options: { bold: true, color: light, fill: navy } }, { text: "Расчет", options: { bold: true, color: light, fill: navy } }, { text: "Трактовка", options: { bold: true, color: light, fill: navy } }],
      ["Лицензии", c.lic === null ? "Нет данных" : fmt(c.lic), "Потенциал сокращения расходов"],
      ["Ручные операции", c.manual === null ? "Нет данных" : fmt(c.manual), "Стоимость высвобождаемого времени"],
      ["Поддержка списанных активов", c.retired === null ? "Нет данных" : fmt(c.retired), "Расходы, которые можно проверить и прекратить"],
      ["Простой", c.downtime === null ? "Нет данных" : fmt(c.downtime), "Потенциальные потери бизнеса"],
      ["ИТ-риск", c.risk === null ? "Нет данных" : fmt(c.risk), "Ожидаемый ущерб при заданной вероятности"]
    ];
    s2.addTable(rows, { x: 0.6, y: 2.12, w: 12, h: 3.7, colW: [3.0, 2.5, 6.5], rowH: 0.6, border: { pt: 0.7, color: line }, fontFace: "PT Sans", fontSize: 13, color: navy, fill: light, margin: 0.08, valign: "mid" });
    s2.addText("Стоимость внедрения и эксплуатации нужно добавить отдельно, прежде чем рассчитывать окупаемость и ROI.", { x: 0.62, y: 6.15, w: 12, h: 0.55, fontFace: "PT Sans", fontSize: 13, color: red, bold: true, margin: 0 });

    var s3 = pptx.addSlide();
    addHeader(s3, "Аргументы для " + audience.title);
    s3.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.7, w: 12, h: 0.75, fill: { color: "E4D3B5" }, line: { color: "E4D3B5" } });
    s3.addText("ГЛАВНЫЙ ВОПРОС: " + audience.question, { x: 0.82, y: 1.9, w: 11.5, h: 0.3, fontFace: "Oswald", fontSize: 17, bold: true, color: navy, margin: 0 });
    s3.addText("ЧТО ВАЖНО", { x: 0.65, y: 2.8, w: 5.7, h: 0.3, fontFace: "Oswald", fontSize: 15, bold: true, color: red, margin: 0 });
    s3.addText(audience.focus.map(function (v) { return "• " + v; }).join("\n"), { x: 0.7, y: 3.2, w: 5.7, h: 2.8, fontFace: "PT Sans", fontSize: 14, color: navy, breakLine: false, margin: 0.03, paraSpaceAfterPt: 8, valign: "top" });
    s3.addText("ЧТО ПОКАЗАТЬ В ОБОСНОВАНИИ", { x: 6.8, y: 2.8, w: 5.8, h: 0.3, fontFace: "Oswald", fontSize: 15, bold: true, color: red, margin: 0 });
    s3.addText(audience.proof.map(function (v) { return "• " + v; }).join("\n"), { x: 6.85, y: 3.2, w: 5.7, h: 2.8, fontFace: "PT Sans", fontSize: 14, color: navy, breakLine: false, margin: 0.03, paraSpaceAfterPt: 8, valign: "top" });
    s3.addText("Формулировка: " + audience.say, { x: 0.7, y: 6.25, w: 11.9, h: 0.66, fontFace: "PT Sans", fontSize: 12, italic: true, color: navy, margin: 0.02, valign: "mid" });

    var s4 = pptx.addSlide();
    addHeader(s4, "Что подтвердить перед защитой");
    var checks = [
      "Сверить число лицензий, фактическое использование и даты продления.",
      "Проверить стоимость поддержки и статус списанных активов.",
      "Подтвердить трудозатраты и стоимость рабочего часа.",
      "Согласовать потери от простоя с владельцами бизнес-процессов.",
      "Подтвердить вероятность инцидента и потенциальный ущерб с ИБ.",
      "Добавить стоимость внедрения и эксплуатации перед расчетом ROI."
    ];
    s4.addText(checks.map(function (v, i) { return (i + 1) + ". " + v; }).join("\n\n"), { x: 0.7, y: 1.85, w: 11.8, h: 3.9, fontFace: "PT Sans", fontSize: 16, color: navy, breakLine: false, margin: 0.02, paraSpaceAfterPt: 10, valign: "top" });
    s4.addShape(pptx.ShapeType.rect, { x: 0.65, y: 6.15, w: 12, h: 0.72, fill: { color: "E4D3B5" }, line: { color: "E4D3B5" } });
    s4.addText("Следующий шаг: выбрать участок инфраструктуры, зафиксировать исходные показатели и сверить источники данных.", { x: 0.86, y: 6.34, w: 11.55, h: 0.34, fontFace: "PT Sans", fontSize: 13, bold: true, color: navy, margin: 0.01 });

    try {
      var result = pptx.writeFile({ fileName: "ITAM-obosnovanie.pptx" });
      if (result && typeof result.catch === "function") result.catch(function () { window.alert("Не удалось создать PPTX. Попробуйте скачать DOC."); });
    } catch (error) {
      window.alert("Не удалось создать PPTX. Попробуйте скачать DOC.");
    }
  }

  function bind() {
    syncInputs();
    document.querySelectorAll("[data-go]").forEach(function (button) {
      button.addEventListener("click", function () { showStep(Number(button.dataset.go)); });
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
    var docButton = $("btnDownloadDoc");
    var pptButton = $("btnDownloadPpt");
    if (docButton) docButton.addEventListener("click", downloadDoc);
    if (pptButton) pptButton.addEventListener("click", downloadPptx);
    renderLive();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();