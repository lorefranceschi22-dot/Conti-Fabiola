// Salvataggio sul telefono, esportazione e importazione.
import { defaultCategories } from './categories.js';

const KEY = 'app-conti-fabiola-v1';
const KINDS = ['entrata', 'uscita'];
const ACCOUNTS = ['personale'];

export function emptyState() {
  return { version: 1, movements: [], categories: defaultCategories(), memory: {} };
}

function validMovement(m) {
  return m && typeof m === 'object'
    && typeof m.id === 'string'
    && KINDS.includes(m.kind)
    && ACCOUNTS.includes(m.account)
    && Number.isInteger(m.amount) && m.amount > 0
    && typeof m.description === 'string'
    && (m.category === null || typeof m.category === 'string')
    && typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date);
}

function validate(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'Il file non è un archivio dei conti.';
  if (obj.version !== 1) return 'Versione del file non riconosciuta.';
  if (!Array.isArray(obj.movements) || !obj.movements.every(validMovement)) return 'Movimenti non validi nel file.';
  if (!Array.isArray(obj.categories) || !obj.categories.every((c) => typeof c === 'string' && c.trim())) return 'Categorie non valide nel file.';
  if (!obj.memory || typeof obj.memory !== 'object' || Array.isArray(obj.memory)
      || !Object.values(obj.memory).every((v) => typeof v === 'string')) return 'Memoria delle descrizioni non valida.';
  return null;
}

// Se i dati salvati sono rovinati, ne tengo una copia a parte prima che
// il salvataggio successivo li sovrascriva.
function keepCorrupt(storage, raw) {
  try { storage.setItem(KEY + '-corrotto', raw); } catch { /* niente da fare */ }
}

export function load(storage) {
  let raw = null;
  try {
    raw = storage.getItem(KEY);
    if (!raw) return emptyState();
    const obj = JSON.parse(raw);
    if (!validate(obj)) return obj;
  } catch {
    // dati non leggibili: si passa alla copia di sicurezza qui sotto
  }
  if (raw) keepCorrupt(storage, raw);
  return emptyState();
}

export function save(storage, state) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Non riesco a salvare i dati sul telefono. Esporta un file e libera spazio.' };
  }
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Il file non è leggibile.' };
  }
  const problem = validate(obj);
  if (problem) return { ok: false, error: problem };
  const { version, movements, categories, memory } = obj;
  return { ok: true, state: { version, movements, categories, memory } };
}
