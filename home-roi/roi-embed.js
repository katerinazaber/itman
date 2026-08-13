/* ROI embed — 3-phase funnel: input → preview CTA → lead form → done */

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

  let inputStep = 1; // 1 company, 2 IT, 3 licenses
  let phase = "input"; // input | result | lead | done

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
  function paybackLabel(years) {
    if (!isFinite(years)) return "—";
    const v = fmtNum(years, 1);
    const n = Number(String(v).replace(",", "."));
    if (n === 1) return v + " год";
    if (n >= 2 && n < 5) return v + " года";
    return v + " лет";
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

  function refreshNumbers() {
    const r = calculate();
    const save = fmtRubShort(r.savingsTotal);
    const roi = isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : "—";
    const pay = paybackLabel(r.paybackYears);
    root.querySelectorAll('[data-bind="save"]').forEach((el) => (el.textContent = save));
    root.querySelectorAll('[data-bind="roi"]').forEach((el) => (el.textContent = roi));
    root.querySelectorAll('[data-bind="pay"]').forEach((el) => (el.textContent = pay));

    const note = document.getElementById("roiPreviewNote");
    if (note && phase === "input") {
      const left = Math.max(0, 4 - inputStep);
      if (left === 0) {
        note.textContent = "Нажмите «Рассчитать», чтобы увидеть персональный результат";
      } else {
        note.textContent =
          "Заполните ещё " +
          left +
          (left === 1 ? " шаг" : " шага") +
          ", чтобы получить персональный расчёт с детализацией";
      }
    }
  }

  function updateStepper() {
    const visualStep = phase === "input" ? inputStep : 4;
    root.querySelectorAll("[data-step-dot]").forEach((d) => {
      const s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === visualStep);
      d.classList.toggle("is-done", s < visualStep);
    });
  }

  function setPhase(next) {
    phase = next;
    root.dataset.phase = next;

    const show = (sel, on) => {
      root.querySelectorAll(sel).forEach((el) => {
        el.hidden = !on;
      });
    };

    // left
    show('[data-view="input"]', next === "input");
    show('[data-view="summary"]', next === "result" || next === "lead" || next === "done");

    // right
    show('[data-view="preview"]', next === "input");
    show('[data-view="cta"]', next === "result");
    show('[data-view="lead"]', next === "lead");
    show('[data-view="done"]', next === "done");

    if (next === "input") {
      root.querySelectorAll("[data-input-panel]").forEach((p) => {
        p.hidden = Number(p.dataset.inputPanel) !== inputStep;
      });
    }

    updateStepper();
    refreshNumbers();
  }

  function goInputStep(n) {
    inputStep = n;
    root.dataset.inputStep = String(n);
    root.querySelectorAll("[data-input-panel]").forEach((p) => {
      p.hidden = Number(p.dataset.inputPanel) !== n;
    });
    updateStepper();
    refreshNumbers();
  }

  function formatBudgetInput(el) {
    const digits = String(el.value || "").replace(/\D/g, "");
    el.value = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  }

  root.querySelectorAll(".itman-roi__pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".itman-roi__pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const wp = document.getElementById("roiWp");
      if (wp) wp.value = btn.dataset.wp || "300";
      refreshNumbers();
    });
  });

  document.getElementById("roiIt")?.addEventListener("input", refreshNumbers);
  document.getElementById("roiBudget")?.addEventListener("input", (e) => {
    formatBudgetInput(e.target);
    refreshNumbers();
  });

  root.querySelectorAll("[data-go-input]").forEach((btn) => {
    btn.addEventListener("click", () => goInputStep(Number(btn.dataset.goInput)));
  });

  document.getElementById("roiCalcBtn")?.addEventListener("click", () => {
    inputStep = 4;
    setPhase("result");
  });

  document.getElementById("roiGetReportBtn")?.addEventListener("click", () => {
    setPhase("lead");
  });

  document.getElementById("roiEditBtn")?.addEventListener("click", () => {
    inputStep = 1;
    setPhase("input");
    goInputStep(1);
  });

  document.getElementById("roiLeadForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("roiName")?.value?.trim();
    const email = document.getElementById("roiEmail")?.value?.trim();
    if (!name || !email) return;
    setPhase("done");
  });

  setPhase("input");
  goInputStep(1);
})();
