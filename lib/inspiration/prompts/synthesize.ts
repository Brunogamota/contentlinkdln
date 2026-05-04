import { brunoIdentityHeader } from "./identity";
import { SavedInspiration, FullAnalysis, AngleOption } from "../types";

export interface SynthesisInput {
  topic: string;
  desiredAngle?: string;
  categories: string[];
  inspirations: SavedInspiration[];
}

export interface AggregateSynthesis {
  recurringPatterns: string[];
  dominantArchetypes: string[];
  dominantHooks: string[];
  emotionalPalette: string[];
  marketEnemiesAggregated: string[];
  reusablePrinciples: string[];
  contentWarnings: string[];
  originalityBoundaries: string[];
  brunoEdge: string;
  angles: Omit<AngleOption, "id">[];
}

export function buildSynthesizeSystemPrompt(): string {
  return `${brunoIdentityHeader()}

🧠 STAGE: SÍNTESE AGREGADA DE MÚLTIPLAS REFERÊNCIAS.

Você recebe N referências já analisadas (cada uma com tese, hook, archetype, mapa, emoção, inimigo).
Sua missão NÃO é analisar uma de cada vez. É IDENTIFICAR PADRÕES RECORRENTES entre elas e construir
um MAPA DE INSPIRAÇÃO AGREGADO que serve de matéria-prima pro Bruno escrever algo próprio sobre o tópico.

PRINCÍPIOS:
- Quanto mais referências, mais inteligente fica o output. Use TODAS.
- Identifique o que se repete: hooks similares, emoções comuns, inimigos compartilhados, princípios estruturais.
- Identifique o que é ÚNICO de cada uma e NÃO pode ser reusado.
- Construa fronteiras de originalidade explícitas.
- Gere 15 ângulos AUTORAIS pro Bruno baseado no agregado + tópico-alvo.

Os ângulos devem:
- Partir da matéria-prima do Bruno (pagamentos, founder, mercado, ego, bastidor, operação)
- NUNCA repetir história específica ou metáfora única de nenhuma referência
- Variar formato (curto cortante, longo storytelling, educativo camuflado, etc.)
- Ter alto brunoFitScore e alto originalityScore

📦 OUTPUT JSON (apenas isso):
{
  "recurringPatterns": ["padrão recorrente 1 entre as referências", "padrão 2", "..."],
  "dominantArchetypes": ["archetype mais frequente 1", "..."],
  "dominantHooks": ["tipo de hook recorrente 1", "..."],
  "emotionalPalette": ["emoção 1", "emoção 2", "..."],
  "marketEnemiesAggregated": ["inimigo agregado 1 (que aparece em várias)", "..."],
  "reusablePrinciples": ["princípio reusável seguro 1", "..."],
  "contentWarnings": ["aviso 1 sobre o que evitar", "..."],
  "originalityBoundaries": ["fronteira 1: NUNCA reusar história X de referência Y", "..."],
  "brunoEdge": "qual é o ângulo único que SÓ o Bruno (founder Reborn, opera pagamentos) consegue trazer pra esse agregado",
  "angles": [
    {
      "title": "...",
      "thesis": "...",
      "emotionalDriver": "...",
      "controversyLevel": 0-10,
      "audience": "...",
      "whyItCouldWork": "...",
      "brunoFitScore": 0-100,
      "originalityScore": 0-100,
      "riskScore": 0-100,
      "recommendedFormat": "post_curto_de_porrada | post_longo_storytelling | post_educativo_disfarcado | post_polemico | post_bastidor | post_social_selling_sutil | post_analise_de_mercado | post_conversa_vazada | post_manifesto | post_alerta"
    },
    ... 15 ângulos no total
  ]
}`;
}

function compactReferenceForPrompt(insp: SavedInspiration, idx: number): string {
  const a = insp.analysis;
  const lines: string[] = [`### REF ${idx + 1} ${insp.reference.author ? `(autor: ${insp.reference.author})` : ""}`];
  if (a) {
    lines.push(`Tese: ${a.referenceAnalysis.centralThesis}`);
    lines.push(`Tensão: ${a.referenceAnalysis.hiddenTension}`);
    lines.push(`Emoção: ${a.referenceAnalysis.emotionalDriver}`);
    lines.push(`Inimigo: ${a.referenceAnalysis.enemy}`);
    lines.push(`Crença atacada: ${a.referenceAnalysis.beliefBeingAttacked}`);
    lines.push(`Crença instalada: ${a.referenceAnalysis.beliefBeingBuilt}`);
    lines.push(`Hook: "${a.hookAnalysis.hookText}" (tipo: ${a.hookAnalysis.hookType})`);
    lines.push(`Por que funciona: ${a.hookAnalysis.whyItWorks}`);
    lines.push(`Archetype: ${a.narrativeDNA.archetype}`);
    lines.push(`Princípio reusável: ${a.inspirationMap.reusablePrinciple}`);
    lines.push(
      `Fronteiras (não cruzar): ${a.inspirationMap.originalityBoundaries.slice(0, 3).join(" · ")}`
    );
  } else {
    // Fallback: usar texto bruto truncado
    const txt = (insp.reference.extractedText || insp.reference.rawContent).slice(0, 600);
    lines.push(`(sem análise — texto bruto truncado): ${txt}`);
  }
  return lines.join("\n");
}

export function buildSynthesizeUserMessage(input: SynthesisInput): string {
  return `📌 TÓPICO-ALVO: ${input.topic}
${input.desiredAngle ? `📍 ÂNGULO DESEJADO: ${input.desiredAngle}\n` : ""}${input.categories.length > 0 ? `🏷️ CATEGORIAS-FOCO: ${input.categories.join(", ")}\n` : ""}
🧠 ${input.inspirations.length} REFERÊNCIAS DA BIBLIOTECA (já analisadas):

${input.inspirations.map((i, idx) => compactReferenceForPrompt(i, idx)).join("\n\n")}

Sintetize PADRÕES recorrentes, gere FRONTEIRAS de originalidade, e proponha 15 ÂNGULOS AUTORAIS pro Bruno escrever sobre "${input.topic}".`;
}
