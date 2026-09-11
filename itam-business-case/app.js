(function () {
  "use strict";

  var state = {
    step: 0, // 0 = intro
    workstations: 5000,
    assets: 7200,
    licensesTotal: 10000,
    products: 120,
    licenseCount: 10000,
    licensePrice: 50000,
    unusedPct: 10,
    specialists: 6,
    hoursMonth: 20,
    hourRate: 2500,
    hoursAfter: 6,
    retiredCount: 50,
    retiredCost: 40000,
    downtimeHours: 10,
    downtimeRate: 150000,
    audience: "ceo",
  };

  var AUDIENCE = {
    ceo: {
      title: "CEO",
      short: "Эффективность",
      question: "Что это даст бизнесу?",
      main:
        "Мы хотим понять, насколько эффективно компания использует уже вложенные в ИТ средства, и сделать ИТ-бюджет более прогнозируемым.",
      points: [
        "Эффект для бизнеса и окупаемость ИТ-инвестиций",
        "Снижение будущих расходов и избежанные затраты",
        "Высвобождение ресурсов на стратегические задачи",
        "Прогнозируемость ИТ-бюджета: что заменить, продлить или закупить",
      ],
      say: [
        "«Мы хотим понять, насколько эффективно компания использует уже вложенные в ИТ средства».",
        "«По итогам проекта покажем не только экономию, но и расходы, которых компания сможет избежать».",
        "«Сделаем ИТ-бюджет более прогнозируемым».",
      ],
    },
    cfo: {
      title: "CFO",
      short: "Финансовый эффект",
      question: "Сколько потратим и сколько получим?",
      main:
        "Покажем, где компания переплачивает за лицензии, поддержку и ручные процессы — и сколько средств можно высвободить.",
      points: [
        "Сокращение расходов и оптимизация закупок",
        "ROI и окупаемость проекта",
        "Высвобождение бюджета из уже купленного парка",
        "Прогнозируемость ИТ-затрат",
      ],
      say: [
        "«Давайте посмотрим, какие активы и лицензии реально используются».",
        "«Сравним стоимость новой закупки с модернизацией и переиспользованием».",
        "«Посчитаем экономический эффект и сопоставим со стоимостью проекта».",
      ],
    },
    fin: {
      title: "Финконтроль",
      short: "Доказательная база",
      question: "Откуда цифра и как ее проверить?",
      main:
        "Каждая цифра будет иметь источник: актив, лицензия, стоимость, факт использования и конкретное действие.",
      points: [
        "Прозрачность данных и проверяемость расчетов",
        "Связь цифры с первичными данными",
        "Пилот на конкретном участке вместо абстрактной системы",
        "Сравнение текущего учета (Excel) с результатами пилота",
      ],
      say: [
        "«Проверим систему на конкретном участке и сравним с текущим учетом».",
        "«Каждая цифра будет иметь источник».",
        "«Сначала посмотрим, какие расхождения между планом и фактом есть сегодня».",
      ],
    },
    ib: {
      title: "ИБ",
      short: "Снижение рисков",
      question: "Какие у нас уязвимости?",
      main:
        "Свяжем ИТ-активы, уязвимости и стоимость устранения — чтобы понимать не только риск, но и бюджет на его снижение.",
      points: [
        "Контроль активов, версий ПО и критичности",
        "План устранения рисков (remediation)",
        "Привязка риска к конкретному активу и действию",
        "Ожидаемая стоимость риска в деньгах",
      ],
      say: [
        "«Посмотрим, какие активы реально под контролем и какие затронуты рисками».",
        "«Заранее увидим, что потребует обновления или замены».",
        "«Свяжем активы, уязвимости и бюджет на снижение риска».",
      ],
    },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function fmt(n) {
    if (!isFinite(n)) return "—";
    return Math.round(n).toLocaleString("ru-RU") + " ₽";
  }

  function calc() {
    var lic = state.licenseCount * state.licensePrice * (state.unusedPct / 100);
    var manual =
      Math.max(0, state.hoursMonth - state.hoursAfter) *
      state.hourRate *
      state.specialists *
      12;
    var retired = state.retiredCount * state.retiredCost;
    var downtime = state.downtimeHours * state.downtimeRate;
    var total = lic + manual + retired + downtime;
    return { lic: lic, manual: manual, retired: retired, downtime: downtime, total: total };
  }

  function syncInputs() {
    var map = {
      workstations: "workstations",
      assets: "assets",
      licensesTotal: "licensesTotal",
      products: "products",
      licenseCount: "licenseCount",
      licensePrice: "licensePrice",
      unusedPct: "unusedPct",
      specialists: "specialists",
      hoursMonth: "hoursMonth",
      hourRate: "hourRate",
      hoursAfter: "hoursAfter",
      retiredCount: "retiredCount",
      retiredCost: "retiredCost",
      downtimeHours: "downtimeHours",
      downtimeRate: "downtimeRate",
    };
    Object.keys(map).forEach(function (key) {
      var el = $(map[key]);
      if (el) el.value = state[key];
    });
  }

  function readInputs() {
    function num(id, fallback) {
      var el = $(id);
      if (!el) return fallback;
      var v = Number(String(el.value).replace(/\s/g, "").replace(",", "."));
      return isFinite(v) ? v : fallback;
    }
    state.workstations = num("workstations", state.workstations);
    state.assets = num("assets", state.assets);
    state.licensesTotal = num("licensesTotal", state.licensesTotal);
    state.products = num("products", state.products);
    state.licenseCount = num("licenseCount", state.licenseCount);
    state.licensePrice = num("licensePrice", state.licensePrice);
    state.unusedPct = num("unusedPct", state.unusedPct);
    state.specialists = num("specialists", state.specialists);
    state.hoursMonth = num("hoursMonth", state.hoursMonth);
    state.hourRate = num("hourRate", state.hourRate);
    state.hoursAfter = num("hoursAfter", state.hoursAfter);
    state.retiredCount = num("retiredCount", state.retiredCount);
    state.retiredCost = num("retiredCost", state.retiredCost);
    state.downtimeHours = num("downtimeHours", state.downtimeHours);
    state.downtimeRate = num("downtimeRate", state.downtimeRate);
  }

  function renderLive() {
    var c = calc();
    var licEl = $("liveLicenses");
    var manEl = $("liveManual");
    var retEl = $("liveRetired");
    var downEl = $("liveDowntime");
    if (licEl) licEl.textContent = fmt(c.lic) + " / год";
    if (manEl) manEl.textContent = fmt(c.manual) + " / год";
    if (retEl) retEl.textContent = fmt(c.retired);
    if (downEl) downEl.textContent = fmt(c.downtime);
  }

  function renderAudience() {
    var a = AUDIENCE[state.audience];
    document.querySelectorAll(".audience-card").forEach(function (card) {
      card.classList.toggle("active", card.dataset.audience === state.audience);
    });
    var box = $("audienceArg");
    if (!box || !a) return;
    box.innerHTML =
      '<div class="label">Главный аргумент для ' +
      a.title +
      "</div>" +
      "<h3>«" +
      a.question +
      "»</h3>" +
      "<p style=\"margin-bottom:12px;font-size:14px;line-height:1.5;color:#334155\">" +
      a.main +
      "</p>" +
      "<ul>" +
      a.points.map(function (p) { return "<li>" + p + "</li>"; }).join("") +
      "</ul>";
  }

  function renderResult() {
    var c = calc();
    var a = AUDIENCE[state.audience];
    $("totalValue").textContent = fmt(c.total) + " / год";

    var max = Math.max(c.lic, c.manual, c.retired, c.downtime, 1);
    var rows = [
      { name: "Оптимизация лицензий", val: c.lic, id: "barLic" },
      { name: "Ручное управление", val: c.manual, id: "barMan" },
      { name: "Поддержка списанных", val: c.retired, id: "barRet" },
      { name: "Стоимость простоя", val: c.downtime, id: "barDown" },
    ];
    rows.forEach(function (r) {
      var track = $(r.id);
      var val = $(r.id + "Val");
      if (track) track.style.width = Math.max(4, (r.val / max) * 100) + "%";
      if (val) val.textContent = fmt(r.val);
    });

    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.audience === state.audience);
    });

    var detail = $("resultArgs");
    if (detail && a) {
      detail.innerHTML =
        "<h3 style=\"margin-bottom:10px\">Что говорить " +
        a.title +
        "</h3>" +
        "<ul>" +
        a.say.map(function (s) { return "<li>" + s + "</li>"; }).join("") +
        "</ul>" +
        '<p style="margin-top:12px;font-size:13px;color:#64748b"><strong>Вопрос адресата:</strong> ' +
        a.question +
        "</p>";
    }

    $("docMeta").textContent =
      state.workstations.toLocaleString("ru-RU") +
      " РМ · " +
      state.assets.toLocaleString("ru-RU") +
      " активов · адресат: " +
      a.title;
    $("docTotal").textContent = fmt(c.total) + " / год";
  }

  function showStep(n) {
    readInputs();
    state.step = n;
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.remove("active");
    });
    var screen = $("screen-" + n);
    if (screen) screen.classList.add("active");

    if (n >= 1 && n <= 6) {
      var pct = (n / 6) * 100;
      document.querySelectorAll("[data-progress]").forEach(function (el) {
        el.style.width = pct + "%";
      });
      document.querySelectorAll("[data-step-label]").forEach(function (el) {
        el.textContent = "Шаг " + n + " из 6";
      });
    }

    if (n === 2 || n === 3 || n === 4) renderLive();
    if (n === 5) renderAudience();
    if (n === 6) renderResult();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildReportHtml() {
    var c = calc();
    var a = AUDIENCE[state.audience];
    return (
      "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"UTF-8\"><title>Бизнес-обоснование ITAM</title>" +
      "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;line-height:1.5}" +
      "h1{font-size:28px}h2{font-size:18px;margin-top:28px}table{width:100%;border-collapse:collapse;margin:12px 0}" +
      "td,th{border:1px solid #ddd;padding:10px;text-align:left}.total{background:#ecfdf5;padding:16px;border-radius:8px;font-size:20px;font-weight:700}</style></head><body>" +
      "<h1>Бизнес-обоснование ITAM</h1>" +
      "<p>Перевод с языка ITAM на язык денег. Адресат: <strong>" +
      a.title +
      "</strong></p>" +
      "<p>Масштаб: " +
      state.workstations.toLocaleString("ru-RU") +
      " рабочих мест, " +
      state.assets.toLocaleString("ru-RU") +
      " ИТ-активов, " +
      state.licenseCount.toLocaleString("ru-RU") +
      " лицензий.</p>" +
      "<div class=\"total\">Потенциальный экономический эффект: " +
      fmt(c.total) +
      " / год</div>" +
      "<h2>1. Задача</h2><p>" +
      a.main +
      "</p><p><em>Главный вопрос: " +
      a.question +
      "</em></p>" +
      "<h2>2. Текущая ситуация и потенциал эффекта</h2>" +
      "<table><tr><th>Метрика</th><th>Эффект / год</th></tr>" +
      "<tr><td>Оптимизация лицензий (Q × P × K)</td><td>" +
      fmt(c.lic) +
      "</td></tr>" +
      "<tr><td>Стоимость ручного управления</td><td>" +
      fmt(c.manual) +
      "</td></tr>" +
      "<tr><td>Поддержка списанного оборудования</td><td>" +
      fmt(c.retired) +
      "</td></tr>" +
      "<tr><td>Стоимость простоя</td><td>" +
      fmt(c.downtime) +
      "</td></tr></table>" +
      "<h2>3. Что говорить адресату</h2><ul>" +
      a.say.map(function (s) { return "<li>" + s + "</li>"; }).join("") +
      "</ul>" +
      "<h2>4. Логика расчета</h2>" +
      "<p>Задача → данные → метрика → расчет → эффект → решение</p>" +
      "<h2>5. Следующий шаг</h2>" +
      "<p>Пилот на выбранном сегменте инфраструктуры: зафиксировать базовые показатели и измерить результат.</p>" +
      "<p style=\"color:#666;font-size:12px;margin-top:32px\">Ориентировочный расчет на основе введенных данных. Не является офертой. Примеры формул соответствуют методологии доклада «Перевод с языка ITAM на язык денег».</p>" +
      "</body></html>"
    );
  }

  function downloadBlob(filename, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadDocx() {
    // Word opens HTML with .doc extension reliably
    downloadBlob(
      "ITAM-biznes-obosnovanie.doc",
      "application/msword",
      buildReportHtml()
    );
  }

  function downloadPptx() {
    if (typeof PptxGenJS === "undefined") {
      downloadBlob(
        "ITAM-biznes-obosnovanie.html",
        "text/html;charset=utf-8",
        buildReportHtml()
      );
      alert("PPTX-библиотека не загрузилась. Скачан HTML-отчет — откройте его или распечатайте в PDF.");
      return;
    }
    var c = calc();
    var a = AUDIENCE[state.audience];
    var pptx = new PptxGenJS();
    pptx.defineLayout({ name: "LAYOUT_16x9", width: 13.333, height: 7.5 });
    pptx.layout = "LAYOUT_16x9";

    var s1 = pptx.addSlide();
    s1.addText("Бизнес-обоснование ITAM", {
      x: 0.6, y: 2.2, w: 12, h: 1, fontSize: 36, bold: true, color: "0F172A",
    });
    s1.addText("Перевод с языка ITAM на язык денег · адресат: " + a.title, {
      x: 0.6, y: 3.2, w: 12, h: 0.5, fontSize: 16, color: "64748B",
    });
    s1.addText(fmt(c.total) + " / год потенциального эффекта", {
      x: 0.6, y: 4.0, w: 12, h: 0.5, fontSize: 20, bold: true, color: "16A34A",
    });

    var s2 = pptx.addSlide();
    s2.addText("Потенциал эффекта", {
      x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: "0F172A",
    });
    s2.addTable(
      [
        [
          { text: "Метрика", options: { bold: true } },
          { text: "Эффект / год", options: { bold: true } },
        ],
        ["Оптимизация лицензий", fmt(c.lic)],
        ["Ручное управление", fmt(c.manual)],
        ["Поддержка списанных активов", fmt(c.retired)],
        ["Стоимость простоя", fmt(c.downtime)],
        [
          { text: "Итого", options: { bold: true } },
          { text: fmt(c.total), options: { bold: true } },
        ],
      ],
      { x: 0.6, y: 1.3, w: 12, colW: [8, 4], border: { pt: 0.5, color: "E2E8F0" }, fontSize: 14, color: "0F172A" }
    );

    var s3 = pptx.addSlide();
    s3.addText("Аргументы для " + a.title, {
      x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: "0F172A",
    });
    s3.addText("Вопрос: " + a.question, {
      x: 0.6, y: 1.1, w: 12, h: 0.4, fontSize: 16, color: "2563EB", bold: true,
    });
    s3.addText(a.say.map(function (x, i) { return i + 1 + ". " + x; }).join("\n\n"), {
      x: 0.6, y: 1.7, w: 12, h: 4.5, fontSize: 15, color: "334155",
    });

    var s4 = pptx.addSlide();
    s4.addText("Следующий шаг", {
      x: 0.6, y: 2.2, w: 12, h: 0.6, fontSize: 28, bold: true, color: "0F172A",
    });
    s4.addText(
      "Задача → данные → метрика → расчет → эффект → решение\n\nПилот на сегменте инфраструктуры: зафиксировать базу и измерить результат.",
      { x: 0.6, y: 3.0, w: 12, h: 2, fontSize: 16, color: "475569" }
    );

    pptx.writeFile({ fileName: "ITAM-biznes-obosnovanie.pptx" });
  }

  function bind() {
    syncInputs();

    document.querySelectorAll("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showStep(Number(btn.dataset.go));
      });
    });

    document.querySelectorAll("input[data-state]").forEach(function (input) {
      input.addEventListener("input", function () {
        readInputs();
        renderLive();
      });
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
    var btnMain = $("btnDownloadMain");
    if (btnDoc) btnDoc.addEventListener("click", downloadDocx);
    if (btnPpt) btnPpt.addEventListener("click", downloadPptx);
    if (btnMain) btnMain.addEventListener("click", function () {
      downloadPptx();
    });
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
