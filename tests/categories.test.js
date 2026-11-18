import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultCategories, normalizeDescription, suggestCategory, remember,
  addCategory, renameCategory, deleteCategory,
} from '../src/categories.js';

test('categorie di partenza', () => {
  assert.deepEqual(defaultCategories(), ['Cibo', 'Casa', 'Trasporti', 'Svago', 'Salute', 'Altro']);
});

test('normalizeDescription ignora maiuscole e spazi', () => {
  assert.equal(normalizeDescription('  TIGROS   Roma '), 'tigros roma');
});

test('la memoria trova la descrizione anche scritta diversamente', () => {
  const mem = remember({}, 'Tigros', 'Cibo');
  assert.equal(suggestCategory(mem, '  TIGROS '), 'Cibo');
  assert.equal(suggestCategory(mem, 'Esselunga'), null);
  assert.equal(suggestCategory(mem, ''), null);
});

test('remember non modifica l\'originale e vale l\'ultima scelta', () => {
  const a = remember({}, 'Tigros', 'Cibo');
  const b = remember(a, 'tigros', 'Casa');
  assert.deepEqual(a, { tigros: 'Cibo' });
  assert.deepEqual(b, { tigros: 'Casa' });
});

test('addCategory rifiuta vuoti e doppioni', () => {
  const list = ['Cibo', 'Casa'];
  assert.deepEqual(addCategory(list, 'Animali'), ['Cibo', 'Casa', 'Animali']);
  assert.deepEqual(addCategory(list, '  '), list);
  assert.deepEqual(addCategory(list, 'casa'), list);
});

const mv = (category) => ({ id: category + Math.random(), kind: 'uscita', account: 'personale', amount: 100, description: '', category, date: '2026-11-01' });

test('deleteCategory sposta spese e memoria in Altro', () => {
  const list = ['Cibo', 'Casa', 'Altro'];
  const mem = { tigros: 'Cibo', affitto: 'Casa' };
  const r = deleteCategory(list, mem, [mv('Cibo'), mv('Cibo'), mv('Casa')], 'Cibo');
  assert.deepEqual(r.categories, ['Casa', 'Altro']);
  assert.equal(r.movements.filter((x) => x.category === 'Altro').length, 2);
  assert.deepEqual(r.memory, { tigros: 'Altro', affitto: 'Casa' });
  assert.equal(r.movements.reduce((s, x) => s + x.amount, 0), 300);
});

test('Altro non si elimina', () => {
  const list = ['Cibo', 'Altro'];
  const r = deleteCategory(list, {}, [mv('Altro')], 'Altro');
  assert.deepEqual(r.categories, list);
});

test('renameCategory aggiorna elenco, spese e memoria', () => {
  const r = renameCategory(['Cibo', 'Altro'], { tigros: 'Cibo' }, [mv('Cibo')], 'Cibo', 'Alimentari');
  assert.deepEqual(r.categories, ['Alimentari', 'Altro']);
  assert.equal(r.movements[0].category, 'Alimentari');
  assert.deepEqual(r.memory, { tigros: 'Alimentari' });
});

test('renameCategory rifiuta un nome già usato', () => {
  const r = renameCategory(['Cibo', 'Casa'], {}, [], 'Cibo', 'casa');
  assert.deepEqual(r.categories, ['Cibo', 'Casa']);
});
