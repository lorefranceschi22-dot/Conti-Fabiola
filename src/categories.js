// Categorie e memoria delle descrizioni. Tutte le funzioni sono pure.

const FALLBACK = 'Altro';

export function defaultCategories() {
  return ['Cibo', 'Casa', 'Trasporti', 'Svago', 'Salute', 'Altro'];
}

export function normalizeDescription(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function suggestCategory(memory, description) {
  const key = normalizeDescription(description);
  if (!key) return null;
  return memory[key] ?? null;
}

export function remember(memory, description, category) {
  const key = normalizeDescription(description);
  if (!key || !category) return { ...memory };
  return { ...memory, [key]: category };
}

function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function addCategory(list, name) {
  const clean = String(name ?? '').trim();
  if (!clean || list.some((c) => sameName(c, clean))) return [...list];
  return [...list, clean];
}

function mapMemory(memory, from, to) {
  return Object.fromEntries(Object.entries(memory).map(([k, v]) => [k, v === from ? to : v]));
}

function mapMovements(movements, from, to) {
  return movements.map((m) => (m.category === from ? { ...m, category: to } : m));
}

export function renameCategory(list, memory, movements, from, to) {
  const clean = String(to ?? '').trim();
  const unchanged = { categories: [...list], memory: { ...memory }, movements: [...movements] };
  if (!clean || from === FALLBACK || !list.includes(from)) return unchanged;
  if (list.some((c) => c !== from && sameName(c, clean))) return unchanged;
  return {
    categories: list.map((c) => (c === from ? clean : c)),
    memory: mapMemory(memory, from, clean),
    movements: mapMovements(movements, from, clean),
  };
}

export function deleteCategory(list, memory, movements, name) {
  if (name === FALLBACK || !list.includes(name)) {
    return { categories: [...list], memory: { ...memory }, movements: [...movements] };
  }
  const categories = list.filter((c) => c !== name);
  if (!categories.includes(FALLBACK)) categories.push(FALLBACK);
  return {
    categories,
    memory: mapMemory(memory, name, FALLBACK),
    movements: mapMovements(movements, name, FALLBACK),
  };
}
