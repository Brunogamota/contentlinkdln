import { FullAnalysis } from "@/lib/inspiration/types";

/**
 * Mapeia palavras-chave do domínio Bruno → categorias.
 * Roda sem LLM. Se a tese/dor/inimigo da referência menciona qualquer keyword,
 * a categoria correspondente é atribuída.
 */
const THEME_TO_CATEGORIES: { keyword: RegExp; categories: string[] }[] = [
  { keyword: /\b(pagamento|pagamentos|chargeback|fallback|adquirente|mdr|antifraude|split|liquid|conciliac|pix|boleto|cart[ãa]o)\b/i, categories: ["pagamentos"] },
  { keyword: /\b(founder|founders|founding|fundador)\b/i, categories: ["founder-led-growth"] },
  { keyword: /\b(opera[çc][ãa]o|operacional|caixa|fluxo|backoffice|backstage)\b/i, categories: ["operacao-real"] },
  { keyword: /\b(palco|pitch|deck|fake|vaidade|ego|aparenc|holofote|premia[çc])\b/i, categories: ["ego-startup", "mercado-fake"] },
  { keyword: /\b(vend(a|ed)|deal|fechamento|closing|cliente|prospec|funil|pipeline|sdr)\b/i, categories: ["vendas-b2b"] },
  { keyword: /\b(bastidor|cicatriz|porrada|cru|vivido|real)\b/i, categories: ["bastidor"] },
  { keyword: /\b(merc(ado|adol[oó]g))/i, categories: ["analise-mercado"] },
  { keyword: /\b(cr[ií]tic|confronto|polem|controv[eé]rs|discord|incom)\b/i, categories: ["critica-consenso"] },
  { keyword: /\b(social selling|conex[ãa]o|relacionamento|networking)\b/i, categories: ["social-selling"] },
  { keyword: /\b(desabafo|rant|frust|cansa(do|sa))\b/i, categories: ["founder-rant"] },
];

const ARCHETYPE_TO_CATEGORIES: Record<string, string[]> = {
  desabafo_de_founder: ["founder-rant", "bastidor", "founder-led-growth"],
  bastidor_de_operacao: ["bastidor", "operacao-real"],
  critica_ao_mercado: ["mercado-fake", "critica-consenso"],
  aprendizado_de_porrada: ["bastidor", "operacao-real"],
  post_anti_consenso: ["critica-consenso"],
  post_educativo_camuflado: ["analise-mercado"],
  historia_curta_com_virada: ["bastidor"],
  post_de_autoridade_sem_carteirada: ["analise-mercado"],
  social_selling_invisivel: ["social-selling", "vendas-b2b", "founder-led-growth"],
  analise_de_mercado_com_veneno: ["analise-mercado", "critica-consenso"],
  confissao_vulneravel_com_forca: ["bastidor", "founder-rant"],
  alerta_para_cliente: ["operacao-real"],
};

const HOOK_TO_CATEGORIES: Record<string, string[]> = {
  alerta_operacional: ["operacao-real", "hooks-criticos"],
  critica_ao_mercado: ["critica-consenso", "mercado-fake", "hooks-criticos"],
  bastidor_proibido: ["bastidor", "hooks-criticos"],
  confissao: ["bastidor", "founder-rant", "hooks-criticos"],
  verdade_desconfortavel: ["critica-consenso", "hooks-criticos"],
  ataque_elegante: ["critica-consenso", "hooks-criticos"],
  provocacao_seca: ["critica-consenso", "hooks-criticos"],
  pergunta_incomoda: ["hooks-criticos"],
  inversao_senso_comum: ["analise-mercado", "hooks-criticos"],
  observacao_social: ["analise-mercado"],
  opiniao_que_divide: ["critica-consenso"],
};

export interface AutoTagResult {
  categories: string[];
  autoTags: string[];
}

export function autoTagFromAnalysis(analysis: FullAnalysis): AutoTagResult {
  const categoriesSet = new Set<string>();
  const tagsSet = new Set<string>();

  // Archetype → categorias + tag
  const archetype = analysis.narrativeDNA.archetype;
  if (archetype) {
    tagsSet.add(`archetype:${archetype}`);
    for (const c of ARCHETYPE_TO_CATEGORIES[archetype] || []) categoriesSet.add(c);
  }

  // Hook type → categorias + tag
  const hookType = analysis.hookAnalysis.hookType;
  if (hookType) {
    tagsSet.add(`hook:${hookType}`);
    for (const c of HOOK_TO_CATEGORIES[hookType] || []) categoriesSet.add(c);
  }

  // Emoção dominante
  const emotion = (analysis.referenceAnalysis.emotionalDriver || "")
    .toLowerCase()
    .split(/[,.;\n]/)[0]
    .trim()
    .slice(0, 30);
  if (emotion) tagsSet.add(`emocao:${emotion}`);

  // Inimigo (se for nominal/curto)
  const enemy = (analysis.referenceAnalysis.enemy || "")
    .toLowerCase()
    .split(/[,.\n]/)[0]
    .trim();
  if (enemy && enemy.length < 50) tagsSet.add(`inimigo:${enemy}`);

  // Theme matching no corpus combinado
  const corpus = [
    analysis.referenceAnalysis.centralThesis,
    analysis.referenceAnalysis.audiencePain,
    analysis.referenceAnalysis.enemy,
    analysis.referenceAnalysis.beliefBeingAttacked,
    analysis.referenceAnalysis.beliefBeingBuilt,
    analysis.inspirationMap.reusablePrinciple,
    analysis.inspirationMap.marketConnection,
  ]
    .filter(Boolean)
    .join(" ");

  for (const { keyword, categories } of THEME_TO_CATEGORIES) {
    if (keyword.test(corpus)) {
      for (const c of categories) categoriesSet.add(c);
      const matchTerm = corpus.match(keyword)?.[0]?.toLowerCase().trim();
      if (matchTerm) tagsSet.add(`tema:${matchTerm}`);
    }
  }

  return {
    categories: [...categoriesSet],
    autoTags: [...tagsSet],
  };
}
