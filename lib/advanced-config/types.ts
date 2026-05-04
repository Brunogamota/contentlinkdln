export type ContentLengthMode = "short" | "medium" | "long" | "deep_dive" | "custom";
export type Intensity = "light" | "medium" | "strong" | "aggressive";
export type StorytellingLevel = "none" | "example" | "light_backstage" | "heavy_backstage";
export type ControversyLevel = "neutral" | "provocative" | "controversial" | "enemy_attack";
export type PostGoal = "engagement" | "authority" | "dm_conversion" | "education" | "series_narrative";
export type CtaType = "none" | "reflection" | "comment" | "dm" | "indirect";
export type HumanizationLevel = "structured" | "natural" | "leaked_conversation" | "bruno_signature";
export type PostStructure = "classic" | "story_insight" | "bullets_punch" | "free_flow";
export type CreativeVariation = "low" | "medium" | "high" | "controlled_chaos";
export type SentenceStyle = "short" | "mixed" | "dense";

// Novos campos da reformulação Bruno Brain
export type StructureMode =
  | "whatsapp"
  | "storytelling"
  | "essay"
  | "founder_rant"
  | "technical_breakdown";
export type HookStyle =
  | "dangerous_opinion"
  | "specific_observation"
  | "confession"
  | "market_attack"
  | "counterintuitive"
  | "story_opening";
export type EndingStyle = "punch" | "open_loop" | "reflection" | "provocation" | "soft_cta";
export type RebornMention = "none" | "subtle" | "contextual" | "direct";
export type OutputFormat = "linkedin" | "newsletter" | "twitter_thread";

export interface AdvancedPostConfig {
  // Tamanho (chars + words)
  contentLengthMode: ContentLengthMode;
  minChars: number;
  maxChars: number;
  hardLimit: boolean;
  wordTarget: number;

  // Sliders 0-10 (novo, mais granular)
  intensitySlider: number;
  controversySlider: number;
  authoritySlider: number;
  storytellingSlider: number;
  technicalDepth: number;
  emotionalWeight: number;
  humanImperfection: number;
  salesSubtlety: number;
  antiAILevel: number;

  // Segmentos clássicos (mantidos pra controle de macro-direção)
  intensity: Intensity;
  storytellingLevel: StorytellingLevel;
  controversyLevel: ControversyLevel;
  postGoal: PostGoal;
  ctaType: CtaType;
  humanizationLevel: HumanizationLevel;
  postStructure: PostStructure;
  creativeVariation: CreativeVariation;
  sentenceStyle: SentenceStyle;

  // Novos selects estratégicos
  structureMode: StructureMode;
  hookStyle: HookStyle;
  endingStyle: EndingStyle;
  rebornMention: RebornMention;
  outputFormat: OutputFormat;

  // Hook engine + DNA flags
  useAuthorDNA: boolean;
  generateHookVariations: boolean;
  hookVariationsCount: number;

  // Anti-IA toggles
  avoidLinkedinCliches: boolean;
  avoidMotivationalTone: boolean;
  avoidPerfectStructure: boolean;
  avoidGenericWords: boolean;
  allowLightSlang: boolean;
}

export type PresetName = "bruno" | "technical" | "viral";

// Tipos de retorno do pipeline
export interface HookScore {
  text: string;
  curiosity: number;
  tension: number;
  specificity: number;
  originality: number;
  humanFeel: number;
  total: number;
}

export interface AntiAIReport {
  aiRiskScore: number;
  detectedPatterns: string[];
  rewriteRequired: boolean;
}

export interface GenerationResult {
  hook: string;
  post: string;
  cta: string | null;
  hookAlternatives?: HookScore[];
  wordCount: number;
  antiAIReport?: AntiAIReport;
  configUsed?: AdvancedPostConfig;
}
