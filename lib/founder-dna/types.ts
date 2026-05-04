export interface FounderDNA {
  // Empresa
  companyName: string;
  companyDescription: string;
  whatYouSell: string;

  // ICP — quem compra de você
  icpRole: string;
  icpPain: string;
  icpDecisionMaker: string;

  // Você
  founderStory: string;
  uniqueDifferentiator: string;
  publicEnemies: string[];

  // Voz
  voiceTone: string;

  updatedAt: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  intent: "attract" | "authority" | "connection" | "proof";
  promptGuidance: string;
}

export interface PublishedPost {
  id: string;
  hook: string;
  post: string;
  cta: string;
  pillarId?: string;
  publishedAt: string;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  role: string;
  company: string;
  engagementType: "comment" | "like" | "share" | "dm" | "follow";
  postId?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string;
  createdAt: string;
}

export interface SeriesPost {
  position: number;
  pillarId: string;
  hook: string;
  post: string;
  cta: string;
}

export interface SeriesPlan {
  id: string;
  topic: string;
  narrativeArc: string;
  posts: SeriesPost[];
  createdAt: string;
}
