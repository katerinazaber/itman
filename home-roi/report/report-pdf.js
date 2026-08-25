/**
 * Экспорт экономического обоснования в PDF (A4) через html2canvas + jsPDF.
 * Снимает те же блоки, что на экране — дизайн сохраняется.
 */
(function (global) {
  "use strict";

  var EXPORT_W = 794; /* ширина A4 при 96 dpi */
  var A4_W = 210;
  var A4_H = 297;
  var MARGIN = 0; /* поля уже в .pdf-chunk-wrap */
  var GAP = 2;

  function filename(company) {
    var base = "ИТМен — экономическое обоснование";
    if (company) {
      var safe = String(company)
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (safe) base += " — " + safe;
    }
    return base + ".pdf";
  }

  function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }
    return Promise.resolve();
  }

  function prepareExport() {
    var wrap = document.querySelector(".report-wrap");
    document.body.classList.add("is-pdf-export");
    if (wrap) {
      wrap.dataset.prevScroll = String(wrap.scrollTop || 0);
      wrap.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }

  function restoreExport() {
    var wrap = document.querySelector(".report-wrap");
    var report = document.getElementById("report");
    document.body.classList.remove("is-pdf-export");
    if (report) {
      report.style.width = "";
      report.style.maxWidth = "";
    }
    if (wrap && wrap.dataset.prevScroll) {
      wrap.scrollTop = Number(wrap.dataset.prevScroll || 0);
      delete wrap.dataset.prevScroll;
    }
  }

  function captureChunk(chunk) {
    if (typeof html2canvas === "undefined") {
      return Promise.reject(new Error("html2canvas-missing"));
    }
    return html2canvas(chunk, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: EXPORT_W,
      windowWidth: EXPORT_W,
      scrollX: 0,
      scrollY: 0,
      onclone: function (clonedDoc, clonedNode) {
        clonedNode.style.width = EXPORT_W + "px";
        clonedNode.style.maxWidth = EXPORT_W + "px";
        clonedNode.style.boxSizing = "border-box";
        var nodes = clonedDoc.querySelectorAll(".report, .report *");
        Array.prototype.forEach.call(nodes, function (el) {
          el.style.webkitTextStroke = "0px";
          el.style.textStroke = "0px";
        });
      },
    });
  }

  function buildPdf() {
    if (typeof html2canvas === "undefined" || !global.jspdf) {
      return Promise.reject(new Error("pdf-libs-missing"));
    }

    var jsPDF = global.jspdf.jsPDF;
    var pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    var contentW = A4_W - MARGIN * 2;
    var contentH = A4_H - MARGIN * 2;
    var chunks = Array.prototype.slice.call(
      document.querySelectorAll("#report .pdf-chunk-wrap")
    );

    if (!chunks.length) {
      return Promise.reject(new Error("empty-report"));
    }

    var y = MARGIN;
    var pageNum = 0;
    var lastSection = null;

    function newPage() {
      if (pageNum > 0) pdf.addPage();
      pageNum += 1;
      y = MARGIN;
    }

    return chunks.reduce(function (chain, chunk) {
      return chain.then(function () {
        var section = chunk.closest(".page");
        var sectionKey = section ? section.className : "";

        if (lastSection && sectionKey !== lastSection && pageNum > 0 && y > MARGIN + 1) {
          newPage();
        }
        lastSection = sectionKey;

        return captureChunk(chunk).then(function (canvas) {
          if (canvas.width < 2 || canvas.height < 2) return;

          var imgH = (canvas.height * contentW) / canvas.width;
          if (pageNum === 0) newPage();
          else if (y + imgH > MARGIN + contentH + 0.5) newPage();

          if (imgH > contentH) {
            imgH = contentH;
          }

          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.93),
            "JPEG",
            MARGIN,
            y,
            contentW,
            imgH
          );
          y += imgH + GAP;
        });
      });
    }, Promise.resolve()).then(function () {
      if (pageNum === 0) {
        throw new Error("empty-pdf");
      }
      return pdf;
    });
  }

  function download(opts) {
    opts = opts || {};
    prepareExport();

    return waitForFonts()
      .then(function () {
        return new Promise(function (resolve) {
          window.setTimeout(resolve, 320);
        });
      })
      .then(function () {
        return buildPdf();
      })
      .then(function (pdf) {
        pdf.save(filename(opts.company || ""));
      })
      .finally(function () {
        restoreExport();
      });
  }

  global.ItmenRoiPdf = {
    download: download,
    filename: filename,
  };
})(typeof window !== "undefined" ? window : globalThis);
