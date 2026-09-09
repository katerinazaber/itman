/* ============================================================
   Второй акт интерфейса: сверка с эталонным каталогом.
   ============================================================ */

const plMask = n => plural(n, 'маска', 'маски', 'масок');
const plTimes = n => plural(n, 'раз', 'раза', 'раз');

function pct(x) { return (x * 100).toFixed(x >= 0.995 ? 0 : 1).replace('.', ',') + '%'; }

function renderReconcile(rec, core) {
  const meta = core.meta;
  const nearly = rec.reasons[3] + rec.reasons[4];
  const unknown = rec.reasons[5];
  const share = rec.licensable ? rec.known / rec.licensable : 0;

  /* ---- таблица «до и после» ---- */
  const shown = rec.rows.slice(0, 40);
  const beforeAfter = shown.map(r => `<tr>
      <td class="raw">${esc(r.it.name)}</td>
      <td class="raw dim">${esc(r.it.version || '—')}</td>
      <td class="raw dim">${esc(r.it.publisher || '—')}</td>
      <td class="arrowcell">→</td>
      <td class="ref">${esc(r.app)}${r.code === 6 ? '<span class="via" title="Эта форма записи сама по себе не нашлась, но другая форма той же записи с той же версией совпала с каталогом">по группе</span>' : ''}</td>
    </tr>`).join('');

  /* ---- разные записи, ведущие на одну эталонную позицию ---- */
  const spell = rec.spellings.slice(0, 20).map(p => `<tr>
      <td>${esc(p.app)}</td>
      <td class="dim">${esc(p.vendor)}</td>
      <td class="forms-cell">${[...p.forms].slice(0, 6).map(f => `<span class="chip dup">${esc(f)}</span>`).join('')}</td>
      <td class="num">${p.rows.length}</td>
    </tr>`).join('');

  /* ---- один продукт в нескольких версиях ---- */
  /* Ярлык в каталожной таблице — не наша оценка, а тип лицензирования из
     справочника «Приложение». Именно он решает, стоит ли находка внимания:
     десять версий бесплатного продукта — не работа для SAM-менеджера. */
  const LICSHORT = { 'Коммерческое': ['Лицензируемое', 'lic-com'],
                     'Условно бесплатное': ['Условно бесплатное', 'lic-com'],
                     'Бесплатное': ['Бесплатное', 'lic-free'],
                     'Компонент': ['Компонент', 'lic-comp'],
                     'Тестируемое': ['Тестовое', 'lic-free'] };
  const riskTag = f => {
    if (f.source !== 'catalog') return '<span class="risk risk-maj">Разные старшие версии</span>';
    /* В таблице «остальное» ярлык объясняет, ПОЧЕМУ вопроса о правах нет.
       Лицензируемый продукт попадает сюда, только если позиция каталога одна,
       а различаются сборки — это вопрос обновлений, не лицензий. */
    if (f.licensable) return '<span class="risk risk-pat">Позиция одна · разные сборки</span>';
    const t = LICSHORT[f.lic];
    if (t) return `<span class="risk ${t[1]}">${t[0]}</span>`;
    return '<span class="risk lic-unk">Тип не указан в каталоге</span>';
  };
  /* Метку «новейшая» здесь не ставим: это сырые строки версий из вашего
     инвентаря, и упорядочить их надежно нельзя — «77.27» (это 1С 7.7)
     арифметически больше, чем «8.3.24». Порядок версий, за который можно
     отвечать, берется из каталога — он ниже, в блоке о правах. */
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
  const majCat = rec.families.length;
  const licN = rec.families.filter(f => f.licensable).length;
  const patCat = rec.buildSpread.length;
  const cat = rec.families.slice(0, 10).concat(rec.buildSpread.slice(0, 6));
  const catMore = (majCat - Math.min(majCat, 10)) + (patCat - Math.min(patCat, 6));
  const fams = cat.map(famRow).join('');
  const heur = rec.heuristic.slice(0, 12).map(famRow).join('');

  /* ---- вопрос прав на версию ----
     Мы не знаем закупок и типа договора, поэтому не утверждаем, есть право
     или нет. Мы считаем, сколько установок окажется «не той версии» в каждом
     из двух возможных случаев — это и есть вопрос, который несут в договор. */
  const lf = rec.licFamilies;
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

  const md = meta;
  const dgTot = md.dgYes + md.dgNo, ugTot = md.ugYes + md.ugNo;
  /* Прочие каталожные находки: бесплатное, компоненты и разнобой сборок при
     одной позиции. Лицензионного вопроса тут нет — показываем компактно. */
  const other = rec.freeFamilies.concat(rec.buildSpread);
  const otherRows = other.slice(0, 8).map(famRow).join('');
  const otherMore = other.length - Math.min(other.length, 8);

  /* Витрина: во что превращается запись после нормализации. Поля — несистемные
     атрибуты справочника «Приложение», как есть, без достройки. */
  const scField = (k, v) => `<div class="sc-f"><span>${k}</span><b>${v ? esc(v) : '—'}</b></div>`;
  const showcase = rec.showcase.length ? `
    <h4 class="blk">Что запись получает после нормализации</h4>
    <div class="sh">Выше — только наименование. На деле нормализованная запись несет весь набор атрибутов каталога: по ним и строятся отчеты, а не по строке из инвентаря. Вот ваши собственные записи целиком.</div>
    <div class="sc-row">${rec.showcase.map(a => `<div class="sc-card">
        <div class="sc-raw"><span class="k">БЫЛО</span>
          <code>${esc(a.raw.name)}</code>
          <span class="dim">${esc(a.raw.version || '—')} · ${esc(a.raw.publisher || '—')}</span></div>
        <div class="sc-fields">
          ${scField('Наименование', a.app)}
          ${scField('Семейство приложений', a.family)}
          ${scField('Вендор', a.vendor)}
          ${scField('Страна производителя', a.country)}
          ${scField('Версия', a.version)}
          ${scField('Редакция', a.edition)}
          ${scField('Тип лицензирования', a.lic)}
          ${scField('Категория', a.cat)}
          ${scField('Подкатегория', a.sub)}
          ${scField('Является пакетом', a.pkg)}
          ${scField('Окончание поддержки вендором', a.eol)}
        </div>
      </div>`).join('')}</div>
    <div class="sh" style="margin-top:12px">Прочерк — не наша недоработка, а честное состояние каталога: этого атрибута у позиции нет. Из этих полей и собирается лицензионная модель: тип лицензирования решает, нужен ли учет вообще, версия и редакция — какая именно лицензия, категория — в чей бюджет.</div>` : '';

  /* ---- причины ---- */
  const reasonRow = (n, title, note, cls) => n ? `<div class="rz ${cls}">
      <div class="rz-n">${n}</div>
      <div><b>${title}</b><span>${note}</span></div></div>` : '';

  const ex = (list, render) => list.length
    ? `<div class="find"><div class="k">ПРИМЕРЫ</div>${list.map(render).join('')}</div>` : '';

  return `
  <div class="card sect recon">
    <div class="rc-head">
      <div>
        <h3>Сверка с эталонным каталогом</h3>
        <div class="sh">Второй шаг: мы взяли только лицензируемые записи и попробовали опознать каждую. Эталонное наименование показано ровно так, как оно записано в каталоге «Призмы данных» — вместе с версией и редакцией, если они там есть. Мы ничего не дописываем от себя.</div>
      </div>
      <div class="rc-big">
        <div class="rc-num">${pct(share)}</div>
        <div class="rc-lab">${rec.known.toLocaleString('ru')} из ${rec.licensable.toLocaleString('ru')}<br>лицензируемых записей опознано</div>
      </div>
    </div>

    <div class="rz-row">
      ${reasonRow(rec.known, 'Опознано', rec.propagated ? `${rec.known - rec.propagated} напрямую, ${rec.propagated} перенесено на другие написания той же записи` : 'совпало с эталонным каталогом', 'ok')}
      ${reasonRow(nearly, 'Почти сошлось', 'наименование нашлось, но помешал вендор или версия — это чинится правилом, а не каталогом', 'warn')}
      ${reasonRow(unknown, 'Нет в демонстрационном ядре', `ядро — ${meta.masks.toLocaleString('ru')} ${plMask(meta.masks)}, это ${pct(meta.masks / meta.libMasks)} каталога «Призмы данных»`, 'bad')}
    </div>

    <div class="corenote">
      <b>Честная оговорка.</b> В эту страницу встроено демонстрационное ядро: <b>${meta.masks.toLocaleString('ru')}</b> ${plMask(meta.masks)} распознавания
      на <b>${meta.apps.toLocaleString('ru')}</b> эталонных продуктов. Полный каталог «Призмы данных» —
      <b>${meta.libMasks.toLocaleString('ru')}</b> ${plMask(meta.libMasks)} на <b>${meta.libApps.toLocaleString('ru')}</b> продуктов,
      то есть в ${Math.round(meta.libMasks / meta.masks)} ${plTimes(Math.round(meta.libMasks / meta.masks))} больше. Все, что вы видите ниже как «не опознано»,
      делится на две части: то, чего нет и в полном каталоге, и то, что там есть. Разбираем это на третий день марафона.
    </div>

    ${rec.rows.length ? `
    <h4 class="blk">Что удалось привести к эталону</h4>
    <div class="scroll"><table class="ba">
      <thead><tr><th colspan="3">Ваша запись</th><th></th><th>Эталонное наименование</th></tr></thead>
      <tbody>${beforeAfter}</tbody>
    </table></div>
    ${rec.rows.length > 40 ? `<div class="more">…и еще ${(rec.rows.length - 40).toLocaleString('ru')} ${plural(rec.rows.length - 40, 'запись', 'записи', 'записей')}</div>` : ''}

    ${showcase}

    ${rec.spellings.length ? `
    <h4 class="blk">Разные записи ведут на одну эталонную позицию</h4>
    <div class="sh">Это не наша догадка о похожести строк, а факт каталога: перечисленные записи сопоставлены с одной и той же позицией. Для отчета по лицензиям каждая из них сейчас считается отдельно.</div>
    <div class="scroll"><table>
      <thead><tr><th>Эталонная позиция</th><th>Вендор</th><th>Как записано у вас</th><th class="num">Строк</th></tr></thead>
      <tbody>${spell}</tbody>
    </table></div>` : ''}

    ${(lf.length || cat.length || rec.heuristic.length) ? `
    <h4 class="blk">Один продукт — несколько версий в парке</h4>
    <div class="sh">Само по себе это не дефект данных, а факт инфраструктуры. Но для лицензионного учета это ровно то место, где данные превращаются в деньги:
      <b>разные версии — это, возможно, разные лицензии</b>. Право использовать конкретную версию дает не сам факт покупки, а условия артикула, по которому ее купили.
      Лицензии у вас могут быть — и при этом не давать права на ту версию, которая реально стоит на машинах.
      Мы не видим ваших закупок и не знаем типа договора, поэтому не говорим, есть право или нет. Мы считаем, сколько установок окажется «не той версии» в каждом из двух возможных случаев.</div>

    ${lf.length ? `
    <div class="lic-fact">
      <b>Почему вопрос не праздный.</b> В каталоге «Призмы данных» ${md.skus.toLocaleString('ru')} ${plural(md.skus, 'артикул', 'артикула', 'артикулов')} с условиями прав.
      Право на <b>понижение</b> версии заполнено у ${dgTot.toLocaleString('ru')} из них и дано в ${md.dgYes.toLocaleString('ru')} случаях — ${pct(md.dgYes / dgTot)}.
      Право на <b>повышение</b> заполнено у ${ugTot.toLocaleString('ru')} и дано только в ${md.ugYes.toLocaleString('ru')} — ${pct(md.ugYes / ugTot)}.
      Старая версия в парке обычно не проблема. Новая — проблема примерно в четырех случаях из десяти.
    </div>

    <div class="src-lb ok">Лицензируемое по каталогу — родство позиций и тип лицензирования взяты оттуда</div>
    ${lf.slice(0, 8).map(licCard).join('')}
    ${lf.length > 8 ? `<div class="more">…и еще ${(lf.length - 8).toLocaleString('ru')} ${plural(lf.length - 8, 'продукт', 'продукта', 'продуктов')}</div>` : ''}` : ''}

    ${other.length ? `
    <div class="src-lb ok">Остальное по каталогу — лицензионного вопроса здесь нет</div>
    <div class="sh">Каталог отсекает это за вас: бесплатное, компоненты и случаи, где позиция одна, а различаются только сборки. Без каталога в инвентаре все это выглядит так же, как находки выше.</div>
    <div class="scroll"><table>
      <thead><tr><th>Позиции каталога</th><th>Версии, как записаны у вас</th><th>Что это</th><th class="num">Строк</th></tr></thead>
      <tbody>${otherRows}</tbody>
    </table></div>
    ${otherMore > 0 ? `<div class="more">…и еще ${otherMore.toLocaleString('ru')}</div>` : ''}` : ''}

    ${rec.heuristic.length ? `
    <div class="src-lb warn">По совпадению наименования и издателя — среди записей, которых нет в демонстрационном ядре.
      Опоры на каталог здесь нет: тип лицензирования неизвестен, родство позиций не подтверждено. Список стоит просмотреть глазами.</div>
    <div class="scroll"><table>
      <thead><tr><th>Продукт и издатель, как записаны у вас</th><th>Версии, как записаны у вас</th><th>Что это значит</th><th class="num">Строк</th></tr></thead>
      <tbody>${heur}</tbody>
    </table></div>
    ${rec.heuristic.length > 12 ? `<div class="more">…и еще ${(rec.heuristic.length - 12).toLocaleString('ru')}</div>` : ''}` : ''}

    <div class="lic-notes">
      ${rec.licSkippedFree ? `<div class="ln"><b>${rec.licSkippedFree}</b> ${plural(rec.licSkippedFree, 'продукт', 'продукта', 'продуктов')} в нескольких версиях отсеяно как бесплатное или компоненты — ${rec.licSkippedFreeRows.toLocaleString('ru')} ${plural(rec.licSkippedFreeRows, 'строка', 'строки', 'строк')}. Это работа, которую вам не нужно делать.</div>` : ''}
      ${rec.licBlurred.length ? `<div class="ln"><b>${rec.licBlurred.length}</b> ${plural(rec.licBlurred.length, 'продукт', 'продукта', 'продуктов')} отложено: каталог не дает версию хотя бы для двух позиций, а без версии вопрос поставить нельзя. Делать вид, что можно, мы не будем.</div>` : ''}
      <div class="ln"><b>Главное ограничение.</b> Вопрос поставлен по ${lf.length} ${plural(lf.length, 'продукту', 'продуктам', 'продуктам')}. Еще по ${unknown.toLocaleString('ru')} ${plural(unknown, 'лицензируемой записи', 'лицензируемым записям', 'лицензируемым записям')} он не ставился вовсе — этих позиций нет в демонстрационном ядре, а это ${pct(md.masks / md.libMasks)} каталога. В полном каталоге ${md.libCommercial.toLocaleString('ru')} коммерческих продуктов против ${md.libFree.toLocaleString('ru')} бесплатных и ${md.libComponent.toLocaleString('ru')} компонентов — и по каждому коммерческому вопрос ставится так же.</div>
    </div>
    ` : ''}

    ${(rec.examples[3].length || rec.examples[4].length) ? `
    <h4 class="blk">Почти сошлось — и что именно помешало</h4>
    ${rec.examples[3].length ? `<div class="find"><div class="k">ВЕНДОР ЗАПИСАН ИНАЧЕ, ЧЕМ ЖДЕТ КАТАЛОГ</div>
      ${rec.examples[3].map(e => `<div class="cmp"><span class="chip dup">${esc(e.it.publisher || '(пусто)')}</span>
        <span class="arrow">каталог ждет</span><span class="chip ver">${esc(e.vmask)}</span>
        <span class="dim">→ ${esc(e.app)}</span></div>`).join('')}</div>` : ''}
    ${rec.examples[4].length ? `<div class="find"><div class="k">ВЕРСИЯ НЕ ПОПАЛА В ОЖИДАЕМЫЙ ФОРМАТ</div>
      ${rec.examples[4].map(e => `<div class="cmp"><span class="chip dup">${esc(e.it.version || '(пусто)')}</span>
        <span class="arrow">каталог ждет</span><span class="chip ver">${esc(e.rmask)}</span>
        <span class="dim">→ ${esc(e.app)}</span></div>`).join('')}</div>` : ''}
    <div class="sh" style="margin-top:10px">Это самая дешевая часть работы: здесь наименование уже опознано, поправить нужно только запись вендора или формат версии.</div>` : ''}
    ` : ''}
  </div>`;
}

