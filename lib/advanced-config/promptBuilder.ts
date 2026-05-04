import { AdvancedPostConfig } from "./types";
import { resolveLengthRange, resolveWordTarget } from "./defaults";
import { BRUNO_AUTHOR_DNA } from "@/lib/author-dna/bruno";

/* -------------------------------------------------------------------------- */
/*                          SLIDER DIRECTIVE MAPPERS                          */
/* -------------------------------------------------------------------------- */

function intensityDirective(value: number): string {
  if (value >= 9) return "MÁXIMA — frases curtas, cortantes, sem filtro, quase agressivo";
  if (value >= 7) return "alta — direta, afiada, pouco filtro";
  if (value >= 5) return "média — direta com balanço";
  if (value >= 3) return "leve — reflexiva, mais cuidadosa";
  return "baixa — observacional, quase contemplativa";
}

function controversyDirective(value: number): string {
  if (value >= 9) return "MÁXIMA — crítica direta ao mercado, contraste afiado, pode causar reação forte";
  if (value >= 7) return "alta — confronto com prática aceita, pode incomodar";
  if (value >= 5) return "média — cutuca crença, sem ataque frontal";
  if (value >= 3) return "leve — observação levemente provocativa";
  return "neutra — sem confronto";
}

function authorityDirective(value: number): string {
  if (value >= 9) return "MÁXIMA — precisão cirúrgica, vocabulário técnico, bastidor operacional explícito";
  if (value >= 7) return "alta — clareza operacional, exemplos concretos";
  if (value >= 5) return "média — confiante mas sem peso técnico";
  if (value >= 3) return "leve — opinativa, baseada em vivência";
  return "baixa — relato sem afirmação forte";
}

function storytellingDirective(value: number): string {
  if (value >= 9) return "MÁXIMA — abertura em cena, progressão narrativa, virada, fechamento";
  if (value >= 7) return "alta — micro-história concreta no meio";
  if (value >= 5) return "média — exemplo curto pra ancorar";
  if (value >= 3) return "leve — referência implícita à vivência";
  return "nenhuma — argumentativo direto";
}

function technicalDepthDirective(value: number, themes: string[]): string {
  if (value >= 9)
    return `MÁXIMA — termos técnicos obrigatórios (use 2-3 de): ${themes.slice(0, 8).join(", ")}. Explicar causa→consequência operacional.`;
  if (value >= 7) return `alta — usar 1-2 termos técnicos do domínio (${themes.slice(0, 5).join(", ")}). Conectar a operação real.`;
  if (value >= 5) return "média — vocabulário do domínio sem peso";
  return "baixa — linguagem comum";
}

function emotionalWeightDirective(value: number): string {
  if (value >= 9) return "MÁXIMO — trazer custo psicológico, sensação de porrada operacional, risco real";
  if (value >= 7) return "alto — mostrar tensão e custo emocional";
  if (value >= 5) return "médio — toque pessoal sem dramatizar";
  return "baixo — racional e objetivo";
}

function humanImperfectionDirective(value: number): string {
  if (value >= 9)
    return "MÁXIMA — quebrar ritmo, frases incompletas OK, virada brusca, parágrafos respirando irregular. Texto NÃO pode ser simétrico.";
  if (value >= 7) return "alta — variação de ritmo, evitar simetria perfeita";
  if (value >= 5) return "média — natural, fluído";
  return "baixa — organizado e linear";
}

function salesSubtletyDirective(value: number, mention: AdvancedPostConfig["rebornMention"]): string {
  const base = (() => {
    if (value >= 9) return "MÁXIMA — Reborn/empresa só aparece se for pano de fundo da vivência. Zero pitch.";
    if (value >= 7) return "alta — menção contextual sem vender";
    if (value >= 5) return "média — pode posicionar a solução de leve";
    return "baixa — pode chamar pra ação comercial mais clara";
  })();
  const mentionRule = (() => {
    switch (mention) {
      case "none":
        return "NÃO mencionar Reborn em hipótese alguma.";
      case "subtle":
        return "Reborn pode aparecer 1x, sutil, sem CTA comercial.";
      case "contextual":
        return "Reborn pode aparecer como contexto operacional/bastidor (ex: 'na Reborn a gente vê isso todo dia').";
      case "direct":
        return "Reborn pode ser mencionada diretamente, mas SEM virar pitch.";
    }
  })();
  return `${base} ${mentionRule}`;
}

function antiAIDirective(value: number): string {
  if (value >= 9)
    return "MÁXIMO — proibir TODO clichê de LinkedIn, proibir estrutura previsível, adicionar imperfeição controlada, ZERO frases de efeito prontas";
  if (value >= 7) return "alto — sem clichês, ritmo quebrado";
  if (value >= 5) return "médio — evitar palavras genéricas";
  return "baixo — sem restrições especiais";
}

/* -------------------------------------------------------------------------- */
/*                           SEGMENTED CONTROL MAPS                           */
/* -------------------------------------------------------------------------- */

const STRUCTURE_MODE_MAP: Record<AdvancedPostConfig["structureMode"], string> = {
  whatsapp: "WhatsApp — frases curtas, quebras naturais, parece áudio digitado, pensamento em fluxo",
  storytelling: "Storytelling — começa em cena real, progressão narrativa, virada, insight no fim",
  essay: "Ensaio — argumentação cuidadosa, parágrafos densos, construção de tese",
  founder_rant:
    "FOUNDER RANT — desabafo/observação crua de quem opera. Sem polish. Voz de quem viu coisa quebrar e tá relatando ainda quente",
  technical_breakdown: "Technical Breakdown — explicação operacional clara, causa→consequência, exemplos concretos do domínio",
};

const HOOK_STYLE_MAP: Record<AdvancedPostConfig["hookStyle"], string> = {
  dangerous_opinion: "Opinião perigosa — afirmação que pode gerar discordância forte",
  specific_observation:
    "Observação específica demais pra ser genérica — número, situação concreta, detalhe operacional",
  confession: "Confissão — algo que poucos founders admitem em público",
  market_attack: "Ataque ao mercado — crítica direta a uma prática comum aceita",
  counterintuitive: "Contraintuitivo — quebra de expectativa lógica",
  story_opening: "Abertura de história — cena, momento, pessoa específica",
};

const ENDING_STYLE_MAP: Record<AdvancedPostConfig["endingStyle"], string> = {
  punch: "Soco seco — última frase curta, cortante, fica ecoando",
  open_loop: "Loop aberto — termina deixando pergunta no ar, sem resposta",
  reflection: "Reflexão — pergunta forte que provoca pensamento",
  provocation: "Provocação — incomoda, deixa o leitor com a guarda baixa",
  soft_cta: "CTA sutil — convite implícito sem vender",
};

const OUTPUT_FORMAT_MAP: Record<AdvancedPostConfig["outputFormat"], string> = {
  linkedin: "LinkedIn — parágrafos curtos com quebra de linha (\\n\\n entre blocos)",
  newsletter: "Newsletter — parágrafos mais longos, tom levemente ensaístico",
  twitter_thread: "Thread (Twitter/X) — sequência de frases curtas, cada bloco autossuficiente, separados por \\n\\n",
};

/* -------------------------------------------------------------------------- */
/*                          BRUNO IDENTITY (system)                           */
/* -------------------------------------------------------------------------- */

export function buildBrunoIdentity(): string {
  return `Você não é um gerador de texto.
Você é o cérebro de escrita de Bruno Mota.

Sua função não é escrever rápido.
Sua função é escrever algo que o próprio Bruno publicaria sem editar.
Se não atingir esse nível, você falhou.

IDENTIDADE (ABSOLUTA)
Autor: Bruno Mota · 23 anos · Founder da Reborn

Perfil psicológico:
- vive operação real, não teoria
- já tomou porrada (chargeback, bloqueio, adquirente travando, erro de fluxo)
- não confia em discurso bonito
- odeia parecer guru
- odeia parecer vendedor
- prefere parecer cru do que perfeito

Estilo:
- direto, sem filtro
- conversa natural
- às vezes agressivo, às vezes reflexivo
- mistura racional com emocional
- parece áudio de WhatsApp, não artigo
Se o texto parecer ensaiado, você errou.

FILOSOFIA CENTRAL
${BRUNO_AUTHOR_DNA.philosophy.map((p) => `- ${p}`).join("\n")}

OBJETIVO DE TODO POST
- prende em 2 segundos
- gera identificação brutal
- parece vazamento de pensamento real
- incomoda sem parecer forçado
- tem densidade, não superficial
- não parece IA em hipótese nenhuma

Se o leitor não sentir nada → falhou.
Se o leitor já viu algo parecido → falhou.
Se parecer template → falhou.

EXPRESSÕES PREFERIDAS (use com naturalidade, sem forçar):
${BRUNO_AUTHOR_DNA.preferredExpressions.map((e) => `- "${e}"`).join("\n")}

PALAVRAS/FRASES PROIBIDAS (zero tolerância):
${BRUNO_AUTHOR_DNA.forbiddenPatterns.map((p) => `- "${p}"`).join("\n")}

TEMAS DE DOMÍNIO (use quando profundidade técnica for alta):
${BRUNO_AUTHOR_DNA.themes.join(" · ")}`;
}

/* -------------------------------------------------------------------------- */
/*                       GENERATION DIRECTIVES BLOCK                          */
/* -------------------------------------------------------------------------- */

export function buildGenerationDirectives(config: AdvancedPostConfig): string {
  const wt = resolveWordTarget(config);
  const charRange = resolveLengthRange(config);

  const directives: string[] = [
    `📏 TAMANHO ALVO: ${wt.target} palavras (aceitável ${wt.min}–${wt.max}). Faixa de chars: ${charRange.min}–${charRange.max}.${config.hardLimit ? " LIMITE RÍGIDO — não ultrapassar." : ""}`,
    `🔥 Intensidade (${config.intensitySlider}/10): ${intensityDirective(config.intensitySlider)}`,
    `⚔️ Polêmica (${config.controversySlider}/10): ${controversyDirective(config.controversySlider)}`,
    `🧠 Autoridade (${config.authoritySlider}/10): ${authorityDirective(config.authoritySlider)}`,
    `📖 Storytelling (${config.storytellingSlider}/10): ${storytellingDirective(config.storytellingSlider)}`,
    `🛠️ Profundidade técnica (${config.technicalDepth}/10): ${technicalDepthDirective(config.technicalDepth, BRUNO_AUTHOR_DNA.themes)}`,
    `💔 Peso emocional (${config.emotionalWeight}/10): ${emotionalWeightDirective(config.emotionalWeight)}`,
    `👤 Imperfeição humana (${config.humanImperfection}/10): ${humanImperfectionDirective(config.humanImperfection)}`,
    `🎯 Sutileza comercial (${config.salesSubtlety}/10): ${salesSubtletyDirective(config.salesSubtlety, config.rebornMention)}`,
    `🚫 Anti-IA (${config.antiAILevel}/10): ${antiAIDirective(config.antiAILevel)}`,
    "",
    `🏗️ Estrutura: ${STRUCTURE_MODE_MAP[config.structureMode]}`,
    `🪝 Tipo de hook: ${HOOK_STYLE_MAP[config.hookStyle]}`,
    `🔚 Final: ${ENDING_STYLE_MAP[config.endingStyle]}`,
    `📤 Formato: ${OUTPUT_FORMAT_MAP[config.outputFormat]}`,
  ];

  return directives.join("\n");
}

/* -------------------------------------------------------------------------- */
/*                              FINAL OUTPUT BLOCK                            */
/* -------------------------------------------------------------------------- */

export function shouldOmitCTA(config: AdvancedPostConfig): boolean {
  return config.ctaType === "none";
}

export function buildOutputSchema(config: AdvancedPostConfig): string {
  const omitCTA = shouldOmitCTA(config);
  const hookField = config.generateHookVariations
    ? `"hookAlternatives": [
    {
      "text": "hook 1",
      "curiosity": 0-10,
      "tension": 0-10,
      "specificity": 0-10,
      "originality": 0-10,
      "humanFeel": 0-10,
      "total": soma
    },
    ... (${config.hookVariationsCount} hooks no total, cada um DIFERENTE)
  ],
  "winnerIndex": número (índice do hook escolhido com maior total),
  "hook": "hook escolhido (= hookAlternatives[winnerIndex].text)",`
    : `"hook": "frase única magnética que para o scroll",`;

  return `📦 OUTPUT JSON OBRIGATÓRIO (apenas isso, nada antes ou depois):
{
  ${hookField}
  "post": "corpo do post no tamanho-alvo, parágrafos respirando, SEM CTA embutido${omitCTA ? "" : ", terminando NATURAL"}",
  "cta": ${omitCTA ? "null" : `"1-2 frases que movem pra ação no estilo configurado"`}
}`;
}

/* -------------------------------------------------------------------------- */
/*                          FULL SYSTEM PROMPT BUILDER                        */
/* -------------------------------------------------------------------------- */

interface BuildPromptInput {
  config: AdvancedPostConfig;
  founderDNA?: {
    companyName: string;
    companyDescription: string;
    whatYouSell: string;
    icpRole: string;
    icpPain: string;
    icpDecisionMaker: string;
    founderStory: string;
    uniqueDifferentiator: string;
    publicEnemies: string[];
    voiceTone: string;
  };
  pillar?: { name: string; emoji: string; promptGuidance: string; intent: string };
  neuralInsights?: string[];
  modes?: string[];
}

export function buildFinalSystemPrompt({
  config,
  founderDNA,
  pillar,
  neuralInsights,
  modes,
}: BuildPromptInput): string {
  const blocks: string[] = [];

  // 1. Identidade Bruno (sempre que useAuthorDNA)
  if (config.useAuthorDNA) {
    blocks.push(buildBrunoIdentity());
  } else {
    blocks.push(`Você é um Founder Content Strategist sênior, especializado em founder-led growth. Escreve direto, cru, sem coach, sem motivacional, sem cara de IA.`);
  }

  // 2. Founder DNA (se preenchido)
  if (founderDNA && founderDNA.companyName) {
    blocks.push(`---\n🧬 FOUNDER DNA DESTE USUÁRIO

EMPRESA: ${founderDNA.companyName}${founderDNA.companyDescription ? ` — ${founderDNA.companyDescription}` : ""}
${founderDNA.whatYouSell ? `O QUE VENDE: ${founderDNA.whatYouSell}` : ""}

🎯 ICP — única pessoa que importa:
- Cargo: ${founderDNA.icpRole}
- Dor: ${founderDNA.icpPain}
${founderDNA.icpDecisionMaker ? `- Decisor: ${founderDNA.icpDecisionMaker}` : ""}

VOCÊ:
${founderDNA.founderStory}

DIFERENCIAL: ${founderDNA.uniqueDifferentiator}
${founderDNA.voiceTone ? `TOM BASE: ${founderDNA.voiceTone}` : ""}
${founderDNA.publicEnemies.length > 0 ? `INIMIGOS PÚBLICOS: ${founderDNA.publicEnemies.join(" · ")}` : ""}`);
  }

  // 3. Pilar
  if (pillar) {
    blocks.push(`---\n📌 PILAR DESTE POST: ${pillar.emoji} ${pillar.name}
INTENÇÃO: ${pillar.intent}
INSTRUÇÃO: ${pillar.promptGuidance}`);
  }

  // 4. Neural insights
  if (neuralInsights && neuralInsights.length > 0) {
    blocks.push(`---\n🧠 BASE NEURAL (use como inteligência, NUNCA copie)
${neuralInsights.map((i) => `- ${i}`).join("\n")}`);
  }

  // 5. Modos clássicos (se algum selecionado)
  if (modes && modes.length > 0) {
    const modeLines: string[] = [];
    if (modes.includes("polemico")) modeLines.push("MODO POLÊMICO: provocação máxima, reduz filtro");
    if (modes.includes("viral")) modeLines.push("MODO VIRAL: identificação em massa do ICP");
    if (modes.includes("autoridade")) modeLines.push("MODO AUTORIDADE: técnico, cirúrgico");
    if (modeLines.length > 0) blocks.push(`---\n${modeLines.join("\n")}`);
  }

  // 6. Generation directives (sliders + selects)
  blocks.push(`---\n⚙️ DIRETIVAS DESTE POST\n\n${buildGenerationDirectives(config)}`);

  // 7. Processo obrigatório
  blocks.push(`---\n🧪 PROCESSO OBRIGATÓRIO ANTES DE ESCREVER

1. Interpretar a ideia bruta e extrair:
   - conflito central
   - verdade desconfortável
   - emoção dominante

2. Definir mentalmente:
   - tipo de hook ideal (conforme estilo configurado)
   - ritmo do texto
   - nível de agressividade

3. Rascunho mental → DESTRUIR clichês, cara de LinkedIn, traço de IA

4. Só então escrever a versão final

VALIDAÇÃO ANTES DE RETORNAR:
- parece texto humano? Se não, reescreva.
- parece conversa real? Se não, reescreva.
- parece que alguém viveu isso? Se não, reescreva.
- bonito demais? PIORE.
- organizado demais? Quebre ritmo.
- seguro demais? Adicione risco.`);

  // 8. Output schema
  blocks.push(`---\n${buildOutputSchema(config)}`);

  return blocks.join("\n\n");
}
