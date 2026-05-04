import { SavedInspiration } from "@/lib/inspiration/types";

export interface RetrievalCriteria {
  topic?: string;
  categories?: string[];
  archetypes?: string[];
  hookTypes?: string[];
  emotions?: string[];
  freeText?: string;
  limit?: number;
}

export interface ScoredInspiration {
  inspiration: SavedInspiration;
  score: number;
  matchReasons: string[];
}

function tokenize(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3)
  );
}

function inspirationCorpus(i: SavedInspiration): string {
  const parts: string[] = [];
  parts.push(i.reference.targetTopic || "");
  parts.push(i.reference.userIntent || "");
  parts.push(i.reference.desiredAngle || "");
  parts.push(i.reference.rawContent || "");
  if (i.analysis) {
    parts.push(i.analysis.referenceAnalysis.centralThesis);
    parts.push(i.analysis.referenceAnalysis.audiencePain);
    parts.push(i.analysis.referenceAnalysis.enemy);
    parts.push(i.analysis.inspirationMap.reusablePrinciple);
    parts.push(i.analysis.inspirationMap.marketConnection);
    parts.push(i.analysis.inspirationMap.founderConnection);
  }
  return parts.join(" ");
}

/**
 * Retrieval ranker — sem vector store. Pontua por:
 * - match de categoria (peso 5/match)
 * - match de archetype (4/match)
 * - match de hookType (3/match)
 * - match de emoção (2/match)
 * - overlap de tokens com topic+freeText (1 por match, max 10)
 * - bonus por status (favorito +3, virou_template +5, descartado -10)
 * - bonus por ter finalPost (+2) ou análise (+1)
 */
export function retrieveTopInspirations(
  library: SavedInspiration[],
  criteria: RetrievalCriteria
): ScoredInspiration[] {
  const limit = criteria.limit ?? 8;
  const topicTokens = tokenize(`${criteria.topic || ""} ${criteria.freeText || ""}`);
  const wantedCats = new Set(criteria.categories || []);
  const wantedArchs = new Set(criteria.archetypes || []);
  const wantedHooks = new Set(criteria.hookTypes || []);
  const wantedEmotions = new Set(criteria.emotions || []);

  const scored: ScoredInspiration[] = [];

  for (const i of library) {
    if (i.status === "descartado") continue;
    let score = 0;
    const reasons: string[] = [];

    // Category match
    if (wantedCats.size > 0) {
      const matched = (i.categories || []).filter((c) => wantedCats.has(c));
      score += matched.length * 5;
      if (matched.length > 0) reasons.push(`categorias: ${matched.join(", ")}`);
    }

    // Archetype
    const archTag = (i.autoTags || []).find((t) => t.startsWith("archetype:"));
    if (archTag) {
      const arch = archTag.slice("archetype:".length);
      if (wantedArchs.size > 0 && wantedArchs.has(arch)) {
        score += 4;
        reasons.push(`archetype: ${arch}`);
      }
    }

    // Hook
    const hookTag = (i.autoTags || []).find((t) => t.startsWith("hook:"));
    if (hookTag) {
      const hook = hookTag.slice("hook:".length);
      if (wantedHooks.size > 0 && wantedHooks.has(hook)) {
        score += 3;
        reasons.push(`hook: ${hook}`);
      }
    }

    // Emotion
    const emotionTag = (i.autoTags || []).find((t) => t.startsWith("emocao:"));
    if (emotionTag) {
      const emo = emotionTag.slice("emocao:".length);
      for (const wanted of wantedEmotions) {
        if (emo.includes(wanted) || wanted.includes(emo)) {
          score += 2;
          reasons.push(`emoção: ${emo}`);
          break;
        }
      }
    }

    // Token overlap with topic/freeText
    if (topicTokens.size > 0) {
      const corpusTokens = tokenize(inspirationCorpus(i));
      let overlap = 0;
      for (const t of topicTokens) if (corpusTokens.has(t)) overlap++;
      const capped = Math.min(overlap, 10);
      score += capped;
      if (capped > 0) reasons.push(`overlap-tópico: ${capped}`);
    }

    // Bonus por status
    if (i.status === "favorito") score += 3;
    if (i.status === "virou_template") score += 5;
    if (i.status === "usado") score += 1;

    // Bonus por completude
    if (i.finalPost) score += 2;
    if (i.analysis) score += 1;

    if (score > 0) scored.push({ inspiration: i, score, matchReasons: reasons });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
