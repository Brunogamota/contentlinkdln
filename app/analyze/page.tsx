"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKey } from "@/lib/settings";
import { getDNA } from "@/lib/founder-dna/store";
import { FounderDNA } from "@/lib/founder-dna/types";
import { ApiKeyModal, ApiKeyButton } from "@/components/ApiKeyModal";

interface Analysis {
  overallScore: number;
  icpAlignment: number;
  whatWorks: string[];
  whatKills: string[];
  icpGap: string;
  missingPillars: string[];
  weakHooks: string[];
  strongerHooks: string[];
  topActions: string[];
  verdict: string;
}

export default function AnalyzePage() {
  const [posts, setPosts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [dna, setDNA] = useState<FounderDNA | null>(null);

  useEffect(() => {
    setDNA(getDNA());
  }, []);

  const analyze = async () => {
    if (posts.trim().length < 100) {
      setError("Cole pelo menos 1-2 posts seus (mín 100 chars)");
      return;
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ posts, founderDNA: dna }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao analisar.");
        return;
      }
      setResult(data);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />

      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-blue-400">🔍</span> análise do LinkedIn
              </h1>
              <p className="text-xs text-white/25 mt-0.5">descobre o que tá te segurando</p>
            </div>
          </div>
          <ApiKeyButton onClick={() => setShowKeyModal(true)} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise crua dos seus posts.</h2>
          <p className="text-sm text-white/40 mt-2">
            Cola seus últimos 5-10 posts (separados por <code className="text-white/60">---</code>) e a IA mostra: o que tá funcionando, o que tá matando engajamento, gap pro ICP, e ações pra esta semana.
          </p>
        </div>

        {!dna?.companyName && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-300">
              ⚠️ Configure o{" "}
              <Link href="/founder-dna" className="underline">
                Founder DNA
              </Link>{" "}
              primeiro — sem ele a análise não consegue medir alinhamento com seu ICP.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs text-white/40 uppercase tracking-widest">Seus posts (separados por ---)</label>
          <textarea
            value={posts}
            onChange={(e) => setPosts(e.target.value)}
            placeholder={`Cole o texto completo dos seus últimos posts. Ex:\n\nPost 1 aqui...\n\n---\n\nPost 2 aqui...\n\n---\n\nPost 3 aqui...`}
            rows={12}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-blue-500/50 transition-all font-mono"
          />
          <div className="text-right">
            <span className="text-xs text-white/30">{posts.length} chars</span>
          </div>
          <button
            onClick={analyze}
            disabled={loading || posts.trim().length < 100}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
          >
            {loading ? "analisando..." : "analisar agora"}
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard label="Score geral" value={result.overallScore} color="blue" />
              <ScoreCard label="Alinhamento com ICP" value={result.icpAlignment} color="purple" />
            </div>

            <Section title="🔥 Veredicto" tone="alert">
              <p className="text-white/90 text-sm leading-relaxed">{result.verdict}</p>
            </Section>

            <Section title="✅ O que está funcionando" tone="success">
              <ul className="space-y-2">
                {result.whatWorks.map((w, i) => (
                  <li key={i} className="text-sm text-white/80 flex gap-2">
                    <span className="text-green-400 shrink-0">→</span> {w}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="❌ O que está matando engajamento" tone="danger">
              <ul className="space-y-2">
                {result.whatKills.map((w, i) => (
                  <li key={i} className="text-sm text-white/80 flex gap-2">
                    <span className="text-red-400 shrink-0">→</span> {w}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="🎯 Gap com ICP" tone="warn">
              <p className="text-sm text-white/80 leading-relaxed">{result.icpGap}</p>
            </Section>

            {result.missingPillars.length > 0 && (
              <Section title="📌 Pilares negligenciados" tone="warn">
                <div className="flex flex-wrap gap-2">
                  {result.missingPillars.map((p, i) => (
                    <span key={i} className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {result.weakHooks.length > 0 && (
              <Section title="🪝 Hooks fracos identificados" tone="danger">
                <ul className="space-y-2">
                  {result.weakHooks.map((h, i) => (
                    <li key={i} className="text-sm text-white/70 italic">"{h}"</li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="🎣 Hooks alternativos fortes" tone="success">
              <div className="space-y-2">
                {result.strongerHooks.map((h, i) => (
                  <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white/85">
                    {h}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="🚀 Top 3 ações para essa semana" tone="alert">
              <ol className="space-y-3">
                {result.topActions.map((a, i) => (
                  <li key={i} className="text-sm text-white/85 flex gap-3">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span> {a}
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreCard({ label, value, color }: { label: string; value: number; color: "blue" | "purple" }) {
  const accent = color === "blue" ? "text-blue-400" : "text-purple-400";
  const bar = color === "blue" ? "bg-blue-500" : "bg-purple-500";
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
        <div className={`h-full ${bar} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: "success" | "danger" | "warn" | "alert"; children: React.ReactNode }) {
  const borderColor = {
    success: "border-green-500/20",
    danger: "border-red-500/20",
    warn: "border-amber-500/20",
    alert: "border-blue-500/20",
  }[tone];
  return (
    <div className={`bg-white/[0.02] border ${borderColor} rounded-xl p-5`}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}
