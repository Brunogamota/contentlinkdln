/* -------------------------------------------------------------------------- */
/*                              REFERENCE INPUT                               */
/* -------------------------------------------------------------------------- */

export type ReferenceType = "text" | "image" | "link" | "multi";

export type ProximityToReference = "baixa" | "media" | "alta";

export type CtaMode = "sem_cta" | "indireto" | "reborn" | "comentario" | "reflexao";

export type OutputLengthOption = 1000 | 2000 | 3000 | 5000 | "custom";

export type PostTone =
  | "desabafo"
  | "bastidor"
  | "polemico"
  | "educativo"
  | "storytelling"
  | "social_selling_sutil"
  | "analise_mercado";

export type PostIntensity = "leve" | "medio" | "forte" | "brutal";

export type TargetAudience =
  | "founders"
  | "sellers"
  | "executivos"
  | "mercado_pagamentos"
  | "geral";

export interface ReferenceInput {
  id: string;
  type: ReferenceType;
  rawContent: string;
  extractedText?: string;
  sourceUrl?: string;
  author?: string;
  userIntent: string;
  targetTopic: string;
  desiredAngle?: string;
  intensityLevel: number;
  outputLength: OutputLengthOption;
  customLength?: number;
  proximityToReference: ProximityToReference;
  ctaMode: CtaMode;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  ANALYSIS                                  */
/* -------------------------------------------------------------------------- */

export interface ReferenceAnalysis {
  centralThesis: string;
  hiddenTension: string;
  emotionalDriver: string;
  audiencePain: string;
  enemy: string;
  beliefBeingAttacked: string;
  beliefBeingBuilt: string;
  hookType: string;
  narrativeStructure: string;
  rhythmProfile: string;
  languageProfile: string;
  persuasionMechanics: string[];
  viralityTriggers: string[];
  originalityRisks: string[];
  forbiddenElements: string[];
}

export type HookType =
  | "confissao"
  | "bastidor_proibido"
  | "frase_de_bar"
  | "verdade_desconfortavel"
  | "critica_ao_mercado"
  | "inversao_senso_comum"
  | "comparacao_inesperada"
  | "alerta_operacional"
  | "ataque_elegante"
  | "pergunta_incomoda"
  | "provocacao_seca"
  | "historia_interrompida"
  | "observacao_social"
  | "opiniao_que_divide";

export interface HookAnalysis {
  hookText: string;
  hookType: HookType;
  attentionMechanism: string;
  curiosityGap: string;
  emotionalPunch: string;
  whyItWorks: string;
  riskOfBeingGeneric: string;
  possibleBrunoVersions: string[];
}

export type NarrativeArchetype =
  | "desabafo_de_founder"
  | "bastidor_de_operacao"
  | "critica_ao_mercado"
  | "aprendizado_de_porrada"
  | "post_anti_consenso"
  | "post_educativo_camuflado"
  | "historia_curta_com_virada"
  | "post_de_autoridade_sem_carteirada"
  | "social_selling_invisivel"
  | "analise_de_mercado_com_veneno"
  | "confissao_vulneravel_com_forca"
  | "alerta_para_cliente";

export interface NarrativeDNA {
  openingMove: string;
  contextSetup: string;
  tensionBuild: string;
  proofMoment: string;
  turnPoint: string;
  insightDelivery: string;
  emotionalPeak: string;
  closingMove: string;
  ctaPattern: string;
  paragraphRhythm: string;
  sentenceCadence: string;
  archetype: NarrativeArchetype;
}

export interface InspirationMap {
  reusablePrinciple: string;
  adaptableEmotion: string;
  safeStructure: string;
  newAngleOptions: string[];
  brunoPersonalConnection: string;
  rebornConnection: string;
  marketConnection: string;
  founderConnection: string;
  contentWarnings: string[];
  originalityBoundaries: string[];
}

export interface FullAnalysis {
  referenceAnalysis: ReferenceAnalysis;
  hookAnalysis: HookAnalysis;
  narrativeDNA: NarrativeDNA;
  inspirationMap: InspirationMap;
}

/* -------------------------------------------------------------------------- */
/*                                   ANGLES                                   */
/* -------------------------------------------------------------------------- */

export type RecommendedFormat =
  | "post_curto_de_porrada"
  | "post_longo_storytelling"
  | "post_educativo_disfarcado"
  | "post_polemico"
  | "post_bastidor"
  | "post_social_selling_sutil"
  | "post_analise_de_mercado"
  | "post_conversa_vazada"
  | "post_manifesto"
  | "post_alerta";

export interface AngleOption {
  id: string;
  title: string;
  thesis: string;
  emotionalDriver: string;
  controversyLevel: number;
  audience: string;
  whyItCouldWork: string;
  brunoFitScore: number;
  originalityScore: number;
  riskScore: number;
  recommendedFormat: RecommendedFormat;
}

/* -------------------------------------------------------------------------- */
/*                                POST + SCORE                                */
/* -------------------------------------------------------------------------- */

export interface PostScore {
  hookStrength: number;
  emotionalCharge: number;
  originality: number;
  brunoVoice: number;
  clarity: number;
  controversy: number;
  shareability: number;
  commentPotential: number;
  authority: number;
  humanFeel: number;
  finalScore: number;
}

export interface OriginalityReport {
  similarityScore: number;
  copiedPhrases: string[];
  riskySections: string[];
  narrativeOverlap: string;
  metaphorOverlap: string;
  exampleOverlap: string;
  isSafeToPublish: boolean;
  rewriteInstructions: string;
}

export interface GeneratedPost {
  hook: string;
  post: string;
  cta: string | null;
  alternativeHooks: string[];
  wordCount: number;
  score: PostScore;
  originality: OriginalityReport;
}

export interface PostConfig {
  outputLength: OutputLengthOption;
  customLength?: number;
  intensity: PostIntensity;
  tone: PostTone;
  cta: CtaMode;
  proximityToReference: ProximityToReference;
  targetAudience: TargetAudience;
}

/* -------------------------------------------------------------------------- */
/*                              REFINEMENT BUTTONS                            */
/* -------------------------------------------------------------------------- */

export type RefineAction =
  | "more_bruno"
  | "more_aggressive"
  | "more_elegant"
  | "more_direct"
  | "less_ai"
  | "more_storytelling"
  | "more_market_pain"
  | "add_reborn"
  | "remove_reborn"
  | "shorter"
  | "expand"
  | "new_hooks"
  | "new_angle";

/* -------------------------------------------------------------------------- */
/*                                 LIBRARY                                    */
/* -------------------------------------------------------------------------- */

export type InspirationStatus =
  | "novo"
  | "analisado"
  | "usado"
  | "favorito"
  | "descartado"
  | "virou_template";

export interface SavedInspiration {
  id: string;
  reference: ReferenceInput;
  analysis?: FullAnalysis;
  angles?: AngleOption[];
  selectedAngleId?: string;
  finalPost?: GeneratedPost;
  status: InspirationStatus;
  tags: string[];
  /** auto-extracted categories (PRESET_CATEGORIES ids) */
  categories?: string[];
  /** auto-extracted tags from analysis (archetype:X, hook:Y, tema:Z, emocao:W) */
  autoTags?: string[];
  /** manual tags added by user */
  manualTags?: string[];
  /** sinal de performance: usuário achou útil/inspirou */
  performanceSignal?: "high" | "medium" | "low" | "untested";
  createdAt: string;
  updatedAt: string;
}

export interface ContentPattern {
  id: string;
  name: string;
  archetype: NarrativeArchetype;
  hookType: HookType;
  emotionalDriver: string;
  narrativeDNA: NarrativeDNA;
  bestUseCases: string[];
  examplesGenerated: number;
  createdAt: string;
  timesUsed: number;
  performanceNotes: string;
}
