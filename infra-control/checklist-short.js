/**
 * Short lead-magnet checklist (4 section questions from the 20-point PDF).
 * Score: Да=2, Средне=1, Нет=0 · max 8
 */
(function (global) {
  "use strict";

  var QUESTIONS = [
    {
      id: "inventory",
      step: 1,
      audience: "Учёт активов",
      title: "Инвентаризация и учёт",
      q: "Есть ли у вас единая автоматическая инвентаризация — все устройства, ПО и пользователи в одной системе с историей изменений?",
      hint: "В полном чек-листе это 5 пунктов: автосбор, агрегация источников, единая база, все локации, автообнаружение.",
      riskTitle: "Инвентаризация и учёт",
      risk: "Без единого автоматического учёта часть парка остаётся в «серой зоне», а данные для решений устаревают.",
      rec: "Внедрить непрерывный сбор и один подтверждаемый реестр активов вместо разовых проектов инвентаризации.",
    },
    {
      id: "security",
      step: 2,
      audience: "ПО и ИБ",
      title: "Контроль ПО и безопасность",
      q: "Контролируете ли установленное и запрещённое ПО, видите usage и получаете оповещения об изменениях в инфраструктуре?",
      hint: "В полном чек-листе: каталог ПО, запрещённое ПО, usage, контроль изменений, отчёты для регуляторов.",
      riskTitle: "Контроль ПО и ИБ",
      risk: "Теневое и запрещённое ПО, слабый usage и отсутствие алертов на изменения — прямые риски для ИБ и комплаенса.",
      rec: "Нормализовать каталог ПО, регулярно выявлять нелегитимные установки и фиксировать изменения конфигурации.",
    },
    {
      id: "licenses",
      step: 3,
      audience: "Финансы",
      title: "Лицензии и затраты",
      q: "Знаете ли точно, какие лицензии куплены, где стоят, что не используется — и строите ли ИТ-бюджет на этих данных?",
      hint: "В полном чек-листе: учёт лицензий, чистота, неиспользуемые, TCO, бюджет на фактах.",
      riskTitle: "Лицензии и бюджет",
      risk: "Без картины «куплено / установлено / используется» бюджет уходит на простой и слепые продления.",
      rec: "Свести лицензии с usage и пересобрать закупки и продления на фактическом использовании.",
    },
    {
      id: "ops",
      step: 4,
      audience: "Руководство",
      title: "Операционная эффективность",
      q: "Автоматизирован ли рутинный учёт, можете ли быстро найти активы при изменениях и доказать ROI ИТ-инвестиций?",
      hint: "В полном чек-листе: автоматизация рутины, скорость реакции, точность для проектов, ROI, масштабирование.",
      riskTitle: "Эффективность и проекты",
      risk: "Ручной учёт и неточные данные тормозят проекты, offboarding и доказательство эффекта инвестиций.",
      rec: "Снять рутину с ИТ, связать пользователь↔устройства↔ПО и использовать данные для планирования и ROI.",
    },
  ];

  function scoreAnswers(answers) {
    var total = 0;
    var max = 0;
    var gaps = [];
    var bySection = {};

    QUESTIONS.forEach(function (q) {
      var v = answers[q.id];
      var pts = v === "yes" ? 2 : v === "mid" ? 1 : v === "no" ? 0 : null;
      var sMax = 2;
      if (pts === null) {
        bySection[q.id] = { score: 0, max: sMax, title: q.title, audience: q.audience };
        return;
      }
      total += pts;
      max += sMax;
      bySection[q.id] = { score: pts, max: sMax, title: q.title, audience: q.audience };
      if (pts <= 1) {
        gaps.push({
          sectionId: q.id,
          audience: q.audience,
          section: q.riskTitle,
          text: q.q,
          score: pts,
          rec: q.rec,
          risk: q.risk,
        });
      }
    });

    var answered = max / 2;
    // Scale bands from /40 checklist: 26–40 good, 11–25 mid, 0–10 bad → on /8: ~5.2, 2.2
    var level =
      total >= 6
        ? {
            key: "good",
            title: "Хорошее состояние",
            text: "Базовый контроль выглядит уверенно. Имеет смысл точечно усилить зоны со «Средне» и закрепить автоматизацию.",
          }
        : total >= 3
          ? {
              key: "mid",
              title: "Требуются улучшения",
              text: "Есть основа, но есть зоны риска. Ниже — где чаще всего теряются бюджет, видимость и скорость ИТ.",
            }
          : {
              key: "bad",
              title: "Есть проблемы с контролем ИТ-активов",
              text: "Значительные пробелы в контроле. Имеет смысл закрыть критичные зоны до масштабирования процессов.",
            };

    gaps.sort(function (a, b) {
      return a.score - b.score;
    });

    return {
      total: total,
      max: max || 8,
      answered: answered,
      bySection: bySection,
      gaps: gaps,
      level: level,
      complete: answered === 4,
      questions: QUESTIONS,
    };
  }

  global.ItmenChecklistShort = {
    QUESTIONS: QUESTIONS,
    scoreAnswers: scoreAnswers,
  };
})(typeof window !== "undefined" ? window : globalThis);
