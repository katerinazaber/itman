/* ROI embed for Taptop — resilient init (event delegation + retry) */
(function () {
  var ROI_VER = 23;
  // v23: сотрудники учёта — целые числа (1, 2, 3…)
  // v22: понятные формулировки вопросов для сайта; устройства — числом
  // v21: модель Base 2026 (devices/compute/virt/fte/extend/buy) — как index.html + Excel
  // v20: nbsp before «персональных» in consent label
  // v19: consent checkbox (ПДн) + block submit until checked; link → itman.ru/soglasie
  // v18: unlock pointer-events for Yandex SmartCaptcha inside mounted form.
  if ((window.__itmenRoiInitVersion || 0) >= ROI_VER) return;
  window.__itmenRoiInitVersion = ROI_VER;
  window.__itmenRoiInit = true;
  var SOGLASIE_URL = "https://itman.ru/soglasie";

  /* ===== Модель Base 2026 (синхрон с ITMen_ROI_Model_2026.xlsx / index.html) ===== */
  var CONST = {
    pricePerDevice: 2000,
    salaryGross: 200000,
    unusedRate: 0.1,
    opexShareFromY2: 0.3,
    implPersonMonths: 3,
    computeShareDefault: 0.8,
    addressableShare: 0.5,
    laborCapture: 0.25,
    hwCapture: 0.03,
    licY2ShareOfAddressable: 0.7,
    laborY2Mult: 1.6,
    hwY2Mult: 1.67,
    inventoryBenefitPerDevice: 900,
    inventoryCaptureY1: 0.35,
    inventoryCaptureY2: 0.5,
    otherFteWeight: 0.35,
  };

  var COSTS = {
    "100-1000": { noVirt: { sw: 24000, hw: 32000 }, virt: { sw: 27000, hw: 27000 } },
    "1000-5000": { noVirt: { sw: 21500, hw: 29000 }, virt: { sw: 24000, hw: 24500 } },
    "5000-20000": { noVirt: { sw: 19000, hw: 26000 }, virt: { sw: 21500, hw: 22000 } },
    "20000+": { noVirt: { sw: 16500, hw: 22500 }, virt: { sw: 19000, hw: 19000 } },
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function band(n) {
    if (n >= 20000) return "20000+";
    if (n >= 5000) return "5000-20000";
    if (n >= 1000) return "1000-5000";
    return "100-1000";
  }
  function estimateFte(computeEp, otherEp) {
    var weighted = computeEp + otherEp * CONST.otherFteWeight;
    return Math.round(clamp(0.3 + weighted / 8000, 0.3, 3) * 10) / 10;
  }
  function unitCosts(computeEp, virtMode) {
    var b = band(Math.max(computeEp, 1));
    var row = COSTS[b] || COSTS["100-1000"];
    if (virtMode === "low") return row.noVirt;
    if (virtMode === "high") return row.virt;
    return {
      sw: Math.round((row.noVirt.sw + row.virt.sw) / 2),
      hw: Math.round((row.noVirt.hw + row.virt.hw) / 2),
    };
  }
  function fmtRubShort(n) {
    if (!isFinite(n)) return "—";
    if (Math.abs(n) >= 1e9) {
      return (n / 1e9).toFixed(2).replace(".", ",") + " млрд ₽";
    }
    if (Math.abs(n) >= 1e6) {
      return (Math.round((n / 1e6) * 10) / 10).toString().replace(".", ",") + " млн ₽";
    }
    if (Math.abs(n) >= 1e3) return Math.round(n / 1e3).toLocaleString("ru-RU") + " тыс. ₽";
    return Math.round(n) + " ₽";
  }
  function fmtNum(n, digits) {
    if (!isFinite(n)) return "—";
    digits = digits == null ? 1 : digits;
    return (Math.round(n * 10 ** digits) / 10 ** digits).toString().replace(".", ",");
  }
  function paybackLabel(months) {
    if (!isFinite(months) || months <= 0) return "—";
    if (months < 12) {
      var m = Math.max(1, Math.round(months));
      if (m === 1) return "около 1 мес.";
      if (m < 5) return "около " + m + " мес.";
      return Math.round(months) + " мес.";
    }
    var years = months / 12;
    var v = fmtNum(years, 1);
    var n = Number(String(v).replace(",", "."));
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
      var devices =
        Number(el("roiDevices")?.value || el("roiWp")?.value || 0) || 0;
      var compute = Number(el("roiCompute")?.value || 0);
      var virt = (el("roiVirt")?.value || "high").toLowerCase();
      if (virt !== "low" && virt !== "mid" && virt !== "high") virt = "high";
      var fte = Number(el("roiFte")?.value);
      if (!isFinite(fte)) fte = Number(el("roiIt")?.value || 0);
      /* На сайте считаем целыми людьми; 0 = автооценка в модели */
      if (fte > 0) fte = Math.round(fte);
      var extendPct = Number(el("roiExtend")?.value || 0);
      var buyPct = Number(el("roiBuy")?.value || 0);
      return {
        devices: devices,
        compute: compute,
        virt: virt,
        fte: fte,
        extendPct: extendPct,
        buyPct: buyPct,
        // legacy aliases for form fill
        endpoints: devices,
        itStaff: fte,
        currentLicenses: 0,
      };
    }

    function calculate() {
      var inp = getInputs();
      var devices = Math.max(0, inp.devices || 0);
      var computeEp = Math.max(0, inp.compute || 0);
      var computeSynth = false;
      if (computeEp <= 0 && devices > 0) {
        computeEp = Math.round(devices * CONST.computeShareDefault);
        computeSynth = true;
      }
      computeEp = Math.min(computeEp, devices || computeEp);
      var otherEp = Math.max(0, devices - computeEp);

      var units = unitCosts(computeEp, inp.virt);
      var swBudget = Math.round(computeEp * units.sw);
      var hwBudget = Math.round(computeEp * units.hw);

      var fte = inp.fte;
      var fteSynth = false;
      if (!isFinite(fte) || fte < 0) fte = 0;
      if (fte === 0) {
        fte = estimateFte(computeEp, otherEp);
        fteSynth = true;
      }

      var extendPct = clamp(inp.extendPct || 0, 0, 100);
      var buyPct = clamp(inp.buyPct || 0, 0, 100);
      var cashEventPct = clamp(extendPct + buyPct, 0, 100);
      var cashEventShare = cashEventPct / 100;

      var unusedPool = swBudget * CONST.unusedRate;
      var addressable = unusedPool * CONST.addressableShare;
      var licY1 = addressable * cashEventShare;
      var licY2 = addressable * CONST.licY2ShareOfAddressable;
      var hwY1 = hwBudget * CONST.hwCapture;
      var hwY2 = hwY1 * CONST.hwY2Mult;

      var laborY1 = fte * CONST.salaryGross * 12 * CONST.laborCapture;
      var laborY2 = laborY1 * CONST.laborY2Mult;

      var invPool = devices * CONST.inventoryBenefitPerDevice;
      var invY1 = invPool * CONST.inventoryCaptureY1;
      var invY2 = invPool * CONST.inventoryCaptureY2;

      var saveY1 = licY1 + laborY1 + hwY1 + invY1;
      var saveY2 = licY2 + laborY2 + hwY2 + invY2;
      var saveY3 = saveY2 * 1.05;
      var save3y = saveY1 + saveY2 + saveY3;

      var capex = devices * CONST.pricePerDevice;
      var opexY1 = (CONST.implPersonMonths / 12) * CONST.salaryGross;
      var opexY2 = capex * CONST.opexShareFromY2;
      var opexY3 = capex * CONST.opexShareFromY2;
      var investY1 = capex + opexY1;
      var investY2 = opexY2;
      var investY3 = opexY3;
      var invest3y = investY1 + investY2 + investY3;

      var monthly = saveY1 / 12;
      var paybackMonths = monthly > 0 ? investY1 / monthly : Infinity;
      var paybackYears = isFinite(paybackMonths) ? paybackMonths / 12 : NaN;
      var roi3y =
        investY1 > 0 ? ((save3y - invest3y) / investY1) * 100 : NaN;

      return {
        savingsTotal: saveY1,
        saveY1: saveY1,
        saveY2: saveY2,
        saveY3: saveY3,
        save3y: save3y,
        investY1: investY1,
        investY2: investY2,
        investY3: investY3,
        roi: roi3y,
        paybackMonths: paybackMonths,
        paybackYears: paybackYears,
        devices: devices,
        computeEp: computeEp,
        otherEp: otherEp,
        swBudget: swBudget,
        fte: fte,
        computeSynth: computeSynth,
        fteSynth: fteSynth,
        extendPct: extendPct,
        buyPct: buyPct,
      };
    }

    function refreshNumbers() {
      const r = calculate();
      const save = fmtRubShort(r.savingsTotal);
      const roi = isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : "—";
      const pay = paybackLabel(r.paybackMonths);
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

    function syncLegacyHidden() {
      var devices = el("roiDevices");
      var wp = el("roiWp");
      if (devices && wp) wp.value = devices.value;
      var fte = el("roiFte");
      var it = el("roiIt");
      if (fte && it) it.value = fte.value;
    }

    // Event delegation — works even if Taptop re-wraps nodes
    root.addEventListener("click", function (e) {
      const t = e.target.closest("button, a, [data-go-input], .itman-roi__pill");
      if (!t || !root.contains(t)) return;

      if (t.classList.contains("itman-roi__pill") || t.closest(".itman-roi__pill")) {
        const pill = t.classList.contains("itman-roi__pill") ? t : t.closest(".itman-roi__pill");
        e.preventDefault();
        var group = pill.parentElement;
        if (group) {
          group.querySelectorAll(".itman-roi__pill").forEach(function (b) {
            b.classList.remove("is-active");
          });
        }
        pill.classList.add("is-active");

        if (pill.dataset.virt != null) {
          var virt = el("roiVirt");
          if (virt) virt.value = pill.dataset.virt;
        }
        // старые pill-диапазоны устройств (если остались в другой вёрстке)
        if (pill.dataset.devices != null || pill.dataset.wp != null) {
          var n = pill.dataset.devices || pill.dataset.wp || "2000";
          var devices = el("roiDevices");
          var wp = el("roiWp");
          if (devices) devices.value = n;
          if (wp) wp.value = n;
        }
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
      if (!t) return;
      if (
        t.id === "roiIt" ||
        t.id === "roiFte" ||
        t.id === "roiCompute" ||
        t.id === "roiExtend" ||
        t.id === "roiBuy" ||
        t.id === "roiDevices" ||
        t.id === "roiWp"
      ) {
        syncLegacyHidden();
        refreshNumbers();
      }
      if (t.id === "roiBudget") {
        /* budget больше не вход модели Base — игнор */
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

    function setNativeValue(inp, value) {
      if (!inp) return;
      var proto =
        inp instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      var desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && desc.set) desc.set.call(inp, String(value));
      else inp.value = String(value);
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function findFieldByNameOrLabel(form, names, labelRe) {
      if (!form) return null;
      var i, inp, wrap, label;
      var inputs = form.querySelectorAll("input, textarea");
      for (i = 0; i < inputs.length; i++) {
        inp = inputs[i];
        var nm = (inp.getAttribute("name") || inp.getAttribute("data-name") || "").toLowerCase();
        var id = (inp.id || "").toLowerCase();
        for (var n = 0; n < names.length; n++) {
          if (nm === names[n] || id === names[n] || nm.indexOf(names[n]) !== -1) {
            return inp;
          }
        }
      }
      if (labelRe) {
        var fields = form.querySelectorAll(".form__field, [data-type-field]");
        for (i = 0; i < fields.length; i++) {
          wrap = fields[i];
          label = (wrap.textContent || "").replace(/\s+/g, " ");
          if (labelRe.test(label)) {
            return wrap.querySelector("input, textarea");
          }
        }
      }
      return null;
    }

    function buildRoiSummary() {
      var inp = getInputs();
      var r = calculate();
      var virtLabel =
        inp.virt === "low"
          ? "небольшая часть"
          : inp.virt === "mid"
            ? "примерно половина"
            : "большинство";
      return [
        "Устройств в опросе: " + r.devices.toLocaleString("ru-RU"),
        "ПК и серверы: " +
          r.computeEp.toLocaleString("ru-RU") +
          (r.computeSynth ? " (оценка ~80%)" : ""),
        "Виртуализация: " + virtLabel,
        "FTE учёта: " +
          r.fte +
          (r.fteSynth ? " (оценка)" : ""),
        "Продление / докупка: " + r.extendPct + "% / " + r.buyPct + "%",
        "Экономия год 1: " + fmtRubShort(r.saveY1),
        "ROI за 3 года: " + (isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : "—"),
        "Окупаемость: " + paybackLabel(r.paybackMonths),
        "Инвестиции год 1: " + fmtRubShort(r.investY1),
      ].join("\n");
    }

    function ensureMetaHideStyle() {
      if (document.getElementById("itman-roi-meta-hide")) return;
      var st = document.createElement("style");
      st.id = "itman-roi-meta-hide";
      st.textContent =
        "#roiTaptopMount .itman-roi-meta-field," +
        "#roiTaptopMount .form__field.itman-roi-meta-field{" +
        "position:absolute!important;left:0!important;top:0!important;" +
        "width:1px!important;height:1px!important;margin:0!important;padding:0!important;" +
        "opacity:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;" +
        "border:0!important;pointer-events:none!important;" +
        "}" +
        /* Captcha must stay clickable (park CSS / overlays often break it) */
        "#roiTaptopMount,.itman-roi__taptop-mount,.itman-roi__preview," +
        "#roiTaptopMount .form,#roiTaptopMount form," +
        "#roiTaptopMount smart-captcha,#roiTaptopMount iframe{" +
        "pointer-events:auto!important;overflow:visible!important;" +
        "}" +
        "#roiTaptopMount smart-captcha,#roiTaptopMount .SmartCaptcha," +
        "#roiTaptopMount iframe[src*='captcha'],#roiTaptopMount iframe[src*='smartcaptcha']{" +
        "position:relative!important;z-index:2147483000!important;" +
        "pointer-events:auto!important;max-width:100%!important;" +
        "}" +
        "body > div[id*='captcha'],body > div[class*='Captcha']," +
        "body > div[class*='captcha']{" +
        "pointer-events:auto!important;z-index:2147483646!important;" +
        "}";
      document.head.appendChild(st);
    }

    function unlockInteractive(node) {
      if (!node || !node.style) return;
      node.style.setProperty("pointer-events", "auto", "important");
      node.style.setProperty("overflow", "visible", "important");
      node.style.setProperty("opacity", "1", "important");
      node.style.setProperty("z-index", "30", "important");
    }

    function hideMetaField(field) {
      if (!field) return;
      var box = field.closest(".form__field") || field.parentElement || field;
      box.classList.add("itman-roi-meta-field");
    }

    function fillRoiIntoTaptopForm(form) {
      if (!form) return false;
      ensureMetaHideStyle();
      var inp = getInputs();
      var r = calculate();
      var summary = buildRoiSummary();

      var summaryField = findFieldByNameOrLabel(
        form,
        ["roi_summary", "roi-summary", "данные_расчёта", "dannye_rascheta"],
        /Данные\s+расч[её]та|ROI\s*summary|Расч[её]т\s+калькулятора/i
      );
      var wpField = findFieldByNameOrLabel(
        form,
        ["roi_wp", "endpoints", "rabochie_mesta"],
        /Рабочие\s+места|Endpoints/i
      );
      var itField = findFieldByNameOrLabel(
        form,
        ["roi_it", "it_staff"],
        /Сотрудников\s+в\s+ИТ|ИТ-команда/i
      );
      var budgetField = findFieldByNameOrLabel(
        form,
        ["roi_budget", "licenses_budget"],
        /Бюджет\s+на\s+ПО|Лицензии/i
      );
      var saveField = findFieldByNameOrLabel(
        form,
        ["roi_save", "savings"],
        /Экономия/i
      );
      var roiField = findFieldByNameOrLabel(form, ["roi_pct", "roi"], /^ROI|Ориентировочный ROI/i);
      var payField = findFieldByNameOrLabel(
        form,
        ["roi_payback", "payback"],
        /Окупаемост/i
      );

      // Hide first so user never sees the filled values
      [
        summaryField,
        wpField,
        itField,
        budgetField,
        saveField,
        roiField,
        payField,
      ].forEach(hideMetaField);

      setNativeValue(summaryField, summary);
      setNativeValue(wpField, String(r.devices));
      setNativeValue(itField, String(r.fte));
      setNativeValue(
        budgetField,
        String(Math.round(r.swBudget || 0))
      );
      setNativeValue(saveField, fmtRubShort(r.savingsTotal));
      setNativeValue(
        roiField,
        isFinite(r.roi) ? fmtNum(r.roi, 0) + "%" : ""
      );
      setNativeValue(payField, paybackLabel(r.paybackMonths));

      console.info("[ROI] v" + ROI_VER + " filled calc meta", {
        hasSummary: !!(summaryField && summaryField.value),
        summaryPreview: summary.slice(0, 80),
      });
      return !!(summaryField || wpField || saveField);
    }

    function findConsentCheckboxes(form) {
      if (!form) return [];
      return Array.prototype.slice.call(
        form.querySelectorAll(
          '[data-type-field="checkbox_group"] input[type="checkbox"], input.form__checkbox[type="checkbox"], .itman-roi-consent input[type="checkbox"]'
        )
      );
    }

    function enhanceConsentLinks(scope) {
      if (!scope) return;
      var links = scope.querySelectorAll('a[href*="soglasie"], a[data-url*="soglasie"]');
      for (var i = 0; i < links.length; i++) {
        links[i].setAttribute("href", SOGLASIE_URL);
        links[i].setAttribute("target", "_blank");
        links[i].setAttribute("rel", "noopener noreferrer");
      }
    }

    function ensureConsentField(form) {
      if (!form) return;
      enhanceConsentLinks(form);
      if (findConsentCheckboxes(form).length) return;

      var btn = form.querySelector(
        "button.submit_button, button[type='submit'], [type='submit']"
      );
      var box = document.createElement("div");
      box.className = "form__field itman-roi-consent";
      box.setAttribute("data-type-field", "checkbox_group");
      box.innerHTML =
        '<label class="form__widget-item">' +
        '<input type="checkbox" class="form__checkbox itman-roi-consent-input" name="pdn_consent" value="1" required />' +
        '<span class="itman-roi-consent-box" aria-hidden="true"></span>' +
        '<span class="form__label-text">Я даю согласие на обработку&nbsp;' +
        '<a href="' +
        SOGLASIE_URL +
        '" target="_blank" rel="noopener noreferrer">персональных данных</a></span>' +
        "</label>" +
        '<p class="itman-roi-consent-error" role="alert">Отметьте согласие на обработку персональных данных</p>';
      if (btn && btn.parentNode) btn.parentNode.insertBefore(box, btn);
      else form.appendChild(box);
      console.warn(
        "[ROI] v" +
          ROI_VER +
          " injected consent checkbox — add required Checkbox in Taptop form «Лид-магнит Главная» for CRM"
      );
    }

    function isConsentOk(form) {
      var boxes = findConsentCheckboxes(form);
      if (!boxes.length) return false;
      for (var i = 0; i < boxes.length; i++) {
        if (!boxes[i].checked) return false;
      }
      return true;
    }

    function showConsentError(form, on) {
      var err =
        form.querySelector(".itman-roi-consent-error") ||
        form.querySelector('[data-type-field="checkbox_group"] .form__field-error');
      if (!err) return;
      if (err.classList.contains("itman-roi-consent-error")) {
        err.classList.toggle("is-visible", !!on);
      } else {
        err.style.display = on ? "block" : "";
      }
    }

    function bindConsentGate(form) {
      if (!form || form.dataset.roiConsentBound === "1") return;
      form.dataset.roiConsentBound = "1";

      function blockIfNeeded(e) {
        if (isConsentOk(form)) {
          showConsentError(form, false);
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        showConsentError(form, true);
      }

      form.addEventListener("submit", blockIfNeeded, true);
      var btn = form.querySelector(
        "button.submit_button, button[type='submit'], [type='submit']"
      );
      if (btn) btn.addEventListener("click", blockIfNeeded, true);

      form.addEventListener("change", function (e) {
        var t = e.target;
        if (t && t.type === "checkbox") showConsentError(form, !isConsentOk(form));
      });
    }

    function bindFillBeforeSubmit(form) {
      if (!form || form.dataset.roiFillBound === "1") return;
      form.dataset.roiFillBound = "1";
      form.addEventListener(
        "submit",
        function () {
          fillRoiIntoTaptopForm(form);
        },
        true
      );
      var btn = form.querySelector(
        "button.submit_button, button[type='submit'], [type='submit']"
      );
      if (btn) {
        btn.addEventListener(
          "click",
          function () {
            fillRoiIntoTaptopForm(form);
          },
          true
        );
      }
    }

    function mountNativeLeadForm() {
      var leadView = root.querySelector('[data-view="lead"]');
      var mount = el("roiTaptopMount");
      if (!mount && leadView) {
        // Legacy embed still has #roiLeadForm — replace with mount slot
        var legacy = leadView.querySelector("#roiLeadForm");
        if (legacy) legacy.hidden = true;
        mount = document.createElement("div");
        mount.id = "roiTaptopMount";
        mount.className = "itman-roi__taptop-mount";
        mount.setAttribute("aria-live", "polite");
        if (legacy && legacy.parentNode) {
          legacy.parentNode.insertBefore(mount, legacy);
        } else {
          leadView.appendChild(mount);
        }
        console.info("[ROI] v" + ROI_VER + " created #roiTaptopMount (legacy embed)");
      }
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
      unlockInteractive(mount);
      unlockInteractive(wrap);
      if (form) unlockInteractive(form);
      var captcha = (form || wrap).querySelector("smart-captcha, .SmartCaptcha, [data-captcha]");
      if (captcha) unlockInteractive(captcha);
      ensureMetaHideStyle();
      if (form) {
        ensureConsentField(form);
        bindConsentGate(form);
        fillRoiIntoTaptopForm(form);
        bindFillBeforeSubmit(form);
      }
      console.info("[ROI] v" + ROI_VER + " mounted native Taptop form", {
        anketa: form && form.getAttribute("data-s3-anketa-id"),
        formId: form && form.id,
        consent: form && findConsentCheckboxes(form).length,
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
