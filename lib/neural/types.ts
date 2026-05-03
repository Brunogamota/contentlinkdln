export interface StrategicAnalysis {
  contentType: string;
  mainSubject: string;
  identifiedHook: string;
  dominantEmotion: string;
  toneOfVoice: string;
  narrativeStructure: string;
  writingStyle: string;
  provocationType: number;
  authorityLevel: number;
  languagePatterns: string[];
  psychologicalTriggers: string[];
  whyItWorks: string;
  reusableElements: string[];
  strategicTags: string[];
}

export interface ReferenceScore {
  virality: number;
  authority: number;
  controversy: number;
  clarity: number;
  authenticity: number;
  adaptationPotential: number;
}

export interface NeuralReference {
  id: string;
  imageUrl: string;
  originalFileName: string;
  extractedText: string;
  strategicAnalysis: StrategicAnalysis;
  tags: string[];
  scores: ReferenceScore;
  createdAt: string;
  isStrongReference: boolean;
}

export interface NeuralContext {
  dominantPatterns: string[];
  recommendedHookStyle: string;
  toneGuidelines: string;
  narrativeStructure: string;
  avoidPatterns: string;
  referenceInsights: string[];
}

export type NeuralMode = "polemico" | "viral" | "autoridade";
