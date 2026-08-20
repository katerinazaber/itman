/* ROI embed for Taptop — resilient init (event delegation + retry) */
(function () {
  if (window.__itmenRoiInit) return;
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
    if (root.dataset.roiReady === "1") return;
    root.dataset.roiReady = "1";
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

    root.addEventListener("submit", function (e) {
      if (!(e.target && e.target.id === "roiLeadForm")) return;
      e.preventDefault();
      var name = el("roiName")?.value?.trim();
      var email = el("roiEmail")?.value?.trim();
      var phone = el("roiPhone")?.value?.trim() || "";
      if (!name || !email) return;

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
          "[ROI] Taptop form not submitted. Check: form visible in editor (Visibility=show), CSS off-screen hide only, name «Лид-магнит Главная»."
        );
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
      var wrap = document.getElementById("roi-taptop-form");
      if (wrap) {
        return {
          root: wrap,
          form: wrap.matches("form") ? wrap : wrap.querySelector("form") || wrap,
        };
      }

      // Prefer native <form> that is NOT inside the calculator
      var forms = document.querySelectorAll("form");
      for (var i = 0; i < forms.length; i++) {
        var f = forms[i];
        if (root.contains(f)) continue;
        var text = (f.textContent || "").replace(/\s+/g, " ");
        if (
          /Лид-магнит/i.test(text) ||
          /Получить\s+отч[её]т/i.test(text) ||
          f.querySelectorAll("input").length >= 2
        ) {
          // If multiple forms, prefer one with «отчет»
          if (
            /Лид-магнит|отч[её]т/i.test(text) ||
            forms.length === 1
          ) {
            return { root: f, form: f };
          }
        }
      }

      // Taptop sometimes wraps fields in a div, not <form>
      var nodes = document.querySelectorAll("button, [type='submit']");
      for (var j = 0; j < nodes.length; j++) {
        var btn = nodes[j];
        if (root.contains(btn)) continue;
        if (!/Получить\s+отч[её]т|Отправить/i.test(btn.textContent || ""))
          continue;
        var node = btn.parentElement;
        for (var depth = 0; depth < 10 && node; depth++) {
          var inputs = node.querySelectorAll("input");
          if (inputs.length >= 2) {
            return {
              root: node,
              form: node.matches("form") ? node : node.querySelector("form") || node,
              button: btn,
            };
          }
          node = node.parentElement;
        }
      }
      return null;
    }

    function revealForSubmit(elNode) {
      if (!elNode || !elNode.style) return function () {};
      var prev = {
        display: elNode.style.display,
        visibility: elNode.style.visibility,
        opacity: elNode.style.opacity,
        position: elNode.style.position,
        left: elNode.style.left,
        height: elNode.style.height,
        overflow: elNode.style.overflow,
        pointerEvents: elNode.style.pointerEvents,
      };
      elNode.style.setProperty("display", "block", "important");
      elNode.style.setProperty("visibility", "visible", "important");
      elNode.style.setProperty("opacity", "1", "important");
      elNode.style.setProperty("pointer-events", "auto", "important");
      // keep off-screen so user doesn't flash-see it
      elNode.style.setProperty("position", "fixed", "important");
      elNode.style.setProperty("left", "-10000px", "important");
      elNode.style.setProperty("top", "0", "important");
      elNode.style.setProperty("height", "auto", "important");
      elNode.style.setProperty("overflow", "visible", "important");
      return function restore() {
        Object.keys(prev).forEach(function (k) {
          elNode.style[k] = prev[k] || "";
        });
      };
    }

    function submitToHiddenTaptopForm(data) {
      var found = findTaptopLeadForm();
      if (!found) return false;
      var box = found.root;
      var form = found.form;
      var restore = revealForSubmit(box);
      // also unhide parents up to 5 levels (Taptop Visibility)
      var restores = [restore];
      var p = box.parentElement;
      for (var up = 0; up < 5 && p; up++) {
        restores.push(revealForSubmit(p));
        p = p.parentElement;
      }

      var inputs = Array.prototype.slice.call(
        form.querySelectorAll("input, textarea")
      );
      var used = {};

      function pick(pred) {
        for (var i = 0; i < inputs.length; i++) {
          if (used[i]) continue;
          var inp = inputs[i];
          var type = (inp.type || "").toLowerCase();
          if (type === "hidden" || type === "submit" || type === "button")
            continue;
          if (pred(inp, type)) {
            used[i] = true;
            return inp;
          }
        }
        return null;
      }

      var emailInp = pick(function (inp, type) {
        return (
          type === "email" ||
          /email|e-?mail|mail/i.test(
            (inp.name || "") + (inp.id || "") + (inp.placeholder || "") + (inp.getAttribute("aria-label") || "")
          )
        );
      });
      var phoneInp = pick(function (inp, type) {
        return (
          type === "tel" ||
          /phone|tel|телефон/i.test(
            (inp.name || "") + (inp.id || "") + (inp.placeholder || "") + (inp.getAttribute("aria-label") || "")
          )
        );
      });
      var nameInp = pick(function (inp, type) {
        return (
          type === "text" ||
          type === "" ||
          /name|имя|fio/i.test(
            (inp.name || "") + (inp.id || "") + (inp.placeholder || "") + (inp.getAttribute("aria-label") || "")
          )
        );
      });

      // Fallback by order: many Taptop forms are Name, Phone, Email
      var free = inputs.filter(function (inp, idx) {
        var type = (inp.type || "").toLowerCase();
        return (
          !used[idx] &&
          type !== "hidden" &&
          type !== "submit" &&
          type !== "button"
        );
      });
      if (!nameInp && free[0]) nameInp = free[0];
      if (!phoneInp && free[1]) phoneInp = free[1];
      if (!emailInp && free[2]) emailInp = free[2];
      if (!emailInp) {
        emailInp = pick(function (inp, type) {
          return type === "text" || type === "email";
        });
      }

      setNativeValue(nameInp, data.name);
      setNativeValue(emailInp, data.email);
      setNativeValue(phoneInp, data.phone);

      var btn =
        found.button ||
        form.querySelector('[type="submit"]') ||
        form.querySelector("button");

      try {
        if (form.tagName === "FORM" && typeof form.requestSubmit === "function") {
          form.requestSubmit(btn || undefined);
        } else if (btn) {
          btn.click();
        } else if (form.tagName === "FORM") {
          form.submit();
        } else if (btn) {
          btn.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
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
      }, 1500);

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
