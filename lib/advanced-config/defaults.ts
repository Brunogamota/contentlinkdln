import { AdvancedPostConfig, ContentLengthMode, PresetName } from "./types";

export const DEFAULT_CONFIG: AdvancedPostConfig = {
  contentLengthMode: "medium",
  minChars: 600,
  maxChars: 1200,
  hardLimit: false,
  intensity: "strong",
  storytellingLevel: "light_backstage",
  controversyLevel: "provocative",
  postGoal: "authority",
  ctaType: "indirect",
  humanizationLevel: "bruno_signature",
  postStructure: "free_flow",
  creativeVariation: "high",
  sentenceStyle: "mixed",
  avoidLinkedinCliches: true,
  avoidMotivationalTone: true,
  avoidPerfectStructure: true,
  avoidGenericWords: true,
  allowLightSlang: true,
};

export const PRESETS: Record<PresetName, AdvancedPostConfig> = {
  bruno: {
    contentLengthMode: "medium",
    minChars: 600,
    maxChars: 1200,
    hardLimit: false,
    intensity: "aggressive",
    storytellingLevel: "heavy_backstage",
    controversyLevel: "enemy_attack",
    postGoal: "authority",
    ctaType: "indirect",
    humanizationLevel: "bruno_signature",
    postStructure: "free_flow",
    creativeVariation: "controlled_chaos",
    sentenceStyle: "short",
    avoidLinkedinCliches: true,
    avoidMotivationalTone: true,
    avoidPerfectStructure: true,
    avoidGenericWords: true,
    allowLightSlang: true,
  },
  technical: {
    contentLengthMode: "long",
    minChars: 1200,
    maxChars: 2500,
    hardLimit: false,
    intensity: "medium",
    storytellingLevel: "example",
    controversyLevel: "neutral",
    postGoal: "education",
    ctaType: "reflection",
    humanizationLevel: "natural",
    postStructure: "classic",
    creativeVariation: "medium",
    sentenceStyle: "dense",
    avoidLinkedinCliches: true,
    avoidMotivationalTone: true,
    avoidPerfectStructure: false,
    avoidGenericWords: true,
    allowLightSlang: false,
  },
  viral: {
    contentLengthMode: "short",
    minChars: 300,
    maxChars: 700,
    hardLimit: false,
    intensity: "aggressive",
    storytellingLevel: "light_backstage",
    controversyLevel: "controversial",
    postGoal: "engagement",
    ctaType: "comment",
    humanizationLevel: "leaked_conversation",
    postStructure: "story_insight",
    creativeVariation: "controlled_chaos",
    sentenceStyle: "short",
    avoidLinkedinCliches: true,
    avoidMotivationalTone: true,
    avoidPerfectStructure: true,
    avoidGenericWords: true,
    allowLightSlang: true,
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
    case "custom":
      return {
        min: Math.max(50, Math.min(config.minChars, config.maxChars)),
        max: Math.max(100, Math.max(config.minChars, config.maxChars)),
      };
  }
}

export function lengthModeLabel(mode: ContentLengthMode): string {
  switch (mode) {
    case "short":
      return "curto (até 600)";
    case "medium":
      return "médio (600–1200)";
    case "long":
      return "longo (1200–2500)";
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
