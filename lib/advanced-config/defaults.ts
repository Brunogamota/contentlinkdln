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

/* -------------------------------------------------------------------------- */
/*                       PLATFORM CHAR CAPS (HARD LIMITS)                     */
/* -------------------------------------------------------------------------- */

/** LinkedIn limita posts a 3000 caracteres no total */
export const LINKEDIN_MAX_CHARS = 3000;
/** Twitter/X thread — limite agregado conservador (≈ 30 tweets × 280) */
export const TWITTER_THREAD_MAX_CHARS = 8400;
/** Newsletter — sem limite prático */
export const NEWSLETTER_MAX_CHARS = 50000;

export function getPlatformCharCap(format: AdvancedPostConfig["outputFormat"]): number {
  switch (format) {
    case "linkedin":
      return LINKEDIN_MAX_CHARS;
    case "twitter_thread":
      return TWITTER_THREAD_MAX_CHARS;
    case "newsletter":
      return NEWSLETTER_MAX_CHARS;
  }
}

export function getPlatformLabel(format: AdvancedPostConfig["outputFormat"]): string {
  switch (format) {
    case "linkedin":
      return "LinkedIn";
    case "twitter_thread":
      return "Thread X";
    case "newsletter":
      return "Newsletter";
  }
}

/** Computa o tamanho COMBINADO (hook + post + cta + quebras) que vai pra plataforma */
export function combinedLength(hook: string, post: string, cta: string | null): number {
  const sep = "\n\n";
  return (hook?.length ?? 0) + sep.length + (post?.length ?? 0) + (cta ? sep.length + cta.length : 0);
}

/** Verifica se a config atual ultrapassaria o limite de plataforma */
export function isOverPlatformCap(config: AdvancedPostConfig): boolean {
  const cap = getPlatformCharCap(config.outputFormat);
  // Cap só "morde" quando há limite prático (newsletter é efetivamente infinito)
  if (cap >= NEWSLETTER_MAX_CHARS) return false;

  let maxChars: number;
  if (config.contentLengthMode === "custom") {
    maxChars = Math.max(config.minChars, config.maxChars);
  } else {
    // wordTarget bruto × 7 chars/palavra (limite superior conservador)
    const wtRaw = config.wordTarget || 900;
    maxChars = Math.floor(wtRaw * 1.2 * 7);
  }
  return maxChars > cap;
}

export function resolveLengthRange(config: AdvancedPostConfig): { min: number; max: number } {
  const cap = getPlatformCharCap(config.outputFormat);

  let range: { min: number; max: number };
  if (config.contentLengthMode === "custom") {
    range = {
      min: Math.max(50, Math.min(config.minChars, config.maxChars)),
      max: Math.max(100, Math.max(config.minChars, config.maxChars)),
    };
  } else {
    const wt = resolveWordTargetRaw(config);
    range = {
      min: Math.floor(wt.min * 5),
      max: Math.floor(wt.max * 7),
    };
  }
  // Aplica platform cap (hard ceiling)
  return {
    min: Math.min(range.min, cap),
    max: Math.min(range.max, cap),
  };
}

/** Versão SEM cap — usada internamente pra calcular o range bruto */
function resolveWordTargetRaw(config: AdvancedPostConfig): { target: number; min: number; max: number } {
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

export function resolveWordTarget(config: AdvancedPostConfig): { target: number; min: number; max: number } {
  const raw = resolveWordTargetRaw(config);
  const cap = getPlatformCharCap(config.outputFormat);
  // Converter cap de chars pra palavras (conservador: 6 chars/palavra)
  // E reservar ~250 chars pra hook + cta + quebras → cap efetivo do POST
  const postCap = Math.max(100, cap - 250);
  const wordCap = Math.floor(postCap / 6);
  return {
    target: Math.min(raw.target, wordCap),
    min: Math.min(raw.min, wordCap),
    max: Math.min(raw.max, wordCap),
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

/** Word target padrão por modo (usado no UI ao trocar mode) */
export function defaultWordTargetForMode(mode: ContentLengthMode): number {
  switch (mode) {
    case "short":
      return 450;
    case "medium":
      return 900;
    case "long":
      return 1600;
    case "deep_dive":
      return 2700;
    default:
      return 900;
  }
}

/**
 * Temperatura mapeada da variação criativa.
 * IMPORTANTE: cap em 0.95 — temperaturas > 1.0 fazem o GPT-4o gerar
 * texto incoerente / mistura de idiomas (word salad). Nunca passar de 1.0.
 */
export function temperatureFor(variation: AdvancedPostConfig["creativeVariation"]): number {
  switch (variation) {
    case "low":
      return 0.3;
    case "medium":
      return 0.6;
    case "high":
      return 0.8;
    case "controlled_chaos":
      return 0.95;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Detecta texto incoerente / word salad / mistura excessiva de idiomas.
 * Conta proporção de chars fora do alfabeto latino esperado em pt-BR.
 * Se > 12%, considera gibberish (modelo bugou).
 */
export function isGibberishOutput(text: string): boolean {
  if (text.length < 100) return false;
  // Aceitar: letras latinas, acentos pt-BR, pontuação, espaço, números
  const nonLatinMatches = text.match(/[^\p{Script=Latin}\p{P}\p{Z}\p{N}\s]/gu);
  const ratio = (nonLatinMatches?.length ?? 0) / text.length;
  return ratio > 0.12;
}
