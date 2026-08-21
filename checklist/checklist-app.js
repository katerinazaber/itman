/* Full 20-point express-audit lead magnet */
(function () {
  if (!window.ItmenChecklist) return;

  var root = document.getElementById("checklist-app");
  if (!root) return;

  var SECTIONS = ItmenChecklist.SECTIONS;
  var flat = [];
  SECTIONS.forEach(function (sec, si) {
    sec.items.forEach(function (item) {
      flat.push({
        sectionIndex: si,
        section: sec,
        item: item,
        n: flat.length + 1,
      });
    });
  });

  var answers = {};
  var idx = 0;
  var phase = "quiz";

  function scored() {
    return ItmenChecklist.scoreAnswers(answers);
  }

  function levelCls(pct) {
    if (pct >= 65) return "is-good";
    if (pct >= 28) return "is-mid";
    return "is-bad";
  }

  function levelKey(total) {
    if (total >= 26) return "good";
    if (total >= 11) return "mid";
    return "bad";
  }

  function showPhase(next) {
    phase = next;

    var afterQuiz = next !== "quiz";
    document.querySelectorAll("[data-page-phase]").forEach(function (el) {
      var want = el.getAttribute("data-page-phase");
      if (want === "quiz") el.hidden = afterQuiz;
      else if (want === "after") el.hidden = !afterQuiz;
    });

    document.querySelectorAll('[data-phase="quiz"]').forEach(function (el) {
      el.hidden = next !== "quiz";
    });

    // Form card: lead vs done
    document.querySelectorAll('[data-phase="lead"]').forEach(function (el) {
      el.hidden = next === "done";
    });
    document.querySelectorAll('[data-phase="done"]').forEach(function (el) {
      el.hidden = next !== "done";
    });

    if (next === "quiz") renderQuiz();
    if (afterQuiz) renderResult();
    refreshLive();

    if (next === "result") {
      var r = document.getElementById("result");
      if (r) r.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (next === "lead" || next === "done") {
      var l = document.getElementById("lead");
      if (l) l.scrollIntoView({ behavior: "smooth", block: "start" });
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
      ((idx + (curAns ? 1 : 0)) / flat.length) * 100 +
      '%"></span></div>';
    html +=
      "<span>Вопрос " +
      cur.n +
      " из " +
      flat.length +
      " · раздел " +
      (cur.sectionIndex + 1) +
      "/4</span></div>";
    html +=
      '<p class="cl-section-tag">' + sec.audience + " · " + sec.title + "</p>";
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
      (idx < flat.length - 1 ? "Далее →" : "Смотреть результат →") +
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
    var key = levelKey(s.total);

    document.querySelectorAll("[data-bind-score]").forEach(function (n) {
      n.innerHTML =
        s.total + " / " + s.max + " <span>" + pct + "%</span>";
    });
    document.querySelectorAll("[data-bind-verdict]").forEach(function (n) {
      n.textContent = s.level.title;
    });
    document.querySelectorAll("[data-bind-meaning]").forEach(function (n) {
      n.textContent = s.level.text;
    });

    document.querySelectorAll("[data-level-card]").forEach(function (card) {
      card.classList.toggle(
        "is-active",
        card.getAttribute("data-level-card") === key
      );
    });

    var bars = document.querySelector("[data-bars]");
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

    var risks = document.querySelector("[data-risks]");
    if (risks) {
      if (!s.gaps.length) {
        risks.innerHTML =
          '<p class="cl-muted">Критических провалов нет. В разборе усилим точечные зоны.</p>';
      } else {
        risks.innerHTML = s.gaps
          .slice(0, 6)
          .map(function (g) {
            return (
              '<div class="cl-risk"><span class="cl-risk__aud">' +
              g.audience +
              "</span><p>" +
              g.text +
              "</p></div>"
            );
          })
          .join("");
      }
    }
  }

  function refreshLive() {
    var s = scored();
    var live = root.querySelector("[data-live-score]");
    if (live) live.textContent = s.answered ? s.total + " / " + s.max : "— / 40";
    var ans = root.querySelector("[data-live-answered]");
    if (ans) ans.textContent = s.answered + " из 20";
    var note = root.querySelector("[data-live-note]");
    if (note && phase === "quiz") {
      var cur = flat[idx];
      note.textContent = cur
        ? "Сейчас: " + cur.section.title
        : "20 пунктов из чек-листа ИТМен";
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
    }
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("button, a");
    if (!btn) return;
    if (btn.id === "clToLead" || btn.closest("#clToLead")) {
      e.preventDefault();
      showPhase("lead");
      return;
    }
    if (btn.id === "clEdit" || btn.closest("#clEdit")) {
      e.preventDefault();
      idx = 0;
      showPhase("quiz");
      var q = document.getElementById("quiz");
      if (q) q.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (btn.hasAttribute("data-go-quiz")) {
      e.preventDefault();
      if (phase !== "quiz") {
        idx = 0;
        showPhase("quiz");
      }
      var quiz = document.getElementById("quiz");
      if (quiz) quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  var form = document.querySelector("#clLeadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.querySelector("#clName");
      var email = document.querySelector("#clEmail");
      if (!name || !email || !name.value.trim() || !email.value.trim()) return;
      showPhase("done");
    });
  }

  showPhase("quiz");
})();
