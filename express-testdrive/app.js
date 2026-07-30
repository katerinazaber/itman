(() => {
  const beforeRows = [
    ["1", "ms office 2019", "16.0", "microsoft"],
    ["2", "7zip", "", "Igor Pavlov"],
    ["3", "Adobe Reader DC", "2023.001", "Adobe Inc"],
    ["4", "chrome", "120.0.6099", "Google LLC"],
    ["5", "Office 19", "16", "MS"],
  ];

  const afterRows = [
    ["1", "Microsoft Office 2019", "16.0.14326", "Microsoft Corporation"],
    ["2", "7-Zip", "23.01", "Igor Pavlov"],
    ["3", "Adobe Acrobat Reader DC", "23.001.20143", "Adobe Inc."],
    ["4", "Google Chrome", "120.0.6099.129", "Google LLC"],
    ["5", "Microsoft Office 2019", "16.0.14326", "Microsoft Corporation"],
  ];

  const insights = [
    {
      label: "Дубликаты ПО",
      value: "35%",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 7h11v12H8V7z" stroke="currentColor" stroke-width="1.6"/><path d="M5 17V5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    },
    {
      label: "Нетипичные названия",
      value: "12",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 12.5l2 2 3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    },
    {
      label: "Нормализованные версии",
      value: "18%",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M17 15l2 2 3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      label: "Заполненные пропуски",
      value: "24",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    },
    {
      label: "Уникальных продуктов",
      value: "156",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="8" r="2.5" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="16" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
    },
  ];

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const stateDefault = document.getElementById("dropzone-default");
  const stateLoading = document.getElementById("dropzone-loading");
  const stateDone = document.getElementById("dropzone-done");
  const fileNameEl = document.getElementById("file-name");
  const loadingText = document.getElementById("loading-text");
  const resultsSection = document.getElementById("results");
  const downloadSection = document.getElementById("download");
  const tableBefore = document.getElementById("table-before");
  const tableAfter = document.getElementById("table-after");
  const insightList = document.getElementById("insight-list");
  const processTime = document.getElementById("process-time");
  const form = document.getElementById("lead-form");
  const formSuccess = document.getElementById("form-success");

  let processing = false;

  function fillTables() {
    tableBefore.innerHTML = beforeRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell) || "—"}</td>`).join("")}</tr>`
      )
      .join("");

    tableAfter.innerHTML = afterRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
      )
      .join("");

    insightList.innerHTML = insights
      .map(
        (item) => `
        <li class="insight-item">
          <span class="insight-icon">${item.icon}</span>
          <span class="insight-label">${item.label}</span>
          <span class="insight-value">${item.value}</span>
        </li>`
      )
      .join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showState(which) {
    stateDefault.hidden = which !== "default";
    stateLoading.hidden = which !== "loading";
    stateDone.hidden = which !== "done";
  }

  function validateFile(file) {
    if (!file) return "Выберите файл";
    const name = file.name.toLowerCase();
    const okExt = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!okExt) return "Поддерживаются только .xlsx и .csv";
    if (file.size > 10 * 1024 * 1024) return "Максимальный размер файла — 10 МБ";
    return null;
  }

  function startDemo(file) {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    if (processing) return;
    processing = true;

    fileNameEl.textContent = file.name;
    showState("loading");
    loadingText.textContent = "Обрабатываем данные…";
    resultsSection.hidden = true;
    downloadSection.hidden = true;

    const started = performance.now();
    const steps = [
      { t: 400, text: "Читаем выгрузку…" },
      { t: 1100, text: "Нормализуем названия ПО…" },
      { t: 1900, text: "Сверяем с эталонным каталогом…" },
      { t: 2600, text: "Формируем отчёт…" },
    ];

    steps.forEach(({ t, text }) => {
      setTimeout(() => {
        if (processing) loadingText.textContent = text;
      }, t);
    });

    setTimeout(() => {
      const elapsed = Math.max(1, Math.round((performance.now() - started) / 1000));
      processTime.textContent = String(elapsed);
      showState("done");
      fillTables();
      resultsSection.hidden = false;
      downloadSection.hidden = false;
      resultsSection.querySelector(".panel").classList.add("is-enter");
      downloadSection.querySelector(".panel").classList.add("is-enter");
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      processing = false;
    }, 3200);
  }

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) startDemo(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) startDemo(file);
    fileInput.value = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email;
    const phone = form.phone;
    let valid = true;

    [email, phone].forEach((input) => {
      input.classList.remove("is-invalid");
      if (!input.value.trim()) {
        input.classList.add("is-invalid");
        valid = false;
      }
    });

    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) return;

    formSuccess.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    form.querySelector('button[type="submit"]').textContent = "Отправлено";
  });
})();
