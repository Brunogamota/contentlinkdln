import { FounderDNA, ContentPillar, PublishedPost } from "./types";
import { DEFAULT_PILLARS } from "./pillars";

const DNA_KEY = "founder_dna";
const PILLARS_KEY = "founder_pillars";
const PUBLISHED_KEY = "published_posts";

export function getDNA(): FounderDNA | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DNA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDNA(dna: FounderDNA): void {
  localStorage.setItem(DNA_KEY, JSON.stringify({ ...dna, updatedAt: new Date().toISOString() }));
}

export function hasDNA(): boolean {
  const dna = getDNA();
  return !!(dna && dna.companyName && dna.icpRole);
}

export function getPillars(): ContentPillar[] {
  if (typeof window === "undefined") return DEFAULT_PILLARS;
  const raw = localStorage.getItem(PILLARS_KEY);
  if (!raw) return DEFAULT_PILLARS;
  try {
    const parsed = JSON.parse(raw) as ContentPillar[];
    return parsed.length > 0 ? parsed : DEFAULT_PILLARS;
  } catch {
    return DEFAULT_PILLARS;
  }
}

export function savePillars(pillars: ContentPillar[]): void {
  localStorage.setItem(PILLARS_KEY, JSON.stringify(pillars));
}

export function getPublishedPosts(): PublishedPost[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PUBLISHED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePublishedPost(post: PublishedPost): void {
  const all = getPublishedPosts();
  all.unshift(post);
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(all));
}

export function updatePublishedPost(id: string, updates: Partial<PublishedPost>): void {
  const all = getPublishedPosts();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(all));
}

export function deletePublishedPost(id: string): void {
  const all = getPublishedPosts().filter((p) => p.id !== id);
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(all));
}
