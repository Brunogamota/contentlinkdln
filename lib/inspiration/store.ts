import { SavedInspiration, ContentPattern, InspirationStatus } from "./types";

const KEY_INSPIRATIONS = "inspiration_library";
const KEY_PATTERNS = "inspiration_patterns";

/* --------------------------------- SAVED INSPIRATIONS --------------------- */

export function getAllInspirations(): SavedInspiration[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_INSPIRATIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getInspiration(id: string): SavedInspiration | null {
  return getAllInspirations().find((i) => i.id === id) ?? null;
}

export function saveInspiration(inspiration: SavedInspiration): void {
  if (typeof window === "undefined") return;
  const all = getAllInspirations();
  const idx = all.findIndex((i) => i.id === inspiration.id);
  const updated: SavedInspiration = { ...inspiration, updatedAt: new Date().toISOString() };
  if (idx === -1) all.unshift(updated);
  else all[idx] = updated;
  localStorage.setItem(KEY_INSPIRATIONS, JSON.stringify(all));
}

export function updateInspiration(id: string, partial: Partial<SavedInspiration>): SavedInspiration | null {
  const existing = getInspiration(id);
  if (!existing) return null;
  const merged: SavedInspiration = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveInspiration(merged);
  return merged;
}

export function deleteInspiration(id: string): void {
  if (typeof window === "undefined") return;
  const all = getAllInspirations().filter((i) => i.id !== id);
  localStorage.setItem(KEY_INSPIRATIONS, JSON.stringify(all));
}

export function setInspirationStatus(id: string, status: InspirationStatus): void {
  updateInspiration(id, { status });
}

/* ------------------------------- CONTENT PATTERNS ------------------------- */

export function getAllPatterns(): ContentPattern[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY_PATTERNS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePattern(pattern: ContentPattern): void {
  if (typeof window === "undefined") return;
  const all = getAllPatterns();
  const idx = all.findIndex((p) => p.id === pattern.id);
  if (idx === -1) all.unshift(pattern);
  else all[idx] = pattern;
  localStorage.setItem(KEY_PATTERNS, JSON.stringify(all));
}

export function deletePattern(id: string): void {
  if (typeof window === "undefined") return;
  const all = getAllPatterns().filter((p) => p.id !== id);
  localStorage.setItem(KEY_PATTERNS, JSON.stringify(all));
}

/* --------------------------------- HELPERS -------------------------------- */

export function newInspirationId(): string {
  return `insp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newAngleId(): string {
  return `angle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
