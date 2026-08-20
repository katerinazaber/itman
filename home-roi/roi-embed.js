/* ROI embed for Taptop — resilient init (event delegation + retry) */
(function () {
  var ROI_VER = 13;
  // v13: native Taptop form is MOVED into calculator (no fake bridge / no hidden submit).
  if ((window.__itmenRoiInitVersion || 0) >= ROI_VER) return;
  window.__itmenRoiInitVersion = ROI_VER;
  window.__itmenRoiInit = true;

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

  function boot(attempt) {
    const root =
      document.querySelector("#roi-calculator.itman-roi") ||
      document.querySelector(".itman-roi");
    if (!root) {
      if ((attempt || 0) < 40) {
        setTimeout(function () {
          boot((attempt || 0) + 1);
        }, 150);
      }
      return;
    }
    if (root.dataset.roiReady === String(ROI_VER)) return;
    root.dataset.roiReady = String(ROI_VER);
    init(root);
  }

  function init(root) {
    let inputStep = 1;
    let phase = "input";

    function el(id) {
      return root.querySelector("#" + id);
    }

    function getInputs() {
      return {
        endpoints: Number(el("roiWp")?.value || 0),
        itStaff: Number(el("roiIt")?.value || 0),
        currentLicenses: parseBudget(el("roiBudget")?.value),
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
      root.querySelectorAll('[data-bind="save"]').forEach(function (node) {
        node.textContent = save;
      });
      root.querySelectorAll('[data-bind="roi"]').forEach(function (node) {
        node.textContent = roi;
      });
      root.querySelectorAll('[data-bind="pay"]').forEach(function (node) {
        node.textContent = pay;
      });

      const note = el("roiPreviewNote");
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
      root.querySelectorAll("[data-step-dot]").forEach(function (d) {
        const s = Number(d.dataset.stepDot);
        d.classList.toggle("is-active", s === visualStep);
        d.classList.toggle("is-done", s < visualStep);
      });
    }

    function setPhase(next) {
      phase = next;
      root.dataset.phase = next;

      function show(sel, on) {
        root.querySelectorAll(sel).forEach(function (node) {
          node.hidden = !on;
        });
      }

      show('[data-view="input"]', next === "input");
      show('[data-view="summary"]', next === "result" || next === "lead" || next === "done");
      show('[data-view="preview"]', next === "input");
      show('[data-view="cta"]', next === "result");
      show('[data-view="lead"]', next === "lead");
      show('[data-view="done"]', next === "done");

      if (next === "input") {
        root.querySelectorAll("[data-input-panel]").forEach(function (p) {
          p.hidden = Number(p.dataset.inputPanel) !== inputStep;
        });
      }

      updateStepper();
      refreshNumbers();
    }

    function goInputStep(n) {
      inputStep = n;
      root.dataset.inputStep = String(n);
      root.querySelectorAll("[data-input-panel]").forEach(function (p) {
        p.hidden = Number(p.dataset.inputPanel) !== n;
      });
      updateStepper();
      refreshNumbers();
    }

    function formatBudgetInput(node) {
      const digits = String(node.value || "").replace(/\D/g, "");
      node.value = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
    }

    // Event delegation — works even if Taptop re-wraps nodes
    root.addEventListener("click", function (e) {
      const t = e.target.closest("button, a, [data-go-input], .itman-roi__pill");
      if (!t || !root.contains(t)) return;

      if (t.classList.contains("itman-roi__pill") || t.closest(".itman-roi__pill")) {
        const pill = t.classList.contains("itman-roi__pill") ? t : t.closest(".itman-roi__pill");
        e.preventDefault();
        root.querySelectorAll(".itman-roi__pill").forEach(function (b) {
          b.classList.remove("is-active");
        });
        pill.classList.add("is-active");
        const wp = el("roiWp");
        if (wp) wp.value = pill.dataset.wp || "300";
        refreshNumbers();
        return;
      }

      if (t.hasAttribute("data-go-input") || t.closest("[data-go-input]")) {
        const btn = t.hasAttribute("data-go-input") ? t : t.closest("[data-go-input]");
        e.preventDefault();
        goInputStep(Number(btn.getAttribute("data-go-input")));
        return;
      }

      if (t.id === "roiCalcBtn" || t.closest("#roiCalcBtn")) {
        e.preventDefault();
        inputStep = 4;
        setPhase("result");
        return;
      }

      if (t.id === "roiGetReportBtn" || t.closest("#roiGetReportBtn")) {
        e.preventDefault();
        setPhase("lead");
        mountNativeLeadForm();
        return;
      }

      if (t.id === "roiEditBtn" || t.closest("#roiEditBtn")) {
        e.preventDefault();
        inputStep = 1;
        setPhase("input");
        goInputStep(1);
      }
    });

    root.addEventListener("input", function (e) {
      const t = e.target;
      if (t && t.id === "roiIt") refreshNumbers();
      if (t && t.id === "roiBudget") {
        formatBudgetInput(t);
        refreshNumbers();
      }
    });

    var mountedWrap = null;
    var successObserver = null;

    function findTaptopLeadWrap() {
      var form =
        document.querySelector("form[data-s3-anketa-id='346201316']") ||
        document.getElementById("if6fgkokg_0");
      if (form) {
        return form.closest(".form") || form.parentElement || form;
      }
      var forms = document.querySelectorAll("form[data-s3-anketa-id]");
      for (var i = 0; i < forms.length; i++) {
        var f = forms[i];
        if (root.contains(f) && f.closest("#roiTaptopMount")) continue;
        var text = (f.textContent || "").replace(/\s+/g, " ");
        if (/Получить\s+отч[её]т/i.test(text) && /Имя/i.test(text) && /Email/i.test(text)) {
          return f.closest(".form") || f;
        }
      }
      return null;
    }

    function isSuccessVisible(wrap) {
      if (!wrap) return false;
      var ok = wrap.querySelector(".form__state-success");
      if (!ok) return false;
      var st = window.getComputedStyle(ok);
      if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") {
        return false;
      }
      // Taptop often keeps success in DOM; also check if default form is hidden
      var def = wrap.querySelector("form.form__state-default, form#if6fgkokg_0");
      if (def) {
        var ds = window.getComputedStyle(def);
        if (ds.display === "none") return true;
      }
      var txt = (ok.textContent || "").replace(/\s+/g, " ");
      return /Спасибо|отправлена|успеш/i.test(txt) && st.display !== "none";
    }

    function watchFormSuccess(wrap) {
      if (successObserver) {
        try {
          successObserver.disconnect();
        } catch (e) {}
      }
      successObserver = new MutationObserver(function () {
        if (isSuccessVisible(wrap)) {
          console.info("[ROI] v" + ROI_VER + " native form success");
          setPhase("done");
          try {
            successObserver.disconnect();
          } catch (e2) {}
        }
      });
      successObserver.observe(wrap, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["class", "style", "hidden"],
      });
      // Fallback poll — Taptop may toggle without attributes we catch
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (isSuccessVisible(wrap) || phase === "done") {
          clearInterval(timer);
          if (phase !== "done" && isSuccessVisible(wrap)) setPhase("done");
        }
        if (tries > 60) clearInterval(timer);
      }, 500);
    }

    function mountNativeLeadForm() {
      var mount = el("roiTaptopMount");
      if (!mount) {
        console.warn("[ROI] #roiTaptopMount missing — update Embed HTML");
        return false;
      }
      var wrap = findTaptopLeadWrap();
      if (!wrap) {
        console.warn(
          "[ROI] Taptop form «Лид-магнит Главная» not found (anketa 346201316)"
        );
        mount.innerHTML =
          '<p class="itman-roi__lead-text">Форма заявки не найдена на странице. Проверьте, что блок «Лид-магнит Главная» на странице и Visibility = Отображать.</p>';
        return false;
      }
      if (!mount.contains(wrap)) {
        mount.innerHTML = "";
        mount.appendChild(wrap);
        mountedWrap = wrap;
      }
      wrap.classList.add("itman-roi-native-form");
      wrap.style.cssText = "";
      var form = wrap.querySelector("form") || (wrap.matches("form") ? wrap : null);
      if (form) form.style.cssText = "";
      console.info("[ROI] v" + ROI_VER + " mounted native Taptop form", {
        anketa: form && form.getAttribute("data-s3-anketa-id"),
        formId: form && form.id,
      });
      watchFormSuccess(wrap);
      return true;
    }

    setPhase("input");
    goInputStep(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      boot(0);
    });
  } else {
    boot(0);
  }
})();
