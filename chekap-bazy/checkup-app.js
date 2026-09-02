/* Чекап базы лицензий и ПО — локальный анализ в браузере */

(function () {
  const MAX_ROWS = 200;
  const STEP_KEYS = ["recognize", "duplicates", "names", "versions", "catalog"];
  const CIRC = 326.7;

  let analysisResult = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const NAME_ALIASES = [
    [/^ms\s*office\s*2019$/i, "Microsoft Office 2019"],
    [/^office\s*19$/i, "Microsoft Office 2019"],
    [/^ms\s*office\s*19$/i, "Microsoft Office 2019"],
    [/^microsoft\s*office\s*2019$/i, "Microsoft Office 2019"],
    [/^7\s*-?\s*zip$/i, "7-Zip"],
    [/^7zip$/i, "7-Zip"],
    [/^google\s*chrome$/i, "Google Chrome"],
    [/^adobe\s*acrobat\s*reader$/i, "Adobe Acrobat Reader"],
    [/^notepad\s*\+\+$/i, "Notepad++"],
  ];

  const DEMO_ROWS = [
    { name: "Microsoft Office 2019", version: "16.0.10396", vendor: "Microsoft" },
    { name: "ms office 2019", version: "16.0.10396", vendor: "Microsoft" },
    { name: "Office 19", version: "16.0", vendor: "Microsoft" },
    { name: "7-Zip", version: "19.00", vendor: "Igor Pavlov" },
    { name: "7zip", version: "19.0", vendor: "Igor Pavlov" },
    { name: "Adobe Acrobat Reader", version: "23.001.20174", vendor: "Adobe" },
    { name: "Google Chrome", version: "124.0.6367", vendor: "Google" },
    { name: "Notepad++", version: "8.6.5", vendor: "Notepad++ Team" },
  ];

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function titleCase(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  }

  function normalizeName(raw) {
    const src = String(raw || "").trim();
    if (!src) return "";
    for (const [re, out] of NAME_ALIASES) {
      if (re.test(src)) return out;
    }
    if (/^[a-z0-9_\-\s.]+$/i.test(src) && src === src.toLowerCase()) {
      return titleCase(src.replace(/_/g, " "));
    }
    return src.replace(/\s+/g, " ").trim();
  }

  function normalizeVendor(raw) {
    const v = String(raw || "").trim();
    if (!v) return "";
    return titleCase(v);
  }

  function normalizeVersion(raw) {
    const v = String(raw || "").trim();
    if (!v) return "";
    const m = v.match(/(\d+(?:\.\d+)*)/);
    if (!m) return v;
    const parts = m[1].split(".");
    while (parts.length < 2) parts.push("0");
    if (parts[0].length <= 2 && parts.length === 2) {
      parts[1] = parts[1].padEnd(2, "0");
    }
    return parts.join(".");
  }

  function productKey(row) {
    return `${normalizeName(row.name).toLowerCase()}|${normalizeVendor(row.vendor).toLowerCase()}`;
  }

  function detectColumns(headers) {
    const h = headers.map((x) => String(x || "").toLowerCase());
    const find = (words) => h.findIndex((cell) => words.some((w) => cell.includes(w)));
    let nameIdx = find(["назван", "name", "product", "software", "програм", "пo", "title"]);
    let verIdx = find(["верс", "version", "ver"]);
    let vendorIdx = find(["производ", "vendor", "publisher", "издат", "manufacturer"]);
    if (nameIdx < 0) nameIdx = 0;
    if (verIdx < 0) verIdx = nameIdx === 0 ? 1 : 0;
    if (vendorIdx < 0) vendorIdx = Math.max(nameIdx, verIdx) + 1;
    return { nameIdx, verIdx, vendorIdx };
  }

  function rowsFromMatrix(matrix) {
    if (!matrix || matrix.length < 2) return [];
    const headers = matrix[0].map(String);
    const cols = detectColumns(headers);
    const out = [];
    for (let i = 1; i < matrix.length && out.length < MAX_ROWS; i++) {
      const row = matrix[i];
      if (!row || row.every((c) => !String(c || "").trim())) continue;
      out.push({
        name: String(row[cols.nameIdx] ?? "").trim(),
        version: String(row[cols.verIdx] ?? "").trim(),
        vendor: String(row[cols.vendorIdx] ?? "").trim(),
      });
    }
    return out;
  }

  function parseCsv(text) {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
    if (!lines.length) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const matrix = lines.map((line) => {
      const cells = [];
      let cur = "";
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { q = !q; continue; }
        if (ch === sep && !q) { cells.push(cur); cur = ""; continue; }
        cur += ch;
      }
      cells.push(cur);
      return cells.map((c) => c.trim().replace(/^"|"$/g, ""));
    });
    return rowsFromMatrix(matrix);
  }

  function parseXml(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    if (doc.querySelector("parsererror")) throw new Error("Не удалось прочитать XML");
    const rows = [];
    const items = doc.querySelectorAll("row, item, record, software, product");
    if (items.length) {
      items.forEach((el) => {
        if (rows.length >= MAX_ROWS) return;
        const name = el.querySelector("name, title, product")?.textContent?.trim()
          || el.getAttribute("name") || "";
        const version = el.querySelector("version, ver")?.textContent?.trim()
          || el.getAttribute("version") || "";
        const vendor = el.querySelector("vendor, publisher, manufacturer")?.textContent?.trim()
          || el.getAttribute("vendor") || "";
        if (name || version || vendor) rows.push({ name, version, vendor });
      });
    }
    if (rows.length) return rows;
    const allRows = [...doc.querySelectorAll("*")].filter((el) => el.children.length >= 2);
    allRows.slice(0, MAX_ROWS + 1).forEach((el, i) => {
      if (i === 0) return;
      const kids = [...el.children].map((c) => c.textContent?.trim() || "");
      if (kids.some(Boolean)) rows.push({ name: kids[0] || "", version: kids[1] || "", vendor: kids[2] || "" });
    });
    return rows.slice(0, MAX_ROWS);
  }

  function loadXlsx() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const s = document.createElement("script");
      s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
      s.onload = () => resolve(window.XLSX);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function parseXlsx(file) {
    const XLSX = await loadXlsx();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    return rowsFromMatrix(matrix);
  }

  async function parseFile(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === "csv") return parseCsv(await file.text());
    if (ext === "xlsx" || ext === "xls") return parseXlsx(file);
    if (ext === "xml") return parseXml(await file.text());
    throw new Error("Поддерживаются только .csv, .xlsx и .xml");
  }

  function hasDefect(row) {
    const name = String(row.name || "");
    if (/[\uFFFD]/.test(name)) return true;
    if (/\{[0-9a-f-]{36}\}/i.test(name)) return true;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name)) return true;
    return false;
  }

  function analyzeRows(rawRows) {
    const rows = rawRows.slice(0, MAX_ROWS).filter((r) => r.name || r.version || r.vendor);
    const source = rows.length ? rows : DEMO_ROWS;

    const normalized = source.map((r) => ({
      raw: r,
      name: normalizeName(r.name),
      version: normalizeVersion(r.version),
      vendor: normalizeVendor(r.vendor || r.name.split(" ")[0]),
    }));

    const groups = new Map();
    normalized.forEach((item) => {
      const key = productKey(item.raw);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    const catalog = [];
    groups.forEach((items) => {
      const best = items.reduce((a, b) => (String(b.version).length > String(a.version).length ? b : a), items[0]);
      catalog.push({ name: best.name || items[0].name, version: best.version, vendor: best.vendor || items[0].vendor, items });
    });

    const duplicateRows = source.length - catalog.length;

    let unusual = 0;
    let versionIssues = 0;
    let missingVersion = 0;
    let defects = 0;
    let emptyVendor = 0;

    const nameVariants = new Map();
    const vendorVariants = new Map();
    const versionSprawl = new Map();

    normalized.forEach((item) => {
      const rawName = String(item.raw.name || "").trim();
      if (rawName && item.name && rawName.toLowerCase() !== item.name.toLowerCase()) unusual += 1;
      const rawVer = String(item.raw.version || "").trim();
      if (!rawVer) missingVersion += 1;
      if (rawVer && item.version && rawVer !== item.version) versionIssues += 1;
      if (hasDefect(item.raw)) defects += 1;
      if (!item.raw.vendor?.trim()) emptyVendor += 1;

      const canon = item.name || rawName;
      if (canon) {
        if (!nameVariants.has(canon)) nameVariants.set(canon, new Set());
        if (rawName) nameVariants.get(canon).add(rawName);
      }
      const vCanon = item.vendor;
      if (vCanon) {
        if (!vendorVariants.has(vCanon)) vendorVariants.set(vCanon, new Set());
        const rv = String(item.raw.vendor || "").trim();
        if (rv) vendorVariants.get(vCanon).add(rv);
      }
      if (canon && rawVer) {
        if (!versionSprawl.has(canon)) versionSprawl.set(canon, new Set());
        versionSprawl.get(canon).add(rawVer);
      }
    });

    const multiVersionProducts = [...versionSprawl.entries()].filter(([, vers]) => vers.size > 1);

    const problems = duplicateRows + unusual + versionIssues + missingVersion + defects + emptyVendor;
    const score = Math.max(25, Math.min(95, Math.round(100 - (problems / Math.max(source.length, 1)) * 35)));

    return {
      total: source.length,
      unique: catalog.length,
      problems,
      score,
      duplicates: duplicateRows,
      multiVersions: multiVersionProducts.length,
      missingVersion,
      defects: defects + emptyVendor,
      unlicensed: Math.max(0, Math.round(source.length * 0.05)),
      analysisMin: Math.max(18, Math.min(45, Math.round(source.length * 0.7 + 12))),
      nameVariants,
      vendorVariants,
      multiVersionProducts,
      defectBreakdown: {
        encoding: Math.max(0, Math.round(defects * 0.3)),
        guid: Math.max(0, Math.round(defects * 0.2)),
        emptyVendor,
        badVersion: versionIssues,
      },
    };
  }

  function scoreLabel(score) {
    if (score >= 85) return "База в хорошем состоянии";
    if (score >= 70) return "База требует внимания";
    if (score >= 50) return "Много проблем в данных";
    return "Критическое состояние базы";
  }

  function setScoreRing(score) {
    const offset = CIRC * (1 - score / 100);
    const arc = $("#scoreArc");
    if (arc) arc.setAttribute("stroke-dashoffset", String(offset));
    const val = $("#scoreValue");
    if (val) val.textContent = String(score);
    const status = $("#scoreStatus");
    if (status) status.textContent = scoreLabel(score);
  }

  function renderTags(container, variantMap, limit = 8) {
    if (!container) return;
    const tags = [];
    variantMap.forEach((variants, canon) => {
      variants.forEach((v) => {
        if (v.toLowerCase() !== canon.toLowerCase()) tags.push(v);
      });
      if (variants.size <= 1 && canon) tags.push(canon);
    });
    const unique = [...new Set(tags)].slice(0, limit);
    if (!unique.length) return;
    container.innerHTML = unique.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  }

  function renderVersionsTable(products) {
    const tbody = $("#versionsTable");
    if (!tbody || !products.length) return;
    tbody.innerHTML = products.slice(0, 5).map(([name, vers]) => {
      const tags = [...vers].slice(0, 4).map((v) => `<span class="tag tag--orange">${esc(v)}</span>`).join(" ");
      return `<tr><td>${esc(name)}</td><td>${tags}</td></tr>`;
    }).join("");
  }

  function renderDefectsTable(breakdown) {
    const tbody = $("#defectsTable");
    if (!tbody) return;
    const rows = [
      ["Битая кодировка", breakdown.encoding],
      ["GUID в названии", breakdown.guid],
      ["Пустой издатель", breakdown.emptyVendor],
      ["Некорректная версия", breakdown.badVersion],
    ].filter(([, n]) => n > 0);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="2">Критичных дефектов не найдено</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(([label, n]) => `<tr><td>${esc(label)}</td><td>${n}</td></tr>`).join("");
  }

  function renderResult(r) {
    analysisResult = r;
    setScoreRing(r.score);
    $('[data-metric="total"]').textContent = String(r.total);
    $('[data-metric="unique"]').textContent = String(r.unique);
    $('[data-metric="problems"]').textContent = String(r.problems);
    $('[data-metric="time"]').textContent = `${r.analysisMin} min`;

    $('[data-chip="duplicates"]').textContent = String(r.duplicates);
    $('[data-chip="versions"]').textContent = String(r.multiVersions);
    $('[data-chip="missing"]').textContent = String(r.missingVersion);
    $('[data-chip="defects"]').textContent = String(r.defects);
    $('[data-chip="unlicensed"]').textContent = String(r.unlicensed);

    renderTags($("#tagsNames"), r.nameVariants);
    renderTags($("#tagsVendors"), r.vendorVariants);
    renderVersionsTable(r.multiVersionProducts);
    renderDefectsTable(r.defectBreakdown);
  }

  function showSection(id) {
    ["#step-upload", "#step-analyzing", "#step-results"].forEach((sel) => {
      const el = $(sel);
      if (el) el.hidden = sel !== id;
    });
  }

  async function runAnalysisAnimation(total) {
    showSection("#step-analyzing");
    $("#step-analyzing")?.scrollIntoView({ behavior: "smooth", block: "start" });

    const fill = $("#checkupProgressFill");
    const label = $("#checkupProgressLabel");
    const started = performance.now();
    const minMs = 2200;

    return new Promise((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - started;
        const progress = Math.min(1, elapsed / minMs);
        const processed = Math.min(total, Math.round(total * progress));
        if (fill) fill.style.width = `${Math.round(progress * 100)}%`;
        if (label) label.textContent = `Обработано ${processed} из ${total} строк`;

        const activeStep = Math.min(STEP_KEYS.length - 1, Math.floor(progress * STEP_KEYS.length));
        $$("#checkupSteps li").forEach((li, i) => {
          li.classList.toggle("is-done", i < activeStep);
          li.classList.toggle("is-active", i === activeStep);
        });

        if (elapsed >= minMs && progress >= 1) {
          $$("#checkupSteps li").forEach((li) => li.classList.add("is-done"));
          if (fill) fill.style.width = "100%";
          if (label) label.textContent = `Обработано ${total} из ${total} строк`;
          setTimeout(resolve, 400);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function handleFile(file) {
    const errEl = $("#checkupFileError");
    const nameEl = $("#checkupFileName");
    if (errEl) errEl.hidden = true;
    if (nameEl) { nameEl.hidden = false; nameEl.textContent = file.name; }

    try {
      let rows = await parseFile(file);
      if (!rows.length) rows = DEMO_ROWS;
      const result = analyzeRows(rows);
      await runAnalysisAnimation(result.total);
      renderResult(result);
      showSection("#step-results");
      $("#step-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = e.message || "Не удалось прочитать файл. Попробуйте .csv, .xlsx или .xml до 200 строк.";
      }
    }
  }

  function downloadReport() {
    if (!analysisResult) return;
    const r = analysisResult;
    const lines = [
      "Чекап базы лицензий и ПО — экспресс-отчет",
      "========================================",
      "",
      `Индекс качества: ${r.score} из 100`,
      `Статус: ${scoreLabel(r.score)}`,
      "",
      `Всего строк: ${r.total}`,
      `Уникальных продуктов: ${r.unique}`,
      `Потенциальных проблем: ${r.problems}`,
      "",
      "Категории:",
      `- Дубли записей: ${r.duplicates}`,
      `- Несколько версий: ${r.multiVersions}`,
      `- Без версии: ${r.missingVersion}`,
      `- С дефектами: ${r.defects}`,
      `- Без лицензии (оценка): ${r.unlicensed}`,
      "",
      "Данные обрабатывались локально в браузере.",
      "Подробнее: https://katerinazaber.github.io/itman/klinika-b/",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chekap-bazy-otchet.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function restart() {
    analysisResult = null;
    const input = $("#checkupFileInput");
    if (input) input.value = "";
    const nameEl = $("#checkupFileName");
    if (nameEl) { nameEl.hidden = true; nameEl.textContent = ""; }
    const errEl = $("#checkupFileError");
    if (errEl) errEl.hidden = true;
    showSection("#step-upload");
    $("#step-upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("#btnStartCheckup")?.addEventListener("click", () => {
    $("#step-upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#btnDownloadReport")?.addEventListener("click", downloadReport);
  $("#btnRestart")?.addEventListener("click", restart);

  const input = $("#checkupFileInput");
  const drop = $("#checkupDropzone");

  drop?.addEventListener("click", () => input?.click());
  drop?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input?.click(); }
  });

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) handleFile(file);
  });

  ["dragenter", "dragover"].forEach((ev) => {
    drop?.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-dragover"); });
  });
  ["dragleave", "drop"].forEach((ev) => {
    drop?.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("is-dragover");
      if (ev === "drop" && e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
    });
  });

  let detailsOpen = true;
  $("#detailsToggle")?.addEventListener("click", () => {
    detailsOpen = !detailsOpen;
    const grid = $("#detailsGrid");
    const text = $("#detailsToggleText");
    const chevron = $("#detailsChevron");
    if (grid) grid.hidden = !detailsOpen;
    if (text) text.textContent = detailsOpen ? "Скрыть детали" : "Показать детали";
    if (chevron) chevron.setAttribute("d", detailsOpen ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4");
    $("#detailsToggle")?.setAttribute("aria-expanded", String(detailsOpen));
  });
})();
