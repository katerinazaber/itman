/* ============================================================
   Второй акт: сверка с эталонным каталогом («Призма данных»).
   ============================================================ */

function pct(x) {
  return (x * 100).toFixed(x >= 0.995 ? 0 : 1).replace('.', ',') + '%';
}

function rcDonut(share) {
  const R = 41, C = 2 * Math.PI * R;
  const on = C * Math.max(0, Math.min(1, share));
  const label = pct(share);
  return `<svg class="rc-donut" viewBox="0 0 100 100" width="168" height="168" aria-hidden="true">
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#F0D4D8" stroke-width="7.5"/>
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--red)" stroke-width="7.5"
      stroke-linecap="round" transform="rotate(-90 50 50)"
      stroke-dasharray="${on.toFixed(1)} ${C.toFixed(2)}"/>
    <text x="50" y="55" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="800"
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
  const meta = `${esc(a.raw.version || '—')}${a.raw.publisher ? ` · ${esc(a.raw.publisher)}` : ''}`;
  return `<div class="rc-sc__slide${active ? ' is-on' : ''}" data-rc-slide="${i}" ${active ? '' : 'hidden'}>
    <div class="rc-sc__raw">
      <span class="rc-sc__raw-ico" aria-hidden="true">${ICO.dup}</span>
      <span class="rc-sc__raw-k">Ваша запись</span>
      <div class="rc-sc__raw-main">
        <span class="rx-spell__name">${esc(a.raw.name)}</span>
        <span class="rx-spell__meta">${meta}</span>
      </div>
    </div>
    <div class="rc-sc__arrow" aria-hidden="true">↓</div>
    <table class="rx-table rc-sc__table">
      <tbody>
        ${fields.map(([k, v]) => `<tr><td class="rc-sc__k">${esc(k)}</td><td><b class="rx-spell__name">${esc(v)}</b></td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderReconcile(rec, core) {
  const md = core.meta;
  const nearly = rec.reasons[3] + rec.reasons[4];
  const unknown = rec.reasons[5];
  const share = rec.licensable ? rec.known / rec.licensable : 0;

  const PREVIEW = 5;
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

  const mapBlock = `
      <div class="rc-split__col">
        <div class="rc-split__head">
          <h4 class="rx-panel__sec-title">Что удалось привести к эталону?</h4>
          <p class="rx-panel__sec-sh">Слева — как записано в вашей выгрузке, справа — эталонное наименование.</p>
        </div>
        <div class="rc-split__body">
          ${rec.rows.length ? `<div class="scroll rx-table-wrap"><table class="rx-table rc-ba-table">
            <thead><tr>
              <th>Ваша запись</th>
              <th></th>
              <th>Эталонное наименование</th>
            </tr></thead>
            <tbody>${baRows.slice(0, PREVIEW).join('')}</tbody>
            ${rest.length ? `<tbody class="xmore" id="${tid}" hidden>${rest.join('')}</tbody>` : ''}
          </table></div>` : '<p class="dim">Примеров нет</p>'}
        </div>
        <div class="rc-split__foot">
          ${rest.length ? `<button type="button" class="rx-panel__more xtoggle" data-x="${tid}" data-n="${rest.length}"
            data-open-label="Показать больше примеров →" data-close-label="Свернуть">Показать больше примеров →</button>` : ''}
        </div>
      </div>`;

  const showBlock = `
      <div class="rc-split__col">
        <div class="rc-split__head">
          <h4 class="rx-panel__sec-title">Как выглядит запись после нормализации</h4>
          <p class="rx-panel__sec-sh">Превращаем сырую строку в единую карточку ИТ-актива.</p>
        </div>
        <div class="rc-split__body">
          ${show.length ? `<div class="rx-table-wrap rc-sc" id="${scId}" data-rc-sc="${show.length}">
            ${show.map((a, i) => rcShowcaseCard(a, i, i === 0)).join('')}
          </div>` : '<p class="dim">Примеров нет</p>'}
        </div>
        <div class="rc-split__foot">
          ${show.length > 1 ? `<button type="button" class="rx-panel__more" data-rc-next="${scId}">Показать другие примеры →</button>` : ''}
        </div>
      </div>`;

  return `
  <section class="card sect recon" id="rx-recon">
    <div class="rc-hero">
      <div class="rc-hero__text">
        <span class="dx-tag"><span class="dx-tag__ico" aria-hidden="true">${ICO.pulse}</span> Нормализация данных</span>
        <h3 class="rx-h rc-title">Сверка с эталонным каталогом ПО <span class="rc-title__hi">«Призма данных»</span></h3>
        <p class="rx-sh rc-prism__lead"><b class="rc-hi">«Призма данных»</b> — крупнейшая в России интеллектуальная база знаний о программном обеспечении и лицензиях:
          более <b class="rc-hi">300&nbsp;000</b> наименований ПО и <b class="rc-hi">45&nbsp;000</b> артикулов (SKU).</p>
        <div class="rc-feats">
          <div class="rc-feat">
            <span class="rc-feat__ico" aria-hidden="true">${ICO.db}</span>
            <span>Единый каталог ПО</span>
          </div>
          <div class="rc-feat">
            <span class="rc-feat__ico" aria-hidden="true">${ICO.bolt}</span>
            <span>Точные соответствия</span>
          </div>
          <div class="rc-feat">
            <span class="rc-feat__ico" aria-hidden="true">${ICO.shield}</span>
            <span>Порядок в данных и меньше рисков</span>
          </div>
        </div>
      </div>
      <div class="rc-hero__visual">
        <img class="rc-monitor" src="assets/prism-monitor.png?v=161" alt="Экран каталога «Призма данных»" width="1536" height="1024" decoding="async">
      </div>
    </div>

    <div class="rc-results">
      <h4 class="rx-panel__sec-title">Результаты сверки</h4>
      <div class="rc-norm">
        <div class="rc-norm__card">
          <div class="rc-norm__top">
            <span class="rc-norm__ico" aria-hidden="true">${ICO.dup}</span>
            <div class="rc-norm__n">${pct(share)}</div>
          </div>
          <div class="rc-norm__t">записей нашли соответствие в «Призме данных»</div>
        </div>
        <div class="rc-norm__card">
          <div class="rc-norm__top">
            <span class="rc-norm__ico" aria-hidden="true">${ICO.check}</span>
            <div class="rc-norm__n">${nfmt(rec.known)}</div>
          </div>
          <div class="rc-norm__t">${plural(rec.known, 'запись распознана', 'записи распознаны', 'записей распознано')}</div>
        </div>
        <div class="rc-norm__card">
          <div class="rc-norm__top">
            <span class="rc-norm__ico" aria-hidden="true">${ICO.vendor}</span>
            <div class="rc-norm__n">${nfmt(nearly)}</div>
          </div>
          <div class="rc-norm__t">Почти сошлось</div>
          <p class="rc-norm__p">Наименование нашлось, но помешал вендор или формат версии.</p>
        </div>
        <div class="rc-norm__card">
          <div class="rc-norm__top">
            <span class="rc-norm__ico" aria-hidden="true">${ICO.noise}</span>
            <div class="rc-norm__n">${nfmt(unknown)}</div>
          </div>
          <div class="rc-norm__t">Нет в демонстрационном срезе</div>
          <p class="rc-norm__p">Сравнение шло с <b class="rc-hi">${nfmt(md.apps)}</b> эталонными продуктами из <b class="rc-hi">${nfmt(md.libApps)}</b>.</p>
        </div>
      </div>
    </div>

    <div class="rc-biz-block">
      <h4 class="rx-panel__sec-title">«Призма данных» позволяет компаниям</h4>
      <div class="rc-biz">
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.db}</span>
          <p>получить прозрачную картину установленного ПО</p>
        </div>
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.warn}</span>
          <p>выявлять неучтенные установки (Shadow&nbsp;IT)</p>
        </div>
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.check}</span>
          <p>повысить точность данных о программных активах</p>
        </div>
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.shield}</span>
          <p>создать основу для управления лицензиями и лицензионного соответствия</p>
        </div>
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.building}</span>
          <p>поддержать процессы импортозамещения</p>
        </div>
        <div class="rc-biz__i">
          <span class="rc-biz__ico" aria-hidden="true">${ICO.coin}</span>
          <p>иметь полную информацию для оптимизации закупок ПО</p>
        </div>
      </div>
    </div>

    <div class="rc-split">
      ${mapBlock}
      ${showBlock}
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
