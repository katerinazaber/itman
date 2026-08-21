/**
 * Interactive infrastructure checklist (from «Бесплатный чек-лист… ИТМен»)
 * Score: Да=2, Средне=1, Нет=0 · max 40
 */
(function (global) {
  "use strict";

  var SECTIONS = [
    {
      id: "inventory",
      title: "Инвентаризация и учёт ИТ-активов",
      audience: "Операции / ITAM",
      items: [
        {
          id: "i1",
          text: "Проводите ли полную автоматическую инвентаризацию — учитываются ли все устройства, ПО и пользователи в единой системе?",
          rec: "Внедрить непрерывный сбор (агенты + сеть + каталоги) вместо разовых проектов инвентаризации.",
          itil: "IT asset management",
        },
        {
          id: "i2",
          text: "Агрегируете ли данные из разных источников (AD, SCCM, VMware, SolarWinds и др.) в одном месте?",
          rec: "Свести источники в единый контур сопоставления активов — иначе разные «правды» по парку.",
          itil: "Service configuration management",
        },
        {
          id: "i3",
          text: "Ведете ли единую базу ИТ-активов с историей изменений по каждому устройству?",
          rec: "Нужен централизованный реестр с историей атрибутов — база для Change и разбора инцидентов.",
          itil: "Change control",
        },
        {
          id: "i4",
          text: "Охвачены ли инвентаризацией все локации — удалённые офисы, филиалы и виртуальная инфраструктура?",
          rec: "Закрыть «серые зоны» филиалов и виртуализации — иначе часть парка вне учёта и бюджета.",
          itil: "IT asset management",
        },
        {
          id: "i5",
          text: "Настроено ли автоматическое обнаружение новых устройств в сети?",
          rec: "Включить автообнаружение: новые узлы не должны появляться «после инцидента».",
          itil: "Monitoring and event management",
        },
      ],
    },
    {
      id: "security",
      title: "Контроль ПО и безопасность",
      audience: "ИБ",
      items: [
        {
          id: "s1",
          text: "Контролируете ли установленное ПО — полный список программ с версиями и производителями?",
          rec: "Нормализовать каталог ПО (эталонный SKU) — иначе 10 имён одного продукта и слепые зоны для ИБ.",
          itil: "IT asset management",
        },
        {
          id: "s2",
          text: "Выявляете ли запрещённое / нежелательное ПО?",
          rec: "Регулярно выявлять теневые и запрещённые установки — политика без факта не работает.",
          itil: "Information security management",
        },
        {
          id: "s3",
          text: "Отслеживаете ли использование ПО — какие программы реально используют сотрудники?",
          rec: "Включить usage: закупки и продления — по факту запусков, не по числу установок.",
          itil: "Measurement and reporting",
        },
        {
          id: "s4",
          text: "Контролируете ли изменения в инфраструктуре — оповещения о разукомплектации и несанкционированных изменениях?",
          rec: "Алерты на критичные изменения конфигурации снижают простои «после правок».",
          itil: "Change control",
        },
        {
          id: "s5",
          text: "Готовы ли к проверкам регуляторов — быстро подготовить отчёты по установленному российскому ПО?",
          rec: "Автоотчёты по отечественному / иностранному ПО ускоряют аудиты и импортозамещение.",
          itil: "Measurement and reporting",
        },
      ],
    },
    {
      id: "licenses",
      title: "Управление лицензиями и затратами",
      audience: "Финансы",
      items: [
        {
          id: "l1",
          text: "Ведете ли централизованный учёт лицензий — какие куплены и где используются?",
          rec: "Свести «куплено / установлено / используется» в одну картину для переговоров с вендорами.",
          itil: "Service financial management",
        },
        {
          id: "l2",
          text: "Контролируете ли лицензионную чистоту — установки соответствуют купленным лицензиям?",
          rec: "Закрыть разрыв установок vs лицензий до аудита вендора — это прямой финансовый и комплаенс-риск.",
          itil: "IT asset management",
        },
        {
          id: "l3",
          text: "Выявляете ли неиспользуемые лицензии для оптимизации затрат?",
          rec: "Вычистить простой (ориентир — без запусков >90 дней) и перераспределить бюджет.",
          itil: "Measurement and reporting",
        },
        {
          id: "l4",
          text: "Знаете ли реальную стоимость владения ИТ-активами (устройство + лицензии)?",
          rec: "Считать TCO по факту парка — аргумент для CFO при оптимизации CAPEX/OPEX.",
          itil: "Service financial management",
        },
        {
          id: "l5",
          text: "Планируете ли ИТ-бюджет на базе данных — закупки по реальному использованию активов?",
          rec: "Перейти от бюджета «прошлый год + %» к решениям на данных инвентаризации и usage.",
          itil: "Service financial management",
        },
      ],
    },
    {
      id: "ops",
      title: "Операционная эффективность",
      audience: "Руководство",
      items: [
        {
          id: "o1",
          text: "Автоматизированы ли рутинные задачи учёта — или ИТ тратит время на ручной сбор данных?",
          rec: "Снять рутину инвентаризации с квалифицированных специалистов — до 40% времени часто уходит на ручной сбор.",
          itil: "Continual improvement",
        },
        {
          id: "o2",
          text: "Можете ли быстро реагировать на изменения — например, найти все устройства сотрудника при увольнении?",
          rec: "Связка пользователь ↔ устройства ↔ ПО в одном реестре ускоряет offboarding и снижает риски.",
          itil: "Service configuration management",
        },
        {
          id: "o3",
          text: "Уверены ли в точности информации при планировании ИТ-проектов?",
          rec: "Миграции и импортозамещение без точной карты инфраструктуры дорожают и срывают сроки.",
          itil: "IT asset management",
        },
        {
          id: "o4",
          text: "Можете ли доказать ROI от ИТ-инвестиций — эффективность купленного оборудования и ПО?",
          rec: "Связать закупки с usage и загрузкой парка — чтобы защищать инвестиции цифрами.",
          itil: "Measurement and reporting",
        },
        {
          id: "o5",
          text: "Готовы ли процессы к масштабированию и быстрым изменениям в инфраструктуре?",
          rec: "Непрерывный учёт вместо «генеральной уборки» — управляемая система, а не разовый проект.",
          itil: "Continual improvement",
        },
      ],
    },
  ];

  function scoreAnswers(answers) {
    var bySection = {};
    var total = 0;
    var max = 0;
    var gaps = [];

    SECTIONS.forEach(function (sec) {
      var s = 0;
      var sMax = sec.items.length * 2;
      sec.items.forEach(function (item) {
        var v = answers[item.id];
        var pts = v === "yes" ? 2 : v === "mid" ? 1 : v === "no" ? 0 : null;
        if (pts === null) return;
        s += pts;
        total += pts;
        max += 2;
        if (pts <= 1) {
          gaps.push({
            sectionId: sec.id,
            audience: sec.audience,
            section: sec.title,
            itemId: item.id,
            text: item.text,
            score: pts,
            rec: item.rec,
            itil: item.itil,
          });
        }
      });
      bySection[sec.id] = { score: s, max: sMax, title: sec.title, audience: sec.audience };
    });

    var answered = max / 2;
    var level =
      total >= 26
        ? {
            key: "good",
            title: "Хорошее состояние",
            text: "ИТ-инфраструктура под хорошим контролем. Поддерживайте уровень и усиливайте слабые пункты ниже.",
          }
        : total >= 11
          ? {
              key: "mid",
              title: "Требуются улучшения",
              text: "Есть основа, но есть зоны риска. Сфокусируйтесь на пунктах с оценкой «Нет» и «Средне».",
            }
          : {
              key: "bad",
              title: "Есть проблемы с контролем ИТ-активов",
              text: "Значительные пробелы в контроле. Имеет смысл закрыть критичные зоны до масштабирования процессов и CMDB.",
            };

    // sort gaps: no first, then mid; finance/security/exec priority mix
    gaps.sort(function (a, b) {
      return a.score - b.score;
    });

    return {
      total: total,
      max: max || 40,
      answered: answered,
      bySection: bySection,
      gaps: gaps,
      level: level,
      complete: answered === 20,
    };
  }

  function buildChecklistNarrative(score, calcFmt) {
    var top = score.gaps.slice(0, 6);
    var forFinance = [];
    var forSecurity = [];
    var forExec = [];

    score.gaps.forEach(function (g) {
      if (g.sectionId === "licenses" || g.audience === "Финансы") forFinance.push(g.rec);
      else if (g.sectionId === "security" || g.audience === "ИБ") forSecurity.push(g.rec);
      else if (g.sectionId === "ops" || g.audience === "Руководство") forExec.push(g.rec);
      else forExec.push(g.rec);
    });

    function uniq(arr) {
      var s = {};
      return arr.filter(function (x) {
        if (s[x]) return false;
        s[x] = true;
        return true;
      });
    }

    forFinance = uniq(forFinance).slice(0, 4);
    forSecurity = uniq(forSecurity).slice(0, 4);
    forExec = uniq(forExec).slice(0, 4);

    if (!forFinance.length) {
      forFinance = [
        "По чек-листу лицензионный контур выглядит устойчивее — закрепите usage и бюджет на данных.",
      ];
    }
    if (!forSecurity.length) {
      forSecurity = [
        "По чек-листу контроль ПО/ИБ сильнее среднего — поддерживайте выявление запрещённого ПО и изменений.",
      ];
    }
    if (!forExec.length) {
      forExec = [
        "Операционная зрелость по чек-листу выше — используйте данные для доказательства ROI проектов.",
      ];
    }

    if (calcFmt && calcFmt.save) {
      forExec.unshift(
        "Ориентировочная экономия по масштабу парка: " +
          calcFmt.save +
          " в год; окупаемость — " +
          calcFmt.pay +
          ". Ниже — что именно чинить по вашим ответам в чек-листе."
      );
    }

    var recommendations = top.map(function (g) {
      return {
        audience: g.audience,
        title: g.section,
        text: g.rec,
        itil: g.itil,
        from: g.text,
      };
    });

    return {
      forFinance: forFinance,
      forSecurity: forSecurity,
      forExec: forExec,
      recommendations: recommendations,
      score: score,
    };
  }

  global.ItmenChecklist = {
    SECTIONS: SECTIONS,
    scoreAnswers: scoreAnswers,
    buildChecklistNarrative: buildChecklistNarrative,
  };
})(typeof window !== "undefined" ? window : globalThis);
