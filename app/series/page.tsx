"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKey } from "@/lib/settings";
import { getDNA, getPillars, savePublishedPost } from "@/lib/founder-dna/store";
import { FounderDNA, ContentPillar, SeriesPost } from "@/lib/founder-dna/types";
import { ApiKeyModal, ApiKeyButton } from "@/components/ApiKeyModal";

interface SeriesResult {
  narrativeArc: string;
  posts: SeriesPost[];
}

export default function SeriesPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SeriesResult | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [dna, setDNA] = useState<FounderDNA | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [publishedSet, setPublishedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    setDNA(getDNA());
    setPillars(getPillars());
  }, []);

  const generate = async () => {
    if (!topic.trim()) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setPublishedSet(new Set());

    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ topic, founderDNA: dna }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gerar série.");
        return;
      }
      setResult(data);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const copyPost = async (idx: number, post: SeriesPost) => {
    const text = `${post.hook}\n\n${post.post}\n\n${post.cta}`;
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const markPublished = (idx: number, post: SeriesPost) => {
    savePublishedPost({
      id: `post_${Date.now()}_${idx}`,
      hook: post.hook,
      post: post.post,
      cta: post.cta,
      pillarId: post.pillarId,
      publishedAt: new Date().toISOString(),
    });
    setPublishedSet((prev) => new Set(prev).add(idx));
  };

  const pillarBy = (id: string) => pillars.find((p) => p.id === id);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />

      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-blue-400">📚</span> series mode
              </h1>
              <p className="text-xs text-white/25 mt-0.5">7 posts conectados, 2 semanas de autoridade</p>
            </div>
          </div>
          <ApiKeyButton onClick={() => setShowKeyModal(true)} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Construa autoridade em arco.</h2>
          <p className="text-sm text-white/40 mt-2">
            Founder bom não posta aleatório. Posta arco narrativo que prende a audiência por semanas.{" "}
            <span className="text-white/70">Aqui você gera 7 posts conectados em 1 click.</span>
          </p>
        </div>

        {!dna?.companyName && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm text-amber-300">
              ⚠️ Configure o{" "}
              <Link href="/founder-dna" className="underline">
                Founder DNA
              </Link>{" "}
              primeiro — sem ele a série fica genérica.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs text-white/40 uppercase tracking-widest">Tópico central da série</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ex: como fechei R$ 200k em 90 dias usando só LinkedIn — e o que eu fiz diferente"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
          />
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
          >
            {loading ? "construindo arco narrativo (45-60s)..." : "gerar série de 7 posts"}
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

        {result && (
          <div className="space-y-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400/70 uppercase tracking-widest mb-2">Arco narrativo</p>
              <p className="text-sm text-white/85">{result.narrativeArc}</p>
            </div>

            {result.posts.map((post, idx) => {
              const pillar = pillarBy(post.pillarId);
              const isExpanded = expandedIdx === idx;
              const isPublished = publishedSet.has(idx);
              return (
                <div
                  key={idx}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    isPublished
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-white/[0.03] border-white/[0.08]"
                  }`}
                >
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xs bg-white/10 text-white/70 w-6 h-6 rounded-full flex items-center justify-center font-bold">
                        {post.position}
                      </span>
                      {pillar && (
                        <span className="text-xs text-white/40">
                          {pillar.emoji} {pillar.name}
                        </span>
                      )}
                      <span className="text-sm text-white/85 font-medium truncate max-w-md">
                        {post.hook}
                      </span>
                    </div>
                    <span className="text-xs text-white/30">{isExpanded ? "−" : "+"}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                      <div>
                        <p className="text-xs text-blue-400/70 uppercase tracking-widest mb-1">Hook</p>
                        <p className="text-white font-semibold">{post.hook}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-400/70 uppercase tracking-widest mb-1">Post</p>
                        <div className="text-white/85 text-sm whitespace-pre-wrap leading-relaxed">{post.post}</div>
                      </div>
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-widest mb-1">CTA</p>
                        <p className="text-white/90 text-sm">{post.cta}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => copyPost(idx, post)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all"
                        >
                          {copiedIdx === idx ? "copiado ✓" : "copiar post"}
                        </button>
                        <button
                          onClick={() => markPublished(idx, post)}
                          disabled={isPublished}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            isPublished
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          }`}
                        >
                          {isPublished ? "✓ no pipeline" : "marcar publicado"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
