import { AntiAIReport } from "./types";
import { BRUNO_AUTHOR_DNA } from "@/lib/author-dna/bruno";

const STRUCTURAL_PATTERNS: { regex: RegExp; label: string; weight: number }[] = [
  { regex: /\bn[ãa]o é\s+(sobre|um|uma)\b/gi, label: '"não é sobre X" pattern', weight: 1.2 },
  { regex: /\b(jornada|propósito|resiliência|protagonismo|ecossistema|mindset|transformação|impacto)\b/gi, label: "palavra genérica de LinkedIn", weight: 1.5 },
  { regex: /\bno final do dia\b/gi, label: '"no final do dia"', weight: 2 },
  { regex: /\b(a verdade é|aprendi (que|da pior)|isso me ensinou)\b/gi, label: "abertura genérica de IA", weight: 2 },
  { regex: /\bo que ningu[ée]m (te conta|fala)\b/gi, label: "clichê de viral", weight: 2 },
  { regex: /\bconsist[êe]ncia é tudo\b/gi, label: '"consistência é tudo"', weight: 2 },
  { regex: /\bconex[ãa]o (genu[íi]na|verdadeira)\b/gi, label: "conexão genuína", weight: 2 },
];

export function validateAntiAI(text: string): AntiAIReport {
  const detected: string[] = [];
  let score = 0;

  // Forbidden patterns from Bruno DNA
  const lower = text.toLowerCase();
  for (const pattern of BRUNO_AUTHOR_DNA.forbiddenPatterns) {
    if (lower.includes(pattern.toLowerCase())) {
      detected.push(`palavra proibida: "${pattern}"`);
      score += 1.5;
    }
  }

  // Structural / regex patterns
  for (const sp of STRUCTURAL_PATTERNS) {
    const matches = text.match(sp.regex);
    if (matches && matches.length > 0) {
      detected.push(`${sp.label} (${matches.length}x)`);
      score += sp.weight * matches.length;
    }
  }

  // Excesso de "não é X, é Y" — padrão clássico de IA
  const naoEYPattern = (text.match(/\bn[ãa]o é\s+\S+[,.]?\s+é\b/gi) || []).length;
  if (naoEYPattern >= 2) {
    detected.push(`uso excessivo do padrão "não é X, é Y" (${naoEYPattern}x)`);
    score += naoEYPattern * 1.5;
  }

  // Texto perfeito demais: parágrafos muito uniformes
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 4) {
    const lengths = paragraphs.map((p) => p.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
    const stdev = Math.sqrt(variance);
    if (avg > 80 && stdev / avg < 0.25) {
      detected.push("parágrafos com tamanho uniforme demais (texto sintético)");
      score += 1.5;
    }
  }

  const finalScore = Math.min(10, Math.round(score * 10) / 10);

  return {
    aiRiskScore: finalScore,
    detectedPatterns: detected,
    rewriteRequired: finalScore > 6,
  };
}

export function buildAntiAIRewriteInstruction(report: AntiAIReport): string {
  const detected = report.detectedPatterns.length > 0 ? report.detectedPatterns.join(" · ") : "estrutura geral muito sintética";
  return `Reescreva este texto removendo qualquer cara de IA. Detectados: ${detected}. Quebre ritmo, adicione especificidade (números, nomes próprios genéricos, exemplos operacionais), traga imperfeição humana (frase quebrada, pensamento solto, virada brusca). NÃO use nenhuma das palavras detectadas. Mantenha o hook e o CTA. Retorne o mesmo JSON.`;
}
