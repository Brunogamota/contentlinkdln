import { Lead } from "@/lib/founder-dna/types";

const LEADS_KEY = "leads_pipeline";

export function getLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LEADS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead): void {
  const all = getLeads();
  all.unshift(lead);
  localStorage.setItem(LEADS_KEY, JSON.stringify(all));
}

export function updateLead(id: string, updates: Partial<Lead>): void {
  const all = getLeads();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  localStorage.setItem(LEADS_KEY, JSON.stringify(all));
}

export function deleteLead(id: string): void {
  const all = getLeads().filter((l) => l.id !== id);
  localStorage.setItem(LEADS_KEY, JSON.stringify(all));
}
