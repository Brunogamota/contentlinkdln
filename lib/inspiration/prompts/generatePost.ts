import { brunoIdentityHeader } from "./identity";
import { AngleOption, FullAnalysis, PostConfig, ReferenceInput } from "../types";

/* ----------------------------- helpers ----------------------------- */

function resolveTargetWords(config: PostConfig): { target: number; min: number; max: number } {
  let target: number;
  if (config.outputLength === "custom") target = config.customLength ?? 1500;
  else target = config.outputLength;
  return {
    target,
    min: Math.floor(target * 0.85),
    max: Math.floor(target * 1.2),
  };
}

const INTENSITY_MAP: Record<PostConfig["intensity"], string> = {
  leve: "leve — reflexivo, mais cuidadoso",
  medio: "médio — direto, equilibrado",
  forte: "forte — desconfortável, incisivo",
  brutal: "BRUTAL — máximo atrito, frase cortante, sem filtro (sem ofender)",
};

const TONE_MAP: Record<PostConfig["tone"], string> = {
  desabafo: "desabafo — voz crua, fluxo de pensamento, sem polish",
  bastidor: "bastidor — relato operacional vazado, como se ninguém devesse estar lendo",
  polemico: "polêmico — confronta o mercado, divide a sala",
  educativo: "educativo camuflado — ensina sem parecer aula, com voz de operador",
  storytelling: "storytelling — abre em cena real, virada, insight",
  social_selling_sutil: "social selling sutil — Reborn aparece como contexto operacional, NUNCA como pitch",
  analise_mercado: "análise de mercado com veneno — observação afiada, tese contra-intuitiva",
};

const CTA_MAP: Record<PostConfig["cta"], string> = {
  sem_cta: "🚫 SEM CTA — não inclua campo CTA. Retorne cta: null. Post fecha por si só.",
  indireto: "📞 CTA INDIRETO — não pede DM nem comentário. Só posiciona o problema e a solução de forma sutil.",
  reborn: "📞 CTA REBORN — convida pra continuar a conversa em torno da Reborn (sem ser pitch). Ex: \"se você opera pagamentos e isso bateu, tô aberto pra trocar — DM\".",
  comentario: "📞 CTA COMENTÁRIO — chama discussão real nos comentários (sem ser professor).",
  reflexao: "📞 CTA REFLEXÃO — termina com pergunta forte que provoca pensamento.",
};

const PROXIMITY_MAP: Record<PostConfig["proximityToReference"], string> = {
  baixa: "BAIXA — afaste-se da referência. Use só o PRINCÍPIO. Estrutura nova, exemplos novos, hook diferente.",
  media: "MÉDIA — mantenha a engenharia emocional, mude tudo o resto (estrutura, exemplos, hook, voz).",
  alta: "ALTA — mantenha estrutura geral, mas sempre com matéria-prima do Bruno. Cuidado com cópia — atravesse a fronteira de originalidade ZERO vezes.",
};

const AUDIENCE_MAP: Record<PostConfig["targetAudience"], string> = {
  founders: "founders early-stage — gente que opera, não estrategia de slide",
  sellers: "vendedores B2B — quem fecha, sente fila quebrar, vê deal sumir",
  executivos: "C-level — quem aprova orçamento e olha número",
  mercado_pagamentos: "pessoas de pagamentos/fintech — entendem MDR, fallback, antifraude",
  geral: "audiência ampla de LinkedIn",
};

/* ----------------------------- prompts ----------------------------- */

export function buildGeneratePostSystemPrompt(): string {
  return `${brunoIdentityHeader()}

🎯 SUA MISSÃO NESTE STAGE: criar UM post do zero a partir de:
- um ÂNGULO já escolhido
- a inspiração estratégica (mapa)
- as configs do usuário

🚨 REGRA DE ORIGINALIDADE
Você está vendo a referência ORIGINAL e o mapa derivado. NUNCA copie:
- nenhuma frase da referência
- a sequência narrativa idêntica
- a metáfora única
- o mesmo exemplo
- o mesmo CTA específico

A INSPIRAÇÃO É INPUT. O OUTPUT É AUTORAL.
Pergunte-se: "qual é a engenharia emocional desse padrão?" — NÃO "como reescrever?".

⚙️ PROCESSO INTERNO OBRIGATÓRIO ANTES DE ESCREVER

1. LEIA o ângulo e identifique:
   - tese central
   - emoção dominante
   - inimigo
   - dor do ICP

2. RASCUNHE mentalmente o post.

3. APLIQUE BRUNO VOICE no rascunho:
   - linguagem direta, frase com cara de WhatsApp
   - sem corporativês, sem coach, sem motivacional
   - frase curta + frase média (ritmo humano)
   - opinião forte, exemplos reais, punchlines
   - "mano", "tipo", "porra", "foda" sem forçar

4. APLIQUE ANTI-IA:
   - remover frase genérica
   - quebrar simetria
   - adicionar micro-imperfeição humana
   - cortar palavra de consultor
   - trocar abstração por exemplo concreto

5. GERE 10 hooks alternativos (variando mecanismo de atenção).

6. AVALIE você mesmo (PostScore) e atribua nota 0-100 em cada eixo.

7. AVALIE originalidade vs referência (similarityScore 0-100).

📦 OUTPUT JSON (apenas isso):
{
  "hook": "hook escolhido (o melhor dos 10)",
  "post": "corpo completo (no tamanho-alvo) — SEM o CTA dentro do post",
  "cta": "CTA conforme config (ou null se sem_cta)",
  "alternativeHooks": ["hook 2", "hook 3", ... 10 hooks no total, contando o escolhido"],
  "wordCount": número (você conta as palavras do post),
  "score": {
    "hookStrength": 0-100,
    "emotionalCharge": 0-100,
    "originality": 0-100,
    "brunoVoice": 0-100,
    "clarity": 0-100,
    "controversy": 0-100,
    "shareability": 0-100,
    "commentPotential": 0-100,
    "authority": 0-100,
    "humanFeel": 0-100,
    "finalScore": 0-100 (média ponderada)
  },
  "originality": {
    "similarityScore": 0-100 (quanto seu post se aproxima da referência — quanto MENOR melhor),
    "copiedPhrases": ["frase em comum (idealmente vazio)", "..."],
    "riskySections": ["seção do seu post que ficou perto da referência"],
    "narrativeOverlap": "explicação curta",
    "metaphorOverlap": "explicação curta",
    "exampleOverlap": "explicação curta",
    "isSafeToPublish": true/false,
    "rewriteInstructions": "se isSafeToPublish=false, instrução pra reescrever; senão string vazia"
  }
}`;
}

export function buildGeneratePostUserMessage(
  angle: AngleOption,
  config: PostConfig,
  reference: ReferenceInput,
  analysis: FullAnalysis
): string {
  const wt = resolveTargetWords(config);
  return `🎯 ÂNGULO ESCOLHIDO
Título: ${angle.title}
Tese: ${angle.thesis}
Emoção: ${angle.emotionalDriver}
Polêmica: ${angle.controversyLevel}/10
Audiência: ${angle.audience}
Por que funcionaria: ${angle.whyItCouldWork}
Formato recomendado: ${angle.recommendedFormat}

⚙️ CONFIG DO USUÁRIO
- Tamanho-alvo: ${wt.target} palavras (aceitável ${wt.min}–${wt.max})
- Intensidade: ${INTENSITY_MAP[config.intensity]}
- Tom: ${TONE_MAP[config.tone]}
- Audiência: ${AUDIENCE_MAP[config.targetAudience]}
- Proximidade da referência: ${PROXIMITY_MAP[config.proximityToReference]}
- ${CTA_MAP[config.cta]}

🧠 MAPA DE INSPIRAÇÃO (input estratégico, output autoral)
Princípio reusável: ${analysis.inspirationMap.reusablePrinciple}
Estrutura segura: ${analysis.inspirationMap.safeStructure}
Conexão founder: ${analysis.inspirationMap.founderConnection}
Conexão mercado: ${analysis.inspirationMap.marketConnection}

⛔ FRONTEIRAS DE ORIGINALIDADE (não cruzar):
${analysis.inspirationMap.originalityBoundaries.map((b) => `- ${b}`).join("\n")}

📥 REFERÊNCIA ORIGINAL (não copie nada — só serve pra você medir similarityScore depois):
"""
${reference.extractedText || reference.rawContent}
"""

Gere o post completo no JSON pedido.`;
}
