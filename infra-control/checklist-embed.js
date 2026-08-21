/* Lead magnet: Под контролем ли ваша ИТ-инфраструктура? */
(function () {
  var root = document.querySelector("#infra-control.itman-roi");
  if (!root || !window.ItmenChecklist) return;

  var SECTIONS = ItmenChecklist.SECTIONS;
  var answers = {};
  var sectionIdx = 0; // 0..3 quiz, then result
  var phase = "quiz"; // quiz | result | lead | done
  var RESULT_DOT = 5;

  function levelCls(pct) {
    if (pct >= 75) return "is-good";
    if (pct >= 50) return "is-mid";
    return "is-bad";
  }

  function scored() {
    return ItmenChecklist.scoreAnswers(answers);
  }

  function sectionComplete(sec) {
    return sec.items.every(function (it) {
      return answers[it.id] === "yes" || answers[it.id] === "mid" || answers[it.id] === "no";
    });
  }

  function updateStepper() {
    var visual = phase === "quiz" ? sectionIdx + 1 : RESULT_DOT;
    root.querySelectorAll("[data-step-dot]").forEach(function (d) {
      var s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === visual);
      d.classList.toggle("is-done", s < visual);
    });
  }

  function renderQuizPanel() {
    var host = root.querySelector("[data-quiz-host]");
    if (!host) return;
    var sec = SECTIONS[sectionIdx];
    var startNum = sectionIdx * 5;
    var html = "";
    html +=
      '<p class="itman-roi__sec-prog">Раздел ' +
      (sectionIdx + 1) +
      " из 4 · пункты " +
      (startNum + 1) +
      "–" +
      (startNum + 5) +
      "</p>";
    html += '<span class="itman-roi__aud-tag">' + sec.audience + "</span>";
    html += '<p class="itman-roi__q">' + sec.title + "</p>";
    html +=
      '<p class="itman-roi__subq" style="margin:0 0 16px;font-size:13px;color:var(--roi-muted);line-height:1.45">Отметьте каждый пункт: Да (2), Средне (1) или Нет (0)</p>';

    sec.items.forEach(function (item, i) {
      var cur = answers[item.id] || "";
      html += '<div class="itman-roi__check-row">';
      html +=
        "<p><span class=\"n\">" +
        (startNum + i + 1) +
        "</span>" +
        item.text +
        "</p>";
      html += '<div class="itman-roi__tri" role="group">';
      [
        ["yes", "Да"],
        ["mid", "Средне"],
        ["no", "Нет"],
      ].forEach(function (pair) {
        html +=
          '<button type="button" data-id="' +
          item.id +
          '" data-v="' +
          pair[0] +
          '"' +
          (cur === pair[0] ? ' class="is-on"' : "") +
          ">" +
          pair[1] +
          "</button>";
      });
      html += "</div></div>";
    });

    html += '<div class="itman-roi__nav">';
    if (sectionIdx > 0) {
      html +=
        '<button type="button" class="itman-roi__btn itman-roi__btn--ghost" data-prev-sec>← Назад</button>';
    } else {
      html += "<div></div>";
    }
    var nextLabel =
      sectionIdx < 3 ? "Далее →" : "Получить результат →";
    html +=
      '<button type="button" class="itman-roi__btn" data-next-sec' +
      (sectionComplete(sec) ? "" : " disabled") +
      ">" +
      nextLabel +
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

    var risks = s.gaps.filter(function (g) {
      return g.score === 0;
    });
    if (risks.length < 4) {
      risks = s.gaps.slice(0, 6);
    } else {
      risks = risks.slice(0, 6);
    }

    var riskHost = root.querySelector("[data-risks]");
    if (riskHost) {
      if (!risks.length) {
        riskHost.innerHTML =
          '<p class="itman-roi__preview-note">Критичных провалов не видно — поддерживайте уровень и усиливайте «Средне».</p>';
      } else {
        riskHost.innerHTML = risks
          .map(function (g) {
            return (
              '<div class="itman-roi__risk"><span class="aud">' +
              g.audience +
              "</span><strong>" +
              g.section +
              "</strong>" +
              g.rec +
              "</div>"
            );
          })
          .join("");
      }
    }

    var bars = root.querySelector("[data-bars]");
    if (bars) {
      bars.innerHTML = SECTIONS.map(function (sec) {
        var st = s.bySection[sec.id] || { score: 0, max: 10 };
        var p = st.max ? Math.round((st.score / st.max) * 100) : 0;
        return (
          '<div class="itman-roi__bar-row"><div class="itman-roi__bar-head"><span>' +
          sec.title +
          "</span><strong>" +
          st.score +
          "/" +
          st.max +
          '</strong></div><div class="itman-roi__bar-track"><div class="itman-roi__bar-fill ' +
          levelCls(p) +
          '" style="width:' +
          p +
          '%"></div></div></div>'
        );
      }).join("");
    }

    var sideRisk = root.querySelector("[data-side-risks]");
    if (sideRisk) {
      var weakSecs = SECTIONS.map(function (sec) {
        var st = s.bySection[sec.id] || { score: 0, max: 10 };
        return { title: sec.title, audience: sec.audience, pct: st.max ? st.score / st.max : 0, score: st.score, max: st.max };
      })
        .filter(function (x) {
          return x.pct < 0.75;
        })
        .sort(function (a, b) {
          return a.pct - b.pct;
        })
        .slice(0, 3);
      sideRisk.innerHTML = weakSecs.length
        ? weakSecs
            .map(function (x) {
              return (
                "<li><strong>" +
                x.audience +
                ":</strong> " +
                x.title +
                " — " +
                x.score +
                "/" +
                x.max +
                "</li>"
              );
            })
            .join("")
        : "<li>Все разделы ≥ 75% — хороший контроль</li>";
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
    show('[data-view="summary"]', next === "result" || next === "lead" || next === "done");
    show('[data-view="preview"]', next === "quiz");
    show('[data-view="cta"]', next === "result");
    show('[data-view="lead"]', next === "lead");
    show('[data-view="done"]', next === "done");
    if (next === "quiz") renderQuizPanel();
    if (next === "result" || next === "lead" || next === "done") renderResult();
    updateStepper();
    refreshSideLive();
  }

  function refreshSideLive() {
    var s = scored();
    var live = root.querySelector("[data-live-score]");
    if (live) {
      live.textContent = s.answered ? s.total + " / " + (s.max || 40) : "— / 40";
    }
    var liveAns = root.querySelector("[data-live-answered]");
    if (liveAns) liveAns.textContent = s.answered + " из 20";
    var note = root.querySelector("[data-live-note]");
    if (note && phase === "quiz") {
      note.textContent =
        "Раздел " +
        (sectionIdx + 1) +
        " из 4. После всех пунктов покажем риски по зонам.";
    }
  }

  root.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn || !root.contains(btn)) return;

    if (btn.hasAttribute("data-id") && btn.hasAttribute("data-v")) {
      e.preventDefault();
      answers[btn.getAttribute("data-id")] = btn.getAttribute("data-v");
      renderQuizPanel();
      refreshSideLive();
      return;
    }
    if (btn.hasAttribute("data-next-sec")) {
      if (btn.disabled) return;
      e.preventDefault();
      if (sectionIdx < 3) {
        sectionIdx += 1;
        renderQuizPanel();
        updateStepper();
        refreshSideLive();
      } else {
        setPhase("result");
      }
      return;
    }
    if (btn.hasAttribute("data-prev-sec")) {
      e.preventDefault();
      if (sectionIdx > 0) {
        sectionIdx -= 1;
        renderQuizPanel();
        updateStepper();
        refreshSideLive();
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
      sectionIdx = 0;
      setPhase("quiz");
      return;
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
