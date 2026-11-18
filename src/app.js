// Collega logica e schermate. Lo stato vive qui; ogni modifica passa da dispatch().
import { load, save, exportJson, importJson } from './store.js';
import { addMonths } from './model.js';
import { suggestCategory, remember, addCategory, renameCategory, deleteCategory } from './categories.js';
import { buildMovement } from './form.js';
import { todayIso } from './html.js';
import { renderHome } from './ui-home.js';
import { renderSheet } from './ui-movement.js';
import { renderSettings } from './ui-settings.js';

const root = document.getElementById('app');

function getStorage() {
  try {
    const s = window.localStorage;
    s.getItem('app-conti-fabiola-test');
    return s;
  } catch {
    return null;
  }
}
const storage = getStorage();

let state = storage ? load(storage) : load({ getItem: () => null, setItem: () => {} });
let month = todayIso().slice(0, 7);
let view = 'home';
let sheet = null; // { draft, isNew, catTouched }
let saveError = storage ? '' : 'Questo browser non permette di salvare i dati. Usa l\'app dalla schermata Home.';

function newId() {
  return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `m${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function blankDraft() {
  return { id: newId(), kind: 'uscita', amountText: '', description: '', category: null, account: 'personale', date: todayIso() };
}

function dispatch(next) {
  state = next;
  if (storage) {
    const r = save(storage, state);
    saveError = r.ok ? '' : r.error;
  }
  render();
}

function render() {
  const banner = saveError ? `<div class="banner" role="alert">${saveError.replace(/</g, '&lt;')}</div>` : '';
  const body = view === 'settings' ? renderSettings(state) : renderHome(state, month, 'Ciao Fabiola');
  root.innerHTML = banner + body + (sheet ? renderSheet(state, sheet.draft, sheet.isNew) : '');
}

function readDraft() {
  const q = (id) => document.getElementById(id);
  const checked = document.querySelector('input[name="cat"]:checked');
  return {
    id: sheet.draft.id,
    kind: sheet.draft.kind,
    amountText: q('f-amount')?.value ?? '',
    description: q('f-desc')?.value ?? '',
    category: checked ? checked.value : null,
    account: q('f-account')?.value ?? sheet.draft.account,
    date: q('f-date')?.value ?? '',
  };
}

function openSheet(draft, isNew) {
  sheet = { draft, isNew, catTouched: !isNew };
  render();
}

function closeSheet() {
  sheet = null;
  render();
}

function saveSheet() {
  const draft = readDraft();
  const r = buildMovement(draft);
  const err = document.getElementById('f-error');
  if (!r.ok) {
    err.textContent = r.error;
    return;
  }
  const m = r.movement;
  const others = state.movements.filter((x) => x.id !== m.id);
  const memory = m.kind === 'uscita' ? remember(state.memory, m.description, m.category) : state.memory;
  sheet = null;
  month = m.date.slice(0, 7);
  dispatch({ ...state, movements: [...others, m], memory });
}

async function doExport() {
  const text = exportJson(state);
  const name = `conti-${todayIso()}.json`;
  const file = new File([text], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function doImport(file) {
  const err = document.getElementById('s-error');
  const r = importJson(await file.text());
  if (!r.ok) {
    err.textContent = r.error;
    return;
  }
  if (!confirm('Importando, i dati attuali verranno sostituiti da quelli del file. Continuare?')) return;
  dispatch(r.state);
}

root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'prev-month') { month = addMonths(month, -1); render(); }
  else if (action === 'next-month') { month = addMonths(month, 1); render(); }
  else if (action === 'settings') { view = 'settings'; render(); }
  else if (action === 'back') { view = 'home'; render(); }
  else if (action === 'add') openSheet(blankDraft(), true);
  else if (action === 'edit') {
    const m = state.movements.find((x) => x.id === el.dataset.id);
    if (m) openSheet({ id: m.id, kind: m.kind, amountText: String(m.amount / 100).replace('.', ','), description: m.description, category: m.category, account: m.account, date: m.date }, false);
  } else if (action === 'close-sheet') closeSheet();
  else if (action === 'kind') {
    const cur = readDraft();
    sheet.draft = { ...cur, kind: el.dataset.kind };
    render();
  } else if (action === 'delete') {
    if (confirm('Eliminare questo movimento?')) {
      const id = sheet.draft.id;
      sheet = null;
      dispatch({ ...state, movements: state.movements.filter((x) => x.id !== id) });
    }
  } else if (action === 'export') doExport();
  else if (action === 'rename-cat') {
    const to = prompt('Nuovo nome della categoria', el.dataset.name);
    if (to !== null) {
      const r = renameCategory(state.categories, state.memory, state.movements, el.dataset.name, to);
      dispatch({ ...state, categories: r.categories, memory: r.memory, movements: r.movements });
    }
  } else if (action === 'delete-cat') {
    if (confirm(`Eliminare "${el.dataset.name}"? Le sue spese passeranno in "Altro".`)) {
      const r = deleteCategory(state.categories, state.memory, state.movements, el.dataset.name);
      dispatch({ ...state, categories: r.categories, memory: r.memory, movements: r.movements });
    }
  }
});

root.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'movement-form') saveSheet();
  else if (e.target.id === 'add-cat') {
    const input = document.getElementById('new-cat');
    dispatch({ ...state, categories: addCategory(state.categories, input.value) });
  }
});

root.addEventListener('input', (e) => {
  if (!sheet) return;
  if (e.target.id === 'f-desc' && sheet.draft.kind === 'uscita' && !sheet.catTouched) {
    const s = suggestCategory(state.memory, e.target.value);
    const radios = document.querySelectorAll('input[name="cat"]');
    radios.forEach((r) => { r.checked = s !== null && r.value === s; });
  }
});

root.addEventListener('change', (e) => {
  if (e.target.name === 'cat' && sheet) sheet.catTouched = true;
  if (e.target.id === 'import-file' && e.target.files[0]) {
    doImport(e.target.files[0]).finally(() => { e.target.value = ''; });
  }
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
render();
