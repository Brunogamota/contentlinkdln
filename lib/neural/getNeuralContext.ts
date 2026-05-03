import { NeuralContext, NeuralMode, NeuralReference } from "./types";
import { getAllReferences } from "./store";

const MODE_SCORE_MAP: Record<NeuralMode, keyof NeuralReference["scores"]> = {
  polemico: "controversy",
  viral: "virality",
  autoridade: "authority",
};

function scoreReferenceForModes(
  ref: NeuralReference,
  modes: NeuralMode[]
): number {
  let score = 0;
  for (const mode of modes) {
    score += ref.scores[MODE_SCORE_MAP[mode]] ?? 0;
  }
  if (ref.isStrongReference) score *= 1.5;
  return score;
}

function ideaMatchesReference(idea: string, ref: NeuralReference): number {
  const lower = idea.toLowerCase();
  const fields = [
    ref.strategicAnalysis.mainSubject,
    ref.strategicAnalysis.contentType,
    ref.strategicAnalysis.dominantEmotion,
    ...ref.tags,
    ...ref.strategicAnalysis.strategicTags,
  ];
  let matches = 0;
  for (const field of fields) {
    if (lower.includes(field.toLowerCase()) || field.toLowerCase().includes(lower.split(" ")[0])) {
      matches++;
    }
  }
  return matches;
}

export function getNeuralContext(
  modes: NeuralMode[],
  rawIdea: string
): NeuralContext {
  const all = getAllReferences();
  if (all.length === 0) {
    return {
      dominantPatterns: [],
      recommendedHookStyle: "",
      toneGuidelines: "",
      narrativeStructure: "",
      avoidPatterns: "",
      referenceInsights: [],
    };
  }

  const scored = all
    .map((ref) => ({
      ref,
      score: scoreReferenceForModes(ref, modes) + ideaMatchesReference(rawIdea, ref) * 10,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const top = scored.map((s) => s.ref);
  const strong = top.filter((r) => r.isStrongReference);
  const primary = strong.length > 0 ? strong : top;

  const allPatterns = primary.flatMap((r) => r.strategicAnalysis.languagePatterns);
  const dominantPatterns = [...new Set(allPatterns)].slice(0, 6);

  const allTriggers = primary.flatMap((r) => r.strategicAnalysis.psychologicalTriggers);
  const allReusable = primary.flatMap((r) => r.strategicAnalysis.reusableElements);

  const hookStyles = primary.map((r) => r.strategicAnalysis.identifiedHook).filter(Boolean);
  const tones = primary.map((r) => r.strategicAnalysis.toneOfVoice).filter(Boolean);
  const structures = primary.map((r) => r.strategicAnalysis.narrativeStructure).filter(Boolean);

  const referenceInsights = primary.map(
    (r) =>
      `[${r.strategicAnalysis.contentType}] ${r.strategicAnalysis.whyItWorks}. Reutilizável: ${r.strategicAnalysis.reusableElements.slice(0, 2).join(", ")}.`
  );

  return {
    dominantPatterns,
    recommendedHookStyle: hookStyles[0] ?? "",
    toneGuidelines: tones.slice(0, 2).join(" + "),
    narrativeStructure: structures[0] ?? "",
    avoidPatterns: allTriggers.length > 0 ? `Não repetir: ${[...new Set(allTriggers)].slice(0, 3).join(", ")}` : "",
    referenceInsights: referenceInsights.concat(
      allReusable.length > 0 ? [`Elementos reutilizáveis: ${[...new Set(allReusable)].slice(0, 4).join(", ")}`] : []
    ),
  };
}
