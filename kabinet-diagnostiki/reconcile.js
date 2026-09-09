/* ============================================================
   Вторая ступень ОАД: сверка с эталонным ядром.
   Ядро поставляется в хешированном виде — по нему нельзя
   восстановить список масок, можно только проверить строку,
   которая уже есть у пользователя.
   ============================================================ */

/* ---------- компактный SHA-256 ---------- */
const SHA_K = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);

function sha256hex(str) {
  const utf8 = new TextEncoder().encode(str);
  const bitLen = utf8.length * 8;
  const withPad = new Uint8Array((((utf8.length + 8) >> 6) + 1) << 6);
  withPad.set(utf8); withPad[utf8.length] = 0x80;
  new DataView(withPad.buffer).setUint32(withPad.length - 4, bitLen >>> 0);
  new DataView(withPad.buffer).setUint32(withPad.length - 8, Math.floor(bitLen / 4294967296));
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,
      h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  const w = new Uint32Array(64);
  const dv = new DataView(withPad.buffer);
  for (let i = 0; i < withPad.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const a = w[t-15], b = w[t-2];
      const s0 = ((a>>>7)|(a<<25)) ^ ((a>>>18)|(a<<14)) ^ (a>>>3);
      const s1 = ((b>>>17)|(b<<15)) ^ ((b>>>19)|(b<<13)) ^ (b>>>10);
      w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e>>>6)|(e<<26)) ^ ((e>>>11)|(e<<21)) ^ ((e>>>25)|(e<<7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA_K[t] + w[t]) >>> 0;
      const S0 = ((a>>>2)|(a<<30)) ^ ((a>>>13)|(a<<19)) ^ ((a>>>22)|(a<<10));
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0;
    h4=(h4+e)>>>0; h5=(h5+f)>>>0; h6=(h6+g)>>>0; h7=(h7+h)>>>0;
  }
  return [h0,h1,h2,h3,h4,h5,h6,h7].map(x => x.toString(16).padStart(8,'0')).join('');
}

/* ---------- ключ и LIKE ---------- */
function coreKey(s) {
  return String(s ?? '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}
const _likeCache = new Map();

/** Тело символьного класса LIKE -> безопасное тело класса регулярного выражения. */
function likeClass(body) {
  const esc = ch => '\\]^-'.includes(ch) ? '\\' + ch : ch;
  let out = '', k = 0;
  while (k < body.length) {
    if (k + 2 < body.length && body[k + 1] === '-' && body[k] <= body[k + 2]) {
      out += esc(body[k]) + '-' + esc(body[k + 2]); k += 3;
    } else { out += esc(body[k]); k++; }
  }
  return out;
}

/** Правила LIKE именно SQL Server: % — любая последовательность, _ — ровно один символ,
 *  [abc] и [a-z] — один символ из набора, [^abc] — один вне набора. */
function likeRx(pattern) {
  let rx = _likeCache.get(pattern);
  if (rx) return rx;
  const s = String(pattern);
  let out = '^', i = 0;
  const escLit = ch => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  while (i < s.length) {
    const c = s[i];
    if (c === '%') { out += '.*'; i++; }
    else if (c === '_') { out += '.'; i++; }
    else if (c === '[') {
      const j = s.indexOf(']', i + 1);
      if (j === -1) { out += escLit(c); i++; }
      else {
        let body = s.slice(i + 1, j);
        if (body === '') { out += escLit('[') + escLit(']'); i = j + 1; }
        else {
          const neg = body.startsWith('^');
          if (neg) body = body.slice(1);
          out += '[' + (neg ? '^' : '') + likeClass(body) + ']';
          i = j + 1;
        }
      }
    } else { out += escLit(c); i++; }
  }
  out += '$';
  rx = new RegExp(out, 'i');
  _likeCache.set(pattern, rx);
  return rx;
}

/* ---------- снятие декоративного хвоста ---------- */
const DECOR = /(?:\s*[([][^()[\]]*(?:bit|бит|разряд[\p{L}]*|x64|x86|amd64|i[3-6]86|arm64|рус[\p{L}]*|англ[\p{L}]*|russian|english|multi[\p{L}]*|\d[\d.]*)[^()[\]]*[)\]]|\s*[-–—]\s*\d[\d.]*|\s*[-–—]\s*(?:Русский|Russian|English|Английский)|\s+(?:x64|x86|amd64|64-?bit|32-?bit))\s*$/iu;
function decorVariants(name) {
  const out = [];
  let cur = String(name).trim();
  for (let i = 0; i < 3; i++) {
    const next = cur.replace(DECOR, '').trim();
    if (!next || next === cur) break;
    cur = next; out.push(cur);
  }
  return out;
}

/* ---------- сверка ---------- */

/** Литеральный префикс маски — до первой подстановки. */
function litPrefix(mask) {
  const s = String(mask);
  for (let i = 0; i < s.length; i++) if (s[i] === '%' || s[i] === '_' || s[i] === '[') return s.slice(0, i);
  return s;
}

/** Все записи ядра, у которых совпало НАИМЕНОВАНИЕ. */
function nameCandidates(core, name) {
  const out = [];
  const recs = core.idx[sha256hex(coreKey(name)).slice(0, 11)];
  if (recs) for (const r of recs) { r.ns = 2; out.push(r); }   // точная маска имени
  if (core.wild && core.wpref) {
    const n = String(name).trim().toLowerCase();
    const seen = new Set();
    for (const p of [n.slice(0, 3), n.slice(0, 2), n.slice(0, 1), '']) {
      const bucket = core.wpref[p];
      if (!bucket) continue;
      for (const k of bucket) {
        if (seen.has(k)) continue;
        seen.add(k);
        const w = core.wild[k];
        if (likeRx(w[0]).test(name)) {
          const r = w.slice(1); r.ns = 1;                       // маска с подстановкой
          out.push(r);
        }
      }
    }
  }
  return out;
}

/** Конкретность записи: версия важнее вендора, дальше — длина литерала версии. */
/* Приоритет при выборе эталона. Первым идет конкретность маски НАИМЕНОВАНИЯ:
   точная маска всегда сильнее маски с подстановкой. Иначе «Microsoft Visual
   Studio%» перебивает точную «Microsoft Visual Studio Professional», и ответ
   теряет редакцию — а редакция это отдельная лицензия, а не оформление имени.
   Дальше — маска версии, маска вендора, длина литерала версии. */
function moreSpecific(a, b) {
  if (!b) return true;
  const an = a.ns === undefined ? 2 : a.ns, bn = b.ns === undefined ? 2 : b.ns;
  if (an !== bn) return an > bn;
  if (a[4] !== b[4]) return a[4] > b[4];
  if (a[5] !== b[5]) return a[5] > b[5];
  return a[6] > b[6];
}

/** Итог по строке:
 *  1 — опознано, 2 — опознано после снятия декоративного хвоста,
 *  3 — имя есть, вендор записан иначе, 4 — имя и вендор есть, версия не совпала,
 *  5 — нет в демонстрационном ядре. */
function matchCore(core, name, vendor, version) {
  const vs = String(vendor ?? ''), rs = String(version ?? '');
  const evaluate = recs => {
    let hit = null, verFail = null, vendorFail = null;
    for (const r of recs) {
      const vmOk = likeRx(core.vm[r[0]]).test(vs);
      const rmOk = likeRx(core.rm[r[1]]).test(rs);
      if (vmOk && rmOk) { if (moreSpecific(r, hit)) hit = r; }
      else if (vmOk) { if (moreSpecific(r, verFail)) verFail = r; }
      else { if (moreSpecific(r, vendorFail)) vendorFail = r; }
    }
    return { hit, verFail, vendorFail };
  };

  let near = { verFail: null, vendorFail: null };
  const first = nameCandidates(core, name);
  if (first.length) {
    const r = evaluate(first);
    if (r.hit) return { code: 1, rec: r.hit };
    near = r;
  }
  for (const v of decorVariants(name)) {
    const c = nameCandidates(core, v);
    if (!c.length) continue;
    const r = evaluate(c);
    if (r.hit) return { code: 2, rec: r.hit, via: v };
    if (!near.verFail) near.verFail = r.verFail;
    if (!near.vendorFail) near.vendorFail = r.vendorFail;
  }
  if (near.verFail) return { code: 4, rec: near.verFail };
  if (near.vendorFail) return { code: 3, rec: near.vendorFail };
  return { code: 5 };
}

/* ---------- разбор версий для витрины «несколько версий в парке» ---------- */

/** Числовые части версии: «12.0.30501» -> [12,0,30501]. */
function verParts(v) {
  const m = String(v ?? '').match(/\d+/g);
  return m ? m.slice(0, 4).map(Number) : [];
}
function verCmp(a, b) {
  const x = verParts(a), y = verParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}
function verMajor(v) {
  const p = verParts(v);
  return p.length ? p[0] : null;
}

/** Сводка по версиям одной группы записей. */
function versionSummary(items) {
  const byVer = new Map();
  for (const it of items) {
    const key = String(it.version ?? '').trim() || '—';
    if (!byVer.has(key)) byVer.set(key, { label: key, rows: 0 });
    byVer.get(key).rows++;
  }
  const versions = [...byVer.values()].sort((a, b) => verCmp(b.label, a.label));
  const majors = new Set(items.map(i => verMajor(i.version)).filter(x => x !== null));
  if (versions.length) versions[0].newest = true;
  return {
    versions,
    majors: majors.size,
    /* Мажорные различия — вопрос прав на версию. Различия только в младших
       разрядах — это разнобой обновлений: лицензионного риска нет, но парк
       не выровнен. Разница между этими двумя случаями и есть польза блока. */
    risk: majors.size > 1 ? 'major' : 'patch'
  };
}

/* ---------- атрибуты эталонной позиции из справочников «Призмы данных» ----------
   Все, что ниже, читается из ядра как есть. Ни тип лицензирования, ни версия
   каталога не выводятся из инвентарных данных — они взяты из справочника
   «Приложение» и подставлены на сборке. */

/** Тип лицензирования эталонной позиции по ее индексу в core.apps. */
function appLicense(core, ai) {
  if (!core.appLic || !core.licTypes) return null;
  const t = core.licTypes[core.appLic[ai]];
  return t === undefined ? null : t;
}
/** Позиции, по которым вообще возникает лицензионный вопрос. */
const LICENSABLE = { 'Коммерческое': 1, 'Условно бесплатное': 1 };

/** Версия каталога для позиции. «Unspecified» и пустое — это отсутствие версии. */
function appCatVer(core, ai) {
  if (!core.appVer) return '';
  const v = String(core.appVer[ai] || '').trim();
  return (!v || /^unspecified$/i.test(v) || /^не\s*определ/i.test(v)) ? '' : v;
}
/** Числовое представление версии каталога; null, если упорядочить нельзя. */
function catVerKey(v) {
  const m = String(v || '').match(/\d+/g);
  return m ? m.slice(0, 4).map(Number) : null;
}
function catVerCmp(a, b) {
  const x = catVerKey(a) || [], y = catVerKey(b) || [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

function reconcile(analysis, core) {
  const REASONS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const examples = { 3: [], 4: [], 5: [] };

  /* 1. сверяем каждую лицензируемую строку */
  for (const g of analysis.groups) {
    for (const it of g.members) {
      if (it.noise) { it.m = null; continue; }
      it.m = matchCore(core, it.name, it.publisher, it.version);
    }
  }

  /* 2. переносим эталон на всю группу разнописаний:
        если хотя бы одна форма записи совпала с каталогом,
        остальные формы описывают тот же продукт. */
  let propagated = 0;
  for (const g of analysis.groups) {
    g.ref = null;
    for (const b of g.buckets) {
      // переносим ТОЛЬКО внутри одной версии: это разные написания одной записи,
      // а не разные версии продукта
      const lic = b.members.filter(x => !x.noise);
      if (lic.length < 2) continue;
      const donor = lic.find(x => x.m && x.m.code <= 2);
      if (!donor) continue;
      if (!g.ref) g.ref = donor.m.rec;
      for (const it of lic) {
        if (it.m && it.m.code > 2) { it.m = { code: 6, rec: donor.m.rec }; propagated++; }
      }
    }
  }

  /* 3. сводим — опираясь на каталог, а не на догадки о том, что чему родня */
  const rows = [], products = new Map();
  let licensable = 0, known = 0;
  for (const g of analysis.groups) {
    for (const it of g.members) {
      if (it.noise) continue;
      licensable++;
      const c = it.m ? it.m.code : 5;
      if (c === 6) known++;
      else { REASONS[c]++; if (c <= 2) known++; }
      const rec = it.m && it.m.rec;
      if (c <= 2 || c === 6) {
        const key = rec[2];                       // индекс эталонной позиции
        if (!products.has(key)) products.set(key, {
          ai: rec[2], app: core.apps[rec[2]], vendor: core.vendors[rec[3]],
          /* семейство берем из справочника «Приложение», а не из маски:
             каталог сам знает, что AutoCAD 2019 и AutoCAD 2022 — один продукт */
          afam: core.appFam ? core.appFam[rec[2]] : -1,
          lic: appLicense(core, rec[2]),
          catVer: appCatVer(core, rec[2]),
          red: core.appRed ? (core.appRed[rec[2]] || '') : '',
          fam: rec.length > 7 ? rec[7] : -1, rows: [], forms: new Set()
        });
        const p = products.get(key);
        p.rows.push(it); p.forms.add(it.name.trim());
        rows.push({ it, app: p.app, vendor: p.vendor, code: c });
      } else if (examples[c] && examples[c].length < 6) {
        examples[c].push({ it, app: rec ? core.apps[rec[2]] : null,
                           vendor: rec ? core.vendors[rec[3]] : null,
                           vmask: rec ? core.vm[rec[0]] : null, rmask: rec ? core.rm[rec[1]] : null });
      }
    }
  }
  REASONS[6] = propagated;

  const prodList = [...products.values()].sort((a, b) => b.rows.length - a.rows.length);

  /* Разные записи, ведущие на ОДНУ эталонную позицию.
     Это факт каталога, а не наша догадка о сходстве строк. */
  const spellings = prodList.filter(p => p.forms.size > 1);

  /* Несколько эталонных позиций ОДНОГО семейства приложений — то есть один
     продукт, учтенный в парке в разных версиях. Семейство берется из
     справочника «Приложение», а не из похожести строк. */
  /* У безверсионных «родовых» позиций каталога («Acrobat», «TeamViewer»)
     Семейство приложений не заполнено. Если имя такой позиции дословно
     совпадает с именем семейства, привязываем ее туда — иначе один продукт
     двоится: часть версий в лестнице, родовая позиция отдельной строкой. */
  const famByName = new Map();
  if (core.famNames) core.famNames.forEach((n, i) => famByName.set(n, i));
  for (const p of prodList) if (p.afam < 0 && famByName.has(p.app)) p.afam = famByName.get(p.app);

  const byFam = new Map();
  for (const p of prodList) {
    const k = p.afam >= 0 ? 'A' + p.afam : (p.fam >= 0 ? 'M' + p.fam : null);
    if (k === null) continue;
    if (!byFam.has(k)) byFam.set(k, []);
    byFam.get(k).push(p);
  }
  const families = [...byFam.values()]
    .filter(list => list.length > 1)
    .map(list => {
      const items = list.flatMap(p => p.rows);
      const vs = versionSummary(items);
      /* Риск здесь определяет НЕ наша арифметика над строками версий, а сам
         каталог: если записи легли на разные эталонные позиции, значит каталог
         считает их разными продуктами — это вопрос прав. Если позиция одна,
         а версии в инвентаре разные, то различие ниже уровня учета: вопрос
         обновлений, не лицензий. */
      const risk = list.length > 1 ? 'major' : 'patch';
      const main = list.slice().sort((x, y) => y.rows.length - x.rows.length)[0];
      const licRows = list.reduce((s2, p) => s2 + (LICENSABLE[p.lic] ? p.rows.length : 0), 0);
      return {
        source: 'catalog',
        lic: main.lic, licensable: licRows * 2 > items.length,
        apps: list.map(p => p.app),
        title: list.map(p => p.app).join(' · '),
        vendor: list[0].vendor,
        rows: items.length,
        forms: list.reduce((s, p) => s + p.forms.size, 0),
        versions: vs.versions, majors: vs.majors, risk
      };
    })
    .sort((a, b) => b.rows - a.rows);

  /* Одна эталонная позиция, но версии в инвентаре разные — парк не выровнен
     по обновлениям. Лицензионного вопроса нет, но это тоже находка. */
  const buildSpread = prodList
    .filter(p => { const k = p.afam >= 0 ? 'A' + p.afam : (p.fam >= 0 ? 'M' + p.fam : null);
                   return k === null || (byFam.get(k) || []).length === 1; })
    .map(p => {
      const vs = versionSummary(p.rows);
      return { source: 'catalog', apps: [p.app], title: p.app, vendor: p.vendor,
               lic: p.lic, licensable: !!LICENSABLE[p.lic],
               rows: p.rows.length, forms: p.forms.size,
               versions: vs.versions, majors: vs.majors, risk: 'patch' };
    })
    .filter(f => f.versions.length > 1)
    .sort((a, b) => b.versions.length - a.versions.length || b.rows - a.rows);

  /* --------------------------------------------------------------------
     ЛИЦЕНЗИОННЫЙ ВОПРОС.
     Здесь мы НИЧЕГО не утверждаем про соответствие: закупок мы не видим,
     тип договора не знаем. Мы показываем ровно то, что следует из каталога:
     на сколько разных эталонных позиций легли записи одного продукта, какая
     из них младшая, какая старшая, и сколько установок окажется «не той
     версии» в каждом из двух возможных случаев.
     -------------------------------------------------------------------- */
  /* --------------------------------------------------------------------
     ВИТРИНА: что получает запись после нормализации.
     Все атрибуты — несистемные поля справочника «Приложение». Ничего не
     достраиваем: где в каталоге пусто, там и показываем пусто.
     -------------------------------------------------------------------- */
  const dict = (arr, list, i) => (arr && list && arr[i] >= 0) ? list[arr[i]] : '';
  const showcase = [];
  {
    const seen = new Set();
    const scored = rows.filter(r => r.code <= 2).map(r => {
      const p = products.get(r.it.m.rec[2]);
      const ai = r.it.m.rec[2];
      const a = {
        raw: r.it,
        app: core.apps[ai],
        family: (core.famNames && core.appFam && core.appFam[ai] >= 0) ? core.famNames[core.appFam[ai]] : '',
        vendor: p ? p.vendor : '',
        country: dict(core.appCountry, core.countries, ai),
        version: appCatVer(core, ai),
        edition: (core.appRed && core.appRed[ai] && !/^unspecified$/i.test(core.appRed[ai])) ? core.appRed[ai] : '',
        lic: appLicense(core, ai),
        cat: dict(core.appCat, core.cats, ai),
        sub: dict(core.appSub, core.subs, ai),
        pkg: (core.appPkg && core.appPkg[ai]) || '',
        eol: (core.appEol && core.appEol[ai]) || ''
      };
      a.filled = ['family','vendor','country','version','edition','lic','cat','sub','pkg','eol']
        .reduce((s2, k) => s2 + (a[k] ? 1 : 0), 0);
      return a;
    });
    scored.sort((x, y) => y.filled - x.filled);
    for (const a of scored) {
      if (showcase.length >= 3) break;
      if (seen.has(a.app)) continue;
      seen.add(a.app); showcase.push(a);
    }
  }

  const licFamilies = [], licBlurred = [], freeFamilies = [];
  let licSkippedFree = 0, licSkippedFreeRows = 0;
  for (const list of byFam.values()) {
    if (list.length < 2) continue;
    const rowsTotal = list.reduce((s2, p) => s2 + p.rows.length, 0);
    const main = list.slice().sort((a, b) => b.rows.length - a.rows.length)[0];
    /* Лицензионным считаем семейство, если лицензируемые позиции держат
       большинство строк. Одной коммерческой позиции в хвосте недостаточно:
       иначе в список попадет бесплатный продукт из-за случайной привязки. */
    const licRows = list.reduce((s2, p) => s2 + (LICENSABLE[p.lic] ? p.rows.length : 0), 0);
    if (licRows * 2 <= rowsTotal) {
      licSkippedFree++; licSkippedFreeRows += rowsTotal;
      freeFamilies.push({ source: 'catalog', lic: main.lic, licensable: false,
        apps: list.map(p => p.app), title: main.app, vendor: main.vendor,
        rows: rowsTotal, versions: versionSummary(list.flatMap(p => p.rows)).versions });
      continue;
    }
    /* Имя семейства дает каталог; если его нет, подписываемся позицией. */
    const famName = (core.famNames && main.afam >= 0 && core.famNames[main.afam]) || main.app;
    const licMain = LICENSABLE[main.lic] ? main.lic
                  : (list.find(p => LICENSABLE[p.lic]) || main).lic;

    const dated = list.filter(p => catVerKey(p.catVer))
                      .sort((a, b) => catVerCmp(a.catVer, b.catVer));
    const undated = list.filter(p => !catVerKey(p.catVer));
    const undatedRows = undated.reduce((s2, p) => s2 + p.rows.length, 0);
    const pos = p => ({ app: p.app, ver: p.catVer, red: p.red, rows: p.rows.length, lic: p.lic });

    if (dated.length < 2) {
      /* Версию хотя бы двух позиций каталог не дает — вопрос поставить
         нельзя, и делать вид, что можно, мы не будем. */
      licBlurred.push({
        family: famName, vendor: main.vendor, rows: rowsTotal,
        positions: list.map(pos), undatedRows
      });
      continue;
    }
    const oldest = dated[0], newest = dated[dated.length - 1];
    const eds = [...new Set(list.map(p => p.red).filter(x => x && !/^unspecified$/i.test(x)))];
    licFamilies.push({
      family: famName, vendor: main.vendor, lic: licMain,
      positions: dated.map(pos),
      oldest: pos(oldest), newest: pos(newest),
      rows: rowsTotal,
      /* если лицензии куплены на МЛАДШУЮ версию — все, что новее ее,
         требует права на повышение */
      needUpgrade: rowsTotal - oldest.rows.length,
      /* если на СТАРШУЮ — все, что старее, требует права на понижение */
      needDowngrade: rowsTotal - newest.rows.length,
      undatedRows,
      editions: eds
    });
  }
  licFamilies.sort((a, b) => b.rows - a.rows);
  licBlurred.sort((a, b) => b.rows - a.rows);

  /* То же самое для записей, которых нет в ядре: опереться на каталог там нельзя,
     поэтому группируем по совпадению наименования И вендора — двойное условие,
     чтобы не повторить прежнюю ошибку со склейкой разных продуктов. */
  const heurMap = new Map();
  for (const g of analysis.groups) {
    for (const it of g.members) {
      if (it.noise) continue;
      if (it.m && (it.m.code <= 2 || it.m.code === 6)) continue;   // опознанные уже учтены
      if (it.junk && it.junk.length) continue;                      // битые строки не группируем
      /* Ключ берем СТРОГИЙ (tkey самой записи), а не ключ группы первого акта:
         там работает нечеткое слияние по токенам, и оно склеивает, например,
         «.NET Host» с «.NET Core Host». В блоке без опоры на каталог догадка
         поверх догадки недопустима. */
      const key = (it.tkey || it.key || '') + '\u0000' + (it.publisher || '').trim().toLowerCase();
      if (!heurMap.has(key)) heurMap.set(key, []);
      heurMap.get(key).push(it);
    }
  }
  /* Родовые наименования, под которыми в инвентаре живут десятки разных
     компонентов: группировать по ним нельзя — получится ровно та ложная
     склейка, ради которой этот блок и переписывался. */
  const GENERIC = /operating system|операционная система|shared framework|targeting pack|apphost|host pack|host fx|\bhost\b|resolver|\btemplates?\b|шаблон|\bframework\b|\bruntime\b|среда выполнения|language pack|языковой пакет|\bsdk\b|\bsetup\b|\bcomponents?\b|компонент|driver|драйвер|\binstall|updater|update|helper|\bbho\b|\bservice\b|служба|redistributable|crash[ -]?report|help viewer|user interface|dynamic link librar|\bdll\b|панель управления|control panel|\bplug[ -]?in\b|плагин|add[ -]?(?:in|on)\b|надстройк|\bshell extension|проигрыватель|\bviewer\b|\bmodule\b|модуль|библиотек|\blibrar(?:y|ies)\b/i;
  /* Строки, где кодировка уже потеряна безвозвратно («??????»), группировать
     бессмысленно: наименования там нет. */
  const LOSTENC = n => { const q = (String(n).match(/\?/g) || []).length; return q > 3 && q / String(n).length > 0.15; };
  const BUILDSTR = /@commit|built by|\+[0-9a-f]{8,}|[0-9a-f]{16,}/i;
  const heuristic = [];
  for (const items of heurMap.values()) {
    if (items.length < 2) continue;
    const toks = items[0].toks || [];
    if (toks.length < 2 && (items[0].key || '').length < 8) continue;   // слишком общее имя
    // фильтры применяем ко ВСЕЙ группе: достаточно одной родовой или битой
    // строки, чтобы группа перестала что-либо значить
    if (items.some(x => GENERIC.test(x.name) || LOSTENC(x.name))) continue;
    const vs = versionSummary(items);
    if (vs.versions.length < 2) continue;
    if (vs.risk !== 'major') continue;      // разнобой сборок у неопознанного продукта не действие
    /* Версии вида «17.14.40480+055814fcc2» или «6,0,2824,12007 @Commit: 34a1…» —
       это строки сборки из ресурса файла, а не версия продукта. Значит и
       наименование в такой группе взято оттуда же: продуктом это не является. */
    if (vs.versions.some(v => BUILDSTR.test(v.label))) continue;
    /* Заголовок — самая частая форма записи в группе, при равенстве самая
       короткая. Брать самую длинную нельзя: это часто редкий вариант, и
       группа подписывается именем меньшинства. */
    const freq = new Map();
    for (const x of items) { const n = x.name.trim(); freq.set(n, (freq.get(n) || 0) + 1); }
    const title = [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
    heuristic.push({
      source: 'heuristic', title, vendor: items[0].publisher || '',
      rows: items.length, forms: freq.size,
      versions: vs.versions, majors: vs.majors, risk: vs.risk
    });
  }
  heuristic.sort((a, b) => (b.risk === 'major') - (a.risk === 'major') || b.rows - a.rows);

  return {
    licensable, known, propagated, reasons: REASONS, rows, examples,
    products: prodList, spellings, families, buildSpread, heuristic,
    licFamilies, licBlurred, freeFamilies, licSkippedFree, licSkippedFreeRows, showcase,
    rate: licensable ? known / licensable : 0
  };
}

