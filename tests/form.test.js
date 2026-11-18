import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMovement } from '../src/form.js';

const base = { id: 'a1', kind: 'uscita', amountText: '45,50', description: '  Tigros ', category: 'Cibo', account: 'personale', date: '2026-11-05' };

test('uscita valida', () => {
  const r = buildMovement(base);
  assert.equal(r.ok, true);
  assert.deepEqual(r.movement, { id: 'a1', kind: 'uscita', account: 'personale', amount: 4550, description: 'Tigros', category: 'Cibo', date: '2026-11-05' });
});

test('importo non valido rifiutato', () => {
  for (const amountText of ['', '0', '-5', 'abc']) {
    const r = buildMovement({ ...base, amountText });
    assert.equal(r.ok, false, amountText);
    assert.match(r.error, /importo/i);
  }
});

test('uscita senza categoria rifiutata', () => {
  const r = buildMovement({ ...base, category: null });
  assert.equal(r.ok, false);
  assert.match(r.error, /categoria/i);
});

test('l\'entrata non ha categoria', () => {
  const e = buildMovement({ ...base, kind: 'entrata', category: 'Cibo' });
  assert.equal(e.movement.category, null);
  assert.equal(e.movement.account, 'personale');
});

test('tipo quota e conto postepay non esistono in questa app', () => {
  assert.equal(buildMovement({ ...base, kind: 'quota' }).ok, false);
  assert.equal(buildMovement({ ...base, account: 'postepay' }).ok, false);
});

test('data non valida rifiutata', () => {
  for (const date of ['', 'ieri', '2026-02-31', '2026-13-01']) {
    assert.equal(buildMovement({ ...base, date }).ok, false, date);
  }
});

test('conto sconosciuto rifiutato', () => {
  assert.equal(buildMovement({ ...base, account: 'cassa' }).ok, false);
});
