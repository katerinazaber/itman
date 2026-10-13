var SHEET_NAME = "Ответы";
var SPREADSHEET_ID = "1poH4m4GV32ypu0bm9qZGH-uKhZLObhyyHuZ2tKbJpH8";

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e && e.postData && e.postData.contents) {
    var raw = String(e.postData.contents);
    try {
      return JSON.parse(raw);
    } catch (err1) {
      // application/x-www-form-urlencoded: payload=...
      var m = raw.match(/(?:^|&)payload=([^&]*)/);
      if (m) return JSON.parse(decodeURIComponent(m[1].replace(/\+/g, " ")));
      throw err1;
    }
  }
  if (e && e.parameter && e.parameter.test === "1") {
    return {
      ts: new Date().toISOString(),
      action: "url-test",
      source: "doGet-test",
      audience: "ceo",
      audienceTitle: "Тест по ссылке",
      workstations: 1
    };
  }
  return null;
}

function writeRow_(data) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
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
}

function doPost(e) {
  try {
    var data = parsePayload_(e);
    if (!data) throw new Error("Пустой payload");
    writeRow_(data);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.test === "1") {
      writeRow_(parsePayload_(e));
      return json_({ ok: true, wrote: "url-test" });
    }
    return json_({ ok: true, service: "itam-business-case" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
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

function testWrite_() {
  writeRow_({
    ts: new Date().toISOString(),
    action: "manual-test",
    source: "apps-script-editor",
    audience: "ceo",
    audienceTitle: "Тест",
    workstations: 1
  });
}
