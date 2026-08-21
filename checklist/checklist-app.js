/* Full 20-point checklist lead magnet */
(function () {
  if (!window.ItmenChecklist) return;

  var root = document.getElementById("checklist-app");
  if (!root) return;

  var SECTIONS = ItmenChecklist.SECTIONS;
  var flat = [];
  SECTIONS.forEach(function (sec, si) {
    sec.items.forEach(function (item, ii) {
      flat.push({
        sectionIndex: si,
        itemIndex: ii,
        section: sec,
        item: item,
        n: flat.length + 1,
      });
    });
  });

  var answers = {};
  var idx = 0;
  var phase = "quiz"; // quiz | result | lead | done

  function scored() {
    return ItmenChecklist.scoreAnswers(answers);
  }

  function levelCls(pct) {
    if (pct >= 65) return "is-good";
    if (pct >= 35) return "is-mid";
    return "is-bad";
  }

  function showPhase(next) {
    phase = next;
    root.querySelectorAll("[data-phase]").forEach(function (el) {
      el.hidden = el.getAttribute("data-phase") !== next;
    });
    if (next === "quiz") renderQuiz();
    if (next === "result" || next === "lead") renderResult();
    refreshLive();
    if (next === "quiz" || next === "result") {
      var el = document.getElementById("quiz");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderQuiz() {
    var cur = flat[idx];
    if (!cur) return;
    var host = root.querySelector("[data-quiz-host]");
    if (!host) return;
    var q = cur.item;
    var sec = cur.section;
    var curAns = answers[q.id] || "";

    var html = "";
    html += '<div class="cl-progress" role="status">';
    html +=
      '<div class="cl-progress__bar"><span style="width:' +
      (idx / flat.length) * 100 +
      '%"></span></div>';
    html +=
      "<span>Вопрос " +
      cur.n +
      " из " +
      flat.length +
      " · раздел " +
      (cur.sectionIndex + 1) +
      "/4</span></div>";
    html += '<p class="cl-section-tag">' + sec.audience + " · " + sec.title + "</p>";
    html += '<p class="cl-q">' + q.text + "</p>";
    html += '<div class="cl-tri" role="group">';
    [
      ["yes", "Да"],
      ["mid", "Средне"],
      ["no", "Нет"],
    ].forEach(function (pair) {
      html +=
        '<button type="button" class="cl-pick' +
        (curAns === pair[0] ? " is-on" : "") +
        '" data-pick="' +
        q.id +
        '" data-v="' +
        pair[0] +
        '">' +
        pair[1] +
        "</button>";
    });
    html += "</div>";
    html += '<div class="cl-nav">';
    if (idx > 0) {
      html +=
        '<button type="button" class="cl-btn cl-btn--ghost" data-prev>← Назад</button>';
    } else {
      html += "<div></div>";
    }
    html +=
      '<button type="button" class="cl-btn" data-next' +
      (curAns ? "" : " disabled") +
      ">" +
      (idx < flat.length - 1 ? "Далее →" : "Посмотреть результат →") +
      "</button>";
    html += "</div>";
    host.innerHTML = html;

    root.querySelectorAll("[data-sec-dot]").forEach(function (d) {
      var s = Number(d.getAttribute("data-sec-dot"));
      d.classList.toggle("is-active", s === cur.sectionIndex);
      d.classList.toggle("is-done", s < cur.sectionIndex);
    });
  }

  function renderResult() {
    var s = scored();
    var pct = s.max ? Math.round((s.total / s.max) * 100) : 0;
    var bind = function (sel, html) {
      root.querySelectorAll(sel).forEach(function (n) {
        n.innerHTML = html;
      });
    };
    var text = function (sel, t) {
      root.querySelectorAll(sel).forEach(function (n) {
        n.textContent = t;
      });
    };

    text("[data-bind-score]", s.total + " / " + s.max);
    text("[data-bind-pct]", pct + "%");
    text("[data-bind-verdict]", s.level.title);
    text("[data-bind-meaning]", s.level.text);

    var bars = root.querySelector("[data-bars]");
    if (bars) {
      bars.innerHTML = SECTIONS.map(function (sec) {
        var st = s.bySection[sec.id] || { score: 0, max: 10 };
        var p = st.max ? Math.round((st.score / st.max) * 100) : 0;
        return (
          '<div class="cl-bar"><div class="cl-bar__head"><span>' +
          sec.title +
          "</span><strong>" +
          st.score +
          "/" +
          st.max +
          '</strong></div><div class="cl-bar__track"><div class="cl-bar__fill ' +
          levelCls(p) +
          '" style="width:' +
          Math.max(p, 6) +
          '%"></div></div></div>'
        );
      }).join("");
    }

    var risks = root.querySelector("[data-risks]");
    if (risks) {
      if (!s.gaps.length) {
        risks.innerHTML =
          '<p class="cl-muted">Критических провалов нет. В отчёте разберём, что усилить точечно.</p>';
      } else {
        risks.innerHTML = s.gaps
          .slice(0, 8)
          .map(function (g) {
            return (
              '<div class="cl-risk"><span class="cl-risk__aud">' +
              g.audience +
              "</span><p>" +
              g.text +
              "</p><small>" +
              g.rec +
              "</small></div>"
            );
          })
          .join("");
      }
    }

    var side = root.querySelector("[data-side-gaps]");
    if (side) {
      side.innerHTML = s.gaps.length
        ? s.gaps
            .slice(0, 4)
            .map(function (g) {
              return "<li>" + g.section + "</li>";
            })
            .join("")
        : "<li>Слабых зон почти нет</li>";
    }
  }

  function refreshLive() {
    var s = scored();
    var live = root.querySelector("[data-live-score]");
    if (live) {
      live.textContent = s.answered ? s.total + " / " + s.max : "— / 40";
    }
    var ans = root.querySelector("[data-live-answered]");
    if (ans) ans.textContent = s.answered + " из 20";
    var note = root.querySelector("[data-live-note]");
    if (note && phase === "quiz") {
      var cur = flat[idx];
      note.textContent = cur
        ? "Сейчас: " + cur.section.title
        : "20 пунктов из бесплатного чек-листа ИТМен";
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
      if (idx < flat.length - 1) {
        idx += 1;
        renderQuiz();
        refreshLive();
      } else {
        showPhase("result");
      }
      return;
    }
    if (btn.hasAttribute("data-prev")) {
      e.preventDefault();
      if (idx > 0) {
        idx -= 1;
        renderQuiz();
        refreshLive();
      }
      return;
    }
    if (btn.hasAttribute("data-start") || btn.id === "clStart") {
      e.preventDefault();
      idx = 0;
      showPhase("quiz");
      return;
    }
    if (btn.id === "clGetReport" || btn.closest("#clGetReport")) {
      e.preventDefault();
      showPhase("lead");
      return;
    }
    if (btn.id === "clEdit" || btn.closest("#clEdit")) {
      e.preventDefault();
      idx = 0;
      showPhase("quiz");
    }
  });

  var form = root.querySelector("#clLeadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = root.querySelector("#clName");
      var email = root.querySelector("#clEmail");
      if (!name || !email || !name.value.trim() || !email.value.trim()) return;
      showPhase("done");
    });
  }

  document.querySelectorAll("[data-start], #clStartHero").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      idx = 0;
      phase = "quiz";
      root.querySelectorAll("[data-phase]").forEach(function (el) {
        el.hidden = el.getAttribute("data-phase") !== "quiz";
      });
      renderQuiz();
      refreshLive();
      var el = document.getElementById("quiz");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // initial: hero visible, quiz panel ready but wait for start — show quiz UI empty state with CTA
  phase = "quiz";
  root.querySelectorAll("[data-phase]").forEach(function (el) {
    el.hidden = el.getAttribute("data-phase") !== "quiz";
  });
  renderQuiz();
  refreshLive();
})();
