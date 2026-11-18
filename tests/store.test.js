import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, load, save, exportJson, importJson } from '../src/store.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; }, data };
}

const sample = () => ({
  ...emptyState(),
  movements: [{ id: 'a1', kind: 'uscita', account: 'personale', amount: 4550, description: 'Tigros', category: 'Cibo', date: '2026-11-05' }],
  memory: { tigros: 'Cibo' },
});

test('emptyState ha le categorie di partenza', () => {
  const s = emptyState();
  assert.equal(s.version, 1);
  assert.deepEqual(s.movements, []);
  assert.equal(s.categories.length, 6);
});

test('salva e carica restituisce lo stesso stato', () => {
  const st = fakeStorage();
  const s = sample();
  assert.deepEqual(save(st, s), { ok: true });
  assert.deepEqual(load(st), s);
});

test('load senza dati o con dati rovinati dà lo stato vuoto', () => {
  assert.deepEqual(load(fakeStorage()), emptyState());
  assert.deepEqual(load(fakeStorage({ 'app-conti-fabiola-v1': '{rotto' })), emptyState());
});

test('dati rovinati vengono messi da parte, non persi', () => {
  const st = fakeStorage({ 'app-conti-fabiola-v1': '{rotto' });
  load(st);
  assert.equal(st.data['app-conti-fabiola-v1-corrotto'], '{rotto');
});

test('save segnala l\'errore se l\'archivio rifiuta', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } };
  const r = save(st, sample());
  assert.equal(r.ok, false);
  assert.ok(r.error);
});

test('esporta e reimporta dà lo stesso stato', () => {
  const s = sample();
  const r = importJson(exportJson(s));
  assert.equal(r.ok, true);
  assert.deepEqual(r.state, s);
});

test('importJson rifiuta file non validi', () => {
  const bad = [
    'non json',
    '{"version":99,"movements":[],"categories":[],"memory":{}}',
    JSON.stringify({ ...sample(), movements: [{ ...sample().movements[0], amount: 45.5 }] }),
    JSON.stringify({ ...sample(), movements: [{ ...sample().movements[0], account: 'cassa' }] }),
    JSON.stringify({ ...sample(), movements: [{ ...sample().movements[0], account: 'postepay' }] }),
    JSON.stringify({ ...sample(), movements: [{ ...sample().movements[0], kind: 'quota' }] }),
    JSON.stringify({ ...sample(), movements: [{ ...sample().movements[0], date: 'ieri' }] }),
    JSON.stringify({ ...sample(), categories: 'Cibo' }),
    '[]',
    'null',
  ];
  for (const text of bad) assert.equal(importJson(text).ok, false, text.slice(0, 40));
});
