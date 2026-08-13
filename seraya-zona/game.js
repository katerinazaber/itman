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
  const hero = $(".hero");
  hero.classList.remove("cheer");
  void hero.offsetWidth;
  hero.classList.add("cheer");
}

function openPopup(item) {
  $("#popTitle").textContent = item.title;
  $("#popSit").textContent = item.sit;
  $("#popup").hidden = false;
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
  if (hs) hs.classList.add("found");
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
  speak("Смотри, куда я показываю. Там ещё дыра в учёте.");
}

function start() {
  $("#intro").hidden = true;
  $("#how").hidden = true;
  $(".hero").classList.remove("enter");
  speak("Кликай по тому, чего нет в Excel. Пять серых зон на этой площадке.");
}

function bind() {
  setProgress();
  document.querySelectorAll(".hotspot").forEach((btn) => {
    btn.addEventListener("click", () => onFind(btn.dataset.item));
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
  });
  $("#btnReplay").addEventListener("click", () => location.reload());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind);
} else {
  bind();
}
