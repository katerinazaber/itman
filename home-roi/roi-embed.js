/* ROI embed for Taptop — resilient init (event delegation + retry) */
(function () {
  var ROI_VER = 12;
  // Newer version must win over stale loaders (old Embed onerror v=6 vs Custom Code).
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

    function sendLead(e) {
      if (e) e.preventDefault();
      var name = el("roiName")?.value?.trim();
      var email = el("roiEmail")?.value?.trim();
      var phone = el("roiPhone")?.value?.trim() || "";
      if (!name || !email) {
        console.warn("[ROI] name/email required");
        return;
      }

      var r = calculate();
      var ok = submitToHiddenTaptopForm({
        name: name,
        email: email,
        phone: phone,
        save: fmtRubShort(r.savingsTotal),
        roi: isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : "",
        payback: paybackLabel(r.paybackYears),
      });

      setPhase("done");
      if (!ok) {
        console.warn(
          "[ROI] Taptop form not submitted. Disable Smart Captcha on «Лид-магнит Главная», keep Visibility=show, hide only via CSS in-viewport."
        );
      }
    }

    root.addEventListener("submit", function (e) {
      if (!(e.target && e.target.id === "roiLeadForm")) return;
      sendLead(e);
    });
    root.addEventListener("click", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === "roiLeadSend" || (t.closest && t.closest("#roiLeadSend"))) {
        sendLead(e);
      }
    });

    function setNativeValue(inp, value) {
      if (!inp) return;
      var proto =
        inp instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      var desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && desc.set) desc.set.call(inp, value);
      else inp.value = value;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      try {
        inp.dispatchEvent(
          new InputEvent("input", { bubbles: true, data: value })
        );
      } catch (err) {}
    }

    function findTaptopLeadForm() {
      // Exact form from preview «Лид-магнит Главная»
      var exact =
        document.querySelector("form[data-s3-anketa-id='346201316']") ||
        document.getElementById("if6fgkokg_0") ||
        document.getElementById("roi-taptop-form");
      if (exact) {
        var box = exact.id === "roi-taptop-form" && !exact.matches("form")
          ? exact.querySelector("form") || exact
          : exact;
        return {
          root: exact,
          form: box.matches("form") ? box : box.querySelector("form") || box,
          button:
            (box.matches("form") ? box : box.querySelector("form") || box).querySelector(
              "[type='submit'], button.submit_button, button"
            ) || null,
        };
      }

      var forms = document.querySelectorAll("form[data-s3-anketa-id]");
      for (var i = 0; i < forms.length; i++) {
        var f = forms[i];
        if (root.contains(f)) continue;
        var text = (f.textContent || "").replace(/\s+/g, " ");
        if (/Получить\s+отч[её]т/i.test(text) && /Имя/i.test(text) && /Email/i.test(text)) {
          return {
            root: f,
            form: f,
            button: f.querySelector("[type='submit'], button.submit_button, button"),
          };
        }
      }
      return null;
    }

    function revealForSubmit(elNode) {
      if (!elNode || !elNode.style) return function () {};
      var prev = elNode.getAttribute("style") || "";
      // Must stay in viewport — left:-9999 + overflow:hidden breaks Yandex Smart Captcha.
      elNode.style.setProperty("display", "block", "important");
      elNode.style.setProperty("visibility", "visible", "important");
      elNode.style.setProperty("opacity", "0.02", "important");
      elNode.style.setProperty("pointer-events", "auto", "important");
      elNode.style.setProperty("position", "fixed", "important");
      elNode.style.setProperty("left", "8px", "important");
      elNode.style.setProperty("bottom", "8px", "important");
      elNode.style.setProperty("top", "auto", "important");
      elNode.style.setProperty("right", "auto", "important");
      elNode.style.setProperty("width", "280px", "important");
      elNode.style.setProperty("height", "auto", "important");
      elNode.style.setProperty("max-height", "70vh", "important");
      elNode.style.setProperty("overflow", "visible", "important");
      elNode.style.setProperty("clip", "auto", "important");
      elNode.style.setProperty("clip-path", "none", "important");
      elNode.style.setProperty("transform", "none", "important");
      elNode.style.setProperty("z-index", "2147483646", "important");
      return function restore() {
        if (prev) elNode.setAttribute("style", prev);
        else elNode.removeAttribute("style");
      };
    }

    function submitToHiddenTaptopForm(data) {
      var found = findTaptopLeadForm();
      if (!found) {
        console.warn("[ROI] lead form not found (anketa 346201316 / Получить отчет)");
        return false;
      }
      var box = found.root;
      var form = found.form;
      var wrap = form.closest(".form") || box.parentElement || box;
      var restores = [revealForSubmit(wrap), revealForSubmit(box), revealForSubmit(form)];

      function byDataType(typeName) {
        var wrapField = form.querySelector('[data-type-field="' + typeName + '"]');
        return wrapField ? wrapField.querySelector("input, textarea") : null;
      }

      function byLabel(re) {
        var fields = form.querySelectorAll(".form__field, [data-type-field]");
        for (var i = 0; i < fields.length; i++) {
          var label = (fields[i].textContent || "").replace(/\s+/g, " ");
          if (re.test(label)) {
            return fields[i].querySelector("input, textarea");
          }
        }
        return null;
      }

      var nameInp = byLabel(/Имя/i) || byDataType("text");
      var phoneInp = byLabel(/Телефон/i);
      var emailInp =
        byLabel(/Email|E-mail|Почта/i) ||
        byDataType("email") ||
        form.querySelector("input[type='email']");

      if (!phoneInp) {
        var textInputs = form.querySelectorAll(
          '[data-type-field="text"] input, input[type="text"]'
        );
        for (var t = 0; t < textInputs.length; t++) {
          if (textInputs[t] !== nameInp) {
            phoneInp = textInputs[t];
            break;
          }
        }
      }

      setNativeValue(nameInp, data.name);
      setNativeValue(phoneInp, data.phone || "не указан");
      setNativeValue(emailInp, data.email);

      var btn =
        found.button ||
        form.querySelector("button.submit_button") ||
        form.querySelector('[type="submit"]') ||
        form.querySelector("button");

      console.info("[ROI] v" + ROI_VER + " filled Taptop form", {
        formId: form.id,
        anketa: form.getAttribute("data-s3-anketa-id"),
        name: nameInp && nameInp.value,
        phone: phoneInp && phoneInp.value,
        email: emailInp && emailInp.value,
        hasBtn: !!btn,
      });

      // Real click — Taptop + Smart Captcha listen to user gesture on the button.
      setTimeout(function () {
        try {
          if (btn) {
            btn.focus();
            btn.dispatchEvent(
              new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window })
            );
            btn.dispatchEvent(
              new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window })
            );
            btn.click();
          } else if (form.tagName === "FORM" && typeof form.requestSubmit === "function") {
            form.requestSubmit();
          }
        } catch (err) {
          console.warn("[ROI] submit error", err);
          if (btn) btn.click();
        }
        setTimeout(function () {
          restores.forEach(function (fn) {
            try {
              fn();
            } catch (e2) {}
          });
        }, 5000);
      }, 600);

      return !!(nameInp && emailInp);
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
