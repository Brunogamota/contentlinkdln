import { SavedInspiration } from "@/lib/inspiration/types";

export interface BrainStats {
  total: number;
  withAnalysis: number;
  withFinalPost: number;
  favorites: number;
  byStatus: Record<string, number>;
  byCategory: { id: string; count: number }[];
  byArchetype: { id: string; count: number }[];
  byHookType: { id: string; count: number }[];
  byEmotion: { id: string; count: number }[];
  byEnemy: { id: string; count: number }[];
  topThemes: { id: string; count: number }[];
}

function bucketize(values: string[]): { id: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

function tagsByPrefix(insps: SavedInspiration[], prefix: string): string[] {
  const out: string[] = [];
  for (const i of insps) {
    for (const t of i.autoTags || []) {
      if (t.startsWith(prefix)) out.push(t.slice(prefix.length));
    }
  }
  return out;
}

export function buildBrainStats(insps: SavedInspiration[]): BrainStats {
  const total = insps.length;
  const withAnalysis = insps.filter((i) => i.analysis).length;
  const withFinalPost = insps.filter((i) => i.finalPost).length;
  const favorites = insps.filter((i) => i.status === "favorito").length;

  const statusCounts: Record<string, number> = {};
  for (const i of insps) statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;

  const allCategories: string[] = [];
  for (const i of insps) for (const c of i.categories || []) allCategories.push(c);

  return {
    total,
    withAnalysis,
    withFinalPost,
    favorites,
    byStatus: statusCounts,
    byCategory: bucketize(allCategories),
    byArchetype: bucketize(tagsByPrefix(insps, "archetype:")),
    byHookType: bucketize(tagsByPrefix(insps, "hook:")),
    byEmotion: bucketize(tagsByPrefix(insps, "emocao:")),
    byEnemy: bucketize(tagsByPrefix(insps, "inimigo:")),
    topThemes: bucketize(tagsByPrefix(insps, "tema:")),
  };
}
