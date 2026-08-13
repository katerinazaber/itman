const ITEMS = [
  {
    id: "laptop",
    label: "Ноут",
    title: "Ноут «списан»",
    sit: "В Excel он уже год как списан. Бухгалтер закрывает на нём месяц. ИТМен сверяет агент и AD — дубль закрывается.",
  },
  {
    id: "monitor",
    label: "Монитор",
    title: "Второй монитор без номера",
    sit: "Стоит на тумбе, инвентарника нет. В CMDB — дыра. Дискаверинг подхватывает комплектующие, не только системный блок.",
  },
  {
    id: "box",
    label: "Ящик",
    title: "Коробка с «серым» железом",
    sit: "Привезли «на всякий случай», в учёт не поставили. Серая зона: устройство есть в комнате и нет в базе.",
  },
  {
    id: "radio",
    label: "IoT",
    title: "Устройство мимо антивируса",
    sit: "Радиоточка / IoT в углу. Антивирус его не видит, AD — тоже. Нужен сбор из сети, не только из каталога.",
  },
  {
    id: "ap",
    label: "Точка",
    title: "Точка доступа вне AD",
    sit: "Раздаёт Wi‑Fi, в домене её нет. ИТМен подключает SNMP и сеть — «тёмная» зона загорается.",
  },
];

const found = new Set();
const $ = (s, r = document) => r.querySelector(s);

const actor = {
  x: 1.14,
  y: 0.84,
  tx: 0.58,
  ty: 0.82,
  homeX: 0.58,
  homeY: 0.82,
  hovering: false,
  playing: false,
};

let lastHover = "";

function overlayUp() {
  return !!document.querySelector(".overlay:not([hidden])");
}

function floorY(ny) {
  return Math.max(0.64, Math.min(0.84, ny));
}

const STAND = {
  laptop: [0.4, 0.82],
  monitor: [0.44, 0.8],
  box: [0.34, 0.84],
  radio: [0.32, 0.82],
  ap: [0.7, 0.8],
};

function goToHotspot(btn) {
  const [x, y] = STAND[btn.dataset.item] || [actor.homeX, actor.homeY];
  actor.tx = x;
  actor.ty = y;
}

function setProgress() {
  const n = found.size;
  $(".bar span").style.width = `${(n / 5) * 100}%`;
  $("#count").textContent = `${n}/5`;
  $("#g3").classList.toggle("on", n >= 3);
  $("#g5").classList.toggle("on", n >= 5);
  ITEMS.forEach((it) => {
    const chip = document.querySelector(`[data-chip="${it.id}"]`);
    if (chip) chip.classList.toggle("done", found.has(it.id));
  });
}

function speak(text) {
  $("#bubbleText").innerHTML = text;
}

function cheer() {
  const body = $("#heroBody");
  body.classList.remove("cheer");
  void body.offsetWidth;
  body.classList.add("cheer");
  body.addEventListener("animationend", () => body.classList.remove("cheer"), { once: true });
}

function openPopup(item) {
  $("#popTitle").textContent = item.title;
  $("#popSit").textContent = item.sit;
  $("#popup").hidden = false;
  $("#paw").classList.remove("on");
}

function closePopup() {
  $("#popup").hidden = true;
  if (found.size === 3 && !window._gift3) {
    window._gift3 = true;
    speak("Три из пяти. Это уже не Excel. Держи чек-лист: где искать серые зоны.");
  }
  if (found.size === 5) {
    $("#done").hidden = false;
    speak("Полная картина. 5 неучтённых активов на одной площадке. Так и работает дискаверинг.");
  }
}

function onFind(id) {
  if (found.has(id)) return;
  found.add(id);
  const hs = document.querySelector(`[data-item="${id}"]`);
  if (hs) {
    hs.classList.add("found");
    goToHotspot(hs);
  }
  setProgress();
  cheer();
  const item = ITEMS.find((x) => x.id === id);
  speak(`Нашёл: <strong>${item.title}</strong>`);
  openPopup(item);
}

function hint() {
  const left = ITEMS.filter((x) => !found.has(x.id));
  if (!left.length) return;
  const it = left[0];
  const hs = document.querySelector(`[data-item="${it.id}"]`);
  hs.classList.remove("hint");
  void hs.offsetWidth;
  hs.classList.add("hint");
  goToHotspot(hs);
  $("#hero").classList.add("reach");
  speak("Смотри, куда я показываю. Там ещё дыра в учёте.");
}

function start() {
  $("#intro").hidden = true;
  $("#how").hidden = true;
  actor.playing = true;
  actor.x = 1.14;
  actor.y = 0.84;
  actor.tx = actor.homeX;
  actor.ty = actor.homeY;
  $("#game").classList.add("playing");
  speak("Кликай по тому, чего нет в Excel. Пять серых зон на этой площадке.");
}

function tick() {
  const dx = actor.tx - actor.x;
  const dy = actor.ty - actor.y;
  const speed = actor.hovering ? 0.12 : 0.075;
  actor.x += dx * speed;
  actor.y += dy * speed;
  const moving = Math.hypot(dx, dy) > 0.016;

  const hero = $("#hero");
  const body = $("#heroBody");
  hero.classList.toggle("on", actor.playing);
  hero.classList.toggle("walk", actor.playing && moving && !body.classList.contains("cheer"));

  const depth = (actor.y - 0.62) / 0.24;
  const scale = 0.68 + Math.max(0, Math.min(1, depth)) * 0.4;
  hero.style.left = `${actor.x * 100}%`;
  hero.style.top = `${actor.y * 100}%`;
  hero.style.transform = `translate(-42%, -100%) scale(${scale})`;

  const bubble = $("#bubble");
  bubble.classList.toggle("on", actor.playing);
  const flip = actor.x < 0.4;
  bubble.classList.toggle("flip", flip);
  bubble.style.left = `${actor.x * 100}%`;
  bubble.style.top = `${actor.y * 100}%`;
  bubble.style.transform = flip
    ? "translate(12px, calc(-100% - 16px))"
    : "translate(calc(-100% - 10px), calc(-100% - 16px))";

  requestAnimationFrame(tick);
}

function bind() {
  setProgress();
  tick();

  document.querySelectorAll(".hotspot").forEach((btn) => {
    btn.addEventListener("click", () => onFind(btn.dataset.item));
    btn.addEventListener("pointerenter", () => {
      if (!actor.playing || found.has(btn.dataset.item) || overlayUp()) return;
      actor.hovering = true;
      $("#paw").classList.add("on");
      $("#hero").classList.add("reach");
      goToHotspot(btn);
      if (lastHover !== btn.dataset.item) {
        lastHover = btn.dataset.item;
        speak("Тут что-то есть. Давай проверим учёт.");
      }
    });
    btn.addEventListener("pointerleave", () => {
      actor.hovering = false;
      $("#paw").classList.remove("on");
      $("#hero").classList.remove("reach");
    });
  });

  document.addEventListener("pointermove", (e) => {
    $("#paw").style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (!actor.playing || actor.hovering || overlayUp()) return;
    const r = $("#game").getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width;
    const my = (e.clientY - r.top) / r.height;
    actor.tx = Math.max(0.28, Math.min(0.78, mx + 0.06));
    actor.ty = floorY(0.8 + (my - 0.6) * 0.08);
  });

  $("#btnStart").addEventListener("click", () => {
    $("#intro").hidden = true;
    $("#how").hidden = false;
  });
  $("#btnPlay").addEventListener("click", start);
  $("#btnOk").addEventListener("click", closePopup);
  $("#btnHint").addEventListener("click", hint);
  $("#btnHow").addEventListener("click", () => {
    $("#how").hidden = false;
    $("#paw").classList.remove("on");
  });
  $("#btnReplay").addEventListener("click", () => location.reload());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind);
} else {
  bind();
}
