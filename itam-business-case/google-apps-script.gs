/**
 * Бизнес-обоснование ITAM → Google Sheets
 *
 * 1. Создай таблицу: https://sheets.google.com → Пустой файл
 *    Название, например: «ITAM business case — ответы»
 * 2. Расширения → Apps Script → удали код по умолчанию → вставь этот файл целиком
 * 3. Сохранить (Ctrl/Cmd+S)
 * 4. Развернуть → Новое развертывание → тип «Веб-приложение»
 *    - Описание: itam-business-case
 *    - Запуск от имени: Меня
 *    - У кого есть доступ: Все
 * 5. Развернуть → скопировать URL вида
 *    https://script.google.com/macros/s/XXXX/exec
 * 6. Пришли этот URL — вставим в калькулятор
 *
 * Заголовки первой строки создаются сами при первой записи.
 */

var SHEET_NAME = "Ответы";

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    ensureHeader_(sheet);
    sheet.appendRow([
      data.ts || new Date().toISOString(),
      data.action || "",
      data.source || "",
      data.url || "",
      data.audience || "",
      data.audienceTitle || "",
      num_(data.workstations),
      num_(data.assets),
      num_(data.licensesTotal),
      num_(data.products),
      num_(data.licenseCount),
      num_(data.licensePrice),
      num_(data.unusedPct),
      num_(data.specialists),
      num_(data.hoursMonth),
      num_(data.hourRate),
      num_(data.hoursAfter),
      num_(data.retiredCount),
      num_(data.retiredCost),
      num_(data.downtimeHours),
      num_(data.downtimeRate),
      num_(data.riskAssets),
      num_(data.riskProbability),
      num_(data.riskImpact),
      num_(data.implementationCost),
      num_(data.annualSupportCost),
      num_(data.lic),
      num_(data.retired),
      num_(data.manual),
      num_(data.downtime),
      num_(data.risk),
      num_(data.cashSavings),
      num_(data.netAnnualCashEffect),
      num_(data.paybackMonths),
      num_(data.firstYearRoi),
      data.userAgent || ""
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "itam-business-case" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function num_(v) {
  if (v === null || v === undefined || v === "") return "";
  var n = Number(v);
  return isFinite(n) ? n : "";
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    "Дата/время",
    "Событие",
    "Источник",
    "URL",
    "Адресат (код)",
    "Адресат",
    "Рабочие места",
    "ИТ-активы",
    "Лицензии по учету",
    "Продукты",
    "Оплачиваемые лицензии",
    "Цена лицензии/год",
    "Неиспользуемые %",
    "Специалисты",
    "Часов/мес сейчас",
    "Стоимость часа",
    "Часов/мес после",
    "Списанные активы",
    "Поддержка актива/год",
    "Часов простоя/год",
    "Потери за час",
    "Активы риска",
    "Вероятность %",
    "Ущерб",
    "Внедрение",
    "Сопровождение/год",
    "Эффект: лицензии",
    "Эффект: поддержка",
    "Эффект: время",
    "Эффект: простой",
    "Эффект: риск",
    "Сокращение расходов (сумма)",
    "Чистый годовой эффект",
    "Окупаемость, мес",
    "ROI 1-го года %",
    "User-Agent"
  ]);
  sheet.setFrozenRows(1);
}
