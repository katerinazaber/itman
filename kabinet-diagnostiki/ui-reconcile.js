/* ============================================================
   Второй акт: сверка с эталонным каталогом («Призма данных»).
   Макет — по референсу Альберта.
   ============================================================ */

function pct(x) {
  return (x * 100).toFixed(x >= 0.995 ? 0 : 1).replace('.', ',') + '%';
}

const MIN_PER_ROW = 2;
function workHours(minutes) {
  const h = minutes / 60;
  if (h < 1) return `${Math.round(minutes)} мин`;
  if (h < 10) return `${h.toFixed(1).replace('.', ',')} часа`;
  if (h < 80) return `${Math.round(h)} ч`;
  return `${Math.round(h)} ч (${Math.round(h / 8)} ${plural(Math.round(h / 8), 'рабочий день', 'рабочих дня', 'рабочих дней')})`;
}

function rcDonut(share) {
  const R = 38, C = 2 * Math.PI * R;
  const on = C * Math.max(0, Math.min(1, share));
  const label = pct(share);
  return `<svg class="rc-donut" viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#F0D4D8" stroke-width="9"/>
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--red)" stroke-width="9"
      stroke-linecap="round" transform="rotate(-90 50 50)"
      stroke-dasharray="${on.toFixed(1)} ${C.toFixed(2)}"/>
    <text x="50" y="54" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="800"
      font-family="Nekst,system-ui,sans-serif">${label}</text>
  </svg>`;
}

function rcShowcaseCard(a, i, active) {
  const fields = [
    ['Наименование', a.app],
    ['Семейство ПО', a.family],
    ['Вендор', a.vendor],
    ['Версия', a.version],
    ['Редакция', a.edition],
    ['Тип лицензирования', a.lic],
    ['Категория', a.cat],
    ['Страна производителя', a.country]
  ].filter(([, v]) => v);
  return `<div class="rc-sc__slide${active ? ' is-on' : ''}" data-rc-slide="${i}" ${active ? '' : 'hidden'}>
    <div class="rc-sc__raw">
      <span class="rc-sc__raw-ico" aria-hidden="true">${ICO.dup}</span>
      <div>
        <div class="rc-sc__raw-k">Ваша запись</div>
        <div class="rc-sc__raw-name">${esc(a.raw.name)}</div>
        <div class="rc-sc__raw-meta">${esc(a.raw.version || '—')}${a.raw.publisher ? ` · ${esc(a.raw.publisher)}` : ''}</div>
      </div>
    </div>
    <div class="rc-sc__arrow" aria-hidden="true">↓</div>
    <div class="rc-sc__fields">
      <div class="rc-sc__raw-k">После нормализации</div>
      ${fields.map(([k, v]) => `<div class="rc-sc__f"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    </div>
  </div>`;
}

function renderReconcile(rec, core) {
  const md = core.meta;
  const nearly = rec.reasons[3] + rec.reasons[4];
  const unknown = rec.reasons[5];
  const share = rec.licensable ? rec.known / rec.licensable : 0;
  const hours = workHours(rec.known * MIN_PER_ROW);
  const scale = Math.max(1, Math.round(md.libApps / md.apps));
  const direct = Math.max(0, rec.known - (rec.propagated || 0));
  const logo = (typeof PRISM_LOGO !== 'undefined') ? PRISM_LOGO : '';

  const PREVIEW = 6;
  const tid = 'rc-ba-' + (++RXSEQ);
  const baRows = rec.rows.map(r => `<tr>
      <td>
        <div class="rx-spell__name">${esc(r.it.name)}</div>
        <div class="rx-spell__meta">${esc(r.it.version || '—')}${r.it.publisher ? ` · ${esc(r.it.publisher)}` : ''}</div>
      </td>
      <td class="rc-ba__arr" aria-hidden="true">→</td>
      <td>
        <div class="rx-spell__name">${esc(r.app)}${r.code === 6
          ? '<span class="rc-ba__via" title="Эта форма сама не нашлась, но другая форма той же записи совпала с каталогом">по группе</span>'
          : ''}</div>
      </td>
    </tr>`);
  const rest = baRows.slice(PREVIEW);

  const show = rec.showcase || [];
  const scId = 'rc-sc-' + RXSEQ;

  return `
  <section class="card sect recon" id="rx-recon">
    <div class="rc-hero">
      <div class="rc-hero__text">
        <span class="dx-tag"><span class="dx-tag__ico" aria-hidden="true">${ICO.pulse}</span> Диагноз поставлен. Назначение лечения</span>
        <h3 class="rc-title">Сверка с эталонным каталогом</h3>
        <div class="rc-prism">
          ${logo
            ? `<img class="rc-prism__logo" src="${logo}" alt="Призма данных" width="150" height="36">`
            : '<b class="rc-prism__name">Призма данных</b>'}
          <p class="rc-prism__lead">Крупнейшая в России интеллектуальная база знаний о программном обеспечении и лицензиях:
            более <b>300&nbsp;000</b> наименований ПО и <b>45&nbsp;000</b> артикулов (SKU).</p>
          <p class="rc-prism__lead">«Призма данных» проводит ML-нормализацию, приводит данные о ПО и лицензиях к единому виду и создает эталонный каталог ИТ-активов.</p>
        </div>
      </div>
      <div class="rc-hero__visual">
        <img class="rc-monitor" src="assets/prism-monitor.png?v=118" alt="Экран каталога «Призма данных»" width="520" height="380" decoding="async">
      </div>
    </div>

    <div class="rc-treat">
      <span class="rc-treat__ico" aria-hidden="true">${ICO.pulse}</span>
      <span>Симптомы нашли. Теперь назначаем лечение.</span>
    </div>

    <h4 class="rc-h">Результаты нормализации</h4>
    <div class="rc-norm">
      <div class="rc-norm__card rc-norm__card--pct">
        ${rcDonut(share)}
        <div>
          <div class="rc-norm__n">${pct(share)} записей</div>
          <p>нашли соответствие в «Призме данных»</p>
          <p class="rc-norm__sub"><b>${nfmt(rec.known)}</b> из <b>${nfmt(rec.licensable)}</b> лицензируемых записей найдено автоматически.</p>
        </div>
      </div>
      <div class="rc-norm__card">
        <span class="rc-norm__ico" aria-hidden="true">${ICO.check}</span>
        <div class="rc-norm__n">${nfmt(rec.known)}</div>
        <div class="rc-norm__t">Опознано</div>
        <p>${rec.propagated
          ? `<b>${nfmt(direct)}</b> напрямую, <b>${nfmt(rec.propagated)}</b> перенесено на другие написания той же записи`
          : 'сопоставлено с эталонным продуктом'}</p>
      </div>
      <div class="rc-norm__card">
        <span class="rc-norm__ico" aria-hidden="true">${ICO.vendor}</span>
        <div class="rc-norm__n">${nfmt(nearly)}</div>
        <div class="rc-norm__t">Почти сошлось</div>
        <p>Наименование нашлось, но помешал вендор или формат версии. Это чинится правилом.</p>
      </div>
      <div class="rc-norm__card">
        <span class="rc-norm__ico" aria-hidden="true">${ICO.noise}</span>
        <div class="rc-norm__n">${nfmt(unknown)}</div>
        <div class="rc-norm__t">Нет в демонстрационном срезе</div>
        <p>Сравнение шло с <b>${nfmt(md.apps)}</b> эталонными продуктами из <b>${nfmt(md.libApps)}</b>.</p>
      </div>
    </div>

    <h4 class="rc-h">Что это дает бизнесу?</h4>
    <div class="rc-biz">
      <div class="rc-biz__i">
        <span class="rc-biz__ico" aria-hidden="true">${ICO.clock}</span>
        <div>
          <b>Меньше ручной работы</b>
          <p><b>${nfmt(rec.known)}</b> ${plural(rec.known, 'запись не требует', 'записи не требуют', 'записей не требуют')} ручного разбора аналитиком. Это около <b>${hours}</b> работы.</p>
        </div>
      </div>
      <div class="rc-biz__i">
        <span class="rc-biz__ico" aria-hidden="true">${ICO.chart}</span>
        <div>
          <b>Единые данные для расчета лицензий</b>
          <p>Разные написания одного продукта сводятся к одной учетной позиции. Так проще понять, что действительно установлено и сколько лицензий нужно.</p>
        </div>
      </div>
    </div>

    <div class="rc-compare">
      <div class="rc-compare__text">
        <h4 class="rc-h">С чем сравнивали</h4>
        <p>Сравнение проведено с <b>${nfmt(md.apps)}</b> ${plural(md.apps, 'эталонным продуктом', 'эталонными продуктами', 'эталонными продуктами')} — это демонстрационный срез каталога «Призмы данных».
          В полном каталоге <b>${nfmt(md.libApps)}</b> эталонных продуктов.</p>
      </div>
      <div class="rc-compare__box">
        <span class="rc-compare__ico" aria-hidden="true">${ICO.chev}</span>
        <p>В полном каталоге в <b>${nfmt(scale)}</b> ${plural(scale, 'раз', 'раза', 'раз')} больше эталонных продуктов.</p>
      </div>
    </div>

    <div class="rc-split">
      <div class="rc-split__col">
        <h4 class="rc-h">Что удалось привести к эталону</h4>
        <p class="rc-sh">Слева — как записано в вашей выгрузке, справа — эталонное наименование.</p>
        ${rec.rows.length ? `<div class="scroll rc-ba-wrap"><table class="rc-ba-table">
          <thead><tr>
            <th>Ваша запись</th>
            <th></th>
            <th>Эталонное наименование</th>
          </tr></thead>
          <tbody>${baRows.slice(0, PREVIEW).join('')}</tbody>
          ${rest.length ? `<tbody class="xmore" id="${tid}" hidden>${rest.join('')}</tbody>` : ''}
        </table></div>
        ${rest.length ? `<button type="button" class="rc-link xtoggle" data-x="${tid}" data-n="${rest.length}"
          data-open-label="Показать больше примеров →" data-close-label="Свернуть">Показать больше примеров →</button>` : ''}`
          : '<p class="dim">Примеров нет</p>'}
      </div>

      <div class="rc-split__col">
        <h4 class="rc-h">Что запись получает после нормализации</h4>
        <p class="rc-sh">Из сырой строки инвентаря — учетная карточка каталога.</p>
        ${show.length ? `<div class="rc-sc" id="${scId}" data-rc-sc="${show.length}">
          ${show.map((a, i) => rcShowcaseCard(a, i, i === 0)).join('')}
          ${show.length > 1 ? `<button type="button" class="rc-link" data-rc-next="${scId}">Показать другие примеры →</button>` : ''}
        </div>` : '<p class="dim">Примеров нет</p>'}
      </div>
    </div>
  </section>`;
}

document.addEventListener('click', e => {
  const next = e.target.closest('[data-rc-next]');
  if (next) {
    const root = document.getElementById(next.dataset.rcNext);
    if (!root) return;
    const slides = [...root.querySelectorAll('[data-rc-slide]')];
    if (slides.length < 2) return;
    const cur = slides.findIndex(s => !s.hidden);
    const nxt = (cur + 1) % slides.length;
    slides.forEach((s, i) => {
      s.hidden = i !== nxt;
      s.classList.toggle('is-on', i === nxt);
    });
    return;
  }

  const spellBtn = e.target.closest('.rx-spell__toggle');
  if (spellBtn) {
    const t = document.getElementById(spellBtn.dataset.spellForms);
    if (!t) return;
    const open = t.hidden;
    t.hidden = !open;
    spellBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    spellBtn.textContent = open ? 'Скрыть' : 'Показать';
    return;
  }
  const b = e.target.closest('.xtoggle');
  if (!b) return;
  const t = document.getElementById(b.dataset.x);
  if (!t) return;
  t.hidden = !t.hidden;
  const openL = b.dataset.openLabel;
  const closeL = b.dataset.closeLabel || 'Свернуть';
  if (openL) b.textContent = t.hidden ? openL : closeL;
  else b.textContent = t.hidden ? `Показать еще ${(+b.dataset.n).toLocaleString('ru')}` : 'Свернуть';
});
