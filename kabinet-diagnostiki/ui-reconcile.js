/* ============================================================
   Второй акт: сверка с эталонным каталогом («Призма данных»).
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
  const R = 42, C = 2 * Math.PI * R;
  const on = C * Math.max(0, Math.min(1, share));
  return `<svg class="rc-donut" viewBox="0 0 100 100" width="88" height="88" aria-hidden="true">
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#E4EAF1" stroke-width="10"/>
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#1FA971" stroke-width="10"
      stroke-linecap="round" transform="rotate(-90 50 50)"
      stroke-dasharray="${on.toFixed(1)} ${C.toFixed(2)}"/>
    <text x="50" y="54" text-anchor="middle" fill="#1FA971" font-size="15" font-weight="800" font-family="Nekst,system-ui,sans-serif">${pct(share)}</text>
  </svg>`;
}

function renderReconcile(rec, core) {
  const md = core.meta;
  const nearly = rec.reasons[3] + rec.reasons[4];
  const unknown = rec.reasons[5];
  const share = rec.licensable ? rec.known / rec.licensable : 0;
  const hours = workHours(rec.known * MIN_PER_ROW);
  const logo = (typeof PRISM_LOGO !== 'undefined') ? PRISM_LOGO : '';

  const PREVIEW = 8;
  const id = 'rc-ba-' + (++RXSEQ);
  const baRows = rec.rows.map(r => `<tr>
      <td>
        <div class="rc-ba__name">${esc(r.it.name)}</div>
        <div class="rc-ba__meta">${esc(r.it.version || '—')}${r.it.publisher ? ` · ${esc(r.it.publisher)}` : ''}</div>
      </td>
      <td class="rc-ba__arr" aria-hidden="true">→</td>
      <td>
        <div class="rc-ba__ref">${esc(r.app)}${r.code === 6 ? '<span class="rc-ba__via" title="Эта форма сама не нашлась, но другая форма той же записи совпала с каталогом">по группе</span>' : ''}</div>
      </td>
    </tr>`);
  const rest = baRows.slice(PREVIEW);
  const table = rec.rows.length ? `
    <div class="rc-ba">
      <div class="rc-ba__head">
        <h4 class="rc-sec-title">Что удалось привести к эталону</h4>
        ${rest.length ? `<button type="button" class="rc-ba__more xtoggle" data-x="${id}" data-n="${rest.length}"
          data-open-label="Показать больше примеров →" data-close-label="Свернуть">Показать больше примеров →</button>` : ''}
      </div>
      <p class="rc-sec-sh">Слева — как записано в вашей выгрузке, справа — соответствие в «Призме данных».</p>
      <div class="scroll rc-ba__wrap"><table class="rc-ba__table">
        <thead><tr>
          <th>Ваша запись</th>
          <th></th>
          <th>Соответствие в «Призме данных»</th>
        </tr></thead>
        <tbody>${baRows.slice(0, PREVIEW).join('')}</tbody>
        ${rest.length ? `<tbody class="xmore" id="${id}" hidden>${rest.join('')}</tbody>` : ''}
      </table></div>
    </div>` : '';

  return `
  <section class="card sect recon" id="rx-recon">
    <div class="rc-top">
      <div class="rc-top__text">
        <span class="rc-tag"><span class="rc-tag__ico" aria-hidden="true">${ICO.pulse}</span> Диагноз поставлен</span>
        <h3 class="rc-title">Сверка с эталонным каталогом</h3>
        <div class="rc-prism">
          ${logo ? `<img class="rc-prism__logo" src="${logo}" alt="Призма данных" width="150" height="36">` : '<b class="rc-prism__name">Призма данных</b>'}
          <p class="rc-prism__lead">Крупнейшая в России интеллектуальная база знаний о программном обеспечении и лицензиях:
            более <b>300&nbsp;000</b> наименований ПО и <b>45&nbsp;000</b> артикулов (SKU).</p>
          <p class="rc-prism__lead">«Призма данных» проводит ML-нормализацию, приводит данные о ПО и лицензиях к единому виду и создает эталонный каталог ИТ-активов.</p>
        </div>
        <div class="rc-treat">
          <span class="rc-treat__ico" aria-hidden="true">${ICO.pulse}</span>
          <span>Симптомы нашли. Теперь назначаем лечение.</span>
        </div>
      </div>
      <div class="rc-top__visual">
        <img class="rc-monitor" src="assets/prism-monitor.jpg?v=113" alt="Экран каталога «Призма данных»" width="520" height="360" decoding="async">
      </div>
    </div>

    <div class="rc-stats">
      <div class="rc-stat rc-stat--ok">
        ${rcDonut(share)}
        <div class="rc-stat__body">
          <div class="rc-stat__n">${pct(share)} записей</div>
          <div class="rc-stat__t">нашли соответствие в «Призме данных»</div>
          <p class="rc-stat__p"><b>${nfmt(rec.known)}</b> из <b>${nfmt(rec.licensable)}</b> лицензируемых записей найдено автоматически.</p>
        </div>
      </div>
      <div class="rc-stat rc-stat--warn">
        <span class="rc-stat__ico" aria-hidden="true">${ICO.junk}</span>
        <div class="rc-stat__body">
          <div class="rc-stat__n">${nfmt(nearly)}</div>
          <div class="rc-stat__t">Почти сошлось</div>
          <p class="rc-stat__p">Наименование нашлось, но помешал вендор или формат версии. Это чинится правилом.</p>
        </div>
      </div>
      <div class="rc-stat rc-stat--miss">
        <span class="rc-stat__ico" aria-hidden="true">${ICO.noise}</span>
        <div class="rc-stat__body">
          <div class="rc-stat__n">${nfmt(unknown)}</div>
          <div class="rc-stat__t">Нет в демонстрационном срезе</div>
          <p class="rc-stat__p">Сравнение шло с <b>${nfmt(md.apps)}</b> эталонными продуктами из <b>${nfmt(md.libApps)}</b>.</p>
        </div>
      </div>
    </div>

    <div class="rc-biz">
      <h4 class="rc-sec-title">Что это дает бизнесу?</h4>
      <div class="rc-biz__row">
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
    </div>

    ${table}
  </section>`;
}

/* Раскрытие длинных таблиц и форм написаний */
document.addEventListener('click', e => {
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
