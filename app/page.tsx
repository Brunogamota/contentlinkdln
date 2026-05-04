"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNeuralContext } from "@/lib/neural/getNeuralContext";
import { getAllReferences } from "@/lib/neural/store";
import { getApiKey } from "@/lib/settings";
import { getDNA, getPillars, savePublishedPost } from "@/lib/founder-dna/store";
import { pickPillarForIdea } from "@/lib/founder-dna/pillars";
import { NeuralContext } from "@/lib/neural/types";
import { FounderDNA, ContentPillar } from "@/lib/founder-dna/types";
import { ApiKeyModal, ApiKeyButton } from "@/components/ApiKeyModal";
import { AdvancedPostConfigPanel } from "@/components/AdvancedPostConfig";
import { AdvancedPostConfig } from "@/lib/advanced-config/types";
import { getAdvancedConfig, saveAdvancedConfig } from "@/lib/advanced-config/store";
import { DEFAULT_CONFIG, resolveLengthRange } from "@/lib/advanced-config/defaults";

type Mode = "polemico" | "viral" | "autoridade";

interface GeneratedContent {
  hook: string;
  post: string;
  cta: string | null;
}

const MODES: { id: Mode; label: string; emoji: string; desc: string }[] = [
  { id: "polemico", label: "Polêmico", emoji: "🧨", desc: "Máxima provocação" },
  { id: "viral", label: "Viral", emoji: "🎯", desc: "Identificação em massa" },
  { id: "autoridade", label: "Autoridade", emoji: "🧠", desc: "Técnico e cirúrgico" },
];

const REFINE_OPTIONS = [
  { label: "mais cru", instruction: "deixa mais cru, mais direto, menos polido" },
  { label: "mais curto", instruction: "reduz pra metade do tamanho mantendo o impacto" },
  { label: "outro hook", instruction: "mantém o post mas troca completamente o hook" },
  { label: "+ polêmico", instruction: "aumenta a polêmica, mais provocador, menos filtro" },
  { label: "+ história", instruction: "incorpora uma micro-história concreta no meio" },
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [selectedModes, setSelectedModes] = useState<Mode[]>(["polemico", "viral"]);
  const [selectedPillar, setSelectedPillar] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"hook" | "post" | "cta" | "full" | null>(null);
  const [neuralCount, setNeuralCount] = useState(0);
  const [lastContext, setLastContext] = useState<NeuralContext | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [dna, setDNA] = useState<FounderDNA | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [published, setPublished] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedPostConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setNeuralCount(getAllReferences().length);
    setDNA(getDNA());
    setPillars(getPillars());
    setAdvancedConfig(getAdvancedConfig());
  }, []);

  const updateAdvancedConfig = (next: AdvancedPostConfig) => {
    setAdvancedConfig(next);
    saveAdvancedConfig(next);
  };

  const toggleMode = (mode: Mode) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const generate = async (refineInstruction?: string) => {
    if (!idea.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    if (refineInstruction) {
      setRefining(refineInstruction);
    } else {
      setLoading(true);
      setResult(null);
      setPublished(false);
    }
    setError("");

    const neuralContext = getNeuralContext(selectedModes, idea);
    const hasContext =
      neuralContext.dominantPatterns.length > 0 ||
      neuralContext.recommendedHookStyle !== "" ||
      neuralContext.referenceInsights.length > 0;

    setLastContext(hasContext ? neuralContext : null);

    const pillarId = selectedPillar || pickPillarForIdea(idea, selectedModes);
    const pillar = pillars.find((p) => p.id === pillarId);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          idea,
          modes: selectedModes,
          neuralContext: hasContext ? neuralContext : undefined,
          founderDNA: dna,
          pillar,
          refineInstruction,
          advancedConfig,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo deu errado. Tenta de novo.");
        return;
      }

      setResult(data);
      setPublished(false);
    } catch {
      setError("Erro de conexão. Verifica a internet e tenta de novo.");
    } finally {
      setLoading(false);
      setRefining(null);
    }
  };

  const copyToClipboard = async (text: string, type: "hook" | "post" | "cta" | "full") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const markAsPublished = () => {
    if (!result) return;
    const pillarId = selectedPillar || pickPillarForIdea(idea, selectedModes);
    savePublishedPost({
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      hook: result.hook,
      post: result.post,
      cta: result.cta ?? "",
      pillarId,
      publishedAt: new Date().toISOString(),
    });
    setPublished(true);
  };

  const fullPost = result
    ? result.cta
      ? `${result.hook}\n\n${result.post}\n\n${result.cta}`
      : `${result.hook}\n\n${result.post}`
    : "";

  const lengthRange = resolveLengthRange(advancedConfig);
  const postLen = result?.post.length ?? 0;
  const inRange = result ? postLen >= lengthRange.min && postLen <= lengthRange.max : true;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />

      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-blue-400">content</span>link
            </h1>
            <p className="text-xs text-white/30 mt-0.5">founder-led growth no LinkedIn</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ApiKeyButton onClick={() => setShowKeyModal(true)} />
            <NavLink href="/founder-dna" emoji="🧬" label="DNA" active={!!dna?.companyName} />
            <NavLink href="/neural-base" emoji="🧠" label="neural" badge={neuralCount} />
            <NavLink href="/series" emoji="📚" label="series" />
            <NavLink href="/pipeline" emoji="🎯" label="pipeline" />
            <NavLink href="/analyze" emoji="🔍" label="analisar" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Transforma ideia bruta
            <br />
            <span className="text-white/30">em pipeline pro seu negócio.</span>
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {dna?.companyName && (
              <span className="text-xs text-amber-400/70 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <span>🧬</span> DNA configurado: {dna.companyName}
              </span>
            )}
            {!dna?.companyName && (
              <Link
                href="/founder-dna"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse"
              >
                <span>⚠️</span> configure seu DNA primeiro
              </Link>
            )}
            {neuralCount > 0 && (
              <span className="text-xs text-purple-400/70 flex items-center gap-1.5 bg-purple-500/5 border border-purple-500/20 px-2.5 py-1 rounded-full">
                <span>🧠</span> {neuralCount} ref. neural
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">Ideia bruta</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="ex: cliente que mais negocia preço é sempre o que mais dá problema depois..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
            />
            <div className="text-right mt-1">
              <span className="text-xs text-white/20">{idea.length} chars</span>
            </div>
          </div>

          {/* Pillar selection */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">
              Pilar estratégico <span className="text-white/20 normal-case">— deixa em auto pra IA decidir</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                onClick={() => setSelectedPillar("")}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedPillar === ""
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
                }`}
              >
                ✨ auto
              </button>
              {pillars.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillar(p.id)}
                  title={p.description}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedPillar === p.id
                      ? "bg-blue-500/15 border-blue-500/50 text-blue-300"
                      : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20"
                  }`}
                >
                  {p.emoji} {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">Modo</label>
            <div className="flex gap-3">
              {MODES.map((mode) => {
                const active = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? "bg-blue-500/15 border-blue-500/50 text-blue-300"
                        : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    <div className="text-lg mb-1">{mode.emoji}</div>
                    <div>{mode.label}</div>
                    <div className={`text-xs mt-0.5 ${active ? "text-blue-400/70" : "text-white/25"}`}>
                      {mode.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Config */}
          <AdvancedPostConfigPanel config={advancedConfig} onChange={updateAdvancedConfig} />

          <button
            onClick={() => generate()}
            disabled={loading || !idea.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm tracking-wide"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                gerando com {dna?.companyName ? "DNA" : "modo padrão"}...
              </span>
            ) : (
              "gerar post"
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        {result && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs text-white/40 uppercase tracking-widest">Resultado</h3>
                {dna?.companyName && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    🧬 DNA ativo
                  </span>
                )}
                {lastContext && (
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    🧠 base neural
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(fullPost, "full")}
                  className="text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
                >
                  {copied === "full" ? "copiado ✓" : "copiar tudo"}
                </button>
                <button
                  onClick={markAsPublished}
                  disabled={published}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    published
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  }`}
                >
                  {published ? "✓ no pipeline" : "marcar publicado"}
                </button>
              </div>
            </div>

            {/* Hook */}
            <Block label="Hook" color="blue" copied={copied === "hook"} onCopy={() => copyToClipboard(result.hook, "hook")}>
              <p className="text-white font-semibold text-base leading-snug">{result.hook}</p>
            </Block>

            {/* Post */}
            <Block label="Post" color="blue" copied={copied === "post"} onCopy={() => copyToClipboard(result.post, "post")}>
              <div className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{result.post}</div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-white/40">
                  {postLen.toLocaleString("pt-BR")} caracteres
                  <span className="text-white/20 ml-2">
                    · alvo {lengthRange.min}–{lengthRange.max}
                    {advancedConfig.hardLimit && <span className="text-amber-400/70 ml-1">(rígido)</span>}
                  </span>
                </span>
                <span
                  className={
                    inRange
                      ? "text-green-400/80"
                      : advancedConfig.hardLimit
                      ? "text-red-400"
                      : "text-amber-400/80"
                  }
                >
                  {inRange ? "dentro do range ✓" : "fora do range"}
                </span>
              </div>
            </Block>

            {/* CTA — só renderiza se houver */}
            {result.cta && (
              <Block label="CTA Magnético" color="green" copied={copied === "cta"} onCopy={() => copyToClipboard(result.cta!, "cta")}>
                <p className="text-white/90 text-sm leading-relaxed">{result.cta}</p>
              </Block>
            )}

            <div className="mt-2">
              <span className="text-xs text-white/30 uppercase tracking-widest mb-2 block">refinar</span>
              <div className="flex flex-wrap gap-2">
                {REFINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => generate(opt.instruction)}
                    disabled={loading || refining !== null}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-white/50 hover:text-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {refining === opt.instruction ? "..." : opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => generate()}
              disabled={loading}
              className="w-full py-3 border border-white/10 hover:border-white/25 text-white/40 hover:text-white/70 text-sm rounded-xl transition-all disabled:cursor-not-allowed"
            >
              gerar outra versão do zero
            </button>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 px-6 py-6">
        <div className="max-w-3xl mx-auto text-center text-xs text-white/20">
          founder-led growth, sem agência, sem coach
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  emoji,
  label,
  badge,
  active,
}: {
  href: string;
  emoji: string;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg transition-all ${
        active
          ? "border-amber-500/40 text-amber-400 bg-amber-500/5"
          : "border-white/10 text-white/40 hover:text-white/80 hover:border-white/25"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}

function Block({
  label,
  color,
  copied,
  onCopy,
  children,
}: {
  label: string;
  color: "blue" | "green";
  copied: boolean;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  const accent = color === "blue" ? "text-blue-400/70" : "text-green-400/70";
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs ${accent} uppercase tracking-widest font-medium`}>{label}</span>
        <button onClick={onCopy} className="text-xs text-white/30 hover:text-white/70 transition-colors">
          {copied ? "copiado ✓" : "copiar"}
        </button>
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
