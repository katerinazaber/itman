/* Inventory maturity self-assessment funnel */

(function () {
  const root = document.querySelector(".itman-audit");
  if (!root) return;

  const SCORES = {
    collect: { excel: 20, multi: 45, auto: 75, unified: 95 },
    freshness: { month: 20, week: 45, day: 75, realtime: 95 },
    visibility: { yes: 95, partial: 55, no: 25 },
  };

  const answers = { collect: null, freshness: null, visibility: null };
  let step = 1; // 1..3 questions
  let phase = "quiz"; // quiz | result | lead | done

  function level(score) {
    if (score >= 75) return { cls: "is-good", emoji: "🟢" };
    if (score >= 50) return { cls: "is-mid", emoji: "🟡" };
    return { cls: "is-bad", emoji: "🔴" };
  }

  function calc() {
    const c = SCORES.collect[answers.collect] ?? 0;
    const f = SCORES.freshness[answers.freshness] ?? 0;
    const v = SCORES.visibility[answers.visibility] ?? 0;

    const discovery = Math.round(c * 0.7 + f * 0.3);
    const freshness = f;
    const changes = Math.round(v * 0.55 + f * 0.45);
    const software = Math.round(c * 0.4 + v * 0.6);
    const overall = Math.round((discovery + freshness + changes + software) / 4);

    let verdict = "Есть зоны, которые стоит автоматизировать";
    let meaning =
      "Часть информации об инфраструктуре, вероятно, собирается вручную или обновляется с задержкой. Это повышает риск появления неучтённых устройств, неактуальных данных об оборудовании и ПО и затрудняет контроль изменений.";

    if (overall >= 80) {
      verdict = "Хороший уровень — можно усилить автоматизацию отдельных зон";
      meaning =
        "Базовый контроль ИТ-активов уже выстроен. Дальше имеет смысл закрыть оставшиеся пробелы: ускорить обновление данных, усилить контроль изменений и свести учёт в единую актуальную базу.";
    } else if (overall < 45) {
      verdict = "Инвентаризация требует автоматизации";
      meaning =
        "Сейчас данные об инфраструктуре, скорее всего, собираются вручную или фрагментарно. Это увеличивает риск неучтённых устройств, устаревших данных о ПО и потери времени специалистов на поиск актуальной информации.";
    }

    return {
      overall,
      verdict,
      meaning,
      bars: [
        { key: "discovery", label: "Обнаружение устройств", value: discovery },
        { key: "freshness", label: "Актуальность данных", value: freshness },
        { key: "changes", label: "Контроль изменений", value: changes },
        { key: "software", label: "Учёт ПО", value: software },
      ],
    };
  }

  function renderResult() {
    const r = calc();
    root.querySelectorAll("[data-bind-score]").forEach((el) => {
      el.textContent = r.overall + "%";
    });
    root.querySelectorAll("[data-bind-verdict]").forEach((el) => {
      el.textContent = r.verdict;
    });
    root.querySelectorAll("[data-bind-meaning]").forEach((el) => {
      el.textContent = r.meaning;
    });

    const barsHost = root.querySelector("[data-bars]");
    if (barsHost) {
      barsHost.innerHTML = r.bars
        .map((b) => {
          const lv = level(b.value);
          return `<div class="itman-audit__bar-row">
            <div class="itman-audit__bar-head">
              <span>${lv.emoji} ${b.label}</span>
              <strong>${b.value}%</strong>
            </div>
            <div class="itman-audit__bar-track"><span class="itman-audit__bar-fill ${lv.cls}" style="width:${b.value}%"></span></div>
          </div>`;
        })
        .join("");
    }
  }

  function updateStepper() {
    const visual = phase === "quiz" ? step : 4;
    root.querySelectorAll("[data-step-dot]").forEach((d) => {
      const s = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", s === visual);
      d.classList.toggle("is-done", s < visual);
    });
  }

  function showQuizStep(n) {
    step = n;
    root.querySelectorAll("[data-q]").forEach((p) => {
      p.hidden = Number(p.dataset.q) !== n;
    });
    updateStepper();
    refreshNextState();
  }

  function refreshNextState() {
    const map = { 1: "collect", 2: "freshness", 3: "visibility" };
    const key = map[step];
    const nextBtn = root.querySelector(`[data-q="${step}"] [data-next]`);
    if (nextBtn) nextBtn.disabled = !answers[key];
  }

  function setPhase(next) {
    phase = next;
    root.dataset.phase = next;

    const show = (sel, on) => {
      root.querySelectorAll(sel).forEach((el) => {
        el.hidden = !on;
      });
    };

    show('[data-view="quiz"]', next === "quiz");
    show('[data-view="summary"]', next === "result" || next === "lead" || next === "done");
    show('[data-view="side-intro"]', next === "quiz");
    show('[data-view="side-result"]', next === "result");
    show('[data-view="side-lead"]', next === "lead");
    show('[data-view="side-done"]', next === "done");

    if (next === "quiz") showQuizStep(step);
    if (next === "result" || next === "lead" || next === "done") renderResult();
    updateStepper();
  }

  root.querySelectorAll(".itman-audit__option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      answers[group] = value;
      root.querySelectorAll(`.itman-audit__option[data-group="${group}"]`).forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
      refreshNextState();
    });
  });

  root.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const to = Number(btn.dataset.next);
      if (to === 4) {
        setPhase("result");
      } else {
        showQuizStep(to);
      }
    });
  });

  root.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => showQuizStep(Number(btn.dataset.prev)));
  });

  document.getElementById("auditGetReport")?.addEventListener("click", () => setPhase("lead"));
  document.getElementById("auditEdit")?.addEventListener("click", () => {
    step = 1;
    setPhase("quiz");
  });

  document.getElementById("auditLeadForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("auditName")?.value?.trim();
    const email = document.getElementById("auditEmail")?.value?.trim();
    if (!name || !email) return;
    setPhase("done");
  });

  setPhase("quiz");
})();
