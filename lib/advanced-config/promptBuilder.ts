import { AdvancedPostConfig } from "./types";
import { resolveLengthRange } from "./defaults";

const INTENSITY_MAP: Record<AdvancedPostConfig["intensity"], string> = {
  light: "leve — mais reflexivo, menos confronto",
  medium: "média — direta mas equilibrada",
  strong: "forte — desconfortável, incisiva, com punchlines",
  aggressive:
    "agressiva — máximo atrito, frases cruas, provocação alta SEM ser ofensivo gratuito",
};

const STORY_MAP: Record<AdvancedPostConfig["storytellingLevel"], string> = {
  none: "sem história — argumentativo direto",
  example: "exemplo prático e concreto",
  light_backstage: "bastidor leve — vivência real curta de operador",
  heavy_backstage:
    "bastidor PESADO — cicatriz, perda, caos operacional, aprendizado real (NÃO inventar dado/número específico se não for verídico)",
};

const CONT_MAP: Record<AdvancedPostConfig["controversyLevel"], string> = {
  neutral: "neutra — sem ataque, mais educativa",
  provocative: "provocativa — cutuca crença comum do mercado",
  controversial: "polêmica — confronta opinião aceita do nicho",
  enemy_attack:
    "ATAQUE AO INIMIGO PÚBLICO — usa um dos inimigos públicos cadastrados no Founder DNA como alvo narrativo (sem acusar empresa específica sem evidência, atacar PRÁTICA, não pessoa)",
};

const GOAL_MAP: Record<AdvancedPostConfig["postGoal"], string> = {
  engagement: "engajamento — máxima identificação, gera comentários",
  authority: "autoridade — visão, cicatriz e domínio do tema",
  dm_conversion:
    "conversão pra DM — mover ICP a iniciar conversa, CTA comercial sutil (NUNCA vendedor barato)",
  education: "educação — explicar conceito de forma simples e útil",
  series_narrative:
    "narrativa de série — terminar com gancho explícito pro próximo post",
};

const CTA_MAP: Record<Exclude<AdvancedPostConfig["ctaType"], "none">, string> = {
  reflection: "REFLEXÃO — terminar com pergunta forte que provoca pensamento",
  comment: "CHAMAR DISCUSSÃO nos comentários (sem ser professor)",
  dm: "CHAMAR PRA DM — mover pra conversa privada, mas sem cara de vendedor",
  indirect:
    "INDIRETO — NÃO pedir DM nem comentário explicitamente. Só deixar o problema escancarado e posicionar a solução de forma sutil. NÃO vender.",
};

const HUM_MAP: Record<AdvancedPostConfig["humanizationLevel"], string> = {
  structured: "estruturada — organizada mas com voz humana",
  natural: "natural — parece escrito por humano, fluxo orgânico",
  leaked_conversation:
    "CONVERSA VAZADA — parece pensamento real do founder, fluxo menos perfeito, sem polish, como se estivesse escrevendo no WhatsApp pra um amigo",
  bruno_signature:
    "BRUNO SIGNATURE — founder brasileiro direto, cru, com autoridade de quem OPEROU. Zero guru. Zero motivacional. Zero frase com cara de IA. Frases curtas. Pode usar gírias leves. Voz de quem viu coisa quebrar e consertou.",
};

const STRUCT_MAP: Record<AdvancedPostConfig["postStructure"], string> = {
  classic: "clássica — hook + desenvolvimento + fechamento (CTA)",
  story_insight: "história + virada + insight",
  bullets_punch: "hook + bullets curtos + punch final",
  free_flow:
    "fluxo livre — menos previsível, mais autoral, parágrafos respirando ritmo próprio",
};

const VAR_MAP: Record<AdvancedPostConfig["creativeVariation"], string> = {
  low: "baixa — seguro e previsível",
  medium: "média — equilíbrio",
  high: "alta — hooks inesperados e analogias mais fortes",
  controlled_chaos:
    "CAÓTICA CONTROLADA — risco criativo alto, hooks menos óbvios, metáforas fortes, aberturas inesperadas, MAS sem perder clareza do ponto central",
};

const SENT_MAP: Record<AdvancedPostConfig["sentenceStyle"], string> = {
  short: "curtas — punchlines, leitura rápida",
  mixed: "mistas — natural, varia ritmo",
  dense: "densas — explicativo, profundo",
};

export function buildAdvancedConfigInstructions(config: AdvancedPostConfig): string {
  const { min, max } = resolveLengthRange(config);

  const restrictions: string[] = [];
  if (config.avoidLinkedinCliches)
    restrictions.push(
      "ZERO clichês de LinkedIn (proibido: 'no final do dia', 'isso me ensinou', 'aprendi que', 'a verdade é que')"
    );
  if (config.avoidMotivationalTone)
    restrictions.push("ZERO tom motivacional/coach. Nunca soar como palestrante ou guru");
  if (config.avoidPerfectStructure)
    restrictions.push(
      "EVITAR estrutura perfeita demais — deixar o texto respirar imperfeições humanas (frase quebrada, pensamento solto, virada brusca)"
    );
  if (config.avoidGenericWords)
    restrictions.push(
      "PROIBIDO usar palavras genéricas: 'jornada', 'desafio', 'impacto', 'transformação', 'mindset', 'ecossistema', 'propósito', 'protagonismo'"
    );
  if (config.allowLightSlang)
    restrictions.push("OK usar gírias leves brasileiras (mano, tipo, sacou, foda, daora) com moderação");
  else restrictions.push("Sem gírias — manter registro neutro");

  const ctaInstruction =
    config.ctaType === "none"
      ? "🚫 CTA: NENHUM — não gere campo CTA. Retorne `cta: null` no JSON. O post deve fechar por si só."
      : `📞 CTA: ${CTA_MAP[config.ctaType]}`;

  const lengthInstruction = config.hardLimit
    ? `📏 TAMANHO: OBRIGATORIAMENTE entre ${min} e ${max} caracteres (limite RÍGIDO). Conte enquanto escreve.`
    : `📏 TAMANHO ALVO: ${min} a ${max} caracteres (alvo aproximado, pode variar 10%)`;

  return `
⚙️ CONFIGURAÇÕES AVANÇADAS DESTE POST (siga TODAS rigorosamente)

${lengthInstruction}
🔥 Intensidade: ${INTENSITY_MAP[config.intensity]}
📖 Storytelling: ${STORY_MAP[config.storytellingLevel]}
⚔️ Polêmica: ${CONT_MAP[config.controversyLevel]}
🎯 Objetivo: ${GOAL_MAP[config.postGoal]}
${ctaInstruction}
👤 Humanização: ${HUM_MAP[config.humanizationLevel]}
🏗️ Estrutura: ${STRUCT_MAP[config.postStructure]}
🎨 Variação criativa: ${VAR_MAP[config.creativeVariation]}
✏️ Frases: ${SENT_MAP[config.sentenceStyle]}

🚫 RESTRIÇÕES ANTI-IA:
${restrictions.map((r) => `  - ${r}`).join("\n")}
`.trim();
}

export function shouldOmitCTA(config: AdvancedPostConfig): boolean {
  return config.ctaType === "none";
}
