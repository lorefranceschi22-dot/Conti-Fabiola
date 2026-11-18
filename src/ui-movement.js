// Scheda per inserire o modificare un movimento.
import { esc } from './html.js';

const KIND_LABEL = { uscita: 'Uscita', entrata: 'Entrata' };

// draft: { id?, kind, amountText, description, category, account, date }
export function renderSheet(state, draft, isNew) {
  const showCats = draft.kind === 'uscita';
  return `
  <div class="sheet-backdrop" data-action="close-sheet"></div>
  <form class="sheet" id="movement-form" novalidate>
    <div class="sheet-head">
      <h2>${isNew ? 'Nuovo movimento' : 'Modifica movimento'}</h2>
      <button type="button" class="icon-btn" data-action="close-sheet" aria-label="Chiudi">×</button>
    </div>
    <div class="tabs" role="tablist">
      ${Object.entries(KIND_LABEL).map(([k, label]) => `
        <button type="button" role="tab" aria-selected="${k === draft.kind}" class="tab${k === draft.kind ? ' on' : ''}" data-action="kind" data-kind="${k}">${label}</button>`).join('')}
    </div>
    <label class="field">Importo
      <input id="f-amount" inputmode="decimal" autocomplete="off" placeholder="45,50" value="${esc(draft.amountText)}">
    </label>
    <label class="field">Descrizione
      <input id="f-desc" autocomplete="off" placeholder="${showCats ? 'Ad esempio Tigros' : 'Facoltativa'}" value="${esc(draft.description)}">
    </label>
    ${showCats ? `
    <fieldset class="field"><legend>Categoria</legend>
      <div class="chips" id="f-cats">
        ${state.categories.map((c) => `
          <label class="chip"><input type="radio" name="cat" value="${esc(c)}"${c === draft.category ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('')}
      </div>
    </fieldset>` : ''}
    <label class="field">Data
      <input id="f-date" type="date" value="${esc(draft.date)}">
    </label>
    <p class="error" id="f-error" role="alert"></p>
    <div class="sheet-actions">
      ${isNew ? '' : '<button type="button" class="btn danger" data-action="delete">Elimina</button>'}
      <button type="submit" class="btn primary" id="f-save">Salva</button>
    </div>
  </form>`;
}
