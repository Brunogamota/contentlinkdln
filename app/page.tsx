"use client";

import { useState } from "react";

type Mode = "polemico" | "viral" | "autoridade";

interface GeneratedContent {
  hook: string;
  post: string;
}

const MODES: { id: Mode; label: string; emoji: string; desc: string }[] = [
  { id: "polemico", label: "Polêmico", emoji: "🧨", desc: "Máxima provocação" },
  { id: "viral", label: "Viral", emoji: "🎯", desc: "Identificação em massa" },
  { id: "autoridade", label: "Autoridade", emoji: "🧠", desc: "Técnico e cirúrgico" },
];

const EXAMPLE_IDEAS = [
  "founder que posta rotina perfeita não consegue pagar a folha",
  "cliente que mais negocia preço é sempre o que mais dá problema",
  "startup levanta dinheiro pra esconder que não sabe vender",
  "o maior risco não é chargeback, é confiar em quem segura seu dinheiro",
  "empresa parece sólida até o dia que some dinheiro da conta",
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [selectedModes, setSelectedModes] = useState<Mode[]>(["polemico", "viral"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"hook" | "post" | "full" | null>(null);

  const toggleMode = (mode: Mode) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, modes: selectedModes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo deu errado. Tenta de novo.");
        return;
      }

      setResult(data);
    } catch {
      setError("Erro de conexão. Verifica a internet e tenta de novo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "hook" | "post" | "full") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullPost = result ? `${result.hook}\n\n${result.post}` : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-blue-400">content</span>link
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              gerador de conteúdo viral para LinkedIn
            </p>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full">
            founder mode
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Intro */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Transforma ideia bruta
            <br />
            <span className="text-white/30">em post que pega fogo.</span>
          </h2>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          {/* Idea Input */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">
              Ideia bruta
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="ex: cliente que mais negocia preço é sempre o que mais dá problema depois..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {EXAMPLE_IDEAS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setIdea(ex)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                  >
                    exemplo {i + 1}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/20 shrink-0 ml-4">{idea.length} chars</span>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">
              Modo
            </label>
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

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading || !idea.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm tracking-wide"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                gerando...
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs text-white/40 uppercase tracking-widest">
                Resultado
              </h3>
              <button
                onClick={() => copyToClipboard(fullPost, "full")}
                className="text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
              >
                {copied === "full" ? "copiado ✓" : "copiar tudo"}
              </button>
            </div>

            {/* Hook */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-blue-400/70 uppercase tracking-widest font-medium">
                  Hook
                </span>
                <button
                  onClick={() => copyToClipboard(result.hook, "hook")}
                  className="text-xs text-white/30 hover:text-white/70 transition-colors"
                >
                  {copied === "hook" ? "copiado ✓" : "copiar"}
                </button>
              </div>
              <p className="text-white font-semibold text-base leading-snug">
                {result.hook}
              </p>
            </div>

            {/* Post */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-blue-400/70 uppercase tracking-widest font-medium">
                  Post
                </span>
                <button
                  onClick={() => copyToClipboard(result.post, "post")}
                  className="text-xs text-white/30 hover:text-white/70 transition-colors"
                >
                  {copied === "post" ? "copiado ✓" : "copiar"}
                </button>
              </div>
              <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {result.post}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/20">
                  {result.post.length} chars · LinkedIn máx: 3.000
                </span>
                <span className={`text-xs ${result.post.length > 3000 ? "text-red-400" : "text-green-400/60"}`}>
                  {result.post.length > 3000 ? "muito longo" : "dentro do limite"}
                </span>
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-3 border border-white/10 hover:border-white/25 text-white/40 hover:text-white/70 text-sm rounded-xl transition-all disabled:cursor-not-allowed"
            >
              gerar outra versão
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 px-6 py-6">
        <div className="max-w-3xl mx-auto text-center text-xs text-white/20">
          feito pra founder que não tem tempo pra postar bonito
        </div>
      </footer>
    </div>
  );
}
