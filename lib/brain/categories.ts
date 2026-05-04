export interface BrainCategory {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export const PRESET_CATEGORIES: BrainCategory[] = [
  { id: "pagamentos", emoji: "💸", label: "Pagamentos", description: "MDR, fallback, chargeback, adquirente, antifraude" },
  { id: "founder-led-growth", emoji: "🚀", label: "Founder-Led Growth", description: "Founder vendendo via voz" },
  { id: "operacao-real", emoji: "⚙️", label: "Operação Real", description: "Bastidor de operação que dá problema" },
  { id: "mercado-fake", emoji: "🎭", label: "Mercado Fake", description: "Crítica ao palco, vaidade, pitch vazio" },
  { id: "vendas-b2b", emoji: "💼", label: "Vendas B2B", description: "Pipeline, deal, closing, cliente ruim" },
  { id: "ego-startup", emoji: "🪞", label: "Ego de Startup", description: "Vaidades, founder palco" },
  { id: "bastidor", emoji: "🩹", label: "Bastidor Cru", description: "Realidade não polida, cicatriz" },
  { id: "hooks-criticos", emoji: "🪝", label: "Hooks Críticos", description: "Aberturas que prendem em 2s" },
  { id: "analise-mercado", emoji: "🔍", label: "Análise de Mercado", description: "Observação afiada, contraintuitivo" },
  { id: "critica-consenso", emoji: "💢", label: "Crítica ao Consenso", description: "Confronto direto à crença comum" },
  { id: "social-selling", emoji: "🤝", label: "Social Selling Sutil", description: "Vender sem parecer vender" },
  { id: "founder-rant", emoji: "🔥", label: "Founder Rant", description: "Desabafo de operador cansado" },
];

export function getCategoryById(id: string): BrainCategory | undefined {
  return PRESET_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryEmoji(id: string): string {
  return getCategoryById(id)?.emoji ?? "📌";
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}
