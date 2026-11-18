// Schermata principale: riepilogo del mese e elenco dei movimenti.
import { balance, monthSummary, last6Months, formatEuro } from './model.js';
import { esc, monthName, shortMonth, dayLabel } from './html.js';

const SHADES = ['#2F5D46', '#5E8F76', '#8DB5A0', '#B7D1C3'];

function categoryBars(summary) {
  const rows = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '<p class="muted">Nessuna spesa in questo mese.</p>';
  const max = rows[0][1];
  return rows.map(([name, cents], i) => `
    <div class="bar-row">
      <div class="bar-label"><span>${esc(name)}</span><span>${formatEuro(cents)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, Math.round((cents / max) * 100))}%;background:${SHADES[Math.min(i, 3)]}"></div></div>
    </div>`).join('');
}

function monthChart(state, month) {
  const data = last6Months(state.movements, month);
  const max = Math.max(1, ...data.map((d) => d.expense));
  return `<div class="chart">${data.map((d) => `
    <div class="chart-col">
      <div class="chart-bar${d.month === month ? ' current' : ''}" style="height:${Math.max(4, Math.round((d.expense / max) * 70))}px"></div>
      <span class="${d.month === month ? 'strong' : 'muted'} small">${shortMonth(d.month)}</span>
    </div>`).join('')}</div>`;
}

function movementRow(m) {
  const sign = m.kind === 'entrata' ? '+' : '−';
  const cls = m.kind === 'entrata' ? 'pos' : 'neg';
  const title = m.description || (m.kind === 'entrata' ? 'Entrata' : 'Uscita');
  const cat = m.kind === 'uscita' && m.category ? ` · ${esc(m.category)}` : '';
  return `
    <button class="row" data-action="edit" data-id="${esc(m.id)}">
      <span class="row-main"><span class="row-title">${esc(title)}</span>
      <span class="small muted">${dayLabel(m.date)}${cat}</span></span>
      <span class="${cls} strong">${sign} ${formatEuro(m.amount)}</span>
    </button>`;
}

export function renderHome(state, month, userName) {
  const sum = monthSummary(state.movements, month);
  const pct = sum.income > 0 ? Math.min(100, Math.round((sum.expense / sum.income) * 100)) : sum.expense > 0 ? 100 : 0;
  const list = state.movements.filter((m) => m.date.startsWith(month))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return `
    <header class="top">
      <div><span class="muted small">${esc(userName)}</span>
      <h1>${monthName(month)}</h1></div>
      <div class="nav">
        <button class="icon-btn" data-action="prev-month" aria-label="Mese precedente">‹</button>
        <button class="icon-btn" data-action="next-month" aria-label="Mese successivo">›</button>
        <button class="icon-btn" data-action="settings" aria-label="Impostazioni">⚙</button>
      </div>
    </header>
    <section class="card dark balance"><span class="small">Saldo</span><strong class="big">${formatEuro(balance(state.movements))}</strong></section>
    <section class="card block">
      <div class="split">
        <div><span class="small muted">Entrate</span><br><strong class="pos big2">${formatEuro(sum.income)}</strong></div>
        <div class="right"><span class="small muted">Uscite</span><br><strong class="neg big2">${formatEuro(sum.expense)}</strong></div>
      </div>
      <div class="bar-track thick"><div class="bar-fill" style="width:${pct}%;background:#B4492F"></div></div>
      <span class="small muted">${sum.income > 0 ? `Hai speso il ${pct}% di quello che è entrato` : 'Nessuna entrata registrata in questo mese'}</span>
    </section>
    <section class="card block"><h2>Spese per categoria</h2>${categoryBars(sum)}</section>
    <section class="card block"><h2>Ultimi mesi</h2>${monthChart(state, month)}</section>
    <section class="card block"><h2>Movimenti del mese</h2>
      ${list.length ? list.map(movementRow).join('') : '<p class="muted">Ancora nessun movimento.</p>'}
    </section>
    <button class="fab" data-action="add" aria-label="Aggiungi movimento">+</button>`;
}
