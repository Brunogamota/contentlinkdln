import { NeuralReference } from "./types";

const STORAGE_KEY = "contentlink_neural_base";

export function getAllReferences(): NeuralReference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReference(ref: NeuralReference): void {
  const all = getAllReferences();
  all.unshift(ref);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteReference(id: string): void {
  const all = getAllReferences().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function toggleStrongReference(id: string): void {
  const all = getAllReferences().map((r) =>
    r.id === id ? { ...r, isStrongReference: !r.isStrongReference } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getStrongReferences(): NeuralReference[] {
  return getAllReferences().filter((r) => r.isStrongReference);
}

export function searchReferences(query: string): NeuralReference[] {
  const lower = query.toLowerCase();
  return getAllReferences().filter(
    (r) =>
      r.tags.some((t) => t.toLowerCase().includes(lower)) ||
      r.strategicAnalysis.mainSubject.toLowerCase().includes(lower) ||
      r.strategicAnalysis.contentType.toLowerCase().includes(lower) ||
      r.strategicAnalysis.strategicTags.some((t) =>
        t.toLowerCase().includes(lower)
      )
  );
}
