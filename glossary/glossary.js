/* ITMan Glossary — search, alphabet nav, term rendering */
(function () {
  const GROUP_LABELS = { itam: "ITAM", cmdb: "CMDB", itsm: "ITSM" };

  function firstLetter(t) {
    const c = t.title.charAt(0).toUpperCase();
    if (/[A-ZА-ЯЁ]/.test(c)) return c;
    return "#";
  }

  /* =================== HUB PAGE =================== */
  function initHub() {
    const termsEl = document.getElementById("glossaryTerms");
    const alphaEl = document.getElementById("glossaryAlpha");
    const searchInput = document.getElementById("glossarySearch");
    const dropdown = document.getElementById("glossaryDropdown");
    if (!termsEl) return;

    const sorted = [...GLOSSARY_TERMS].sort((a, b) =>
      a.title.localeCompare(b.title, "ru")
    );

    const groups = {};
    sorted.forEach((t) => {
      const l = firstLetter(t);
      (groups[l] = groups[l] || []).push(t);
    });

    const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ".split("");
    const activeSet = new Set(Object.keys(groups));

    alphaEl.innerHTML = allLetters
      .map((l) => {
        const cls = activeSet.has(l) ? "" : " disabled";
        return `<button class="g-alpha__btn${cls}" data-letter="${l}">${l}</button>`;
      })
      .join("");

    let html = "";
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, "ru"))
      .forEach((letter) => {
        html += `<div class="g-terms__group" id="letter-${letter}">`;
        html += `<div class="g-terms__letter">${letter}</div>`;
        html += `<ul class="g-terms__list">`;
        groups[letter].forEach((t) => {
          const badge = GROUP_LABELS[t.group] || "";
          html += `<li><a class="g-terms__card" href="${t.id}/">
            <strong>${t.title} <span class="g-badge g-badge--${t.group}">${badge}</span></strong>
            <span>${t.short}</span>
          </a></li>`;
        });
        html += `</ul></div>`;
      });
    termsEl.innerHTML = html;

    alphaEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".g-alpha__btn");
      if (!btn || btn.classList.contains("disabled")) return;
      const el = document.getElementById("letter-" + btn.dataset.letter);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    let focusIdx = -1;
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      focusIdx = -1;
      if (q.length < 2) { dropdown.classList.remove("open"); return; }
      const matches = sorted.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.short.toLowerCase().includes(q)
      ).slice(0, 8);
      if (!matches.length) { dropdown.classList.remove("open"); return; }
      dropdown.innerHTML = matches
        .map(
          (t) =>
            `<a class="g-search__item" href="${t.id}/"><strong>${t.title}</strong><small>${t.short}</small></a>`
        )
        .join("");
      dropdown.classList.add("open");
    });

    searchInput.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".g-search__item");
      if (!items.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); focusIdx = Math.min(focusIdx + 1, items.length - 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); focusIdx = Math.max(focusIdx - 1, 0); }
      items.forEach((el, i) => el.classList.toggle("active", i === focusIdx));
      if (e.key === "Enter" && focusIdx >= 0) { items[focusIdx].click(); }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".g-search")) dropdown.classList.remove("open");
    });
  }

  /* =================== TERM PAGE =================== */
  function initTerm() {
    const el = document.getElementById("glossaryTermPage");
    if (!el) return;

    const slug = el.dataset.slug;
    const term = GLOSSARY_TERMS.find((t) => t.id === slug);
    if (!term) { el.innerHTML = "<p>Термин не найден.</p>"; return; }

    const related = (term.related || [])
      .map((r) => GLOSSARY_TERMS.find((t) => t.id === r))
      .filter(Boolean);

    const isITAM = term.group === "itam" || term.group === "cmdb";
    const ctaTitle = isITAM
      ? "Узнайте, как Инферит ИТМен автоматизирует ITAM"
      : "Настройте ITSM-процессы по стандартам ITIL с помощью Инферит";
    const ctaBtn = isITAM ? "Смотреть возможности" : "Узнать больше";
    const ctaLink = isITAM ? "https://itman.ru/" : "https://itman.ru/";

    document.getElementById("termTitle").innerHTML = term.title;
    document.getElementById("termSubtitle").textContent = term.short;
    document.getElementById("termBody").innerHTML = term.body;
    document.getElementById("termBreadcrumb").textContent = term.title;

    document.getElementById("termCta").innerHTML = `
      <h3>${ctaTitle}</h3>
      <p>Платформа «Инферит ИТМен» — единое решение для учёта, контроля и автоматизации ИТ-процессов.</p>
      <a href="${ctaLink}" class="g-cta__btn">${ctaBtn}</a>`;

    const sidebarEl = document.getElementById("termRelated");
    if (related.length) {
      sidebarEl.innerHTML = related
        .map(
          (r) =>
            `<a class="g-sidebar__link" href="../${r.id}/"><strong>${r.title}</strong><small>${r.short}</small></a>`
        )
        .join("");
    }

    const schema = {
      "@context": "https://schema.org/",
      "@type": "DefinedTerm",
      name: term.title,
      description: term.body.replace(/<[^>]+>/g, "").slice(0, 300),
      inDefinedTermSet: "https://itman.ru/glossary/"
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHub();
    initTerm();
  });
})();
