/* ROI embed for itman.ru homepage preview — ITMen-styled structure from mock */

(function () {
  const PCT_LICENSES = 0.1;
  const PCT_ASSETS = 0.05;
  const PCT_IT = 0.01;
  const ASSET_COST_PER_ENDPOINT_PER_YEAR = 3000;
  const AVG_IT_SALARY_PER_MONTH = 200000;
  const ITMEN_12_PRICING = [
    { max: 5000, perEndpoint: 1050 },
    { max: 25000, perEndpoint: 950 },
    { max: 50000, perEndpoint: 850 },
  ];

  const root = document.querySelector(".itman-roi");
  if (!root) return;

  let step = 1; // 1..3 filling visual progress, 4 = result form

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }
  function smoothstep(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }
  function getItmenPerEndpointPrice(endpoints) {
    const n = Math.max(0, Number(endpoints || 0));
    for (const tier of ITMEN_12_PRICING) {
      if (n <= tier.max) return tier.perEndpoint;
    }
    return ITMEN_12_PRICING[ITMEN_12_PRICING.length - 1].perEndpoint;
  }
  function parseBudget(raw) {
    const n = Number(String(raw || "").replace(/\D/g, ""));
    return isFinite(n) ? n : 0;
  }
  function fmtRubShort(n) {
    if (!isFinite(n)) return "—";
    if (n >= 1_000_000) {
      return (Math.round((n / 1_000_000) * 10) / 10).toString().replace(".", ",") + " млн ₽";
    }
    if (n >= 1_000) return Math.round(n / 1_000) + " тыс. ₽";
    return Math.round(n) + " ₽";
  }
  function fmtNum(n, digits = 1) {
    if (!isFinite(n)) return "—";
    return (Math.round(n * 10 ** digits) / 10 ** digits).toString().replace(".", ",");
  }

  function getInputs() {
    return {
      endpoints: Number(document.getElementById("roiWp")?.value || 0),
      itStaff: Number(document.getElementById("roiIt")?.value || 0),
      currentLicenses: parseBudget(document.getElementById("roiBudget")?.value),
    };
  }

  function calculate() {
    const { endpoints, itStaff, currentLicenses } = getInputs();
    const savingsLicensesBase = currentLicenses * PCT_LICENSES;
    const assetsCurrent = Math.max(0, endpoints) * ASSET_COST_PER_ENDPOINT_PER_YEAR;
    const savingsAssetsBase = assetsCurrent * PCT_ASSETS;
    const itPayrollBase = Math.max(0, itStaff) * AVG_IT_SALARY_PER_MONTH * 12;
    const savingsItBase = itPayrollBase * PCT_IT;
    const savingsBase = savingsLicensesBase + savingsAssetsBase + savingsItBase;
    const itmenCost = Math.max(0, endpoints) * getItmenPerEndpointPrice(endpoints);

    let roi = NaN;
    let paybackYears = NaN;
    let savingsTotal = 0;

    if (itmenCost > 0) {
      const ratio = savingsBase / itmenCost;
      const ratioScore = clamp01((ratio - 0.3) / (2.5 - 0.3));
      const scaleScore = clamp01(Math.log10(Math.max(1, endpoints)) / 4);
      const orgScore = clamp01(Math.log10(Math.max(1, itStaff)) / 4);
      const score = 0.55 * ratioScore + 0.25 * scaleScore + 0.2 * orgScore;
      roi = 30 + 120 * smoothstep(score);
      savingsTotal = itmenCost * (1 + roi / 100);
      paybackYears = itmenCost / savingsTotal;
    }

    return { savingsTotal, roi, paybackYears };
  }

  function updateStepper() {
    root.querySelectorAll("[data-step-dot]").forEach((d) => {
      const s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === step);
      d.classList.toggle("is-done", s < step);
    });
  }

  function refreshPreview() {
    const r = calculate();
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("roiOutSave", fmtRubShort(r.savingsTotal));
    set("roiOutRoi", isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : "—");
    set("roiOutPay", isFinite(r.paybackYears) ? fmtNum(r.paybackYears, 1) + " года" : "—");

    const note = document.getElementById("roiPreviewNote");
    if (!note) return;
    if (step >= 4) {
      note.textContent = "Персональный расчёт готов — оставьте email, чтобы получить детальный отчёт";
    } else {
      const left = Math.max(1, 4 - step);
      note.textContent =
        "Заполните ещё " +
        left +
        (left === 1 ? " шаг" : " шага") +
        ", чтобы получить персональный расчёт с детализацией";
    }
  }

  function showForm() {
    step = 1;
    root.querySelector('[data-panel="form"]').hidden = false;
    root.querySelector('[data-panel="result"]').hidden = true;
    updateStepper();
    refreshPreview();
  }

  function showResult() {
    step = 4;
    root.querySelector('[data-panel="form"]').hidden = true;
    root.querySelector('[data-panel="result"]').hidden = false;
    updateStepper();
    refreshPreview();
  }

  function formatBudgetInput(el) {
    const digits = String(el.value || "").replace(/\D/g, "");
    el.value = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  }

  // Visual stepper advances as user interacts: wp -> IT -> budget -> next
  function bumpStepFromInputs(target) {
    if (step >= 4) return;
    if (target === "wp" && step < 2) step = 2;
    else if (target === "it" && step < 3) step = 3;
    else if (target === "budget" && step < 3) step = 3;
    updateStepper();
    refreshPreview();
  }

  root.querySelectorAll(".itman-roi__pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".itman-roi__pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const wp = document.getElementById("roiWp");
      if (wp) wp.value = btn.dataset.wp || "300";
      bumpStepFromInputs("wp");
    });
  });

  document.getElementById("roiIt")?.addEventListener("input", () => bumpStepFromInputs("it"));
  document.getElementById("roiBudget")?.addEventListener("input", (e) => {
    formatBudgetInput(e.target);
    bumpStepFromInputs("budget");
  });

  document.getElementById("roiNextBtn")?.addEventListener("click", showResult);
  document.getElementById("roiBackBtn")?.addEventListener("click", showForm);

  document.getElementById("roiLeadForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("roiSuccess");
    if (msg) {
      msg.hidden = false;
      msg.textContent = "Спасибо! Отчёт отправим на указанный email.";
    }
  });

  showForm();
})();
