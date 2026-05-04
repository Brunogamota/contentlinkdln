import { AdvancedPostConfig, ContentLengthMode, PresetName } from "./types";

export const DEFAULT_CONFIG: AdvancedPostConfig = {
  contentLengthMode: "long",
  minChars: 1200,
  maxChars: 2500,
  hardLimit: false,
  wordTarget: 1600,

  intensitySlider: 8,
  controversySlider: 8,
  authoritySlider: 7,
  storytellingSlider: 8,
  technicalDepth: 6,
  emotionalWeight: 7,
  humanImperfection: 9,
  salesSubtlety: 9,
  antiAILevel: 10,

  intensity: "aggressive",
  storytellingLevel: "heavy_backstage",
  controversyLevel: "controversial",
  postGoal: "authority",
  ctaType: "indirect",
  humanizationLevel: "bruno_signature",
  postStructure: "free_flow",
  creativeVariation: "controlled_chaos",
  sentenceStyle: "mixed",

  structureMode: "founder_rant",
  hookStyle: "specific_observation",
  endingStyle: "provocation",
  rebornMention: "contextual",
  outputFormat: "linkedin",

  useAuthorDNA: true,
  generateHookVariations: true,
  hookVariationsCount: 5,

  avoidLinkedinCliches: true,
  avoidMotivationalTone: true,
  avoidPerfectStructure: true,
  avoidGenericWords: true,
  allowLightSlang: true,
};

export const PRESETS: Record<PresetName, AdvancedPostConfig> = {
  bruno: {
    ...DEFAULT_CONFIG,
    // Bruno default já é o DEFAULT_CONFIG. Aqui é um clone explícito.
  },
  technical: {
    ...DEFAULT_CONFIG,
    contentLengthMode: "long",
    minChars: 1200,
    maxChars: 2500,
    wordTarget: 1800,

    intensitySlider: 5,
    controversySlider: 3,
    authoritySlider: 9,
    storytellingSlider: 5,
    technicalDepth: 10,
    emotionalWeight: 4,
    humanImperfection: 5,
    salesSubtlety: 7,
    antiAILevel: 9,

    intensity: "medium",
    storytellingLevel: "example",
    controversyLevel: "neutral",
    postGoal: "education",
    ctaType: "reflection",
    humanizationLevel: "natural",
    postStructure: "classic",
    creativeVariation: "medium",
    sentenceStyle: "dense",

    structureMode: "technical_breakdown",
    hookStyle: "specific_observation",
    endingStyle: "reflection",
    rebornMention: "subtle",
    avoidPerfectStructure: false,
    allowLightSlang: false,
  },
  viral: {
    ...DEFAULT_CONFIG,
    contentLengthMode: "short",
    minChars: 300,
    maxChars: 700,
    wordTarget: 500,

    intensitySlider: 9,
    controversySlider: 9,
    authoritySlider: 5,
    storytellingSlider: 7,
    technicalDepth: 3,
    emotionalWeight: 9,
    humanImperfection: 9,
    salesSubtlety: 6,
    antiAILevel: 10,

    intensity: "aggressive",
    storytellingLevel: "light_backstage",
    controversyLevel: "controversial",
    postGoal: "engagement",
    ctaType: "comment",
    humanizationLevel: "leaked_conversation",
    postStructure: "story_insight",
    creativeVariation: "controlled_chaos",
    sentenceStyle: "short",

    structureMode: "whatsapp",
    hookStyle: "dangerous_opinion",
    endingStyle: "provocation",
    rebornMention: "none",
  },
};

export function resolveLengthRange(config: AdvancedPostConfig): { min: number; max: number } {
  switch (config.contentLengthMode) {
    case "short":
      return { min: 200, max: 600 };
    case "medium":
      return { min: 600, max: 1200 };
    case "long":
      return { min: 1200, max: 2500 };
    case "deep_dive":
      return { min: 2500, max: 5500 };
    case "custom":
      return {
        min: Math.max(50, Math.min(config.minChars, config.maxChars)),
        max: Math.max(100, Math.max(config.minChars, config.maxChars)),
      };
  }
}

export function resolveWordTarget(config: AdvancedPostConfig): { target: number; min: number; max: number } {
  // Se já tem wordTarget customizado e não é default, usa
  let target = config.wordTarget;
  if (!target || target < 50) {
    switch (config.contentLengthMode) {
      case "short":
        target = 450;
        break;
      case "medium":
        target = 900;
        break;
      case "long":
        target = 1600;
        break;
      case "deep_dive":
        target = 2700;
        break;
      default:
        target = 900;
    }
  }
  return {
    target,
    min: Math.floor(target * 0.85),
    max: Math.floor(target * 1.2),
  };
}

export function lengthModeLabel(mode: ContentLengthMode): string {
  switch (mode) {
    case "short":
      return "curto (300–600 palavras)";
    case "medium":
      return "médio (700–1200 palavras)";
    case "long":
      return "longo (1200–2000 palavras)";
    case "deep_dive":
      return "deep dive (2000–3500 palavras)";
    case "custom":
      return "custom";
  }
}

export function temperatureFor(variation: AdvancedPostConfig["creativeVariation"]): number {
  switch (variation) {
    case "low":
      return 0.4;
    case "medium":
      return 0.7;
    case "high":
      return 0.95;
    case "controlled_chaos":
      return 1.15;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
