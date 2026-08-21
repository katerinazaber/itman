/* ROI calculator preview with finance/security/exec quiz */
(function () {
  var root = document.querySelector("#roi-calculator.itman-roi");
  if (!root || !window.ItmenRoiReport) return;

  var phase = "input"; // input | result
  var inputStep = 1; // 1..3 or "quiz1".."quiz6"
  var quiz = {
    usage: null,
    budget_basis: null,
    segments: null,
    shadow: null,
    projects: null,
    downtime: null,
  };

  function el(id) {
    return root.querySelector("#" + id);
  }

  function parseBudget(raw) {
    var n = Number(String(raw || "").replace(/\D/g, ""));
    return isFinite(n) ? n : 0;
  }

  function getInputs() {
    return {
      endpoints: Number(el("roiWp") && el("roiWp").value) || 0,
      itStaff: Number(el("roiIt") && el("roiIt").value) || 0,
      budget: parseBudget(el("roiBudget") && el("roiBudget").value),
      quiz: {
        usage: quiz.usage || "installs",
        budget_basis: quiz.budget_basis || "lists",
        segments: quiz.segments || "some",
        shadow: quiz.shadow || "reactive",
        projects: quiz.projects || "sometimes",
        downtime: quiz.downtime || "sometimes",
      },
    };
  }

  function model() {
    return ItmenRoiReport.buildReportModel(getInputs(), {});
  }

  function refreshNumbers() {
    var m = model();
    var c = m.calc;
    var f = c.fmt;
    root.querySelectorAll('[data-bind="save"]').forEach(function (n) {
      n.textContent = f.save;
    });
    root.querySelectorAll('[data-bind="roi"]').forEach(function (n) {
      n.textContent = f.roi;
    });
    root.querySelectorAll('[data-bind="pay"]').forEach(function (n) {
      n.textContent = f.pay;
    });

    var gapsHost = root.querySelector("[data-gaps]");
    if (gapsHost) {
      var gaps = m.narrative.gaps || [];
      gapsHost.innerHTML = gaps
        .map(function (g) {
          return (
            '<div class="itman-roi__gap"><span class="aud">' +
            escapeHtml(g.audience || "") +
            "</span><strong>" +
            escapeHtml(g.title) +
            "</strong>" +
            escapeHtml(g.text) +
            "</div>"
          );
        })
        .join("");
    }

    var note = el("roiPreviewNote");
    if (note && phase === "input") {
      var answered = Object.keys(quiz).filter(function (k) {
        return quiz[k];
      }).length;
      if (typeof inputStep === "string" && String(inputStep).indexOf("quiz") === 0) {
        note.textContent =
          "Диагностика: отвечено " + answered + " из 6 — цифры уже учитывают слабые места";
      } else {
        note.textContent =
          "Сначала масштаб парка, затем диагностика для финансов, ИБ и руководства";
      }
    }

    updateReportLink();
  }

  function updateReportLink() {
    var inp = getInputs();
    var u = new URL("./report/", location.href);
    u.searchParams.set("wp", String(inp.endpoints));
    u.searchParams.set("it", String(inp.itStaff));
    u.searchParams.set("budget", String(inp.budget));
    u.searchParams.set("usage", inp.quiz.usage);
    u.searchParams.set("budget_basis", inp.quiz.budget_basis);
    u.searchParams.set("segments", inp.quiz.segments);
    u.searchParams.set("shadow", inp.quiz.shadow);
    u.searchParams.set("projects", inp.quiz.projects);
    u.searchParams.set("downtime", inp.quiz.downtime);
    ["roiOpenReport", "roiGetReportBtn"].forEach(function (id) {
      var a = el(id);
      if (a) a.href = u.pathname + u.search + (u.pathname.indexOf("report") >= 0 ? "" : "");
      // fix relative
      if (a) a.setAttribute("href", "./report/" + u.search);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function visualDot() {
    if (phase === "result") return 5;
    if (typeof inputStep === "string" && String(inputStep).indexOf("quiz") === 0) return 4;
    return Number(inputStep) || 1;
  }

  function updateStepper() {
    var v = visualDot();
    root.querySelectorAll("[data-step-dot]").forEach(function (d) {
      var s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === v);
      d.classList.toggle("is-done", s < v);
    });
  }

  function showPanel(step) {
    inputStep = step;
    root.dataset.inputStep = String(step);
    root.querySelectorAll("[data-input-panel]").forEach(function (p) {
      var key = p.dataset.inputPanel;
      var on =
        String(step) === key ||
        (typeof step === "number" && Number(key) === step);
      p.hidden = !on;
    });
    updateStepper();
    refreshQuizButtons();
    refreshNumbers();
  }

  function setPhase(next) {
    phase = next;
    root.dataset.phase = next;
    root.querySelectorAll('[data-view="input"]').forEach(function (n) {
      n.hidden = next !== "input";
    });
    root.querySelectorAll('[data-view="summary"]').forEach(function (n) {
      n.hidden = next !== "result";
    });
    root.querySelectorAll('[data-view="preview"]').forEach(function (n) {
      n.hidden = next !== "input";
    });
    root.querySelectorAll('[data-view="cta"]').forEach(function (n) {
      n.hidden = next !== "result";
    });
    updateStepper();
    refreshNumbers();
  }

  function refreshQuizButtons() {
    root.querySelectorAll("[data-need-quiz]").forEach(function (btn) {
      var key = btn.getAttribute("data-need-quiz");
      btn.disabled = !quiz[key];
    });
  }

  function formatBudgetInput(node) {
    var digits = String(node.value || "").replace(/\D/g, "");
    node.value = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
  }

  root.addEventListener("click", function (e) {
    var t = e.target.closest(
      "button, a, .itman-roi__pill, .itman-roi__option, [data-go-input], [data-go-quiz]"
    );
    if (!t || !root.contains(t)) return;

    if (t.classList.contains("itman-roi__pill") || t.closest(".itman-roi__pill")) {
      var pill = t.classList.contains("itman-roi__pill") ? t : t.closest(".itman-roi__pill");
      e.preventDefault();
      root.querySelectorAll(".itman-roi__pill").forEach(function (b) {
        b.classList.remove("is-active");
      });
      pill.classList.add("is-active");
      if (el("roiWp")) el("roiWp").value = pill.dataset.wp || "300";
      refreshNumbers();
      return;
    }

    if (t.classList.contains("itman-roi__option") || t.closest(".itman-roi__option")) {
      var opt = t.classList.contains("itman-roi__option") ? t : t.closest(".itman-roi__option");
      e.preventDefault();
      var group = opt.getAttribute("data-quiz-group");
      var value = opt.getAttribute("data-value");
      quiz[group] = value;
      root.querySelectorAll('.itman-roi__option[data-quiz-group="' + group + '"]').forEach(function (b) {
        b.classList.toggle("is-active", b === opt);
      });
      refreshQuizButtons();
      refreshNumbers();
      return;
    }

    if (t.hasAttribute("data-go-input") || t.closest("[data-go-input]")) {
      var btn = t.hasAttribute("data-go-input") ? t : t.closest("[data-go-input]");
      e.preventDefault();
      showPanel(Number(btn.getAttribute("data-go-input")));
      return;
    }

    if (t.hasAttribute("data-go-quiz") || t.closest("[data-go-quiz]")) {
      var qb = t.hasAttribute("data-go-quiz") ? t : t.closest("[data-go-quiz]");
      if (qb.disabled) return;
      e.preventDefault();
      showPanel("quiz" + qb.getAttribute("data-go-quiz"));
      return;
    }

    if (t.id === "roiCalcBtn" || t.closest("#roiCalcBtn")) {
      var calcBtn = t.id === "roiCalcBtn" ? t : t.closest("#roiCalcBtn");
      if (calcBtn.disabled) return;
      e.preventDefault();
      setPhase("result");
      return;
    }

    if (t.id === "roiEditBtn" || t.closest("#roiEditBtn")) {
      e.preventDefault();
      setPhase("input");
      showPanel(1);
    }
  });

  root.addEventListener("input", function (e) {
    if (e.target && e.target.id === "roiBudget") formatBudgetInput(e.target);
    if (e.target && (e.target.id === "roiBudget" || e.target.id === "roiIt")) refreshNumbers();
  });

  setPhase("input");
  showPanel(1);
})();
