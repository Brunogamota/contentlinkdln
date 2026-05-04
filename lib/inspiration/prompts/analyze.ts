import { brunoIdentityHeader } from "./identity";
import { ReferenceInput } from "../types";

/**
 * Stage: deep analysis da referência.
 * Combina ReferenceAnalysis + HookAnalysis + NarrativeDNA + InspirationMap em um output.
 * 4 calls em 1 pra coerência semântica + custo.
 */
export function buildAnalyzeSystemPrompt(): string {
  return `${brunoIdentityHeader()}

🎯 SUA MISSÃO NESTE STAGE: ANALISAR uma referência de post (texto de outro autor) e devolver
inteligência estratégica. NÃO criar post. NÃO sugerir ângulos ainda. Só DECONSTRUIR.

A análise tem 4 camadas:

1. REFERENCE ANALYSIS — qual é o motor estratégico do post?
2. HOOK ANALYSIS — o que faz o hook funcionar e por que?
3. NARRATIVE DNA — qual a estrutura invisível?
4. INSPIRATION MAP — o que pode ser reusado SEM copiar?

Seja CIRÚRGICO. Cada campo é uma resposta curta e específica. Nunca genérico.

📦 OUTPUT JSON (apenas isso, nada antes ou depois):
{
  "referenceAnalysis": {
    "centralThesis": "tese central em 1 frase",
    "hiddenTension": "qual tensão prende o leitor",
    "emotionalDriver": "emoção dominante (ex: indignação, identificação)",
    "audiencePain": "dor silenciosa que o post toca",
    "enemy": "inimigo comum criado pelo post",
    "beliefBeingAttacked": "crença que o post DESTRÓI",
    "beliefBeingBuilt": "crença que o post INSTALA",
    "hookType": "tipo do hook (livre)",
    "narrativeStructure": "estrutura narrativa (livre)",
    "rhythmProfile": "perfil de ritmo (frase curta/longa, quebras)",
    "languageProfile": "perfil de linguagem (cru, técnico, ensaio…)",
    "persuasionMechanics": ["mecanismo 1", "mecanismo 2", "mecanismo 3"],
    "viralityTriggers": ["por que comentaria", "por que compartilharia"],
    "originalityRisks": ["o que NÃO pode ser copiado 1", "o que NÃO pode ser copiado 2"],
    "forbiddenElements": ["elemento intransferível 1", "elemento intransferível 2"]
  },
  "hookAnalysis": {
    "hookText": "o hook exato extraído da referência",
    "hookType": "um de: confissao | bastidor_proibido | frase_de_bar | verdade_desconfortavel | critica_ao_mercado | inversao_senso_comum | comparacao_inesperada | alerta_operacional | ataque_elegante | pergunta_incomoda | provocacao_seca | historia_interrompida | observacao_social | opiniao_que_divide",
    "attentionMechanism": "o que faz parar o scroll",
    "curiosityGap": "o gap que ativa curiosidade",
    "emotionalPunch": "o soco emocional",
    "whyItWorks": "por que funciona neste contexto",
    "riskOfBeingGeneric": "se reusar, qual o risco de cair em clichê",
    "possibleBrunoVersions": [
      "3 hooks no estilo Bruno explorando o mesmo MECANISMO mas em assunto/exemplo do mundo do Bruno (pagamentos/operação/founder)",
      "...",
      "..."
    ]
  },
  "narrativeDNA": {
    "openingMove": "como abre",
    "contextSetup": "como contextualiza",
    "tensionBuild": "como constrói tensão",
    "proofMoment": "ponto de prova",
    "turnPoint": "virada",
    "insightDelivery": "como entrega o insight",
    "emotionalPeak": "pico emocional",
    "closingMove": "como fecha",
    "ctaPattern": "padrão de CTA (se houver)",
    "paragraphRhythm": "ritmo dos parágrafos",
    "sentenceCadence": "cadência das frases",
    "archetype": "um de: desabafo_de_founder | bastidor_de_operacao | critica_ao_mercado | aprendizado_de_porrada | post_anti_consenso | post_educativo_camuflado | historia_curta_com_virada | post_de_autoridade_sem_carteirada | social_selling_invisivel | analise_de_mercado_com_veneno | confissao_vulneravel_com_forca | alerta_para_cliente"
  },
  "inspirationMap": {
    "reusablePrinciple": "o PRINCÍPIO que pode ser reusado (não a frase, não a história)",
    "adaptableEmotion": "a emoção que pode ser disparada com matéria-prima do Bruno",
    "safeStructure": "a estrutura SEGURA que pode virar template",
    "newAngleOptions": [
      "ângulo 1 conectando ao mundo do Bruno",
      "ângulo 2",
      "ângulo 3",
      "ângulo 4",
      "ângulo 5"
    ],
    "brunoPersonalConnection": "como conecta à história do Bruno",
    "rebornConnection": "como conecta à Reborn (se fizer sentido)",
    "marketConnection": "como conecta ao mercado de pagamentos",
    "founderConnection": "como conecta ao mundo founder em geral",
    "contentWarnings": [
      "alerta 1 sobre o que evitar pra não copiar",
      "alerta 2"
    ],
    "originalityBoundaries": [
      "fronteira 1: NUNCA reusar a história específica X",
      "fronteira 2: NUNCA usar a metáfora Y",
      "fronteira 3: NUNCA repetir o exemplo Z"
    ]
  }
}`;
}

export function buildAnalyzeUserMessage(reference: ReferenceInput): string {
  const meta: string[] = [];
  if (reference.author) meta.push(`Autor (não-Bruno): ${reference.author}`);
  if (reference.sourceUrl) meta.push(`URL: ${reference.sourceUrl}`);
  if (reference.userIntent) meta.push(`Intenção do usuário: ${reference.userIntent}`);
  if (reference.targetTopic) meta.push(`Tópico-alvo do novo post: ${reference.targetTopic}`);
  if (reference.desiredAngle) meta.push(`Ângulo desejado: ${reference.desiredAngle}`);

  return `${meta.length > 0 ? `📋 METADADOS\n${meta.join("\n")}\n\n` : ""}📥 REFERÊNCIA (texto de outro autor — analisar, NÃO copiar):
"""
${reference.extractedText || reference.rawContent}
"""

Analise nas 4 camadas obrigatórias e retorne o JSON.`;
}
