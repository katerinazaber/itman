/* Short 4-question infra-control lead magnet */
(function () {
  var root = document.querySelector("#infra-control.itman-roi");
  if (!root || !window.ItmenChecklistShort) return;

  var QUESTIONS = ItmenChecklistShort.QUESTIONS;
  var answers = {};
  var step = 1; // 1..4
  var phase = "quiz";
  var RESULT_DOT = 5;

  function levelCls(pct) {
    if (pct >= 75) return "is-good";
    if (pct >= 50) return "is-mid";
    return "is-bad";
  }

  function scored() {
    return ItmenChecklistShort.scoreAnswers(answers);
  }

  function updateStepper() {
    var visual = phase === "quiz" ? step : RESULT_DOT;
    root.querySelectorAll("[data-step-dot]").forEach(function (d) {
      var s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === visual);
      d.classList.toggle("is-done", s < visual);
    });
  }

  function currentQ() {
    return QUESTIONS[step - 1];
  }

  function renderQuiz() {
    var host = root.querySelector("[data-quiz-host]");
    if (!host) return;
    var q = currentQ();
    var cur = answers[q.id] || "";
    var html = "";
    html +=
      '<p class="itman-roi__sec-prog">Вопрос ' + step + " из 4</p>";
    html += '<span class="itman-roi__aud-tag">' + q.audience + "</span>";
    html += '<p class="itman-roi__q">' + q.q + "</p>";
    html +=
      '<p class="itman-roi__subq" style="margin:0 0 16px;font-size:13px;color:var(--roi-muted);line-height:1.45">' +
      q.hint +
      "</p>";
    html += '<div class="itman-roi__tri" role="group" style="margin-bottom:8px">';
    [
      ["yes", "Да — в целом так"],
      ["mid", "Средне — частично"],
      ["no", "Нет — скорее нет"],
    ].forEach(function (pair) {
      html +=
        '<button type="button" data-pick="' +
        q.id +
        '" data-v="' +
        pair[0] +
        '"' +
        (cur === pair[0] ? ' class="is-on"' : "") +
        ">" +
        pair[1] +
        "</button>";
    });
    html += "</div>";
    html += '<div class="itman-roi__nav">';
    if (step > 1) {
      html +=
        '<button type="button" class="itman-roi__btn itman-roi__btn--ghost" data-prev>← Назад</button>';
    } else {
      html += "<div></div>";
    }
    html +=
      '<button type="button" class="itman-roi__btn" data-next' +
      (cur ? "" : " disabled") +
      ">" +
      (step < 4 ? "Далее →" : "Получить результат →") +
      "</button>";
    html += "</div>";
    host.innerHTML = html;
  }

  function renderResult() {
    var s = scored();
    var pct = s.max ? Math.round((s.total / s.max) * 100) : 0;

    root.querySelectorAll("[data-bind-score]").forEach(function (n) {
      n.innerHTML = s.total + ' <span>/ ' + s.max + "</span>";
    });
    root.querySelectorAll("[data-bind-verdict]").forEach(function (n) {
      n.textContent = s.level.title;
    });
    root.querySelectorAll("[data-bind-meaning]").forEach(function (n) {
      n.textContent = s.level.text;
    });
    root.querySelectorAll("[data-bind-pct]").forEach(function (n) {
      n.textContent = pct + "%";
    });

    var riskHost = root.querySelector("[data-risks]");
    if (riskHost) {
      if (!s.gaps.length) {
        riskHost.innerHTML =
          '<p class="itman-roi__preview-note">Критичных провалов по экспресс-оценке не видно. В подробном отчёте разберём, что усилить точечно.</p>';
      } else {
        riskHost.innerHTML = s.gaps
          .map(function (g) {
            return (
              '<div class="itman-roi__risk"><span class="aud">' +
              g.audience +
              "</span><strong>" +
              g.section +
              "</strong>" +
              g.risk +
              "</div>"
            );
          })
          .join("");
      }
    }

    var bars = root.querySelector("[data-bars]");
    if (bars) {
      bars.innerHTML = QUESTIONS.map(function (q) {
        var st = s.bySection[q.id] || { score: 0, max: 2 };
        var p = st.max ? Math.round((st.score / st.max) * 100) : 0;
        var label =
          st.score === 2 ? "Да" : st.score === 1 ? "Средне" : "Нет";
        return (
          '<div class="itman-roi__bar-row"><div class="itman-roi__bar-head"><span>' +
          q.title +
          "</span><strong>" +
          label +
          '</strong></div><div class="itman-roi__bar-track"><div class="itman-roi__bar-fill ' +
          levelCls(p) +
          '" style="width:' +
          Math.max(p, 8) +
          '%"></div></div></div>'
        );
      }).join("");
    }

    var sideRisk = root.querySelector("[data-side-risks]");
    if (sideRisk) {
      sideRisk.innerHTML = s.gaps.length
        ? s.gaps
            .map(function (g) {
              return (
                "<li><strong>" +
                g.audience +
                ":</strong> " +
                g.section +
                "</li>"
              );
            })
            .join("")
        : "<li>Экспресс-оценка без критичных зон</li>";
    }
  }

  function setPhase(next) {
    phase = next;
    root.dataset.phase = next;
    function show(sel, on) {
      root.querySelectorAll(sel).forEach(function (el) {
        el.hidden = !on;
      });
    }
    show('[data-view="quiz"]', next === "quiz");
    show(
      '[data-view="summary"]',
      next === "result" || next === "lead" || next === "done"
    );
    show('[data-view="preview"]', next === "quiz");
    show('[data-view="cta"]', next === "result");
    show('[data-view="lead"]', next === "lead");
    show('[data-view="done"]', next === "done");
    if (next === "quiz") renderQuiz();
    if (next === "result" || next === "lead" || next === "done") renderResult();
    updateStepper();
    refreshLive();
  }

  function refreshLive() {
    var s = scored();
    var live = root.querySelector("[data-live-score]");
    if (live) live.textContent = s.answered ? s.total + " / " + s.max : "— / 8";
    var liveAns = root.querySelector("[data-live-answered]");
    if (liveAns) liveAns.textContent = s.answered + " из 4";
    var note = root.querySelector("[data-live-note]");
    if (note && phase === "quiz") {
      note.textContent =
        "Короткая экспресс-оценка по 4 зонам чек-листа. Подробный разбор — в отчёте после заявки.";
    }
  }

  root.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn || !root.contains(btn)) return;

    if (btn.hasAttribute("data-pick")) {
      e.preventDefault();
      answers[btn.getAttribute("data-pick")] = btn.getAttribute("data-v");
      renderQuiz();
      refreshLive();
      return;
    }
    if (btn.hasAttribute("data-next")) {
      if (btn.disabled) return;
      e.preventDefault();
      if (step < 4) {
        step += 1;
        renderQuiz();
        updateStepper();
        refreshLive();
      } else {
        setPhase("result");
      }
      return;
    }
    if (btn.hasAttribute("data-prev")) {
      e.preventDefault();
      if (step > 1) {
        step -= 1;
        renderQuiz();
        updateStepper();
        refreshLive();
      }
      return;
    }
    if (btn.id === "clGetReport" || btn.closest("#clGetReport")) {
      e.preventDefault();
      setPhase("lead");
      return;
    }
    if (btn.id === "clEdit" || btn.closest("#clEdit")) {
      e.preventDefault();
      step = 1;
      setPhase("quiz");
    }
  });

  var form = root.querySelector("#clLeadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = root.querySelector("#clName");
      var email = root.querySelector("#clEmail");
      if (!name || !email || !name.value.trim() || !email.value.trim()) return;
      setPhase("done");
    });
  }

  setPhase("quiz");
})();
