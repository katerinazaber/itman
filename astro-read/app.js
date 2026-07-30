/* МояКарта — prototype
 * Calc: Astronomy Engine (MIT) https://github.com/cosinekitty/astronomy
 * Funnel: input → preview → paid full report
 */

const SIGNS = [
  "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
  "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
];

const SIGN_META = {
  "Овен": { element: "огонь", mode: "кардинальный", vibe: "прямой импульс и старт" },
  "Телец": { element: "земля", mode: "фиксированный", vibe: "опора, тело, ценность" },
  "Близнецы": { element: "воздух", mode: "мутабельный", vibe: "связность и любопытство" },
  "Рак": { element: "вода", mode: "кардинальный", vibe: "забота и внутренний дом" },
  "Лев": { element: "огонь", mode: "фиксированный", vibe: "выражение и тепло" },
  "Дева": { element: "земля", mode: "мутабельный", vibe: "точность и улучшение" },
  "Весы": { element: "воздух", mode: "кардинальный", vibe: "диалог и баланс" },
  "Скорпион": { element: "вода", mode: "фиксированный", vibe: "глубина и трансформация" },
  "Стрелец": { element: "огонь", mode: "мутабельный", vibe: "смысл и расширение" },
  "Козерог": { element: "земля", mode: "кардинальный", vibe: "структура и зрелость" },
  "Водолей": { element: "воздух", mode: "фиксированный", vibe: "идея и свобода взгляда" },
  "Рыбы": { element: "вода", mode: "мутабельный", vibe: "чувство и растворение границ" }
};

const CITIES = [
  { name: "Москва", lat: 55.7558, lon: 37.6173, tz: 3 },
  { name: "Санкт-Петербург", lat: 59.9311, lon: 30.3609, tz: 3 },
  { name: "Новосибирск", lat: 55.0084, lon: 82.9357, tz: 7 },
  { name: "Екатеринбург", lat: 56.8389, lon: 60.6057, tz: 5 },
  { name: "Казань", lat: 55.7961, lon: 49.1064, tz: 3 },
  { name: "Нижний Новгород", lat: 56.2965, lon: 43.9361, tz: 3 },
  { name: "Самара", lat: 53.1959, lon: 50.1002, tz: 4 },
  { name: "Краснодар", lat: 45.0355, lon: 38.9753, tz: 3 },
  { name: "Владивосток", lat: 43.1155, lon: 131.8855, tz: 10 },
  { name: "Минск", lat: 53.9006, lon: 27.5590, tz: 3 },
  { name: "Алматы", lat: 43.2220, lon: 76.8512, tz: 5 },
  { name: "Тбилиси", lat: 41.7151, lon: 44.8271, tz: 4 },
  { name: "Ереван", lat: 40.1792, lon: 44.4991, tz: 4 },
  { name: "Киев", lat: 50.4501, lon: 30.5234, tz: 2 },
  { name: "Берлин", lat: 52.5200, lon: 13.4050, tz: 1 },
  { name: "Лондон", lat: 51.5074, lon: -0.1278, tz: 0 },
  { name: "Нью-Йорк", lat: 40.7128, lon: -74.0060, tz: -5 }
];

const FOCUS_LABEL = {
  self: "Самопознание",
  love: "Отношения",
  money: "Деньги",
  work: "Работа"
};

const state = {
  chart: null,
  profile: null,
  elapsedMs: 0
};

function degNorm(d) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

function longitudeToSign(lon) {
  const L = degNorm(lon);
  const idx = Math.floor(L / 30);
  const deg = L - idx * 30;
  return {
    sign: SIGNS[idx],
    degree: deg,
    lon: L,
    label: `${SIGNS[idx]} ${deg.toFixed(1)}°`
  };
}

function bodyLongitude(bodyName, time) {
  const body = Astronomy.Body[bodyName];
  return Astronomy.EclipticLongitude(body, time);
}

function obliquity(time) {
  if (typeof Astronomy.e_tilt === "function") {
    return Astronomy.e_tilt(time).tobl;
  }
  const T = time.tt / 36525;
  return 23.439291 - 0.0130042 * T;
}

function calculateAscendant(time, lat, lon) {
  const gst = Astronomy.SiderealTime(time); // Greenwich sidereal hours
  const lst = degNorm((gst + lon / 15) * 15) * Math.PI / 180;
  const eps = obliquity(time) * Math.PI / 180;
  const latR = lat * Math.PI / 180;
  const y = Math.cos(lst);
  const x = -(Math.sin(lst) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps));
  return degNorm(Math.atan2(y, x) * 180 / Math.PI);
}

function calculateChart({ date, time, lat, lon, tz }) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Convert local civil time → UTC approx using fixed city offset (prototype)
  const utcMs = Date.UTC(y, m - 1, d, hh - tz, mm, 0);
  const birth = new Date(utcMs);
  const astroTime = Astronomy.MakeTime(birth);

  const bodies = [
    ["Sun", "Солнце"],
    ["Moon", "Луна"],
    ["Mercury", "Меркурий"],
    ["Venus", "Венера"],
    ["Mars", "Марс"],
    ["Jupiter", "Юпитер"],
    ["Saturn", "Сатурн"]
  ];

  const placements = {};
  for (const [key, title] of bodies) {
    const lonEcl = bodyLongitude(key, astroTime);
    placements[key] = { title, ...longitudeToSign(lonEcl) };
  }

  const ascLon = calculateAscendant(astroTime, lat, lon);
  placements.Asc = { title: "Асцендент", ...longitudeToSign(ascLon) };

  const elements = { огонь: 0, земля: 0, воздух: 0, вода: 0 };
  for (const key of ["Sun", "Moon", "Mercury", "Venus", "Mars", "Asc"]) {
    const el = SIGN_META[placements[key].sign].element;
    elements[el] += 1;
  }
  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];

  return {
    birth,
    placements,
    elements,
    dominantElement
  };
}

function buildPreviewCopy(name, chart, focus) {
  const sun = chart.placements.Sun;
  const moon = chart.placements.Moon;
  const asc = chart.placements.Asc;
  const sunM = SIGN_META[sun.sign];
  const moonM = SIGN_META[moon.sign];
  const ascM = SIGN_META[asc.sign];

  const focusLine = {
    self: `Сейчас тебе полезнее не «искать себя», а замечать, где ${sunM.vibe} уже работает — и где Луна просит паузу.`,
    love: `В отношениях карта подсвечивает диалог между «я хочу» (${sun.sign}) и «я чувствую» (${moon.sign}). Асцендент в ${asc.sign} задаёт, как тебя считывают с порога.`,
    money: `Деньги для тебя — не только цифра. Солнце в ${sun.sign} тянет к росту через ${sunM.vibe}, а Луна в ${moon.sign} показывает, где ты реально чувствуешь безопасность.`,
    work: `В работе сильный ход — опереться на ${ascM.vibe} (Асцендент) и не спорить с ритмом Луны в ${moon.sign}.`
  }[focus];

  const title = `${name}, вот твой каркас личности`;
  const body =
    `Солнце в ${sun.sign} даёт ядро: ${sunM.vibe}. ` +
    `Луна в ${moon.sign} — эмоциональный фон: ${moonM.vibe}. ` +
    `Асцендент в ${asc.sign} — как ты входишь в мир: ${ascM.vibe}. ` +
    focusLine;

  const bullets = [
    `Доминирующая стихия в превью: ${chart.dominantElement}`,
    `Сильная связка: ${sun.sign} + ${moon.sign}`,
    `Точка первого впечатления: Асцендент ${asc.label}`
  ];

  return { title, body, bullets };
}

function buildFullReport(name, chart, focus) {
  const { Sun: sun, Moon: moon, Asc: asc, Venus: venus, Mars: mars, Saturn: saturn } = chart.placements;
  return [
    {
      h: "1. Психологический каркас",
      p: `${name}, твоя базовая формула — Солнце в ${sun.sign}, Луна в ${moon.sign}, Асцендент в ${asc.sign}. Это не «гороскоп на всех», а связка воли, потребности и манеры проявляться. В полном продукте сюда ляжет твоя редактура тона: тепло, без фатализма, с опорой на действие.`
    },
    {
      h: "2. Отношения",
      p: `Венера в ${venus.sign} показывает, что ты ценишь в близости, Марс в ${mars.sign} — как берёшь и отстаиваешь. Фокус «${FOCUS_LABEL[focus]}» усиливает этот блок в AI-рамке: сначала потребность, потом стратегия, потом один мягкий эксперимент на неделю.`
    },
    {
      h: "3. Деньги и реализация",
      p: `Сатурн в ${saturn.sign} задаёт зону взросления и дисциплины. В отчёте мы связываем её с Солнцем (${sun.sign}): где рост ощущается живым, а где только «надо». Три шага ниже — черновик рамки качества, которую ты потом зафиксируешь в промпте.`
    },
    {
      h: "4. Три шага на ближайший месяц",
      p: `1) Каждый день 5 минут: отметить, где проявилось Солнце (${sun.sign}). 2) Один раз в неделю — забота по Луне (${moon.sign}) без продуктивности. 3) В новой ситуации сознательно включить стиль Асцендента (${asc.sign}) — и посмотреть, что изменится в отклике людей.`
    },
    {
      h: "5. Рамка качества (твоя)",
      p: `Запреты демо-рамки: не пугать, не предсказывать болезни/смерть, не обещать судьбу. Структура ответа: энергия → напряжение → действие. Тон: ясный, психологический, без эзотерического пафоса. На проде сюда подключается LLM с твоими эталонными разборами.`
    }
  ];
}

function drawWheel(chart) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 108;
  const rInner = 70;
  const colors = {
    Sun: "#f0a060",
    Moon: "#9ec9c4",
    Asc: "#f4f7f8",
    Mercury: "#d7c38a",
    Venus: "#e2a0b0",
    Mars: "#e07a5f",
    Jupiter: "#c4b5fd",
    Saturn: "#a8b2c1"
  };

  let signs = "";
  for (let i = 0; i < 12; i++) {
    const a0 = ((i * 30 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * 30 - 90) * Math.PI) / 180;
    const x0 = cx + rOuter * Math.cos(a0);
    const y0 = cy + rOuter * Math.sin(a0);
    const x1 = cx + rOuter * Math.cos(a1);
    const y1 = cy + rOuter * Math.sin(a1);
    signs += `<line x1="${cx}" y1="${cy}" x2="${x0}" y2="${y0}" stroke="rgba(255,255,255,.12)" />`;
    const am = ((i * 30 + 15 - 90) * Math.PI) / 180;
    const tx = cx + (rOuter - 14) * Math.cos(am);
    const ty = cy + (rOuter - 14) * Math.sin(am);
    signs += `<text x="${tx}" y="${ty}" fill="rgba(255,255,255,.55)" font-size="8" text-anchor="middle" dominant-baseline="middle">${SIGNS[i].slice(0, 3)}</text>`;
    void x1; void y1;
  }

  let planets = "";
  for (const key of ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Asc"]) {
    const p = chart.placements[key];
    const ang = ((p.lon - 90) * Math.PI) / 180;
    const rr = key === "Asc" ? rInner - 8 : rInner + 8;
    const x = cx + rr * Math.cos(ang);
    const y = cy + rr * Math.sin(ang);
    planets += `<circle cx="${x}" cy="${y}" r="${key === "Sun" ? 5.5 : 4}" fill="${colors[key]}" />`;
    planets += `<text x="${x}" y="${y - 8}" fill="rgba(255,255,255,.75)" font-size="7" text-anchor="middle">${p.title[0]}</text>`;
  }

  return `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="rgba(255,255,255,.25)" />
      <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="rgba(255,255,255,.2)" />
      ${signs}
      ${planets}
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="#f8fafb" />
    </svg>
  `;
}

function fillCities() {
  const select = document.getElementById("city");
  select.innerHTML = CITIES.map((c, i) =>
    `<option value="${i}" ${c.name === "Москва" ? "selected" : ""}>${c.name}</option>`
  ).join("");
}

function show(el) {
  el.hidden = false;
  el.classList.remove("is-hidden");
}

function hide(el) {
  el.hidden = true;
  el.classList.add("is-hidden");
}

function renderPreview(name, chart, focus, elapsedMs) {
  const copy = buildPreviewCopy(name, chart, focus);
  document.getElementById("chart-svg").innerHTML = drawWheel(chart);
  document.getElementById("status-time").textContent = `за ${(elapsedMs / 1000).toFixed(1)} сек`;
  document.getElementById("process-meta").textContent =
    `Карта рассчитана · показан фрагмент отчёта · ${FOCUS_LABEL[focus]}`;
  document.getElementById("focus-tag").textContent = FOCUS_LABEL[focus];
  document.getElementById("preview-title").textContent = copy.title;
  document.getElementById("preview-body").textContent = copy.body;
  document.getElementById("preview-bullets").innerHTML = copy.bullets.map((b) => `<li>${b}</li>`).join("");

  const triad = document.getElementById("triad");
  const items = [
    ["Солнце", chart.placements.Sun],
    ["Луна", chart.placements.Moon],
    ["Асцендент", chart.placements.Asc]
  ];
  triad.innerHTML = items.map(([label, p]) => `
    <div class="triad-card">
      <span>${label}</span>
      <strong>${p.sign}</strong>
      <small>${p.degree.toFixed(1)}°</small>
    </div>
  `).join("");

  const stats = document.getElementById("stats");
  const el = chart.elements;
  stats.innerHTML = `
    <div class="stat"><strong>${chart.dominantElement}</strong><span>доминанта стихий</span></div>
    <div class="stat"><strong>20%</strong><span>открыто в превью</span></div>
    <div class="stat"><strong>${el["огонь"]}/${el["земля"]}</strong><span>огонь / земля</span></div>
    <div class="stat"><strong>${el["воздух"]}/${el["вода"]}</strong><span>воздух / вода</span></div>
  `;
}

function renderFullReport(name, chart, focus) {
  const blocks = buildFullReport(name, chart, focus);
  document.getElementById("report-meta").textContent =
    `${name} · ${chart.placements.Sun.sign} / ${chart.placements.Moon.sign} / ${chart.placements.Asc.sign}`;
  document.getElementById("full-report").innerHTML = blocks.map((b) => `
    <section class="report-block">
      <h3>${b.h}</h3>
      <p>${b.p}</p>
    </section>
  `).join("");
}

function unlockReport() {
  const name = document.getElementById("name").value.trim() || "Друг";
  const focus = document.getElementById("focus").value;
  renderFullReport(name, state.chart, focus);
  hide(document.getElementById("step3"));
  show(document.getElementById("report"));
  document.getElementById("report").scrollIntoView({ behavior: "smooth", block: "start" });
}

function init() {
  if (typeof Astronomy === "undefined") {
    console.error("Astronomy Engine failed to load");
    alert("Не удалось загрузить библиотеку расчёта. Проверь vendor/astronomy.browser.min.js");
    return;
  }

  fillCities();

  const form = document.getElementById("birth-form");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim() || "Друг";
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const city = CITIES[Number(document.getElementById("city").value)];
    const focus = document.getElementById("focus").value;

    show(step2);
    step2.classList.add("processing");
    document.getElementById("status-text").textContent = "Считаем карту…";
    document.getElementById("preview-body").textContent = "Модель собирает превью…";
    step2.scrollIntoView({ behavior: "smooth", block: "start" });

    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

    try {
      const chart = calculateChart({
        date,
        time,
        lat: city.lat,
        lon: city.lon,
        tz: city.tz
      });
      state.chart = chart;
      state.elapsedMs = performance.now() - t0;
      state.profile = { name, focus, city: city.name };

      renderPreview(name, chart, focus, state.elapsedMs);
      document.getElementById("status-text").textContent = "Обработка завершена";
      step2.classList.remove("processing");
      show(step3);
    } catch (err) {
      console.error(err);
      document.getElementById("status-text").textContent = "Ошибка расчёта";
      document.getElementById("preview-body").textContent =
        "Не удалось посчитать карту. Попробуй другое время или город.";
    }
  });

  document.getElementById("pay-form").addEventListener("submit", (e) => {
    e.preventDefault();
    unlockReport();
  });

  document.getElementById("demo-pay").addEventListener("click", unlockReport);

  document.getElementById("print-report").addEventListener("click", () => window.print());

  document.getElementById("reset").addEventListener("click", () => {
    hide(document.getElementById("step2"));
    hide(document.getElementById("step3"));
    hide(document.getElementById("report"));
    document.getElementById("demo").scrollIntoView({ behavior: "smooth" });
  });
}

document.addEventListener("DOMContentLoaded", init);
