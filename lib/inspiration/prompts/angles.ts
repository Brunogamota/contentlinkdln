import { brunoIdentityHeader } from "./identity";
import { FullAnalysis, ReferenceInput } from "../types";

export function buildAnglesSystemPrompt(): string {
  return `${brunoIdentityHeader()}

🎯 SUA MISSÃO: gerar 15 ângulos ORIGINAIS para um post do Bruno baseado no MAPA DE INSPIRAÇÃO
(que foi extraído de uma referência de outro autor — não copie da referência).

REGRAS ABSOLUTAS:
- Cada ângulo é AUTORAL: parte da matéria-prima do Bruno (operação, pagamentos, founder, mercado, ego, bastidor) — não da história do autor original.
- Variar formatos: alguns curtos e cortantes, outros longos e narrativos, outros educativos camuflados.
- Variar nível de polêmica.
- Cada um precisa passar no teste: "Bruno postaria isso sem editar?"

📦 OUTPUT JSON (apenas isso):
{
  "angles": [
    {
      "title": "título curto e provocativo do ângulo",
      "thesis": "tese central em 1 frase",
      "emotionalDriver": "emoção dominante (indignação, identificação, surpresa, admiração, raiva, alívio…)",
      "controversyLevel": 0-10,
      "audience": "ICP-alvo deste ângulo (founders, sellers, executivos, mercado de pagamentos, geral)",
      "whyItCouldWork": "por que esse ângulo geraria identificação/discussão",
      "brunoFitScore": 0-100,
      "originalityScore": 0-100,
      "riskScore": 0-100,
      "recommendedFormat": "um de: post_curto_de_porrada | post_longo_storytelling | post_educativo_disfarcado | post_polemico | post_bastidor | post_social_selling_sutil | post_analise_de_mercado | post_conversa_vazada | post_manifesto | post_alerta"
    },
    ... (EXATAMENTE 15 ângulos, todos diferentes entre si)
  ]
}`;
}

export function buildAnglesUserMessage(analysis: FullAnalysis, reference: ReferenceInput): string {
  return `📌 TÓPICO-ALVO DO POST: ${reference.targetTopic || "(livre — usa o mapa de inspiração)"}
🎯 INTENÇÃO DO USUÁRIO: ${reference.userIntent || "(livre)"}
${reference.desiredAngle ? `📍 ÂNGULO DESEJADO: ${reference.desiredAngle}\n` : ""}
🧠 MAPA DE INSPIRAÇÃO (já extraído):

PRINCÍPIO REUSÁVEL: ${analysis.inspirationMap.reusablePrinciple}
EMOÇÃO ADAPTÁVEL: ${analysis.inspirationMap.adaptableEmotion}
ESTRUTURA SEGURA: ${analysis.inspirationMap.safeStructure}

CONEXÕES POSSÍVEIS:
- pessoal Bruno: ${analysis.inspirationMap.brunoPersonalConnection}
- Reborn: ${analysis.inspirationMap.rebornConnection}
- mercado: ${analysis.inspirationMap.marketConnection}
- founder: ${analysis.inspirationMap.founderConnection}

NOVOS ÂNGULOS SUGERIDOS (use como inspiração, não copia):
${analysis.inspirationMap.newAngleOptions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

⛔ FRONTEIRAS DE ORIGINALIDADE (não cruzar):
${analysis.inspirationMap.originalityBoundaries.map((b) => `- ${b}`).join("\n")}

⚠️ AVISOS:
${analysis.inspirationMap.contentWarnings.map((w) => `- ${w}`).join("\n")}

Gere 15 ângulos ORIGINAIS no JSON pedido.`;
}
