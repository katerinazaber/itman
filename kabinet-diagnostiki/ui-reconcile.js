/* ============================================================
   Второй акт интерфейса: сверка с эталонным каталогом.
   Одна и та же логика собирается в две компоновки:
     'classic' — как раньше: сначала результат сверки, потом находки;
     'problem' — сначала цена проблемы, потом решение.
   Компоновка подставляется на сборке.
   ============================================================ */

const LAYOUT = 'problem';

function pct(x) { return (x * 100).toFixed(x >= 0.995 ? 0 : 1).replace('.', ',') + '%'; }

/* Ручное сопоставление одной записи с каталогом: поиск, сверка версии и
   редакции, решение. Оценка консервативная и вынесена в текст, чтобы ее
   можно было оспорить. */
const MIN_PER_ROW = 2;
function workHours(minutes) {
  const h = minutes / 60;
  if (h < 1) return `${Math.round(minutes)} мин`;
  if (h < 10) return `${h.toFixed(1).replace('.', ',')} ч`;
  if (h < 80) return `${Math.round(h)} ч`;
  return `${Math.round(h)} ч (${Math.round(h / 8)} ${plural(Math.round(h / 8), 'рабочий день', 'рабочих дня', 'рабочих дней')})`;
}

/* Справка о бизнес-результате. Первично — операционные трудозатраты,
   вторично — качество учета и экономия на активах. */
const biz = (kind, html) => `<div class="biz ${kind === 'cost' ? 'biz-cost' : ''}">
  <span class="biz-k">${kind === 'cost' ? 'ВО ЧТО ЭТО ОБХОДИТСЯ' : 'ЧТО ЭТО ДАЕТ'}</span>
  <div>${html}</div></div>`;

/* Раскрываемая таблица: видно 3 строки, остальное по кнопке. */
let XSEQ = 0;
function expandable(head, rows, preview) {
  const id = 'x' + (++XSEQ);
  const rest = rows.slice(preview);
  return `<div class="scroll"><table>${head}
      <tbody>${rows.slice(0, preview).join('')}</tbody>
      ${rest.length ? `<tbody class="xmore" id="${id}" hidden>${rest.join('')}</tbody>` : ''}
    </table></div>
    ${rest.length ? `<button class="xtoggle" data-x="${id}" data-n="${rest.length}">Показать еще ${rest.length.toLocaleString('ru')}</button>` : ''}`;
}

function renderReconcile(rec, core) {
  const md = core.meta;
  const nearly = rec.reasons[3] + rec.reasons[4];
  const unknown = rec.reasons[5];
  const share = rec.licensable ? rec.known / rec.licensable : 0;
  const scale = Math.round(md.libApps / md.apps);

  /* ---------- таблица «до и после» ---------- */
  const baRows = rec.rows.slice(0, 200).map(r => `<tr>
      <td class="raw">${esc(r.it.name)}</td>
      <td class="raw dim">${esc(r.it.version || '—')}</td>
      <td class="raw dim">${esc(r.it.publisher || '—')}</td>
      <td class="arrowcell">→</td>
      <td class="ref">${esc(r.app)}${r.code === 6 ? '<span class="via" title="Эта форма записи сама по себе не нашлась, но другая форма той же записи с той же версией совпала с каталогом">по группе</span>' : ''}</td>
    </tr>`);

  /* ---------- разные записи на одну позицию ---------- */
  const spellExtra = rec.spellings.reduce((s, p) => s + (p.forms.size - 1), 0);
  const spellRows = rec.spellings.slice(0, 60).map(p => `<tr>
      <td>${esc(p.app)}</td>
      <td class="dim">${esc(p.vendor)}</td>
      <td class="forms-cell">${[...p.forms].slice(0, 6).map(f => `<span class="chip dup">${esc(f)}</span>`).join('')}</td>
      <td class="num">${p.rows.length}</td>
    </tr>`);

  /* ---------- один продукт в нескольких версиях ---------- */
  const LICSHORT = { 'Коммерческое': ['Лицензируемое', 'lic-com'],
                     'Условно бесплатное': ['Условно бесплатное', 'lic-com'],
                     'Бесплатное': ['Бесплатное', 'lic-free'],
                     'Компонент': ['Компонент', 'lic-comp'],
                     'Тестируемое': ['Тестовое', 'lic-free'] };
  const riskTag = f => {
    if (f.source !== 'catalog') return '<span class="risk risk-maj">Разные старшие версии</span>';
    if (f.licensable) return '<span class="risk risk-pat">Позиция одна · разные сборки</span>';
    const t = LICSHORT[f.lic];
    if (t) return `<span class="risk ${t[1]}">${t[0]}</span>`;
    return '<span class="risk lic-unk">Тип не указан в каталоге</span>';
  };
  /* Метку «новейшая» по сырой инвентарной версии не ставим: упорядочить эти
     строки надежно нельзя — «77.27» (это 1С 7.7) арифметически больше, чем
     «8.3.24». Порядок, за который можно отвечать, берется из каталога. */
  const verCell = f => `<div class="vers">${f.versions.slice(0, 8).map(v =>
      `<span class="chip ver">${esc(v.label)}${v.rows > 1 ? `<i>×${v.rows}</i>` : ''}</span>`).join('')}${
      f.versions.length > 8 ? `<span class="chip">…еще ${f.versions.length - 8}</span>` : ''}</div>`;
  const famRow = f => `<tr>
      <td>${f.source === 'catalog'
            ? f.apps.slice(0, 8).map(a => `<span class="chip ref-chip">${esc(a)}</span>`).join(' ')
            : esc(f.title) + `<div class="dim sm">${esc(f.vendor)}</div>`}</td>
      <td>${verCell(f)}</td>
      <td>${riskTag(f)}</td>
      <td class="num">${f.rows}</td>
    </tr>`;

  const lf = rec.licFamilies;
  const other = rec.freeFamilies.concat(rec.buildSpread);
  const otherRows = other.slice(0, 30).map(famRow);
  const heurRows = rec.heuristic.slice(0, 30).map(famRow);
  const licRows = lf.reduce((s, f) => s + f.rows, 0);

  const step = (p, cls) => `<span class="pos ${cls || ''}">${esc(p.app)}<i>×${p.rows}</i></span>`;
  const ladder = f => {
    const P = f.positions, last = P.length - 1;
    const cells = P.length <= 5
      ? P.map((p, i) => step(p, i === 0 ? 'old' : i === last ? 'new' : ''))
      : [step(P[0], 'old'), step(P[1]),
         `<span class="pos gap">…еще ${P.length - 4}</span>`,
         step(P[last - 1]), step(P[last], 'new')];
    return `<div class="ladder">${cells.join('<span class="lad-arr">→</span>')}</div>`;
  };
  const licCard = f => `<div class="lic-card">
      <div class="lic-h">
        <div><b>${esc(f.family)}</b> <span class="dim">· ${esc(f.vendor)}</span>
          ${f.editions.length > 1 ? `<span class="risk lic-ed">Разные редакции: ${f.editions.map(esc).join(' / ')}</span>` : ''}</div>
        <div class="dim sm">${f.positions.length} ${plural(f.positions.length, 'позиция каталога', 'позиции каталога', 'позиций каталога')} · ${f.rows} ${plural(f.rows, 'строка', 'строки', 'строк')}</div>
      </div>
      ${ladder(f)}
      <div class="branches">
        <div class="br up"><span class="br-n">${f.needUpgrade}</span>
          <span>если лицензии куплены на младшую — <b>${esc(f.oldest.app)}</b> — столько установок требуют права на повышение версии</span></div>
        <div class="br dn"><span class="br-n">${f.needDowngrade}</span>
          <span>если на старшую — <b>${esc(f.newest.app)}</b> — столько требуют права на понижение</span></div>
      </div>
    </div>`;

  /* ---------- витрина нормализации ---------- */
  const scField = (k, v, hi) => `<div class="sc-f${hi ? ' hi' : ''}"><span>${k}</span><b>${v ? esc(v) : '—'}</b></div>`;

  /* ================= секции ================= */

  const secHero = `
    <div class="rc-hero">
      <div class="rc-hero-l">
        <span class="rc-eyebrow">Шаг 2 · Нормализация</span>
        <h3>Сверка с эталонным каталогом</h3>
        <div class="sh">Мы взяли только лицензируемые записи и попробовали опознать каждую. Эталонное наименование показано ровно так, как оно записано в каталоге «Призмы данных» — с версией и редакцией, если они там есть. Мы ничего не дописываем от себя.</div>
      </div>
      <div class="rc-hero-r">
        <div class="rc-num">${pct(share)}</div>
        <div class="rc-bar"><i style="width:${Math.max(2, Math.round(share * 100))}%"></i></div>
        <div class="rc-lab"><b>${rec.known.toLocaleString('ru')}</b> из ${rec.licensable.toLocaleString('ru')} лицензируемых записей опознано автоматически</div>
      </div>
    </div>

    <div class="rz-row">
      ${rec.known ? `<div class="rz ok"><div class="rz-n">${rec.known}</div><div><b>Опознано</b><span>${rec.propagated ? `${rec.known - rec.propagated} напрямую, ${rec.propagated} перенесено на другие написания той же записи` : 'сопоставлено с эталонным продуктом'}</span></div></div>` : ''}
      ${nearly ? `<div class="rz warn"><div class="rz-n">${nearly}</div><div><b>Почти сошлось</b><span>наименование нашлось, но помешал вендор или формат версии — это чинится правилом</span></div></div>` : ''}
      ${unknown ? `<div class="rz bad"><div class="rz-n">${unknown}</div><div><b>Нет в демонстрационном срезе</b><span>сравнение шло с ${md.apps.toLocaleString('ru')} ${plural(md.apps, 'эталонным продуктом', 'эталонными продуктами', 'эталонными продуктами')} из ${md.libApps.toLocaleString('ru')}</span></div></div>` : ''}
    </div>

    ${biz('gain', `<b>${rec.known.toLocaleString('ru')}</b> ${plural(rec.known, 'запись не требует', 'записи не требуют', 'записей не требуют')} ручного разбора аналитиком — это около <b>${workHours(rec.known * MIN_PER_ROW)}</b>
      при консервативной оценке в ${MIN_PER_ROW} минуты на ручное сопоставление одной записи с каталогом.
      И это повторяющаяся экономия: инвентаризация выгружается регулярно, а нормализация выполняется без участия человека.
      Следом идет второй эффект — отчет по лицензиям строится на позициях каталога, а не на строках инвентаря, и перестает завышать потребность.`)}

    <div class="corenote">
      <b>С чем сравнивали.</b> Сравнение проведено с <b>${md.apps.toLocaleString('ru')}</b> ${plural(md.apps, 'эталонным продуктом', 'эталонными продуктами', 'эталонными продуктами')} — это демонстрационный срез каталога «Призмы данных».
      В полном каталоге <b>${md.libApps.toLocaleString('ru')}</b> эталонных продуктов, то есть в ${scale} ${plural(scale, 'раз', 'раза', 'раз')} больше.
      Все, что помечено как «не опознано», делится на две части: то, чего нет и в полном каталоге, и то, что там есть. Разбираем это на третий день марафона.
      В самом продукте сопоставление выполняет модель машинного обучения; на этой странице работает ее упрощенная офлайн-версия, и она заведомо слабее.
    </div>`;

  const secBefore = rec.rows.length ? `
    <h4 class="blk">Что удалось привести к эталону</h4>
    <div class="sh">Слева — как записано в вашей выгрузке, справа — учетная позиция каталога.</div>
    ${expandable('<thead><tr><th colspan="3">Ваша запись</th><th></th><th>Эталонное наименование</th></tr></thead>', baRows, 3)}
    ${rec.rows.length > 200 ? `<div class="more">Показаны первые 200 из ${rec.rows.length.toLocaleString('ru')}</div>` : ''}` : '';

  const scBenefits = `
    <div class="rx-benefits">
      <h4 class="blk">Что это дает</h4>
      <div class="rx-benefits__row">
        <div class="rx-benefits__i"><b>Единая учетная позиция</b><span>Вместо россыпи строк реестра — одна карточка продукта из каталога.</span></div>
        <div class="rx-benefits__i"><b>Корректная отчетность и расчеты</b><span>Бюджет и претензии строятся по версии, редакции и типу лицензирования.</span></div>
        <div class="rx-benefits__i"><b>Меньше ручной работы</b><span>Около ${workHours(rec.known * MIN_PER_ROW)} экономии на этом объеме — и снова при каждой выгрузке.</span></div>
      </div>
    </div>`;

  const secShowcase = rec.showcase.length ? `
    <div class="sc-block rx-ba">
      <span class="rc-eyebrow">Бизнес-результат</span>
      <h4 class="blk sc-h">Что запись получает после нормализации</h4>
      <div class="sh">Слева — как записано в выгрузке. Справа — учетная единица каталога.</div>
      <div class="sc-row">${rec.showcase.map(a => `<div class="sc-card sc-card--ba">
          <div class="sc-ba-cols">
            <div class="sc-raw"><span class="k">Было</span>
              <code>${esc(a.raw.name)}</code>
              <span class="dim">${esc(a.raw.version || '—')} · ${esc(a.raw.publisher || '—')}</span></div>
            <div class="sc-arrow" aria-hidden="true">→</div>
            <div class="sc-fields">
              <span class="sc-ok-badge">Из каталога</span>
              ${scField('Наименование', a.app, 1)}
              ${scField('Издатель', a.vendor, 1)}
              ${scField('Версия', a.version, 1)}
              ${scField('Тип лицензирования', a.lic, 1)}
              ${scField('Семейство приложений', a.family)}
              ${scField('Страна производителя', a.country)}
              ${scField('Редакция', a.edition)}
              ${scField('Категория', a.cat)}
            </div>
          </div>
        </div>`).join('')}</div>
      ${scBenefits}
      ${biz('gain', `Каждое из этих полей — это отчет, который сейчас собирается руками. Тип лицензирования отсекает то, что учитывать не нужно. Версия и редакция определяют, какая именно лицензия требуется.`)}
    </div>` : '';

  const secSpell = rec.spellings.length ? `
    <h4 class="blk">Разные записи ведут на одну эталонную позицию</h4>
    <div class="sh">Это не догадка о похожести строк, а факт каталога: перечисленные записи сопоставлены с одной и той же позицией.</div>
    ${biz('cost', `Пока эти формы не сведены, каждая считается отдельной позицией: <b>${spellExtra}</b> ${plural(spellExtra, 'лишняя строка', 'лишние строки', 'лишних строк')} в отчете по лицензиям.
      Потребность завышена, сверка с закупками не сходится, а разбирать расхождения приходится вручную — примерно <b>${workHours(rec.spellings.length * 3)}</b> при 3 минутах на сведение одной группы.`)}
    ${expandable('<thead><tr><th>Эталонная позиция</th><th>Вендор</th><th>Как записано у вас</th><th class="num">Строк</th></tr></thead>', spellRows, 3)}` : '';

  const secVersions = (lf.length || other.length || rec.heuristic.length) ? `
    <h4 class="blk">Один продукт — несколько версий в парке</h4>
    <div class="sh">Само по себе это не дефект данных, а факт инфраструктуры. Но для лицензионного учета это ровно то место, где данные превращаются в деньги:
      <b>разные версии — это, возможно, разные лицензии</b>. Право использовать конкретную версию дает не сам факт покупки, а условия артикула, по которому ее купили.
      Лицензии у вас могут быть — и при этом не давать права на ту версию, которая реально стоит на машинах.
      Мы не видим ваших закупок и не знаем типа договора, поэтому не говорим, есть право или нет. Мы считаем, сколько установок окажется «не той версии» в каждом из двух возможных случаев.</div>

    ${lf.length ? `
    ${biz('gain', `В «Призме данных» — <b>${md.skus.toLocaleString('ru')}</b> ${plural(md.skus, 'артикул', 'артикула', 'артикулов')} с предзаполненными условиями прав.
      По каждому известно, дает ли лицензия право на понижение и на повышение версии и до какой именно версии оно действует.
      Это позволяет проверять правомерность использования конкретной версии в отчете, а не поднимать договоры и лицензионные соглашения вручную по каждому продукту.`)}

    <div class="src-lb ok">Лицензируемое по каталогу — родство позиций и тип лицензирования взяты оттуда</div>
    ${lf.slice(0, 8).map(licCard).join('')}
    ${lf.length > 8 ? `<div class="more">…и еще ${(lf.length - 8).toLocaleString('ru')} ${plural(lf.length - 8, 'продукт', 'продукта', 'продуктов')}</div>` : ''}` : ''}

    ${other.length ? `
    <div class="src-lb ok">Остальное по каталогу — лицензионного вопроса здесь нет</div>
    <div class="sh">Каталог отсекает это за вас: бесплатное, компоненты и случаи, где позиция одна, а различаются только сборки. Без каталога в инвентаре все это выглядит так же, как находки выше.</div>
    ${expandable('<thead><tr><th>Позиции каталога</th><th>Версии, как записаны у вас</th><th>Что это</th><th class="num">Строк</th></tr></thead>', otherRows, 3)}` : ''}

    ${rec.heuristic.length ? `
    <div class="src-lb warn">По совпадению наименования и издателя — среди записей, которых нет в демонстрационном срезе.
      Опоры на каталог здесь нет: тип лицензирования неизвестен, родство позиций не подтверждено. Список стоит просмотреть глазами.</div>
    ${expandable('<thead><tr><th>Продукт и издатель, как записаны у вас</th><th>Версии, как записаны у вас</th><th>Что это значит</th><th class="num">Строк</th></tr></thead>', heurRows, 3)}` : ''}

    <div class="lic-notes">
      ${rec.licSkippedFree ? `<div class="ln"><b>${rec.licSkippedFree}</b> ${plural(rec.licSkippedFree, 'продукт', 'продукта', 'продуктов')} в нескольких версиях отсеяно как бесплатное или компоненты — ${rec.licSkippedFreeRows.toLocaleString('ru')} ${plural(rec.licSkippedFreeRows, 'строка', 'строки', 'строк')}. Это работа, которую вам не нужно делать.</div>` : ''}
      ${rec.licBlurred.length ? `<div class="ln"><b>${rec.licBlurred.length}</b> ${plural(rec.licBlurred.length, 'продукт', 'продукта', 'продуктов')} отложено: каталог не дает версию хотя бы для двух позиций, а без версии вопрос поставить нельзя. Делать вид, что можно, мы не будем.</div>` : ''}
      <div class="ln"><b>Главное ограничение.</b> Вопрос поставлен по ${lf.length} ${plural(lf.length, 'продукту', 'продуктам', 'продуктам')}. Еще по ${unknown.toLocaleString('ru')} ${plural(unknown, 'лицензируемой записи', 'лицензируемым записям', 'лицензируемым записям')} он не ставился вовсе — этих продуктов нет в демонстрационном срезе. В полном каталоге ${md.libCommercial.toLocaleString('ru')} коммерческих продуктов, и по каждому вопрос ставится так же.</div>
    </div>` : '';

  /* ================= сборка ================= */

  if (LAYOUT === 'problem') {
    return `
  <div class="card sect recon" id="rx-recon">
    ${secHero}
    ${secShowcase}
    ${secBefore}
  </div>

  ${(secSpell || secVersions) ? `<div class="card sect prob">
    <span class="rc-eyebrow warn">Детали сопоставления с каталогом</span>
    <h3>Что еще видно после сверки</h3>
    <div class="sh">Находки ниже получены сопоставлением ваших записей с эталонным каталогом — это продолжение симптомов выше.</div>
    ${secSpell}
    ${secVersions}
  </div>` : ''}`;
  }

  return `
  <div class="card sect recon">
    ${secHero}
    ${secBefore}
    ${secShowcase}
    ${secSpell}
    ${secVersions}
  </div>`;
}

/* Раскрытие длинных таблиц */
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

