// Impostazioni: categorie, esportazione e importazione.
import { esc } from './html.js';

export function renderSettings(state) {
  return `
  <header class="top">
    <h1>Impostazioni</h1>
    <button class="icon-btn" data-action="back" aria-label="Torna indietro">×</button>
  </header>
  <section class="card block">
    <h2>Categorie</h2>
    <ul class="cat-list">
      ${state.categories.map((c) => `
        <li>
          <span>${esc(c)}</span>
          ${c === 'Altro' ? '<span class="small muted">fissa</span>' : `
          <span>
            <button class="link" data-action="rename-cat" data-name="${esc(c)}">Rinomina</button>
            <button class="link danger-text" data-action="delete-cat" data-name="${esc(c)}">Elimina</button>
          </span>`}
        </li>`).join('')}
    </ul>
    <form id="add-cat" class="inline">
      <input id="new-cat" placeholder="Nuova categoria" autocomplete="off" aria-label="Nome della nuova categoria">
      <button class="btn primary" type="submit">Aggiungi</button>
    </form>
  </section>
  <section class="card block">
    <h2>I tuoi dati</h2>
    <p class="small muted">I dati restano solo su questo telefono. Se cancelli l'app o i dati di Safari li perdi: esporta ogni tanto un file di copia.</p>
    <button class="btn primary" data-action="export">Esporta dati</button>
    <label class="btn secondary file-btn">Importa dati
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </label>
    <p class="error" id="s-error" role="alert"></p>
  </section>`;
}
