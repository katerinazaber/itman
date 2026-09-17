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
            <span>Единый каталог<br>ПО</span>
          </div>
          <div class="rc-feat">
            <span class="rc-feat__ico" aria-hidden="true">${ICO.bolt}</span>
            <span>Интеллектуальная<br>ML-нормализация</span>
          </div>
          <div class="rc-feat">
            <span class="rc-feat__ico" aria-hidden="true">${ICO.shield}</span>
            <span>Лицензии, ПО,<br>артикулы</span>
          </div>
        </div>
      </div>
      <div class="rc-hero__visual">
        <img class="rc-monitor" src="assets/prism-monitor.png?v=164" alt="Экран каталога «Призма данных»" width="1536" height="1024" decoding="async">
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

/* ---------- Цена необработанного инвентаря (после симптомов, до Призмы) ---------- */
function renderInventoryCost(rec, core) {
  if (!rec) return '';
  const md = core.meta;
  const spellings = rec.spellings || [];
  const lf = rec.licFamilies || [];
  const other = (rec.freeFamilies || []).concat(rec.buildSpread || []);
  const unknown = rec.reasons[5] || 0;
  if (!spellings.length && !lf.length && !other.length && !rec.licSkippedFree) return '';

  const excess = spellings.reduce((s, p) => s + Math.max(0, p.forms.size - 1), 0);
  const hrs = whrs(spellings.length * 3);

  const SPELL_PREVIEW = 3;
  const spellRows = spellings.map(p => `<tr>
      <td><div class="rx-spell__name">${esc(p.app)}</div></td>
      <td class="dim">${esc(p.vendor)}</td>
      <td class="rx-inv__forms">${[...p.forms].map(f => `<span class="chip dup">${esc(f)}</span>`).join('')}</td>
      <td class="num">${p.rows.length}</td>
    </tr>`);
  const spellTable = spellings.length ? (() => {
    const id = 'inv-sp-' + (++RXSEQ);
    const rest = spellRows.slice(SPELL_PREVIEW);
    return `<div class="scroll rx-table-wrap"><table class="rx-table rx-inv__table">
      <thead><tr>
        <th>Эталонная позиция</th><th>Вендор</th><th>Как записано у вас</th><th class="num">Строк</th>
      </tr></thead>
      <tbody>${spellRows.slice(0, SPELL_PREVIEW).join('')}</tbody>
      ${rest.length ? `<tbody class="xmore" id="${id}" hidden>${rest.join('')}</tbody>` : ''}
    </table></div>
    ${rest.length ? `<button type="button" class="rx-panel__more xtoggle" data-x="${id}" data-n="${rest.length}"
      data-open-label="Показать ещё ${rest.length.toLocaleString('ru')} →" data-close-label="Свернуть">Показать ещё ${rest.length.toLocaleString('ru')} →</button>` : ''}`;
  })() : '';

  const step = (p, cls) => `<span class="rx-inv__pos ${cls || ''}">${esc(p.app)}<i>×${p.rows}</i></span>`;
  const ladder = f => {
    const P = f.positions, last = P.length - 1;
    const cells = P.length <= 5
      ? P.map((p, i) => step(p, i === 0 ? 'is-old' : i === last ? 'is-new' : ''))
      : [step(P[0], 'is-old'), step(P[1]),
         `<span class="rx-inv__pos is-gap">…ещё ${P.length - 4}</span>`,
         step(P[last - 1]), step(P[last], 'is-new')];
    return `<div class="rx-inv__ladder">${cells.join('<span class="rx-inv__arr" aria-hidden="true">→</span>')}</div>`;
  };
  const LIC_PREVIEW = 8;
  const licCards = lf.map(f => `<article class="rx-inv__card">
      <div class="rx-inv__card-h">
        <div>
          <b>${esc(f.family)}</b>
          <span class="dim"> · ${esc(f.vendor)}</span>
          ${f.editions.length > 1
            ? `<span class="rx-inv__ed">Разные редакции: ${f.editions.map(esc).join(' / ')}</span>`
            : ''}
        </div>
        <div class="rx-inv__card-meta">${f.positions.length} ${plural(f.positions.length, 'позиция каталога', 'позиции каталога', 'позиций каталога')} · ${f.rows} ${plural(f.rows, 'строка', 'строки', 'строк')}</div>
      </div>
      ${ladder(f)}
      <div class="rx-inv__branches">
        <div class="rx-inv__br is-up">
          <span class="rx-inv__br-n">${f.needUpgrade}</span>
          <span>если лицензии куплены на младшую — <b>${esc(f.oldest.app)}</b> — столько установок требуют права на повышение версии</span>
        </div>
        <div class="rx-inv__br is-dn">
          <span class="rx-inv__br-n">${f.needDowngrade}</span>
          <span>если на старшую — <b>${esc(f.newest.app)}</b> — столько требуют права на понижение</span>
        </div>
      </div>
    </article>`);

  const LICSHORT = {
    'Коммерческое': ['Лицензируемое', 'is-com'],
    'Условно бесплатное': ['Условно бесплатное', 'is-com'],
    'Бесплатное': ['Бесплатное', 'is-free'],
    'Компонент': ['Компонент', 'is-comp'],
    'Тестируемое': ['Тестовое', 'is-free']
  };
  const riskTag = f => {
    if (f.source !== 'catalog') return '<span class="rx-inv__tag is-maj">Разные старшие версии</span>';
    if (f.licensable) return '<span class="rx-inv__tag is-pat">Позиция одна · разные сборки</span>';
    const t = LICSHORT[f.lic];
    if (t) return `<span class="rx-inv__tag ${t[1]}">${t[0]}</span>`;
    return '<span class="rx-inv__tag is-unk">Тип не указан в каталоге</span>';
  };
  const verCell = f => `<div class="rx-inv__vers">${(f.versions || []).slice(0, 8).map(v =>
      `<span class="chip ver">${esc(v.label)}${v.rows > 1 ? `<i>×${v.rows}</i>` : ''}</span>`).join('')}${
      (f.versions || []).length > 8 ? `<span class="chip">…ещё ${f.versions.length - 8}</span>` : ''}</div>`;
  const OTHER_PREVIEW = 3;
  const otherRows = other.map(f => `<tr>
      <td>${f.source === 'catalog'
        ? (f.apps || [f.title]).slice(0, 8).map(a => `<span class="chip ref-chip">${esc(a)}</span>`).join(' ')
        : `<div class="rx-spell__name">${esc(f.title)}</div><div class="dim sm">${esc(f.vendor || '')}</div>`}</td>
      <td>${verCell(f)}</td>
      <td>${riskTag(f)}</td>
      <td class="num">${f.rows}</td>
    </tr>`);
  const otherTable = other.length ? (() => {
    const id = 'inv-ot-' + (++RXSEQ);
    const rest = otherRows.slice(OTHER_PREVIEW);
    return `<div class="scroll rx-table-wrap"><table class="rx-table rx-inv__table">
      <thead><tr>
        <th>Позиции каталога</th><th>Версии, как записаны у вас</th><th>Что это</th><th class="num">Строк</th>
      </tr></thead>
      <tbody>${otherRows.slice(0, OTHER_PREVIEW).join('')}</tbody>
      ${rest.length ? `<tbody class="xmore" id="${id}" hidden>${rest.join('')}</tbody>` : ''}
    </table></div>
    ${rest.length ? `<button type="button" class="rx-panel__more xtoggle" data-x="${id}" data-n="${rest.length}"
      data-open-label="Показать ещё ${rest.length.toLocaleString('ru')} →" data-close-label="Свернуть">Показать ещё ${rest.length.toLocaleString('ru')} →</button>` : ''}`;
  })() : '';

  const spellBlock = spellings.length ? `
    <div class="rx-inv__sec">
      <h4 class="rx-panel__sec-title">Разные записи ведут на одну эталонную позицию</h4>
      <p class="rx-panel__sec-sh">Это не догадка о похожести строк, а факт каталога: перечисленные записи сопоставлены с одной и той же позицией.</p>
      <div class="rx-inv__callout">
        <div class="rx-inv__callout-k">Во что это обходится</div>
        <p>Пока эти формы не сведены, каждая считается отдельной позицией: <b>${nfmt(excess)}</b> ${plural(excess, 'лишняя строка', 'лишние строки', 'лишних строк')} в отчёте по лицензиям. Потребность завышена, сверка с закупками не сходится, а разбирать расхождения приходится вручную — примерно <b>${hrs}</b> при 3 минутах на сведение одной группы.</p>
      </div>
      ${spellTable}
    </div>` : '';

  const verBlock = (lf.length || other.length || rec.licSkippedFree) ? `
    <div class="rx-inv__sec">
      <h4 class="rx-panel__sec-title">Один продукт — несколько версий в парке</h4>
      <p class="rx-panel__sec-sh">Само по себе это не дефект данных, а факт инфраструктуры. Но для лицензионного учёта это ровно то место, где данные превращаются в деньги: <b>разные версии — это, возможно, разные лицензии</b>. Право использовать конкретную версию даёт не сам факт покупки, а условия артикула, по которому её купили. Лицензии у вас могут быть — и при этом не давать права на ту версию, которая реально стоит на машинах. Мы не видим ваших закупок и не знаем типа договора, поэтому не говорим, есть право или нет. Мы считаем, сколько установок окажется «не той версии» в каждом из двух возможных случаев.</p>

      <div class="rx-inv__callout">
        <div class="rx-inv__callout-k">Что это даёт</div>
        <p>В «Призме данных» — <b>${nfmt(md.skus)}</b> артикулов с предзаполненными условиями прав. По каждому известно, даёт ли лицензия право на понижение и на повышение версии и до какой именно версии оно действует. Это позволяет проверять правомерность использования конкретной версии в отчёте, а не поднимать договоры и лицензионные соглашения вручную по каждому продукту.</p>
      </div>

      ${lf.length ? `
      <div class="rx-inv__lb">Лицензируемое по каталогу — родство позиций и тип лицензирования взяты оттуда</div>
      <div class="rx-inv__cards">
        ${licCards.slice(0, LIC_PREVIEW).join('')}
      </div>
      ${lf.length > LIC_PREVIEW
        ? `<p class="rx-inv__more">…и ещё ${(lf.length - LIC_PREVIEW).toLocaleString('ru')} ${plural(lf.length - LIC_PREVIEW, 'продукт', 'продукта', 'продуктов')}</p>`
        : ''}` : ''}

      ${other.length ? `
      <div class="rx-inv__lb">Остальное по каталогу — лицензионного вопроса здесь нет</div>
      <p class="rx-panel__sec-sh">Каталог отсекает это за вас: бесплатное, компоненты и случаи, где позиция одна, а различаются только сборки. Без каталога в инвентаре всё это выглядит так же, как находки выше.</p>
      ${otherTable}` : ''}

      <div class="rx-inv__notes">
        ${rec.licSkippedFree
          ? `<p><b>${rec.licSkippedFree}</b> ${plural(rec.licSkippedFree, 'продукт', 'продукта', 'продуктов')} в нескольких версиях отсеяно как бесплатное или компоненты — ${nfmt(rec.licSkippedFreeRows)} ${plural(rec.licSkippedFreeRows, 'строка', 'строки', 'строк')}. Это работа, которую вам не нужно делать.</p>`
          : ''}
        <p><b>Главное ограничение.</b> Вопрос поставлен по ${lf.length} ${plural(lf.length, 'продукту', 'продуктам', 'продуктам')}. Ещё по ${nfmt(unknown)} ${plural(unknown, 'лицензируемой записи', 'лицензируемым записям', 'лицензируемым записям')} он не ставился вовсе — этих продуктов нет в демонстрационном срезе. В полном каталоге ${nfmt(md.libCommercial)} коммерческих продуктов, и по каждому вопрос ставится так же.</p>
      </div>
    </div>` : '';

  return `
  <section class="rx-inv" id="rx-inv">
    <div class="rx-inv__head">
      <span class="dx-tag"><span class="dx-tag__ico" aria-hidden="true">${ICO.coin}</span> Во что обходится необработанный инвентарь</span>
      <h3 class="rx-h">Цена нормализации, которой не было</h3>
      <p class="rx-sh">Ниже — то, что уже сейчас стоит вам рабочих часов и искажает отчётность по лицензиям. Каждая находка получена сопоставлением ваших записей с эталонным каталогом.</p>
    </div>
    ${spellBlock}
    ${verBlock}
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
