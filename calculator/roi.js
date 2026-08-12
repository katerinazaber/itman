/* ROI landing — logic from Roicalc.html */

const LEADS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzY0v3ZZ1TAzTneF4NRmrP4j8RD6vJ3s6dxVMeZmWYUza_N6ZvoW-kFnA63ybhYbU_ExQ/exec";

const LICENSE_CATALOG = [
  { id: "ms_office_m365", name: "Microsoft Office / Microsoft 365", pricePerYear: 12000 },
  { id: "ms_windows", name: "Microsoft Windows (Pro/Enterprise)", pricePerYear: 8000 },
  { id: "adobe_acrobat", name: "Adobe Acrobat Pro", pricePerYear: 18000 },
  { id: "adobe_cc", name: "Adobe Creative Cloud", pricePerYear: 65000 },
  { id: "autocad", name: "AutoCAD", pricePerYear: 120000 },
  { id: "1c", name: "1С:Предприятие (пользовательская)", pricePerYear: 18000 },
  { id: "antivirus", name: "Антивирус (Kaspersky/Dr.Web/аналог)", pricePerYear: 2500 },
  { id: "ms_visio", name: "Microsoft Visio", pricePerYear: 15000 },
  { id: "ms_project", name: "Microsoft Project", pricePerYear: 20000 },
  { id: "vmware", name: "VMware (инфраструктура)", pricePerYear: 90000 },
  { id: "mssql", name: "MS SQL Server (усреднённо)", pricePerYear: 200000 },
  { id: "oracle", name: "Oracle DB (усреднённо)", pricePerYear: 250000 },
];

const PCT_LICENSES = 0.1;
const PCT_ASSETS = 0.05;
const PCT_IT = 0.01;
const ASSET_COST_PER_ENDPOINT_PER_YEAR = 3000;
const AVG_IT_SALARY_PER_MONTH = 200000;
const ITMEN_12_PRICING = [
  { max: 5000, perEndpoint: 1050 },
  { max: 25000, perEndpoint: 950 },
  { max: 50000, perEndpoint: 850 },
];

const state = { lastResult: null };
const selected = new Map();
let hasCalculated = false;

function getItmenPerEndpointPrice(endpoints) {
  const n = Math.max(0, Number(endpoints || 0));
  for (const tier of ITMEN_12_PRICING) {
    if (n <= tier.max) return tier.perEndpoint;
  }
  return ITMEN_12_PRICING[ITMEN_12_PRICING.length - 1].perEndpoint;
}

function fmtRub(n) {
  if (!isFinite(n)) return "—";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function fmtRubShort(n) {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000) return (Math.round((n / 1_000_000) * 10) / 10).toString().replace(".", ",") + " млн ₽";
  if (n >= 1_000) return Math.round(n / 1_000) + " тыс. ₽";
  return fmtRub(n);
}

function fmtNum(n, digits = 1) {
  if (!isFinite(n)) return "—";
  return (Math.round(n * 10 ** digits) / 10 ** digits).toString().replace(".", ",");
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(t) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

function getWorkplaces() {
  return Number(document.getElementById("workplaces")?.value || 0);
}

function getItStaff() {
  return Number(document.getElementById("itStaff")?.value || 0);
}

function sumCurrentCost() {
  let total = 0;
  for (const r of selected.values()) total += Number(r.qty || 0) * Number(r.pricePerYear || 0);
  return total;
}

function calculate() {
  const endpoints = getWorkplaces();
  const itStaff = getItStaff();
  const currentLicenses = sumCurrentCost();

  const savingsLicensesBase = currentLicenses * PCT_LICENSES;
  const assetsCurrent = Math.max(0, endpoints) * ASSET_COST_PER_ENDPOINT_PER_YEAR;
  const savingsAssetsBase = assetsCurrent * PCT_ASSETS;
  const itPayrollBase = Math.max(0, itStaff) * AVG_IT_SALARY_PER_MONTH * 12;
  const savingsItBase = itPayrollBase * PCT_IT;
  const savingsBase = savingsLicensesBase + savingsAssetsBase + savingsItBase;

  const perEndpoint = getItmenPerEndpointPrice(endpoints);
  const itmenCost = Math.max(0, endpoints) * perEndpoint;

  let roi = NaN;
  let paybackYears = NaN;
  let savingsTotal = 0;

  if (itmenCost > 0) {
    const ratio = savingsBase / itmenCost;
    const ratioScore = clamp01((ratio - 0.3) / (2.5 - 0.3));
    const scaleScore = clamp01(Math.log10(Math.max(1, endpoints)) / 4);
    const orgScore = clamp01(Math.log10(Math.max(1, itStaff)) / 4);
    const score = 0.55 * ratioScore + 0.25 * scaleScore + 0.2 * orgScore;
    roi = 30 + 120 * smoothstep(score);
    savingsTotal = itmenCost * (1 + roi / 100);
    paybackYears = itmenCost / savingsTotal;
  }

  const rawSum = savingsLicensesBase + savingsAssetsBase + savingsItBase;
  const scale = rawSum > 0 ? savingsTotal / rawSum : 0;
  const partLicenses = savingsLicensesBase * scale;
  const partAssets = savingsAssetsBase * scale;
  const partIt = savingsItBase * scale;
  const partRisks = Math.max(0, savingsTotal - partLicenses - partAssets - partIt);

  const licenses = [];
  for (const r of selected.values()) {
    licenses.push({ name: r.name, qty: Number(r.qty || 0), pricePerYear: Number(r.pricePerYear || 0) });
  }

  return {
    endpoints,
    itStaff,
    licenses,
    currentLicenses,
    itmenCost,
    savingsTotal,
    savingsLicenses: partLicenses,
    savingsAssets: partAssets,
    savingsIt: partIt,
    savingsRisks: partRisks,
    roi,
    paybackYears,
  };
}

function renderList() {
  const listBody = document.getElementById("listBody");
  if (!listBody) return;
  listBody.innerHTML = "";
  if (selected.size === 0) {
    listBody.innerHTML =
      '<tr id="emptyRow"><td colspan="5" class="small">Пока ничего не добавлено. Выберите лицензию, укажите кол-во и нажмите «Добавить».</td></tr>';
    return;
  }

  for (const [licenseId, row] of selected.entries()) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td class="right"><input type="number" min="0" value="${row.qty}" data-qty="${licenseId}" /></td>
      <td class="right hideCost">${fmtRub(row.pricePerYear)}</td>
      <td class="right hideCost"><span data-total="${licenseId}">${fmtRub(row.qty * row.pricePerYear)}</span></td>
      <td><button type="button" class="btn btn--ghost" data-del="${licenseId}" style="min-height:36px;padding:0 12px;font-size:13px">✕</button></td>`;
    listBody.appendChild(tr);

    tr.querySelector(`[data-qty="${licenseId}"]`)?.addEventListener("input", (e) => {
      row.qty = Number(e.target.value || 0);
      selected.set(licenseId, row);
      tr.querySelector(`[data-total="${licenseId}"]`).textContent = fmtRub(row.qty * row.pricePerYear);
      markDirty();
      refreshPreview();
    });
    tr.querySelector(`[data-del="${licenseId}"]`)?.addEventListener("click", () => {
      selected.delete(licenseId);
      renderList();
      markDirty();
      refreshPreview();
    });
  }
}

function addSelected() {
  const customToggle = document.getElementById("customToggle");
  if (customToggle?.checked) {
    const name = document.getElementById("customName")?.value?.trim();
    const qty = Number(document.getElementById("customQty")?.value || 0);
    const price = Number(document.getElementById("customPrice")?.value || 0);
    if (!name || qty <= 0) return;
    const licenseId = "custom:" + name.toLowerCase();
    const existing = selected.get(licenseId);
    selected.set(licenseId, {
      name,
      pricePerYear: isFinite(price) ? price : 0,
      qty: (existing ? existing.qty : 0) + qty,
    });
    document.getElementById("customName").value = "";
    document.getElementById("customQty").value = "1";
    document.getElementById("customPrice").value = "";
  } else {
    const licenseId = document.getElementById("license")?.value;
    const qty = Number(document.getElementById("qty")?.value || 0);
    const item = LICENSE_CATALOG.find((x) => x.id === licenseId);
    if (!item || qty <= 0) return;
    const existing = selected.get(licenseId);
    selected.set(licenseId, {
      name: item.name,
      pricePerYear: item.pricePerYear,
      qty: (existing ? existing.qty : 0) + qty,
    });
    document.getElementById("qty").value = "0";
  }
  renderList();
  markDirty();
  refreshPreview();
}

function markDirty() {
  if (!hasCalculated) return;
  document.getElementById("dirtyNote")?.classList.remove("hidden");
}

function renderBreakdown(result, container) {
  if (!container) return;
  const items = [
    { label: "Оптимизация учета лицензий", value: result.savingsLicenses },
    { label: "Сокращение потерь на ИТ-активах", value: result.savingsAssets },
    { label: "Снижение нагрузки на ИТ-персонал", value: result.savingsIt },
    { label: "Снижение рисков из-за неточных данных об инфраструктуре", value: result.savingsRisks },
  ];
  const total = result.savingsTotal || 1;
  container.innerHTML = items
    .map(
      (i) => `
    <div class="breakdown-row">
      <div class="breakdown-row__head"><span>${i.label}</span><strong>${fmtRub(Math.round(i.value))}</strong></div>
      <div class="breakdown-row__bar"><span style="width:${Math.max(4, (i.value / total) * 100)}%"></span></div>
    </div>`
    )
    .join("");
}

function applyResultToUI(result) {
  state.lastResult = result;
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const paybackText = isFinite(result.paybackYears) ? fmtNum(result.paybackYears, 1) + " лет" : "—";
  const roiText = isFinite(result.roi) ? fmtNum(result.roi, 0) + "%" : "—";
  const roiPayback = roiText + " / " + paybackText;

  set("heroLoss", fmtRubShort(result.savingsTotal) + " / год");
  set("heroRoi", roiText);
  set("heroPayback", paybackText);
  set(
    "heroMeta",
    `${result.endpoints} рабочих мест · ${result.itStaff} сотрудников ИТ · ${result.licenses.length} лицензий`
  );

  set("kpiCurrent", fmtRub(result.currentLicenses));
  set("kpiSavings", fmtRub(result.savingsTotal));
  set("kpiInvest", fmtRub(result.itmenCost));
  set("kpiRoiPayback", roiPayback);

  set("resSavings", fmtRubShort(result.savingsTotal) + " / год");
  set("resRoi", roiText);
  set("resPayback", paybackText);
  set("resInvest", fmtRubShort(result.itmenCost) + " / год");

  set("reportSavings", fmtRubShort(result.savingsTotal) + " / год");
  set("reportRoi", roiText);
  set("reportPayback", paybackText);
  set("reportInvest", fmtRubShort(result.itmenCost) + " / год");

  renderBreakdown(result, document.getElementById("breakdown"));
}

function refreshPreview() {
  applyResultToUI(calculate());
}

async function sendLead(payload) {
  if (!LEADS_ENDPOINT) return;
  try {
    const body = JSON.stringify(payload);
    if (navigator?.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
      if (navigator.sendBeacon(LEADS_ENDPOINT, blob)) return;
    }
    await fetch(LEADS_ENDPOINT, { method: "POST", mode: "no-cors", body });
  } catch {
    /* silent */
  }
}

async function getClientPublicIp() {
  try {
    const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const j = await r.json();
    return j?.ip ?? null;
  } catch {
    return null;
  }
}

function buildLeadPayload(calcResult, form) {
  return {
    ts: new Date().toISOString(),
    source: "roi-landing-v2",
    client: form.company,
    contactName: form.name,
    email: form.email,
    phone: form.phone,
    endpoints: calcResult.endpoints,
    itStaff: calcResult.itStaff,
    licenses: calcResult.licenses,
    licensesText: calcResult.licenses.map((x) => `${x.name}: ${x.qty}`).join("; "),
    currentLicensesRub: Math.round(calcResult.currentLicenses || 0),
    itmenCostRub: Math.round(calcResult.itmenCost || 0),
    savingsTotalRub: Math.round(calcResult.savingsTotal || 0),
    roiPct: isFinite(calcResult.roi) ? Math.round(calcResult.roi * 10) / 10 : null,
    paybackYears: isFinite(calcResult.paybackYears) ? Math.round(calcResult.paybackYears * 10) / 10 : null,
  };
}

function runCalc() {
  hasCalculated = true;
  document.getElementById("dirtyNote")?.classList.add("hidden");
  applyResultToUI(calculate());
  document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initRoiLanding() {
  const sel = document.getElementById("license");
  if (sel) {
    for (const item of LICENSE_CATALOG) {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      sel.appendChild(opt);
    }
  }

  const wpInput = document.getElementById("workplaces");
  const wpRange = document.getElementById("workplacesRange");
  const syncWp = (v) => {
    if (wpInput) wpInput.value = String(v);
    if (wpRange) wpRange.value = String(v);
    markDirty();
    refreshPreview();
  };
  wpInput?.addEventListener("input", () => syncWp(wpInput.value));
  wpRange?.addEventListener("input", () => syncWp(wpRange.value));
  document.getElementById("itStaff")?.addEventListener("input", () => {
    markDirty();
    refreshPreview();
  });

  document.getElementById("addBtn")?.addEventListener("click", addSelected);
  document.getElementById("addCustomBtn")?.addEventListener("click", () => {
    const t = document.getElementById("customToggle");
    if (t) t.checked = true;
    addSelected();
  });
  document.getElementById("customToggle")?.addEventListener("change", (e) => {
    document.getElementById("customBox")?.classList.toggle("hidden", !e.target.checked);
  });

  document.getElementById("btnCalc")?.addEventListener("click", runCalc);

  document.getElementById("pdfFormEl")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = state.lastResult || calculate();
    const form = {
      name: document.getElementById("leadName")?.value?.trim() || "",
      company: document.getElementById("leadCompany")?.value?.trim() || "",
      email: document.getElementById("leadEmail")?.value?.trim() || "",
      phone: document.getElementById("leadPhone")?.value?.trim() || "",
    };
    if (!form.email || !form.company) return;
    const payload = buildLeadPayload(result, form);
    payload.clientIp = await getClientPublicIp();
    payload.userAgent = navigator.userAgent;
    payload.referrer = document.referrer || null;
    await sendLead(payload);
    const msg = document.getElementById("pdfSuccess");
    if (msg) {
      msg.hidden = false;
      msg.textContent = "Спасибо! Отчет отправим на указанный email.";
    }
  });

  renderList();
  refreshPreview();
}

document.addEventListener("DOMContentLoaded", initRoiLanding);
