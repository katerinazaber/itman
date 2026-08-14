(function () {
  const SECTORS = 6;
  const SLICE = 360 / SECTORS;

  const PRIZES = [
    {
      id: "po",
      short: "ПО",
      sub: "Бонус на ПО",
      amount: "20 000 ₽",
      desc: "на ПО и ИТ-решения",
      partner: "Softline",
      note: "Бонус можно использовать при следующей покупке ПО и ИТ-решений у партнёра.",
      codePrefix: "ITMAN-SL",
      bg: "#e30613",
      darkText: false,
      big: true,
    },
    {
      id: "cloud",
      short: "ОБЛАКО",
      sub: "Облачные сервисы",
      amount: "15 000 ₽",
      desc: "на облачные сервисы",
      partner: "Softline",
      note: "Сертификат действует на первый месяц или пилот облачного сегмента.",
      codePrefix: "ITMAN-CL",
      bg: "#2f333d",
      darkText: false,
    },
    {
      id: "edu",
      short: "ОБУЧЕНИЕ",
      sub: "Сертификат",
      amount: "−20%",
      desc: "на курс Академии АйТи",
      partner: "Академия АйТи",
      note: "Скидка на корпоративное обучение по ITIL, SAM, AD, SCCM и другим направлениям.",
      codePrefix: "ITMAN-ED",
      bg: "#f2f2f2",
      darkText: true,
    },
    {
      id: "ib",
      short: "ИБ",
      sub: "Информационная безопасность",
      amount: "Консультация",
      desc: "экспресс-аудит ИБ",
      partner: "Softline",
      note: "1-часовая консультация и чек-лист рисков для вашей инфраструктуры.",
      codePrefix: "ITMAN-IB",
      bg: "#252830",
      darkText: false,
    },
    {
      id: "infra",
      short: "ИНФРАСТРУКТУРА",
      sub: "ИТ-инфраструктура",
      amount: "−10%",
      desc: "на технику Inferit",
      partner: "Inferit",
      note: "Скидка на парк ПК и серверов Inferit при bundle с решениями ИТМен.",
      codePrefix: "ITMAN-HW",
      bg: "#3a3f4a",
      darkText: false,
    },
    {
      id: "itman",
      short: "ITMAN",
      sub: "Подарок от ITMAN",
      amount: "−15%",
      desc: "на первый год ТП",
      partner: "Инферит ИТМен",
      note: "Сертификат на техподдержку при заключении контракта после пилота.",
      codePrefix: "ITMAN-IM",
      bg: "#ffffff",
      darkText: true,
      big: true,
    },
  ];

  const root = document.querySelector(".itman-bonus");
  if (!root) return;

  const wheel = document.getElementById("bonusWheel");
  const bear = document.getElementById("bonusBear");
  const spinBtn = document.getElementById("bonusSpinBtn");
  const introPanel = document.getElementById("bonusIntroPanel");
  const winPanel = document.getElementById("bonusWinPanel");
  const certView = document.getElementById("bonusCertView");
  const wheelWrap = document.querySelector(".itman-bonus__wheel-wrap");
  const bubble = document.getElementById("bonusBubble");

  let spinning = false;
  let currentPrize = null;
  let currentCode = "";

  function randCode(prefix) {
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function buildWheel() {
    PRIZES.forEach((prize, i) => {
      const seg = document.createElement("div");
      seg.className = "itman-bonus__segment";
      seg.style.background = prize.bg;
      seg.style.transform = `rotate(${i * SLICE}deg)`;
      seg.dataset.index = String(i);

      const label = document.createElement("div");
      label.className = "itman-bonus__segment-label" + (prize.darkText ? " is-dark" : "");
      label.style.transform = `translateX(-50%) rotate(30deg)`;
      label.innerHTML = `${prize.short}<small>${prize.sub}</small>`;
      seg.appendChild(label);
      wheel.appendChild(seg);
    });

    const ticks = document.querySelector(".itman-bonus__wheel-ticks");
    for (let i = 1; i <= SECTORS; i++) {
      const t = document.createElement("span");
      t.textContent = String(i).padStart(2, "0");
      t.style.transform = `rotate(${(i - 0.5) * SLICE - 90}deg) translate(0, -248px)`;
      ticks.appendChild(t);
    }
  }

  function pickPrizeIndex() {
    const weights = PRIZES.map((p) => (p.big ? 0.8 : 1));
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < PRIZES.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return 0;
  }

  function spinToIndex(index) {
    const extra = 5 + Math.floor(Math.random() * 3);
    const center = index * SLICE + SLICE / 2;
    const target = extra * 360 + (360 - center);
    wheel.classList.remove("is-idle");
    wheel.style.transform = `rotate(${target}deg)`;
    return target;
  }

  function showWin(prize) {
    currentPrize = prize;
    currentCode = randCode(prize.codePrefix);

    introPanel.hidden = true;
    winPanel.hidden = false;

    document.getElementById("winTitle").textContent = "Поздравляем!";
    document.getElementById("winAmount").textContent = prize.amount;
    document.getElementById("winDesc").textContent = prize.desc;
    document.getElementById("winPartner").textContent = `Партнёр: ${prize.partner}`;
    document.getElementById("winNote").textContent = prize.note;

    wheelWrap.classList.add("is-highlight");
    wheel.querySelectorAll(".itman-bonus__segment").forEach((s, i) => {
      s.classList.toggle("is-winner", i === PRIZES.indexOf(prize));
    });

    bear.classList.remove("is-spinning");
    bear.classList.add("is-win");
    bubble.hidden = false;
    bubble.textContent = prize.big ? "О, отличный бонус! 🐻" : "Кажется, вам повезло! 🐻";
  }

  function showCertificate() {
    winPanel.hidden = true;
    certView.hidden = false;
    bubble.hidden = true;

    document.getElementById("certAmount").textContent = currentPrize.amount;
    document.getElementById("certDesc").textContent = currentPrize.desc;
    document.getElementById("certPartner").textContent = currentPrize.partner.toUpperCase();
    document.getElementById("certCode").textContent = currentCode;
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "itman-bonus__toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  spinBtn?.addEventListener("click", () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    bear.classList.add("is-spinning");
    bubble.hidden = true;

    const idx = pickPrizeIndex();
    spinToIndex(idx);

    wheel.addEventListener(
      "transitionend",
      () => {
        spinning = false;
        showWin(PRIZES[idx]);
      },
      { once: true }
    );
  });

  document.getElementById("bonusClaimBtn")?.addEventListener("click", showCertificate);

  document.getElementById("copyCodeBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      toast("Промокод скопирован");
    } catch {
      toast("Не удалось скопировать — выделите код вручную");
    }
  });

  document.getElementById("certEmailForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("certEmail")?.value?.trim();
    if (!email) return;
    toast("Сертификат отправим на " + email);
    document.getElementById("certEmailForm").hidden = true;
  });

  document.getElementById("bonusBackBtn")?.addEventListener("click", () => {
    certView.hidden = true;
    winPanel.hidden = false;
  });

  buildWheel();
})();
