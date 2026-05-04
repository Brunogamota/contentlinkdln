export interface AuthorDNA {
  name: string;
  age: number;
  company: string;
  forbiddenPatterns: string[];
  preferredExpressions: string[];
  themes: string[];
  philosophy: string[];
  tone: {
    directness: number;
    rawness: number;
    technicality: number;
    antiCorporate: number;
    founderEnergy: number;
  };
}

export const BRUNO_AUTHOR_DNA: AuthorDNA = {
  name: "Bruno Mota",
  age: 23,
  company: "Reborn",
  forbiddenPatterns: [
    "no final do dia",
    "a verdade é que",
    "o que ninguém te conta",
    "aprendi da pior forma",
    "ninguém fala sobre",
    "ninguém fala disso",
    "isso me ensinou",
    "aprendi que",
    "jornada",
    "propósito",
    "resiliência",
    "conexão genuína",
    "consistência é tudo",
    "não é sobre",
    "transformação",
    "impacto",
    "ecossistema",
    "mindset",
    "protagonismo",
    "escala",
  ],
  preferredExpressions: [
    "mano",
    "tipo",
    "a real é que",
    "isso aqui parece detalhe, mas não é",
    "o mercado finge que isso não existe",
    "bonito no pitch, feio no extrato",
    "taxa baixa não salva venda negada",
    "pagamento é onde o dinheiro some",
    "ninguém fala isso porque dá trabalho explicar",
    "o que parece pequeno é onde a empresa quebra",
  ],
  themes: [
    "pagamentos",
    "founder-led growth",
    "operação real",
    "mercado fake",
    "chargeback",
    "fallback",
    "adquirente",
    "split",
    "liquidação",
    "conciliação",
    "venda negada",
    "ego de founder",
    "startup de palco",
    "cliente ruim",
    "MDR",
    "antifraude",
    "PIX que sumiu",
    "boleto que ninguém pagou",
  ],
  philosophy: [
    "Pagamentos não é detalhe. É onde o dinheiro some.",
    "Taxa baixa não salva operação ruim.",
    "O problema nunca é o que aparece. É o invisível.",
    "Venda negada > taxa baixa.",
    "Fallback inexistente é caixa morrendo silenciosamente.",
    "Chargeback come margem. Antifraude ruim mata empresa.",
    "Adquirente travando = empresa parando sem aviso.",
  ],
  tone: {
    directness: 9,
    rawness: 8,
    technicality: 7,
    antiCorporate: 10,
    founderEnergy: 10,
  },
};
