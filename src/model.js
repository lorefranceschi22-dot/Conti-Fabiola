// Calcoli sui movimenti. Gli importi sono sempre interi in centesimi.

export function parseAmount(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim();
  if (!/^\d+([.,]\d{1,2})?$/.test(t)) return null;
  const [intPart, decPart = ''] = t.replace(',', '.').split('.');
  const cents = Number(intPart) * 100 + Number(decPart.padEnd(2, '0'));
  return cents > 0 ? cents : null;
}

export function formatEuro(cents) {
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  const intStr = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return rest === 0 ? `€ ${intStr}` : `€ ${intStr},${String(rest).padStart(2, '0')}`;
}

export function balance(movements) {
  let total = 0;
  for (const m of movements) {
    if (m.kind === 'entrata') total += m.amount;
    else if (m.kind === 'uscita') total -= m.amount;
  }
  return total;
}

export function monthSummary(movements, month) {
  const out = { income: 0, expense: 0, byCategory: {} };
  for (const m of movements) {
    if (!m.date.startsWith(month)) continue;
    if (m.kind === 'entrata') out.income += m.amount;
    else if (m.kind === 'uscita') {
      out.expense += m.amount;
      const c = m.category ?? 'Altro';
      out.byCategory[c] = (out.byCategory[c] ?? 0) + m.amount;
    }
  }
  return out;
}

export function addMonths(month, delta) {
  const [y, mo] = month.split('-').map(Number);
  const idx = y * 12 + (mo - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

export function last6Months(movements, month) {
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const mm = addMonths(month, -i);
    result.push({ month: mm, expense: monthSummary(movements, mm).expense });
  }
  return result;
}
