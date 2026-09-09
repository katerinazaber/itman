/* ============================================================
   ОАД — Общий анализ данных. Движок диагностики.
   Работает полностью в браузере. Никаких сетевых вызовов.
   ============================================================ */

/* ---------- 1. Разбор входных данных ---------- */

function detectDelimiter(text) {
  const line = (text.split(/\r?\n/).find(l => l.trim()) || '');
  const counts = { '\t': 0, ';': 0, ',': 0, '|': 0 };
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (!inQ && counts[ch] !== undefined) counts[ch]++;
  }
  let best = ',', bestN = -1;
  for (const d of ['\t', ';', ',', '|']) if (counts[d] > bestN) { bestN = counts[d]; best = d; }
  return bestN === 0 ? null : best;
}

function parseDelimited(text, delim) {
  // RFC 4180
  const rows = [];
  let row = [], field = '', inQ = false, i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === delim) { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += ch; i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows.filter(r => r.some(c => c && c.trim()));
}

function parseInput(text) {
  text = String(text || '').replace(/^﻿/, '');
  const delim = detectDelimiter(text);
  if (!delim) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return { rows: lines.map(l => [l]), delim: null };
  }
  return { rows: parseDelimited(text, delim), delim };
}

/* ---------- 2. Определение колонок ---------- */

const HEADER_HINTS = {
  name: ['name', 'software', 'displayname', 'product', 'наименование', 'название', 'по', 'программа', 'продукт', 'софт'],
  version: ['version', 'ver', 'displayversion', 'версия', 'релиз', 'release'],
  publisher: ['publisher', 'vendor', 'manufacturer', 'company', 'издатель', 'вендор', 'производитель', 'разработчик', 'поставщик']
};

function looksLikeHeader(row) {
  const joined = row.join(' ').toLowerCase();
  const all = [...HEADER_HINTS.name, ...HEADER_HINTS.version, ...HEADER_HINTS.publisher];
  return all.some(h => joined.includes(h)) && row.every(c => String(c).length < 60);
}

function guessColumns(rows) {
  const header = looksLikeHeader(rows[0]) ? rows[0] : null;
  const body = header ? rows.slice(1) : rows;
  let width = 0;
  for (const r of rows) if (r.length > width) width = r.length;
  const res = { name: -1, version: -1, publisher: -1, header, body, width };

  if (header) {
    header.forEach((h, idx) => {
      const k = String(h).toLowerCase().replace(/[^a-zа-яё]/g, '');
      for (const field of ['version', 'publisher', 'name']) {
        if (res[field] !== -1) continue;
        if (HEADER_HINTS[field].some(hint => k === hint.replace(/[^a-zа-яё]/g, '') || k.includes(hint.replace(/[^a-zа-яё]/g, '')))) {
          res[field] = idx;
        }
      }
    });
  }

  // эвристика по содержимому для того, что не нашлось
  const sample = body.slice(0, 200);
  const stat = [];
  for (let c = 0; c < width; c++) {
    const vals = sample.map(r => String(r[c] ?? '').trim()).filter(Boolean);
    if (!vals.length) { stat.push({ c, versionish: 0, len: 0, uniq: 0 }); continue; }
    const versionish = vals.filter(v => /^v?\d+(\.\d+){1,4}[a-z]?$/i.test(v)).length / vals.length;
    const len = vals.reduce((s, v) => s + v.length, 0) / vals.length;
    const uniq = new Set(vals.map(v => v.toLowerCase())).size / vals.length;
    stat.push({ c, versionish, len, uniq });
  }
  if (res.version === -1) {
    const cand = stat.filter(s => s.versionish > 0.5).sort((a, b) => b.versionish - a.versionish)[0];
    if (cand) res.version = cand.c;
  }
  if (res.name === -1) {
    const cand = stat.filter(s => s.c !== res.version && s.c !== res.publisher && s.len > 6)
      .sort((a, b) => (b.uniq * b.len) - (a.uniq * a.len))[0];
    res.name = cand ? cand.c : 0;
  }
  if (res.publisher === -1) {
    const cand = stat.filter(s => s.c !== res.version && s.c !== res.name && s.len > 3 && s.uniq < 0.6)
      .sort((a, b) => a.uniq - b.uniq)[0];
    if (cand) res.publisher = cand.c;
  }
  return res;
}

/* ---------- 3. Нормализация наименования ---------- */

const ARCH = /(?<![\p{L}\p{N}])(x64|x86|amd64|i386|i586|i686|win32|win64|64[\s-]?bit|32[\s-]?bit|64[\s-]?разряд[\p{L}]*|32[\s-]?разряд[\p{L}]*|arm64|aarch64)(?![\p{L}\p{N}])/giu;
const EDITIONWORDS = /(?<![\p{L}\p{N}])(edition|editions|version|версия|редакция|выпуск|release|sp\d|service\s*pack\s*\d*|update\s*\d+|обновление\s*\d+|build\s*[\d.]+|сборка\s*[\d.]+|rev\.?\s*\d+|patch\s*\d*|hotfix)(?![\p{L}\p{N}])/giu;
const LANGWORDS = /(?<![\p{L}\p{N}])(русский|russian|english|английский|multilanguage|multilingual|mui|ru-ru|en-us|язык[\p{L}]*)(?![\p{L}\p{N}])/giu;
const VERSIONTOK = /\b\d+(?:[._]\d+){1,4}[a-z]?\b/gi;

const STOPWORDS = new Set(['для', 'and', 'for', 'the', 'of', 'на', 'в', 'по', 'с', 'из', 'пакет', 'приложение']);
const SYNONYMS = { ms: 'microsoft', msft: 'microsoft', win: 'windows' };

function stripDiacritics(s) { return s.replace(/ё/g, 'е').replace(/Ё/g, 'Е'); }

/** Номер сборки/обновления в наименовании — различает Java Update 391 и Update 411. */
function buildTag(name) {
  const s = String(name || '');
  let m = s.match(/(?<![\p{L}\p{N}])(?:update|обновление|u)\s*(\d{2,5})(?![\p{L}\p{N}])/iu);
  if (m) return 'u' + m[1];
  m = s.match(/(?<![\p{L}\p{N}])(?:build|сборка)\s*([\d.]{2,12})(?![\p{L}\p{N}])/iu);
  if (m) return 'b' + m[1];
  m = s.match(/(?<![\p{L}\p{N}])(?:sp|service\s*pack)\s*(\d)(?![\p{L}\p{N}])/iu);
  if (m) return 'sp' + m[1];
  return '';
}

/** Разрядность, если она указана явно. */
/* Редакция издания. Это НЕ оформление наименования: Community, Professional
   и Enterprise — разные продукты с разными лицензиями, и склеивать их как
   разнописания одной записи нельзя. Словарь общеязыковой (английские и
   русские названия изданий), никаких выдуманных наименований продуктов. */
const EDITIONS = /(?<![\p{L}\p{N}])(community|professional|enterprise|ultimate|premium|standard|starter|express|datacenter|corporate|business|education|essentials|home\s*(?:basic|premium)?|basic|personal|trial|preview|beta|профессиональн[\p{L}]*|корпоративн[\p{L}]*|стандартн[\p{L}]*|базов[\p{L}]*|домашн[\p{L}]*|расширенн[\p{L}]*|начальн[\p{L}]*|пробн[\p{L}]*)(?![\p{L}\p{N}])/giu;
function editionTag(name) {
  const found = String(name).match(EDITIONS);
  if (!found) return '';
  return [...new Set(found.map(x => x.toLowerCase().replace(/\s+/g, ' ')))].sort().join('+');
}

function archTag(name) {
  const s = String(name || '');
  if (/(?<![\p{L}\p{N}])(x64|amd64|64[\s-]?bit|64[\s-]?разряд[\p{L}]*|win64)(?![\p{L}\p{N}])/iu.test(s)) return 'x64';
  if (/(?<![\p{L}\p{N}])(x86|i[3-6]86|32[\s-]?bit|32[\s-]?разряд[\p{L}]*|win32)(?![\p{L}\p{N}])/iu.test(s)) return 'x86';
  if (/(?<![\p{L}\p{N}])(arm64|aarch64)(?![\p{L}\p{N}])/iu.test(s)) return 'arm64';
  return '';
}

/** Нормализованная версия: major.minor. Пусто -> '∅'. */
function normalizeVersion(v) {
  const s = String(v ?? '').trim();
  if (!s) return '∅';
  const m = s.match(/(\d+)(?:[._](\d+))?/);
  if (!m) return s.toLowerCase();
  return m[2] !== undefined ? `${+m[1]}.${+m[2]}` : `${+m[1]}`;
}

function normalizeName(raw) {
  let s = stripDiacritics(String(raw || '')).toLowerCase();
  s = s.replace(/[\u0000-\u001F\u007F\uFFFD]/g, ' ');
  s = s.replace(/\([^)]*\)/g, ' ');          // скобочные хвосты целиком
  s = s.replace(/\[[^\]]*\]/g, ' ');
  s = s.replace(ARCH, ' ');
  s = s.replace(LANGWORDS, ' ');
  s = s.replace(EDITIONWORDS, ' ');
  s = s.replace(VERSIONTOK, ' ');
  // Ни год, ни одиночное число из наименования НЕ вычеркиваем: для
  // AutoCAD 2019/2022, Office 2013/2016, Visual C++ 2013 / 2015-2022 и Java 8/11
  // это часть названия продукта. Лучше не склеить одинаковое, чем склеить разное.
  s = s.replace(/[®™©]/g, ' ');
  s = s.replace(/[^\p{L}\p{N}+#]+/gu, ' ');  // пунктуация прочь, но + и # оставляем (C++, C#)
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function tokens(s) {
  return normalizeName(s).split(' ')
    .map(t => SYNONYMS[t] || t)
    .filter(t => t && !STOPWORDS.has(t) && (t.length > 1 || /[0-9+#]/.test(t)));
}

/** Ключ без пробелов и дефисов: ловит «7-Zip» = «7zip», «МойОфис» = «Мой Офис». */
function tightKey(s) { return tokens(s).join(''); }

function diceTokens(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return (2 * inter) / (A.size + B.size);
}

/* ---------- 4. Нормализация издателя ---------- */

const ORGFORMS = /\b(corporation|corp|incorporated|inc|limited|ltd|llc|gmbh|s\.?a\.?r\.?l|s\.?a|b\.?v|co|company|group|software|systems|technologies|technology|solutions|labs|holding|ооо|оао|зао|пао|ао|нао|ип|компания|корпорация|групп|софт|системы|технологии)\b/gi;

function normalizeVendor(raw) {
  let s = stripDiacritics(String(raw || '')).toLowerCase();
  s = s.replace(/[«»"'`]/g, ' ');
  s = s.replace(/[.,]/g, ' ');
  s = s.replace(ORGFORMS, ' ');
  s = s.replace(/[^\p{L}\p{N}]+/gu, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/* ---------- 5. Детекторы патологий ---------- */

const MOJIBAKE = /[\uFFFD]|[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
const CTRLCHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const PATHLIKE = /(^|\s)([a-z]:\\|\\\\|\/usr\/|\/opt\/|\/home\/)/i;
const GUIDLIKE = /\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?/i;

const NOISE_RULES = [
  { re: /\bredistributable\b|\bruntime\b|\bredist\b/i, label: 'Среды исполнения и redistributable' },
  { re: /\b(driver|драйвер\w*)\b/i, label: 'Драйверы' },
  { re: /\b(language\s*pack|языковой\s*пакет|mui)\b/i, label: 'Языковые пакеты' },
  { re: /\b(update for|security update|hotfix|kb\d{6,})\b/i, label: 'Обновления и патчи' },
  { re: /^lib[a-z0-9_-]*|(-devel|-dev|-doc|-common|-data)$/i, label: 'Системные библиотеки Linux' },
  { re: /\.(x86_64|noarch|i686|aarch64)$|@[a-z0-9_.-]+$/i, label: 'Пакеты репозиториев Linux' },
  { re: /\b(sdk|software development kit|toolkit)\b/i, label: 'SDK и инструментарий разработчика' },
  { re: /\b(\.net framework|visual c\+\+|vcredist|java\w* runtime|jre)\b/i, label: 'Платформенные компоненты' },
  { re: /\b(font|шрифт\w*)\b/i, label: 'Шрифты' },
  { re: /\b(агент|agent)\b.*\b(инвентариз\w*|inventory|monitoring|мониторинг\w*)\b/i, label: 'Служебные агенты' }
];

function classifyNoise(name) {
  for (const r of NOISE_RULES) if (r.re.test(name)) return r.label;
  return null;
}

function junkFlags(name, version, publisher) {
  const f = [];
  const all = [name, version, publisher].filter(Boolean).join(' ');
  if (MOJIBAKE.test(all)) f.push('Битая кодировка');
  if (CTRLCHARS.test(all)) f.push('Управляющие символы');
  if (PATHLIKE.test(name)) f.push('Путь вместо наименования');
  if (GUIDLIKE.test(name)) f.push('GUID в наименовании');
  if (name && name.trim().length < 3) f.push('Наименование короче трех символов');
  if (/^\s|\s$/.test(String(name))) f.push('Краевые пробелы');
  if (/\s{2,}/.test(String(name))) f.push('Двойные пробелы');
  return f;
}

function versionQuality(v) {
  const s = String(v ?? '').trim();
  if (!s) return 'missing';
  if (/^v?\d+(\.\d+){1,4}[a-z]?$/i.test(s)) return 'ok';
  if (/^\d+$/.test(s)) return 'coarse';          // «19» вместо «19.00»
  if (/^(19|20)\d{2}$/.test(s)) return 'coarse';
  return 'messy';
}

/* ---------- 6. Основной анализ ---------- */

function analyze(rows, cols, opts) {
  opts = opts || {};
  const FUZZY = opts.fuzzy === undefined ? 0.82 : opts.fuzzy;
  const body = cols.body;
  const items = [];

  for (let i = 0; i < body.length; i++) {
    const r = body[i];
    const name = String(r[cols.name] ?? '').trim();
    if (!name) continue;
    const version = cols.version >= 0 ? String(r[cols.version] ?? '').trim() : '';
    const publisher = cols.publisher >= 0 ? String(r[cols.publisher] ?? '').trim() : '';
    items.push({
      i, name, version, publisher,
      key: normalizeName(name),
      tkey: tightKey(name),
      toks: tokens(name),
      nver: normalizeVersion(version),
      btag: buildTag(name),
      atag: archTag(name),
      etag: editionTag(name),
      vend: normalizeVendor(publisher),
      noise: classifyNoise(name),
      junk: junkFlags(name, version, publisher),
      vq: versionQuality(version)
    });
  }

  /* --- группировка по продуктам (без учета версии) --- */
  const byKey = new Map();
  for (const it of items) {
    const k = it.tkey || it.key || '(пусто)';
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(it);
  }
  let groups = [...byKey.entries()].map(([key, members]) => ({ key, members, toks: members[0].toks }));

  // нечеткое слияние близких групп
  groups.sort((a, b) => b.members.length - a.members.length);
  const merged = [];
  const byToken = new Map();   // инвертированный индекс: токен -> индексы групп в merged
  for (const g of groups) {
    const seen = new Set();
    for (const t of g.toks) for (const idx of (byToken.get(t) || [])) seen.add(idx);
    let host = null;
    for (const idx of seen) {
      const m = merged[idx];
      if (Math.abs(m.toks.length - g.toks.length) > 3) continue;
      if (diceTokens(m.toks, g.toks) >= FUZZY) { host = m; break; }
    }
    if (host) { host.members = host.members.concat(g.members); host.fuzzy = true; }
    else {
      const idx = merged.length;
      merged.push({ key: g.key, members: g.members.slice(), toks: g.toks, fuzzy: false });
      for (const t of new Set(g.toks)) {
        if (!byToken.has(t)) byToken.set(t, []);
        byToken.get(t).push(idx);
      }
    }
  }
  groups = merged;

  /* --- внутри продукта: корзины по версии (+ сборка, + разрядность) --- */
  for (const g of groups) {
    // разрядность различает записи только если она проставлена у ВСЕХ и различается
    const archs = g.members.map(m => m.atag);
    const splitByArch = archs.every(Boolean) && new Set(archs).size > 1;

    const buckets = new Map();
    for (const m of g.members) {
      // редакция разделяет корзины всегда: это разные продукты, а не написания
      const k = m.nver + (m.btag ? '·' + m.btag : '') + (splitByArch ? '·' + m.atag : '')
              + (m.etag ? '·' + m.etag : '');
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(m);
    }
    g.buckets = [...buckets.entries()].map(([ver, ms]) => {
      const forms = [...new Set(ms.map(m => m.name.trim()))];
      const exactDup = ms.length - forms.length;   // строка в строку
      return { ver, members: ms, forms, excess: forms.length - 1, exactDup };
    }).sort((a, b) => b.members.length - a.members.length);

    g.spellExcess = g.buckets.reduce((s, b) => s + b.excess, 0);      // разнописания
    g.exactDup = g.buckets.reduce((s, b) => s + b.exactDup, 0);       // полные дубли строк
    g.versionsInPark = new Set(g.members.filter(m => m.nver !== '∅').map(m => m.nver + (m.btag ? '·' + m.btag : ''))).size;
    g.title = g.members.slice().sort((a, b) => b.name.length - a.name.length)[0].name;
    g.forms = new Set(g.members.map(m => m.name.trim()));
  }
  groups.sort((a, b) => (b.spellExcess - a.spellExcess) || (b.members.length - a.members.length));

  /* --- издатели --- */
  const vendMap = new Map();
  for (const it of items) {
    if (!it.publisher) continue;
    const k = it.vend || '(пусто)';
    if (!vendMap.has(k)) vendMap.set(k, new Set());
    vendMap.get(k).add(it.publisher.trim());
  }
  const vendorGroups = [...vendMap.entries()]
    .map(([k, set]) => ({ key: k, forms: [...set] }))
    .filter(v => v.forms.length > 1)
    .sort((a, b) => b.forms.length - a.forms.length);

  /* --- агрегаты --- */
  const rowsN = items.length;
  const productsN = groups.length;
  const spellGroups = groups.filter(g => g.spellExcess > 0);          // продукты с разнописанием
  const spellExcess = groups.reduce((s, g) => s + g.spellExcess, 0);  // лишних форм записи
  const exactDup = groups.reduce((s, g) => s + g.exactDup, 0);        // полностью повторяющихся строк
  const multiVersion = groups.filter(g => g.versionsInPark > 1);      // продукт в парке в нескольких версиях

  const missingVer = items.filter(i => i.vq === 'missing').length;
  const messyVer = items.filter(i => i.vq === 'messy' || i.vq === 'coarse').length;
  const junkItems = items.filter(i => i.junk.length);
  const noiseItems = items.filter(i => i.noise);

  const noiseBreakdown = {};
  for (const i of noiseItems) noiseBreakdown[i.noise] = (noiseBreakdown[i.noise] || 0) + 1;

  const junkBreakdown = {};
  for (const i of junkItems) for (const f of i.junk) junkBreakdown[f] = (junkBreakdown[f] || 0) + 1;

  const vendorExtraForms = vendorGroups.reduce((s, v) => s + (v.forms.length - 1), 0);
  const vendorsTotal = vendMap.size;

  const r = {
    spell: rowsN ? (spellExcess + exactDup) / rowsN : 0,
    compression: rowsN ? 1 - productsN / rowsN : 0,
    missingVer: rowsN ? missingVer / rowsN : 0,
    messyVer: rowsN ? messyVer / rowsN : 0,
    junk: rowsN ? junkItems.length / rowsN : 0,
    noise: rowsN ? noiseItems.length / rowsN : 0,
    vendor: vendorsTotal ? vendorExtraForms / vendorsTotal : 0
  };

  // Веса открыты сознательно: аудитория марафона проверяет методику, а не верит на слово.
  const WEIGHTS = { spell: 110, missingVer: 18, messyVer: 8, junk: 30, vendor: 22, noise: 10 };
  let index = 100
    - r.spell * WEIGHTS.spell          // разнописания и полные дубли — главная патология
    - r.missingVer * WEIGHTS.missingVer
    - r.messyVer * WEIGHTS.messyVer
    - r.junk * WEIGHTS.junk
    - r.vendor * WEIGHTS.vendor
    - r.noise * WEIGHTS.noise;
  index = Math.max(0, Math.min(100, Math.round(index)));

  const DIAG = [
    { min: 88, t: 'Практически здоров', d: 'База в хорошем состоянии. Профилактический осмотр раз в квартал не помешает: расхождения накапливаются незаметно.' },
    { min: 72, t: 'Легкая форма дублитоза', d: 'Единичные разнописания и пропуски. Лечится амбулаторно: единые правила ввода плюс разовая нормализация.' },
    { min: 52, t: 'Дублитоз средней тяжести', d: 'Одно и то же ПО живет в базе под несколькими именами. Отчет по лицензиям на таких данных уже повышает потребность в более глубоком аудите.' },
    { min: 30, t: 'Хроническая форма', d: 'Данные непригодны для лицензионного учета без нормализации. Ручная сверка на этом объеме экономически не окупается.' },
    { min: 0, t: 'Требуется срочное вмешательство', d: 'Любые отчеты по лицензиям на этих данных недостоверны. Начинать нужно с нормализации, а не с закупки лицензий.' }
  ];
  const diag = DIAG.find(x => index >= x.min);

  // сколько ручной работы это стоит: 3 мин на сведение группы разнописаний, 1 мин на битую строку
  const manualMinutes = spellGroups.length * 3 + junkItems.length * 1 + vendorGroups.length * 2;

  return {
    rowsN, productsN, groups,
    spellGroups, spellExcess, exactDup, multiVersion,
    vendorGroups, vendorsTotal, vendorExtraForms,
    missingVer, messyVer, junkItems, noiseItems,
    noiseBreakdown, junkBreakdown,
    ratios: r, index, diag, weights: WEIGHTS,
    manualMinutes,
    licensable: rowsN - noiseItems.length
  };
}

