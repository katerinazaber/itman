/**
 * Экспорт экономического обоснования в PowerPoint (pptxgenjs).
 */
(function (global) {
  "use strict";

  var RED = "E30613";
  var INK = "141414";
  var MUTED = "5C5C5C";
  var LINE = "E6E6E6";
  var PAPER = "FAF8F5";
  var SOFT = "FDE8EA";
  var WHITE = "FFFFFF";

  function safeName(company) {
    var base = "ИТМен — экономическое обоснование";
    if (company) {
      var safe = String(company)
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (safe) base += " — " + safe;
    }
    return base + ".pptx";
  }

  function addFooter(slide, page, total) {
    slide.addText("Инферит ИТМен · конфиденциально", {
      x: 0.5,
      y: 7.1,
      w: 9,
      h: 0.25,
      fontSize: 10,
      color: MUTED,
      fontFace: "Arial",
    });
    slide.addText(String(page) + " / " + String(total), {
      x: 11.5,
      y: 7.1,
      w: 1.3,
      h: 0.25,
      fontSize: 10,
      color: MUTED,
      fontFace: "Arial",
      align: "right",
    });
  }

  function sectionKicker(slide, index, title, lead) {
    slide.addText(("0" + index).slice(-2), {
      x: 0.5,
      y: 0.35,
      w: 1,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: RED,
      fontFace: "Arial",
    });
    slide.addText(title, {
      x: 0.5,
      y: 0.6,
      w: 12.3,
      h: 0.45,
      fontSize: 28,
      bold: true,
      color: INK,
      fontFace: "Arial",
    });
    if (lead) {
      slide.addText(lead, {
        x: 0.5,
        y: 1.1,
        w: 12.3,
        h: 0.35,
        fontSize: 14,
        color: MUTED,
        fontFace: "Arial",
      });
    }
  }

  function addCard(pptx, slide, opts) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fill: { color: opts.fill || WHITE },
      line: { color: opts.line || LINE, width: 1 },
      rectRadius: 0.08,
    });
  }

  function build(model, meta) {
    if (typeof global.PptxGenJS === "undefined") {
      return Promise.reject(new Error("pptxgenjs-missing"));
    }

    var pptx = new global.PptxGenJS();
    pptx.defineLayout({ name: "ITMEN_16x9", width: 13.333, height: 7.5 });
    pptx.layout = "ITMEN_16x9";
    pptx.author = "Инферит ИТМен";
    pptx.title = "Экономическое обоснование внедрения Инферит ИТМен";
    pptx.subject = "Предварительная оценка потенциала оптимизации ИТ-расходов";

    var c = model.calc;
    var n = model.narrative;
    var f = c.fmt;
    var company = (meta && meta.company) || "";
    var companyLine = company || "вашей компании";
    var when = (model.generatedAt || new Date()).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    var share = isFinite(n.potentialShare)
      ? Math.round(n.potentialShare) + "%"
      : "—";

    var totalPages = 10;
    var page = 0;

    function nextSlide() {
      page += 1;
      var s = pptx.addSlide();
      s.background = { color: WHITE };
      return s;
    }

    // 01 Cover
    (function () {
      var s = nextSlide();
      s.background = { color: PAPER };
      s.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.18,
        h: 7.5,
        fill: { color: RED },
        line: { color: RED },
      });
      s.addText("ЭКОНОМИЧЕСКОЕ ОБОСНОВАНИЕ", {
        x: 0.7,
        y: 1.6,
        w: 11.5,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: RED,
        fontFace: "Arial",
        charSpacing: 4,
      });
      s.addText("Внедрение «Инферит ИТМен»\nдля " + companyLine, {
        x: 0.7,
        y: 2.1,
        w: 11.5,
        h: 1.5,
        fontSize: 36,
        bold: true,
        color: INK,
        fontFace: "Arial",
        valign: "top",
      });
      s.addText(
        "Персональная оценка потенциала оптимизации ИТ-расходов на основе данных вашей компании.",
        {
          x: 0.7,
          y: 3.8,
          w: 10.5,
          h: 0.6,
          fontSize: 16,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      addCard(pptx, s, { x: 0.7, y: 4.7, w: 11.5, h: 1.1, fill: WHITE, line: LINE });
      s.addText(
        "Расчёт сформирован на основе данных ROI-калькулятора. Значения ориентировочные и требуют подтверждения на данных инфраструктуры.\nДата расчёта: " +
          when +
          " · Конфиденциально",
        {
          x: 0.95,
          y: 4.9,
          w: 11,
          h: 0.8,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      addFooter(s, page, totalPages);
    })();

    // 02 Economy
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        2,
        "Ваша экономика в цифрах",
        "Исходная картина, на которой построена предварительная оценка."
      );

      var rows = [
        ["Рабочие места", c.inputs.endpoints.toLocaleString("ru-RU")],
        ["Сотрудники ИТ", c.inputs.itStaff.toLocaleString("ru-RU")],
        ["Бюджет на ПО и лицензии", f.budget + " / год"],
      ];
      rows.forEach(function (row, i) {
        var y = 1.7 + i * 0.55;
        addCard(pptx, s, { x: 0.5, y: y, w: 5.8, h: 0.48, fill: PAPER, line: LINE });
        s.addText(row[0], {
          x: 0.7,
          y: y + 0.08,
          w: 3.2,
          h: 0.32,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        });
        s.addText(row[1], {
          x: 3.6,
          y: y + 0.08,
          w: 2.4,
          h: 0.32,
          fontSize: 15,
          bold: true,
          color: INK,
          fontFace: "Arial",
          align: "right",
        });
      });

      addCard(pptx, s, { x: 6.7, y: 1.7, w: 6.1, h: 3.6, fill: SOFT, line: "F3C4C8" });
      s.addText("Потенциал экономии", {
        x: 7,
        y: 1.95,
        w: 5.5,
        h: 0.3,
        fontSize: 13,
        color: MUTED,
        fontFace: "Arial",
      });
      s.addText(f.save, {
        x: 7,
        y: 2.3,
        w: 5.5,
        h: 0.7,
        fontSize: 36,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText("в год", {
        x: 7,
        y: 3.0,
        w: 5.5,
        h: 0.25,
        fontSize: 13,
        color: MUTED,
        fontFace: "Arial",
      });

      var metrics = [
        ["Эквивалент бюджета ПО", share],
        ["Срок окупаемости", f.pay],
        ["ROI за год", f.roi],
      ];
      metrics.forEach(function (m, i) {
        var y = 3.5 + i * 0.55;
        s.addText(m[0], {
          x: 7,
          y: y,
          w: 3.2,
          h: 0.35,
          fontSize: 12,
          color: MUTED,
          fontFace: "Arial",
        });
        s.addText(m[1], {
          x: 10.1,
          y: y,
          w: 2.3,
          h: 0.35,
          fontSize: 16,
          bold: true,
          color: INK,
          fontFace: "Arial",
          align: "right",
        });
      });

      s.addText(
        "Это оценка потенциала оптимизации, а не гарантия автоматической экономии после установки системы.",
        {
          x: 0.5,
          y: 5.7,
          w: 12.3,
          h: 0.7,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      addFooter(s, page, totalPages);
    })();

    // 03 Method
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        3,
        "Откуда взялась эта цифра?",
        "Как мы получили предварительную оценку потенциала."
      );

      var nodes = [
        {
          t: "Ваши исходные данные",
          v:
            c.inputs.endpoints.toLocaleString("ru-RU") +
            " РМ · " +
            c.inputs.itStaff +
            " ИТ · " +
            f.budget,
          fill: WHITE,
        },
        {
          t: "Модель эффекта ITAM",
          v: "3 направления оптимизации",
          fill: PAPER,
        },
        {
          t: "Предварительный потенциал",
          v: f.save + " / год",
          fill: SOFT,
        },
      ];
      nodes.forEach(function (node, i) {
        var x = 0.5 + i * 4.2;
        addCard(pptx, s, {
          x: x,
          y: 1.8,
          w: 3.9,
          h: 1.6,
          fill: node.fill,
          line: i === 2 ? "F3C4C8" : LINE,
        });
        s.addText(node.t, {
          x: x + 0.2,
          y: 2.0,
          w: 3.5,
          h: 0.45,
          fontSize: 12,
          color: MUTED,
          fontFace: "Arial",
        });
        s.addText(node.v, {
          x: x + 0.2,
          y: 2.5,
          w: 3.5,
          h: 0.7,
          fontSize: 16,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        if (i < 2) {
          s.addText("→", {
            x: x + 3.85,
            y: 2.35,
            w: 0.4,
            h: 0.4,
            fontSize: 18,
            bold: true,
            color: RED,
            fontFace: "Arial",
            align: "center",
          });
        }
      });

      var factors = [
        ["01", "Масштаб инфраструктуры", c.inputs.endpoints.toLocaleString("ru-RU") + " рабочих мест"],
        ["02", "Ресурсы ИТ-команды", c.inputs.itStaff + " сотрудников"],
        ["03", "Текущие расходы на ПО", f.budget + " / год"],
      ];
      factors.forEach(function (item, i) {
        var x = 0.5 + i * 4.2;
        addCard(pptx, s, { x: x, y: 3.8, w: 3.9, h: 1.5, fill: WHITE, line: LINE });
        s.addText(item[0], {
          x: x + 0.2,
          y: 3.95,
          w: 3.5,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
        s.addText(item[1], {
          x: x + 0.2,
          y: 4.3,
          w: 3.5,
          h: 0.35,
          fontSize: 13,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(item[2], {
          x: x + 0.2,
          y: 4.7,
          w: 3.5,
          h: 0.35,
          fontSize: 15,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
      });

      s.addText(
        "Итог складывается из трёх направлений оптимизации; точные значения определяются после инвентаризации.",
        {
          x: 0.5,
          y: 5.6,
          w: 12.3,
          h: 0.7,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      addFooter(s, page, totalPages);
    })();

    // 04 Money directions
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        4,
        "Где именно мы видим деньги",
        "Каждое направление связано с входными данными и имеет проверяемую логику."
      );

      n.directions.forEach(function (d, i) {
        var y = 1.65 + i * 1.55;
        addCard(pptx, s, { x: 0.5, y: y, w: 12.3, h: 1.4, fill: WHITE, line: LINE });
        s.addText("0" + (i + 1), {
          x: 0.7,
          y: y + 0.2,
          w: 0.6,
          h: 0.3,
          fontSize: 14,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
        s.addText(d.title, {
          x: 1.4,
          y: y + 0.15,
          w: 7.5,
          h: 0.35,
          fontSize: 16,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(d.formatted + " / год", {
          x: 9.2,
          y: y + 0.15,
          w: 3.3,
          h: 0.35,
          fontSize: 18,
          bold: true,
          color: RED,
          fontFace: "Arial",
          align: "right",
        });
        s.addText(d.formula, {
          x: 1.4,
          y: y + 0.55,
          w: 11,
          h: 0.3,
          fontSize: 12,
          color: MUTED,
          fontFace: "Arial",
        });
        s.addText(d.verification, {
          x: 1.4,
          y: y + 0.9,
          w: 11,
          h: 0.3,
          fontSize: 12,
          color: INK,
          fontFace: "Arial",
        });
      });
      addFooter(s, page, totalPages);
    })();

    // 05 Risk + total
    (function () {
      var s = nextSlide();
      sectionKicker(s, 5, "Итог модели и риски", "Денежный эффект рисков в сумму не включён.");

      addCard(pptx, s, { x: 0.5, y: 1.7, w: 12.3, h: 1.8, fill: PAPER, line: LINE });
      s.addText("БЕЗ ДЕНЕЖНОЙ ОЦЕНКИ", {
        x: 0.8,
        y: 1.9,
        w: 11.7,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: MUTED,
        fontFace: "Arial",
      });
      s.addText("Снижение лицензионных и операционных рисков", {
        x: 0.8,
        y: 2.3,
        w: 11.7,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(
        "Контроль состава ПО, изменений и полноты учёта снижает слепые зоны. Денежный эффект рисков можно оценить только после анализа фактических данных.",
        {
          x: 0.8,
          y: 2.85,
          w: 11.7,
          h: 0.45,
          fontSize: 14,
          color: MUTED,
          fontFace: "Arial",
        }
      );

      addCard(pptx, s, { x: 0.5, y: 3.9, w: 12.3, h: 1.5, fill: INK, line: INK });
      s.addText("Суммарный модельный потенциал", {
        x: 0.9,
        y: 4.2,
        w: 7,
        h: 0.4,
        fontSize: 16,
        color: WHITE,
        fontFace: "Arial",
      });
      s.addText(f.save + " / год", {
        x: 7.5,
        y: 4.15,
        w: 4.9,
        h: 0.55,
        fontSize: 28,
        bold: true,
        color: WHITE,
        fontFace: "Arial",
        align: "right",
      });
      s.addText(
        "Потенциал не является гарантированной экономией. Для подтверждения нужен анализ фактического состава ПО, лицензий и процессов учёта.",
        {
          x: 0.9,
          y: 4.8,
          w: 11.5,
          h: 0.4,
          fontSize: 12,
          color: "CCCCCC",
          fontFace: "Arial",
        }
      );
      addFooter(s, page, totalPages);
    })();

    // 06 Confidence
    (function () {
      var s = nextSlide();
      sectionKicker(s, 6, "Точность предварительной оценки", null);

      s.addText("Уровень", {
        x: 0.5,
        y: 1.6,
        w: 4,
        h: 0.3,
        fontSize: 12,
        color: MUTED,
        fontFace: "Arial",
      });
      s.addText(n.confidence.level, {
        x: 0.5,
        y: 1.95,
        w: 6,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(n.confidence.score + "%", {
        x: 9.5,
        y: 1.85,
        w: 3.3,
        h: 0.55,
        fontSize: 32,
        bold: true,
        color: RED,
        fontFace: "Arial",
        align: "right",
      });

      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.5,
        y: 2.6,
        w: 12.3,
        h: 0.22,
        fill: { color: "EEEEEE" },
        line: { color: "EEEEEE" },
        rectRadius: 0.1,
      });
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.5,
        y: 2.6,
        w: Math.max(0.4, (12.3 * n.confidence.score) / 100),
        h: 0.22,
        fill: { color: RED },
        line: { color: RED },
        rectRadius: 0.1,
      });

      addCard(pptx, s, { x: 0.5, y: 3.2, w: 6, h: 2.4, fill: PAPER, line: LINE });
      addCard(pptx, s, { x: 6.8, y: 3.2, w: 6, h: 2.4, fill: WHITE, line: LINE });
      s.addText("Что уже известно", {
        x: 0.75,
        y: 3.4,
        w: 5.5,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(
        n.confidence.known.map(function (t) {
          return "•  " + t;
        }).join("\n"),
        {
          x: 0.75,
          y: 3.9,
          w: 5.5,
          h: 1.5,
          fontSize: 14,
          color: MUTED,
          fontFace: "Arial",
          valign: "top",
        }
      );
      s.addText("Что пока неизвестно", {
        x: 7.05,
        y: 3.4,
        w: 5.5,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(
        n.confidence.unknown.map(function (t) {
          return "•  " + t;
        }).join("\n"),
        {
          x: 7.05,
          y: 3.9,
          w: 5.5,
          h: 1.5,
          fontSize: 14,
          color: MUTED,
          fontFace: "Arial",
          valign: "top",
        }
      );

      var path = [
        ["01", "Калькулятор", "Ориентир"],
        ["02", "Демо", "Понимание данных"],
        ["03", "Пилот", "Проверка гипотез"],
        ["04", "Эффект", "Подтверждённые цифры"],
      ];
      path.forEach(function (p, i) {
        var x = 0.5 + i * 3.2;
        addCard(pptx, s, {
          x: x,
          y: 5.85,
          w: 3.0,
          h: 0.85,
          fill: i === 0 ? SOFT : WHITE,
          line: i === 0 ? "F3C4C8" : LINE,
        });
        s.addText(p[0] + "  " + p[1], {
          x: x + 0.15,
          y: 5.95,
          w: 2.7,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(p[2], {
          x: x + 0.15,
          y: 6.3,
          w: 2.7,
          h: 0.25,
          fontSize: 11,
          color: MUTED,
          fontFace: "Arial",
        });
      });
      addFooter(s, page, totalPages);
    })();

    // 07 Questions
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        7,
        "Что нужно проверить",
        "Пять вопросов, чтобы перейти от модели к фактам."
      );

      n.validationQuestions.forEach(function (item, i) {
        var col = i < 3 ? 0 : 1;
        var row = i < 3 ? i : i - 3;
        var x = 0.5 + col * 6.4;
        var y = 1.7 + row * 1.35;
        addCard(pptx, s, { x: x, y: y, w: 6.1, h: 1.2, fill: WHITE, line: LINE });
        s.addText("0" + (i + 1), {
          x: x + 0.2,
          y: y + 0.2,
          w: 0.6,
          h: 0.3,
          fontSize: 14,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
        s.addText(item.question, {
          x: x + 0.9,
          y: y + 0.18,
          w: 4.9,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(item.answer, {
          x: x + 0.9,
          y: y + 0.65,
          w: 4.9,
          h: 0.4,
          fontSize: 12,
          color: MUTED,
          fontFace: "Arial",
        });
      });
      s.addText("Именно эти вопросы можно проверить на пилоте «Инферит ИТМен».", {
        x: 0.5,
        y: 6.0,
        w: 12.3,
        h: 0.4,
        fontSize: 14,
        color: RED,
        fontFace: "Arial",
      });
      addFooter(s, page, totalPages);
    })();

    // 08 Before/after + stakeholders
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        8,
        "Что изменится с ИТМен",
        "От разрозненных данных к управляемой экономике."
      );

      addCard(pptx, s, { x: 0.5, y: 1.65, w: 5.7, h: 2.5, fill: PAPER, line: LINE });
      addCard(pptx, s, { x: 7.1, y: 1.65, w: 5.7, h: 2.5, fill: SOFT, line: "F3C4C8" });
      s.addText("Сейчас", {
        x: 0.75,
        y: 1.85,
        w: 5.2,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(
        [
          "1. Разрозненные источники",
          "2. Ручная сверка",
          "3. Неактуальные данные",
          "4. Решения «на глаз»",
          "5. Перерасход и риски",
        ].join("\n"),
        {
          x: 0.75,
          y: 2.3,
          w: 5.2,
          h: 1.6,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      s.addText("С ИТМен", {
        x: 7.35,
        y: 1.85,
        w: 5.2,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });
      s.addText(
        [
          "1. Автоматический сбор данных",
          "2. Единая база ИТ-активов",
          "3. Нормализация и обогащение",
          "4. Аналитика использования",
          "5. Данные для управления расходами",
        ].join("\n"),
        {
          x: 7.35,
          y: 2.3,
          w: 5.2,
          h: 1.6,
          fontSize: 13,
          color: INK,
          fontFace: "Arial",
        }
      );

      s.addText("Обоснование для ключевых подразделений", {
        x: 0.5,
        y: 4.35,
        w: 12.3,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: INK,
        fontFace: "Arial",
      });

      n.stakeholderCases.forEach(function (item, i) {
        var x = 0.5 + i * 3.2;
        addCard(pptx, s, { x: x, y: 4.8, w: 3.05, h: 1.7, fill: WHITE, line: LINE });
        s.addText(item.role, {
          x: x + 0.15,
          y: 4.95,
          w: 2.75,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
        s.addText(item.metric, {
          x: x + 0.15,
          y: 5.3,
          w: 2.75,
          h: 0.35,
          fontSize: 12,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(item.title, {
          x: x + 0.15,
          y: 5.7,
          w: 2.75,
          h: 0.6,
          fontSize: 11,
          color: MUTED,
          fontFace: "Arial",
        });
      });
      addFooter(s, page, totalPages);
    })();

    // 09 Priorities
    (function () {
      var s = nextSlide();
      sectionKicker(
        s,
        9,
        "Что проверить в первую очередь",
        "Приоритеты по величине модельного потенциала."
      );

      n.priorities.forEach(function (item, i) {
        var x = 0.5 + i * 4.2;
        addCard(pptx, s, { x: x, y: 1.8, w: 3.9, h: 2.2, fill: WHITE, line: LINE });
        s.addText("Приоритет №" + item.rank, {
          x: x + 0.25,
          y: 2.05,
          w: 3.4,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
        s.addText(item.title, {
          x: x + 0.25,
          y: 2.5,
          w: 3.4,
          h: 0.7,
          fontSize: 18,
          bold: true,
          color: INK,
          fontFace: "Arial",
        });
        s.addText(item.formatted + " / год", {
          x: x + 0.25,
          y: 3.35,
          w: 3.4,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: RED,
          fontFace: "Arial",
        });
      });

      addCard(pptx, s, { x: 0.5, y: 4.4, w: 12.3, h: 2.0, fill: SOFT, line: "F3C4C8" });
      s.addText("Следующий шаг", {
        x: 0.85,
        y: 4.6,
        w: 11.6,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: RED,
        fontFace: "Arial",
      });
      s.addText(
        "Ваш расчёт показывает потенциал экономии " + f.save + " в год",
        {
          x: 0.85,
          y: 5.0,
          w: 11.6,
          h: 0.45,
          fontSize: 20,
          bold: true,
          color: INK,
          fontFace: "Arial",
        }
      );
      s.addText(
        "Сегодня это потенциал, а не подтверждённая экономия. Предлагаем проверить расчёт на ваших данных: состав активов, ПО и лицензии, дублирование, точки оптимизации.",
        {
          x: 0.85,
          y: 5.55,
          w: 11.6,
          h: 0.6,
          fontSize: 13,
          color: MUTED,
          fontFace: "Arial",
        }
      );
      addFooter(s, page, totalPages);
    })();

    // 10 CTA
    (function () {
      var s = nextSlide();
      s.background = { color: INK };
      s.addText("Записаться на созвон с экспертом", {
        x: 0.8,
        y: 2.2,
        w: 11.7,
        h: 0.7,
        fontSize: 32,
        bold: true,
        color: WHITE,
        fontFace: "Arial",
      });
      s.addText(
        "Результат пилота — не презентация возможностей системы, а подтверждённые цифры по вашей инфраструктуре.",
        {
          x: 0.8,
          y: 3.1,
          w: 11,
          h: 0.8,
          fontSize: 16,
          color: "CCCCCC",
          fontFace: "Arial",
        }
      );
      addCard(pptx, s, { x: 0.8, y: 4.2, w: 5.5, h: 0.7, fill: RED, line: RED });
      s.addText("info@itman.ru", {
        x: 0.8,
        y: 4.35,
        w: 5.5,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: WHITE,
        fontFace: "Arial",
        align: "center",
      });
      s.addText(
        "Расчёт носит оценочный характер и не является офертой. Фактический эффект зависит от состава инфраструктуры и периметра пилота.",
        {
          x: 0.8,
          y: 5.4,
          w: 11.5,
          h: 0.7,
          fontSize: 12,
          color: "999999",
          fontFace: "Arial",
        }
      );
      s.addText(String(page) + " / " + String(totalPages), {
        x: 11.5,
        y: 7.1,
        w: 1.3,
        h: 0.25,
        fontSize: 10,
        color: "888888",
        fontFace: "Arial",
        align: "right",
      });
    })();

    return pptx.writeFile({ fileName: safeName(company) });
  }

  global.ItmenRoiPptx = {
    download: build,
    filename: safeName,
  };
})(typeof window !== "undefined" ? window : globalThis);
