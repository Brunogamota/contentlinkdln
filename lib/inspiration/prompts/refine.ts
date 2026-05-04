import { brunoIdentityHeader } from "./identity";
import { GeneratedPost, RefineAction, ReferenceInput } from "../types";

const ACTION_INSTRUCTIONS: Record<RefineAction, string> = {
  more_bruno:
    "DEIXE MAIS BRUNO: linguagem mais direta, frase de WhatsApp, opinião forte, frase quebrada OK, expressões naturais ('mano', 'tipo', 'a real é que', 'porra' sem forçar). Remova qualquer corporativês ou cara de consultor.",
  more_aggressive:
    "MAIS AGRESSIVO: aumente intensidade da provocação, reduza filtro social. Confronto mais direto. Punchlines mais cortantes. Sem ofender pessoa específica — atacar PRÁTICA do mercado.",
  more_elegant:
    "MAIS ELEGANTE: mantenha o conteúdo, melhore o ritmo das frases, troque palavras óbvias por escolhas mais precisas, aumente densidade. Sem perder a voz crua.",
  more_direct:
    "MAIS DIRETO: corte enrolação, reduza adjetivos, frases mais curtas, ataque o ponto central rapidamente.",
  less_ai:
    "MENOS IA: remova clichês de LinkedIn, quebre simetrias, varie tamanho de frase, insira micro-imperfeições humanas, troque abstração por exemplo concreto, remova conclusão padrão. Adicione tensão e opinião.",
  more_storytelling:
    "MAIS STORYTELLING: introduza uma micro-cena concreta no meio (não inventar dado falso), com personagem genérico (cliente, founder, vendedor), virada e insight.",
  more_market_pain:
    "MAIS DOR DE MERCADO: traga a dor operacional real (chargeback, fallback, adquirente travando, antifraude tosco, MDR alto, conciliação manual). Mostre que isso é onde a empresa quebra silenciosamente.",
  add_reborn:
    "ADICIONE CONEXÃO COM A REBORN, mas SUTIL: mencione a Reborn como contexto operacional ou bastidor (ex: 'na Reborn a gente vê isso todo dia'). Zero pitch.",
  remove_reborn:
    "REMOVA QUALQUER MENÇÃO À REBORN. Mantenha o resto.",
  shorter:
    "ENCURTE pra ~50% do tamanho atual mantendo o impacto. Cortar gordura, não músculo.",
  expand:
    "EXPANDA mantendo voz e densidade. Adicionar exemplo concreto, bastidor operacional, profundidade técnica do domínio. Não enrolar.",
  new_hooks:
    "GERE 10 HOOKS ALTERNATIVOS novos (variando mecanismo de atenção: confissão, pergunta incômoda, observação específica, contraintuitivo, alerta, ataque ao mercado). Mantenha o post.",
  new_angle:
    "TROQUE O ÂNGULO MANTENDO O TÓPICO. Nova tese, nova abertura, novo fechamento. Mesmo Bruno voice.",
};

export function getRefineLabel(action: RefineAction): string {
  const labels: Record<RefineAction, string> = {
    more_bruno: "deixar mais Bruno",
    more_aggressive: "mais agressivo",
    more_elegant: "mais elegante",
    more_direct: "mais direto",
    less_ai: "deixar menos IA",
    more_storytelling: "+ storytelling",
    more_market_pain: "+ dor de mercado",
    add_reborn: "+ Reborn",
    remove_reborn: "remover Reborn",
    shorter: "encurtar",
    expand: "expandir",
    new_hooks: "novos hooks",
    new_angle: "outro ângulo",
  };
  return labels[action];
}

export function buildRefineSystemPrompt(): string {
  return `${brunoIdentityHeader()}

🎯 SUA MISSÃO: REFINAR um post existente conforme a instrução do usuário.

REGRAS:
- Mantenha o JSON com a mesma estrutura.
- Mantenha o ângulo central (a menos que a instrução peça pra trocar).
- Aplique a instrução com bisturi, sem destruir o que já tá bom.
- Continue passando no teste "Bruno postaria sem editar?".
- Após refinar, atualize score e originality.

📦 OUTPUT JSON (mesma estrutura do post original):
{
  "hook": "...",
  "post": "...",
  "cta": "..." | null,
  "alternativeHooks": [10 hooks],
  "wordCount": número,
  "score": { hookStrength, emotionalCharge, originality, brunoVoice, clarity, controversy, shareability, commentPotential, authority, humanFeel, finalScore },
  "originality": { similarityScore, copiedPhrases, riskySections, narrativeOverlap, metaphorOverlap, exampleOverlap, isSafeToPublish, rewriteInstructions }
}`;
}

export function buildRefineUserMessage(
  post: GeneratedPost,
  action: RefineAction,
  reference?: ReferenceInput
): string {
  const refBlock = reference
    ? `\n\n📥 REFERÊNCIA ORIGINAL (pra você reavaliar similaridade):\n"""\n${
        reference.extractedText || reference.rawContent
      }\n"""\n`
    : "";

  return `🛠️ INSTRUÇÃO DE REFINO: ${ACTION_INSTRUCTIONS[action]}

📝 POST ATUAL:
HOOK: ${post.hook}

POST:
${post.post}

${post.cta ? `CTA: ${post.cta}` : "CTA: (nenhum)"}
${refBlock}
Aplique o refino e retorne o JSON completo atualizado.`;
}
