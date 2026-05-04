export type ContentLengthMode = "short" | "medium" | "long" | "custom";
export type Intensity = "light" | "medium" | "strong" | "aggressive";
export type StorytellingLevel = "none" | "example" | "light_backstage" | "heavy_backstage";
export type ControversyLevel = "neutral" | "provocative" | "controversial" | "enemy_attack";
export type PostGoal = "engagement" | "authority" | "dm_conversion" | "education" | "series_narrative";
export type CtaType = "none" | "reflection" | "comment" | "dm" | "indirect";
export type HumanizationLevel = "structured" | "natural" | "leaked_conversation" | "bruno_signature";
export type PostStructure = "classic" | "story_insight" | "bullets_punch" | "free_flow";
export type CreativeVariation = "low" | "medium" | "high" | "controlled_chaos";
export type SentenceStyle = "short" | "mixed" | "dense";

export interface AdvancedPostConfig {
  contentLengthMode: ContentLengthMode;
  minChars: number;
  maxChars: number;
  hardLimit: boolean;
  intensity: Intensity;
  storytellingLevel: StorytellingLevel;
  controversyLevel: ControversyLevel;
  postGoal: PostGoal;
  ctaType: CtaType;
  humanizationLevel: HumanizationLevel;
  postStructure: PostStructure;
  creativeVariation: CreativeVariation;
  sentenceStyle: SentenceStyle;
  avoidLinkedinCliches: boolean;
  avoidMotivationalTone: boolean;
  avoidPerfectStructure: boolean;
  avoidGenericWords: boolean;
  allowLightSlang: boolean;
}

export type PresetName = "bruno" | "technical" | "viral";
