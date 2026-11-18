import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, formatEuro, balance, monthSummary, last6Months } from '../src/model.js';

test('parseAmount legge virgola e punto', () => {
  assert.equal(parseAmount('45,50'), 4550);
  assert.equal(parseAmount('45.5'), 4550);
  assert.equal(parseAmount(' 1240 '), 124000);
});

test('parseAmount rifiuta valori non validi', () => {
  for (const v of ['', '0', '-3', 'abc', '1,2,3', '0,00', '12 euro']) {
    assert.equal(parseAmount(v), null, v);
  }
});

test('formatEuro', () => {
  assert.equal(formatEuro(124000), '€ 1.240');
  assert.equal(formatEuro(4550), '€ 45,50');
  assert.equal(formatEuro(0), '€ 0');
});

const m = (o) => ({ id: 'x', description: '', category: null, date: '2026-11-05', ...o });

test('balance con entrate e uscite', () => {
  const list = [
    m({ kind: 'entrata', account: 'personale', amount: 210000 }),
    m({ kind: 'uscita', account: 'personale', amount: 8600, category: 'Cibo' }),
  ];
  assert.equal(balance(list), 210000 - 8600);
  assert.equal(balance([]), 0);
});

test('monthSummary esclude altri mesi', () => {
  const list = [
    m({ kind: 'entrata', account: 'personale', amount: 210000 }),
    m({ kind: 'uscita', account: 'personale', amount: 8000, category: 'Cibo' }),
    m({ kind: 'uscita', account: 'personale', amount: 2000, category: 'Cibo' }),
    m({ kind: 'uscita', account: 'personale', amount: 500, category: 'Casa' }),
    m({ kind: 'uscita', account: 'personale', amount: 999, category: 'Cibo', date: '2026-10-31' }),
  ];
  assert.deepEqual(monthSummary(list, '2026-11'), {
    income: 210000,
    expense: 10500,
    byCategory: { Cibo: 10000, Casa: 500 },
  });
});

test('monthSummary di un mese vuoto', () => {
  assert.deepEqual(monthSummary([], '2026-11'), { income: 0, expense: 0, byCategory: {} });
});

test('last6Months attraversa l\'anno', () => {
  const list = [m({ kind: 'uscita', account: 'personale', amount: 700, category: 'Casa', date: '2026-12-10' })];
  const r = last6Months(list, '2027-01');
  assert.deepEqual(r.map((x) => x.month), ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01']);
  assert.equal(r[4].expense, 700);
  assert.equal(r[5].expense, 0);
});
