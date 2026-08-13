/* CMDB data readiness self-assessment funnel */

(function () {
  const root = document.querySelector(".itman-audit");
  if (!root) return;

  const SCORES = {
    sources: { one: 72, two_three: 84, four_five: 78, five_plus: 62 },
    duplicates: { never: 95, sometimes: 72, often: 38, unknown: 28 },
    freshness: { auto: 95, sync: 72, manual: 48, no_guarantee: 26 },
    segments: { no: 95, some: 74, closed: 42, unknown: 32 },
    normalize: { auto: 95, partial: 72, manual: 46, none: 24 },
  };

  const INTEGRATION_SOURCES = { one: 88, two_three: 74, four_five: 58, five_plus: 38 };

  const answers = {
    sources: null,
    duplicates: null,
    freshness: null,
    segments: null,
    normalize: null,
  };

  const QUESTION_KEYS = ["sources", "duplicates", "freshness", "segments", "normalize"];
  const RESULT_STEP = 6;
  let step = 1;
  let phase = "quiz";

  function level(score) {
    if (score >= 75) return { cls: "is-good", emoji: "🟢" };
    if (score >= 50) return { cls: "is-mid", emoji: "🟡" };
    return { cls: "is-bad", emoji: "🔴" };
  }

  function score(key) {
    return SCORES[key][answers[key]] ?? 0;
  }

  function calc() {
    const s = score("sources");
    const d = score("duplicates");
    const f = score("freshness");
    const g = score("segments");
    const n = score("normalize");
    const i = INTEGRATION_SOURCES[answers.sources] ?? 0;

    const completeness = Math.round((s * 0.35 + g * 0.35 + d * 0.3));
    const freshness = f;
    const quality = Math.round((d * 0.45 + n * 0.55));
    const integration = Math.round((i * 0.55 + g * 0.45));
    const overall = Math.round((completeness + freshness + quality + integration) / 4);

    let verdict = "Данные частично готовы к CMDB";
    let meaning =
      "Основной риск — разрозненные форматы данных и необходимость ручной нормализации. Перед построением CMDB потребуется подготовить и унифицировать данные из нескольких источников.";

    if (overall >= 80) {
      verdict = "Данные готовы к CMDB";
      meaning =
        "Базовые процессы сбора и нормализации данных уже выстроены. Можно переходить к наполнению CMDB, параллельно закрывая оставшиеся зоны: дубли, закрытые сегменты и редкие источники.";
    } else if (overall < 55) {
      verdict = "Данные требуют подготовки перед CMDB";
      meaning =
        "Сейчас данные, скорее всего, собираются фрагментарно, с дублями и без единой нормализации. Без подготовительного этапа CMDB быстро превратится в ещё один источник неактуальной информации.";
    } else {
      const weakest = [
        { key: "quality", label: "нормализация и качество данных", value: quality },
        { key: "integration", label: "интеграция источников", value: integration },
        { key: "completeness", label: "полнота охвата", value: completeness },
        { key: "freshness", label: "актуальность данных", value: freshness },
      ].sort((a, b) => a.value - b.value)[0];

      if (weakest.key === "integration") {
        meaning =
          "Основной риск — данные из нескольких систем ещё не сведены в единую картину. Перед построением CMDB потребуется выстроить интеграцию источников и правила сопоставления активов.";
      } else if (weakest.key === "freshness") {
        meaning =
          "Основной риск — данные обновляются с задержкой или вручную. CMDB на такой базе быстро устареет: сначала стоит автоматизировать сбор и синхронизацию.";
      } else if (weakest.key === "completeness") {
        meaning =
          "Основной риск — не все сегменты инфраструктуры попадают в единую базу. Перед CMDB нужно закрыть «слепые зоны» и обеспечить регулярный сбор из закрытых периметров.";
      }
    }

    return {
      overall,
      verdict,
      meaning,
      bars: [
        { key: "completeness", label: "Полнота данных", value: completeness },
        { key: "freshness", label: "Актуальность", value: freshness },
        { key: "quality", label: "Качество / нормализация", value: quality },
        { key: "integration", label: "Интеграция источников", value: integration },
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
    const visual = phase === "quiz" ? step : RESULT_STEP;
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
    const key = QUESTION_KEYS[step - 1];
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
      if (to === RESULT_STEP) {
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
