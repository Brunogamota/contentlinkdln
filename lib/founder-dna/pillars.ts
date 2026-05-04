import { ContentPillar } from "./types";

export const DEFAULT_PILLARS: ContentPillar[] = [
  {
    id: "polemica",
    name: "Polêmica do mercado",
    emoji: "🔥",
    description: "Crítica forte ao status quo do seu nicho. Atrai ICP que se identifica com o problema.",
    intent: "attract",
    promptGuidance:
      "Critique uma prática comum/aceita do mercado que prejudica seu ICP. Use os 'inimigos públicos' do founder. Seja específico, não genérico. Termine implicando que existe um caminho melhor (sem entregar de graça).",
  },
  {
    id: "case",
    name: "Case real",
    emoji: "📊",
    description: "Conta um case concreto (próprio ou de cliente). Constrói prova e autoridade técnica.",
    intent: "proof",
    promptGuidance:
      "Conte uma situação concreta que você ou um cliente viveu. Use número, contexto e desfecho real. Mostra que você OPERA, não só fala. Não cite nome do cliente, só o resultado e o método.",
  },
  {
    id: "filosofia",
    name: "Filosofia de venda",
    emoji: "🧠",
    description: "Princípio profundo sobre vender/operar/liderar. Cria autoridade de pensamento.",
    intent: "authority",
    promptGuidance:
      "Apresente uma crença não-óbvia sobre como você opera (vendas, produto, contratação, gestão). Tem que ser contraintuitiva — algo que a maioria do mercado faz oposto. Quem ler precisa pensar 'nunca tinha pensado assim'.",
  },
  {
    id: "bastidor",
    name: "Bastidor da empresa",
    emoji: "🩹",
    description: "Mostra realidade crua de construir empresa. Cria conexão emocional e humanidade.",
    intent: "connection",
    promptGuidance:
      "Conte um momento real de bastidor — falha, dúvida, decisão difícil, crise resolvida. Sem polir. ICP precisa pensar 'já passei por isso'. Mostra vulnerabilidade controlada que aumenta confiança.",
  },
];

export function pickPillarForIdea(idea: string, modes: string[]): string {
  const lower = idea.toLowerCase();
  if (modes.includes("polemico") || /erra|errad|crítica|odeio|chato|problem|nunca|sempre/.test(lower)) {
    return "polemica";
  }
  if (modes.includes("autoridade") || /método|princípio|estratégia|filosofia|como|deveria/.test(lower)) {
    return "filosofia";
  }
  if (/cliente|fechei|negócio|case|fatur|venda|deal/.test(lower)) {
    return "case";
  }
  if (/ontem|hoje|essa semana|aconteceu|pessoal|equipe/.test(lower)) {
    return "bastidor";
  }
  return "polemica";
}
