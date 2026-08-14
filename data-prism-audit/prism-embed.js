/* Data Prism express file check funnel */

(function () {
  const root = document.querySelector(".itman-prism");
  if (!root) return;

  const MAX_ROWS = 200;
  const STEP_KEYS = ["recognize", "duplicates", "names", "versions", "catalog"];

  let phase = "intro";
  let analysisResult = null;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => root.querySelectorAll(sel);

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
        if (ch === '"') {
          q = !q;
          continue;
        }
        if (ch === sep && !q) {
          cells.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      cells.push(cur);
      return cells.map((c) => c.trim().replace(/^"|"$/g, ""));
    });
    return rowsFromMatrix(matrix);
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
    if (ext === "csv") {
      const text = await file.text();
      return parseCsv(text);
    }
    if (ext === "xlsx" || ext === "xls") {
      return parseXlsx(file);
    }
    throw new Error("Поддерживаются только .csv и .xlsx");
  }

  function analyzeRows(rawRows) {
    const rows = rawRows.slice(0, MAX_ROWS).filter((r) => r.name || r.version || r.vendor);
    if (!rows.length) return analyzeRows(DEMO_ROWS);

    const normalized = rows.map((r) => ({
      raw: r,
      name: normalizeName(r.name),
      version: normalizeVersion(r.version),
      vendor: normalizeVendor(r.vendor || r.name.split(" ")[0]),
    }));

    const groups = new Map();
    normalized.forEach((item, idx) => {
      const key = productKey(item.raw);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ...item, idx });
    });

    const catalog = [];
    groups.forEach((items) => {
      const best = items.reduce((a, b) => (String(b.version).length > String(a.version).length ? b : a), items[0]);
      catalog.push({
        name: best.name || items[0].name,
        version: best.version || items[0].version,
        vendor: best.vendor || items[0].vendor,
      });
    });

    const duplicateRows = rows.length - catalog.length;
    const dupPct = rows.length ? Math.round((duplicateRows / rows.length) * 100) : 0;

    let unusual = 0;
    let versionIssues = 0;
    let gaps = 0;

    normalized.forEach((item) => {
      const rawName = String(item.raw.name || "").trim();
      if (rawName && item.name && rawName.toLowerCase() !== item.name.toLowerCase()) unusual += 1;
      const rawVer = String(item.raw.version || "").trim();
      if (rawVer && item.version && rawVer !== item.version) versionIssues += 1;
      if (!item.raw.name || !item.raw.version || !item.raw.vendor) gaps += 1;
    });

    const verPct = rows.length ? Math.min(99, Math.round((versionIssues / rows.length) * 100)) : 0;

    return {
      total: rows.length,
      unique: catalog.length,
      dupPct: Math.max(dupPct, duplicateRows > 0 ? 10 : 0),
      unusual: Math.max(unusual, 0),
      verPct,
      gaps: Math.max(gaps, 0),
      before: rows.slice(0, 5),
      after: catalog.slice(0, 5),
    };
  }

  function setPhase(next) {
    phase = next;
    root.dataset.phase = next;
    $$("[data-view]").forEach((el) => {
      el.hidden = el.getAttribute("data-view") !== next;
    });
    if (next === "result" && analysisResult) renderResult(analysisResult);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderResult(r) {
    $("#prismResultLead").textContent = `Из ${r.total} строк получили очищенный каталог из ${r.unique} уникальных продуктов.`;
    $("#prismRowLimit").textContent = String(Math.min(r.total, MAX_ROWS));

    const beforeBody = $("#prismBeforeBody");
    const afterBody = $("#prismAfterBody");
    beforeBody.innerHTML = r.before
      .map(
        (row, i) =>
          `<tr><td>${i + 1}</td><td>${esc(row.name)}</td><td>${esc(row.version)}</td><td>${esc(row.vendor)}</td></tr>`
      )
      .join("");
    afterBody.innerHTML = r.after
      .map(
        (row, i) =>
          `<tr><td>${i + 1}</td><td>${esc(row.name)}</td><td>${esc(row.version)}</td><td>${esc(row.vendor)}</td></tr>`
      )
      .join("");

    $('[data-stat="dupPct"]').textContent = `${r.dupPct}%`;
    $('[data-stat="unusual"]').textContent = String(r.unusual);
    $('[data-stat="verPct"]').textContent = `${r.verPct}%`;
    $('[data-stat="gaps"]').textContent = String(r.gaps);
    $('[data-stat="unique"]').textContent = String(r.unique);
  }

  async function runAnalysisAnimation(total) {
    setPhase("analyzing");
    const fill = $("#prismProgressFill");
    const label = $("#prismProgressLabel");
    const started = performance.now();
    const minMs = 2000;
    const maxMs = 5000;

    return new Promise((resolve) => {
      let stepIdx = 0;
      let processed = 0;

      const tick = () => {
        const elapsed = performance.now() - started;
        const progress = Math.min(1, elapsed / minMs);
        processed = Math.min(total, Math.round(total * progress));
        fill.style.width = `${Math.round(progress * 100)}%`;
        label.textContent = `Обработано ${processed} из ${total} строк`;

        const activeStep = Math.min(STEP_KEYS.length - 1, Math.floor(progress * STEP_KEYS.length));
        $$("#prismSteps li").forEach((li, i) => {
          li.classList.toggle("is-done", i < activeStep);
          li.classList.toggle("is-active", i === activeStep);
        });

        if (elapsed >= minMs && progress >= 1) {
          $$("#prismSteps li").forEach((li) => li.classList.add("is-done"));
          fill.style.width = "100%";
          label.textContent = `Обработано ${total} из ${total} строк`;
          const wait = Math.max(0, Math.min(maxMs, elapsed) - elapsed + 300);
          setTimeout(resolve, wait);
          return;
        }
        stepIdx = activeStep;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function handleFile(file) {
    const errEl = $("#prismFileError");
    const nameEl = $("#prismFileName");
    errEl.hidden = true;
    nameEl.hidden = false;
    nameEl.textContent = file.name;

    try {
      let rows = await parseFile(file);
      if (!rows.length) rows = DEMO_ROWS;
      analysisResult = analyzeRows(rows);
      await runAnalysisAnimation(analysisResult.total);
      setPhase("result");
    } catch (e) {
      errEl.hidden = false;
      errEl.textContent = e.message || "Не удалось прочитать файл. Попробуйте .csv или .xlsx до 200 строк.";
    }
  }

  $("#prismStart")?.addEventListener("click", () => setPhase("upload"));
  $("#prismBackIntro")?.addEventListener("click", () => setPhase("intro"));
  $("#prismBackResult")?.addEventListener("click", () => setPhase("result"));
  $("#prismGetReport")?.addEventListener("click", () => setPhase("lead"));
  $("#prismPickFile")?.addEventListener("click", () => $("#prismFileInput").click());

  const input = $("#prismFileInput");
  const drop = $("#prismDropzone");

  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) handleFile(file);
  });

  drop?.addEventListener("click", () => input?.click());
  drop?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input?.click();
    }
  });

  ["dragenter", "dragover"].forEach((ev) => {
    drop?.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    drop?.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("is-dragover");
      if (ev === "drop" && e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
    });
  });

  $("#prismLeadForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#prismName")?.value?.trim();
    const email = $("#prismEmail")?.value?.trim();
    const consent = $("#prismConsent")?.checked;
    if (!name || !email || !consent) return;
    setPhase("done");
  });

  setPhase("intro");
})();
