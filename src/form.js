// Trasforma i campi della scheda di inserimento in un movimento valido.
import { parseAmount } from './model.js';

function validDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text ?? '')) return false;
  const [y, m, d] = text.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function buildMovement({ id, kind, amountText, description, category, account, date }) {
  const amount = parseAmount(amountText ?? '');
  if (amount === null) return { ok: false, error: 'Inserisci un importo valido, ad esempio 45,50.' };
  if (kind === 'uscita' && !category) return { ok: false, error: 'Scegli una categoria.' };
  if (!validDate(date)) return { ok: false, error: 'La data non è valida.' };
  if (kind !== 'uscita' && kind !== 'entrata') return { ok: false, error: 'Tipo di movimento non valido.' };
  if (account !== 'personale') return { ok: false, error: 'Conto non valido.' };
  return {
    ok: true,
    movement: {
      id,
      kind,
      account,
      amount,
      description: String(description ?? '').trim(),
      category: kind === 'uscita' ? category : null,
      date,
    },
  };
}
