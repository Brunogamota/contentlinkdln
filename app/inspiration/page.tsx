"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKey } from "@/lib/settings";
import { ApiKeyModal, ApiKeyButton } from "@/components/ApiKeyModal";
import {
  ReferenceInput,
  FullAnalysis,
  AngleOption,
  GeneratedPost,
  PostConfig,
  SavedInspiration,
  RefineAction,
  ProximityToReference,
  CtaMode,
  OutputLengthOption,
  PostIntensity,
  PostTone,
  TargetAudience,
} from "@/lib/inspiration/types";
import {
  getAllInspirations,
  saveInspiration,
  deleteInspiration,
  newInspirationId,
  setInspirationStatus,
} from "@/lib/inspiration/store";
import { getRefineLabel } from "@/lib/inspiration/prompts/refine";
import { autoTagFromAnalysis } from "@/lib/brain/autoTagger";

type Tab = "reference" | "analysis" | "angles" | "editor" | "library";

const REFINE_ACTIONS: RefineAction[] = [
  "more_bruno",
  "less_ai",
  "more_aggressive",
  "more_elegant",
  "more_direct",
  "more_storytelling",
  "more_market_pain",
  "add_reborn",
  "remove_reborn",
  "shorter",
  "expand",
  "new_hooks",
  "new_angle",
];

export default function InspirationPage() {
  const [tab, setTab] = useState<Tab>("reference");
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Reference state
  const [referenceText, setReferenceText] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceAuthor, setReferenceAuthor] = useState("");
  const [userIntent, setUserIntent] = useState("");
  const [targetTopic, setTargetTopic] = useState("");
  const [desiredAngle, setDesiredAngle] = useState("");
  const [intensityLevel, setIntensityLevel] = useState(7);
  const [outputLength, setOutputLength] = useState<OutputLengthOption>(2000);
  const [customLength, setCustomLength] = useState(1500);
  const [proximity, setProximity] = useState<ProximityToReference>("media");
  const [ctaMode, setCtaMode] = useState<CtaMode>("indireto");
  const [tone, setTone] = useState<PostTone>("bastidor");
  const [postIntensity, setPostIntensity] = useState<PostIntensity>("forte");
  const [audience, setAudience] = useState<TargetAudience>("founders");
  const [imageUploading, setImageUploading] = useState(false);

  // Pipeline state
  const [currentInspirationId, setCurrentInspirationId] = useState<string | null>(null);
  const [reference, setReference] = useState<ReferenceInput | null>(null);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [angles, setAngles] = useState<AngleOption[] | null>(null);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [post, setPost] = useState<GeneratedPost | null>(null);

  // Library state
  const [library, setLibrary] = useState<SavedInspiration[]>([]);

  // Loading states
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingAngles, setGeneratingAngles] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [refining, setRefining] = useState<RefineAction | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"hook" | "post" | "cta" | "full" | null>(null);

  useEffect(() => {
    setLibrary(getAllInspirations());
  }, []);

  /* ----------------------------- helpers ----------------------------- */

  const persistCurrent = (
    updates: Partial<SavedInspiration> & { reference: ReferenceInput }
  ) => {
    const id = currentInspirationId ?? newInspirationId();
    if (!currentInspirationId) setCurrentInspirationId(id);
    const existing = library.find((i) => i.id === id);
    const finalAnalysis = updates.analysis ?? existing?.analysis;

    // Auto-tag sempre que houver análise (recalcula ao atualizar)
    let autoTags = existing?.autoTags ?? [];
    let categories = existing?.categories ?? [];
    if (finalAnalysis) {
      const tagged = autoTagFromAnalysis(finalAnalysis);
      autoTags = tagged.autoTags;
      // mantém categorias manuais já adicionadas + adiciona auto
      categories = Array.from(new Set([...(existing?.categories ?? []), ...tagged.categories]));
    }

    const merged: SavedInspiration = {
      id,
      reference: updates.reference,
      analysis: finalAnalysis,
      angles: updates.angles ?? existing?.angles,
      selectedAngleId: updates.selectedAngleId ?? existing?.selectedAngleId,
      finalPost: updates.finalPost ?? existing?.finalPost,
      status: updates.status ?? existing?.status ?? "novo",
      tags: updates.tags ?? existing?.tags ?? [],
      categories,
      autoTags,
      manualTags: existing?.manualTags ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInspiration(merged);
    setLibrary(getAllInspirations());
    return id;
  };

  const buildReferenceFromInputs = (): ReferenceInput | null => {
    const content = referenceText.trim();
    if (!content || content.length < 30) {
      setError("Cole o texto da referência (mín 30 caracteres).");
      return null;
    }
    return {
      id: currentInspirationId ?? newInspirationId(),
      type: referenceUrl ? "link" : "text",
      rawContent: content,
      extractedText: content,
      sourceUrl: referenceUrl || undefined,
      author: referenceAuthor || undefined,
      userIntent,
      targetTopic,
      desiredAngle: desiredAngle || undefined,
      intensityLevel,
      outputLength,
      customLength: outputLength === "custom" ? customLength : undefined,
      proximityToReference: proximity,
      ctaMode,
      createdAt: new Date().toISOString(),
    };
  };

  /* ------------------------------ actions ----------------------------- */

  const handleImageUpload = async (file: File) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setImageUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/inspiration/extract-image", {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao extrair imagem.");
        return;
      }
      if (data.text && data.text.length > 0) {
        setReferenceText((prev) => (prev ? `${prev}\n\n---\n\n${data.text}` : data.text));
      } else {
        setError("Nenhum texto detectado na imagem.");
      }
    } catch {
      setError("Erro ao subir imagem.");
    } finally {
      setImageUploading(false);
    }
  };

  const runAnalyze = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    const ref = buildReferenceFromInputs();
    if (!ref) return;
    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    setAngles(null);
    setPost(null);
    setReference(ref);
    try {
      const res = await fetch("/api/inspiration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ reference: ref }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha na análise.");
        return;
      }
      setAnalysis(data);
      persistCurrent({ reference: ref, analysis: data, status: "analisado" });
      setTab("analysis");
    } catch {
      setError("Erro de conexão na análise.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAngles = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    if (!reference || !analysis) return;
    setGeneratingAngles(true);
    setError("");
    setAngles(null);
    try {
      const res = await fetch("/api/inspiration/angles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ reference, analysis }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar ângulos.");
        return;
      }
      setAngles(data.angles);
      persistCurrent({ reference, analysis, angles: data.angles });
      setTab("angles");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setGeneratingAngles(false);
    }
  };

  const runGeneratePost = async (angle: AngleOption) => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    if (!reference || !analysis) return;
    setGeneratingPost(true);
    setError("");
    setSelectedAngleId(angle.id);
    setPost(null);
    const config: PostConfig = {
      outputLength,
      customLength: outputLength === "custom" ? customLength : undefined,
      intensity: postIntensity,
      tone,
      cta: ctaMode,
      proximityToReference: proximity,
      targetAudience: audience,
    };
    try {
      const res = await fetch("/api/inspiration/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ reference, analysis, angle, config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar post.");
        return;
      }
      setPost(data);
      persistCurrent({
        reference,
        analysis,
        angles: angles ?? undefined,
        selectedAngleId: angle.id,
        finalPost: data,
        status: "usado",
      });
      setTab("editor");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setGeneratingPost(false);
    }
  };

  const runRefine = async (action: RefineAction) => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    if (!post) return;
    setRefining(action);
    setError("");
    try {
      const res = await fetch("/api/inspiration/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ post, action, reference }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha no refino.");
        return;
      }
      setPost(data);
      if (reference) {
        persistCurrent({
          reference,
          analysis: analysis!,
          angles: angles ?? undefined,
          selectedAngleId: selectedAngleId ?? undefined,
          finalPost: data,
        });
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setRefining(null);
    }
  };

  const swapHook = (newHook: string) => {
    if (!post) return;
    setPost({ ...post, hook: newHook });
  };

  const copyToClipboard = async (text: string, type: "hook" | "post" | "cta" | "full") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadFromLibrary = (insp: SavedInspiration) => {
    setCurrentInspirationId(insp.id);
    setReference(insp.reference);
    setReferenceText(insp.reference.rawContent);
    setReferenceUrl(insp.reference.sourceUrl ?? "");
    setReferenceAuthor(insp.reference.author ?? "");
    setUserIntent(insp.reference.userIntent);
    setTargetTopic(insp.reference.targetTopic);
    setDesiredAngle(insp.reference.desiredAngle ?? "");
    setIntensityLevel(insp.reference.intensityLevel);
    setOutputLength(insp.reference.outputLength);
    setCustomLength(insp.reference.customLength ?? 1500);
    setProximity(insp.reference.proximityToReference);
    setCtaMode(insp.reference.ctaMode);
    setAnalysis(insp.analysis ?? null);
    setAngles(insp.angles ?? null);
    setSelectedAngleId(insp.selectedAngleId ?? null);
    setPost(insp.finalPost ?? null);
    if (insp.finalPost) setTab("editor");
    else if (insp.angles) setTab("angles");
    else if (insp.analysis) setTab("analysis");
    else setTab("reference");
  };

  const handleDeleteFromLibrary = (id: string) => {
    if (!confirm("Deletar essa inspiração do histórico?")) return;
    deleteInspiration(id);
    setLibrary(getAllInspirations());
    if (currentInspirationId === id) {
      setCurrentInspirationId(null);
      setReference(null);
      setAnalysis(null);
      setAngles(null);
      setPost(null);
    }
  };

  const fullPost = post
    ? post.cta
      ? `${post.hook}\n\n${post.post}\n\n${post.cta}`
      : `${post.hook}\n\n${post.post}`
    : "";

  /* ------------------------------ render ----------------------------- */

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-purple-400">⚡</span> inspiration engine
              </h1>
              <p className="text-xs text-white/25 mt-0.5">engenharia reversa criativa — input estratégico, output autoral</p>
            </div>
          </div>
          <ApiKeyButton onClick={() => setShowKeyModal(true)} />
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 sticky top-[72px] bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          <TabBtn id="reference" label="1. referência" active={tab === "reference"} onClick={() => setTab("reference")} />
          <TabBtn id="analysis" label="2. análise" active={tab === "analysis"} onClick={() => setTab("analysis")} disabled={!analysis} />
          <TabBtn id="angles" label="3. ideias" active={tab === "angles"} onClick={() => setTab("angles")} disabled={!angles} badge={angles?.length} />
          <TabBtn id="editor" label="4. editor" active={tab === "editor"} onClick={() => setTab("editor")} disabled={!post} />
          <TabBtn id="library" label="5. biblioteca" active={tab === "library"} onClick={() => setTab("library")} badge={library.length} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* TAB 1: REFERENCE */}
        {tab === "reference" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Cola a referência.</h2>
              <p className="text-sm text-white/40 mt-2">
                Texto, print ou link. A inspiração é INPUT estratégico — o que sair daqui vai ser autoral, não cópia.
              </p>
            </div>

            <FieldGroup label="Texto da referência (post de outro autor)">
              <textarea
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="Cola o texto integral do post que te inspirou..."
                rows={10}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-y focus:outline-none focus:border-purple-500/50"
              />
              <div className="flex items-center justify-between text-xs text-white/30 mt-1">
                <span>{referenceText.length} caracteres</span>
                <label className="cursor-pointer text-purple-400/70 hover:text-purple-300">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  {imageUploading ? "extraindo..." : "📷 enviar print"}
                </label>
              </div>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="URL do post (opcional)">
                <input
                  type="text"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://linkedin.com/posts/..."
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Autor original (opcional)">
                <input
                  type="text"
                  value={referenceAuthor}
                  onChange={(e) => setReferenceAuthor(e.target.value)}
                  placeholder="ex: Founder X"
                  className={inputClass}
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Sua intenção" hint="o que você quer fazer com essa inspiração">
              <input
                type="text"
                value={userIntent}
                onChange={(e) => setUserIntent(e.target.value)}
                placeholder="ex: bater no mesmo ponto mas trazendo realidade de pagamentos"
                className={inputClass}
              />
            </FieldGroup>

            <FieldGroup label="Tópico-alvo do novo post" hint="sobre o que VOCÊ vai escrever">
              <input
                type="text"
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                placeholder="ex: founder que economiza em adquirente e perde 3x mais em chargeback"
                className={inputClass}
              />
            </FieldGroup>

            <FieldGroup label="Ângulo desejado (opcional)">
              <input
                type="text"
                value={desiredAngle}
                onChange={(e) => setDesiredAngle(e.target.value)}
                placeholder="ex: ataque a uma prática comum do mercado"
                className={inputClass}
              />
            </FieldGroup>

            <details className="group border border-white/10 rounded-xl overflow-hidden">
              <summary className="cursor-pointer px-5 py-3 text-sm text-white/70 hover:text-white flex items-center justify-between">
                <span>configurações do post (tamanho, tom, intensidade, audiência, CTA)</span>
                <span className="group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                <SegField<OutputLengthOption>
                  label="Tamanho"
                  value={outputLength}
                  onChange={setOutputLength}
                  options={[
                    { value: 1000, label: "1000 pal" },
                    { value: 2000, label: "2000 pal" },
                    { value: 3000, label: "3000 pal" },
                    { value: 5000, label: "5000 pal" },
                    { value: "custom", label: "custom" },
                  ]}
                />
                {outputLength === "custom" && (
                  <input
                    type="number"
                    min={300}
                    max={10000}
                    value={customLength}
                    onChange={(e) => setCustomLength(parseInt(e.target.value, 10) || 1500)}
                    className={inputClass}
                  />
                )}
                <SegField<PostIntensity>
                  label="Intensidade"
                  value={postIntensity}
                  onChange={setPostIntensity}
                  options={[
                    { value: "leve", label: "leve" },
                    { value: "medio", label: "médio" },
                    { value: "forte", label: "forte" },
                    { value: "brutal", label: "brutal" },
                  ]}
                />
                <SegField<PostTone>
                  label="Tom"
                  value={tone}
                  onChange={setTone}
                  options={[
                    { value: "desabafo", label: "desabafo" },
                    { value: "bastidor", label: "bastidor" },
                    { value: "polemico", label: "polêmico" },
                    { value: "educativo", label: "educativo" },
                    { value: "storytelling", label: "storytelling" },
                    { value: "social_selling_sutil", label: "social selling sutil" },
                    { value: "analise_mercado", label: "análise de mercado" },
                  ]}
                />
                <SegField<TargetAudience>
                  label="Audiência"
                  value={audience}
                  onChange={setAudience}
                  options={[
                    { value: "founders", label: "founders" },
                    { value: "sellers", label: "sellers" },
                    { value: "executivos", label: "executivos" },
                    { value: "mercado_pagamentos", label: "mercado pagamentos" },
                    { value: "geral", label: "geral" },
                  ]}
                />
                <SegField<ProximityToReference>
                  label="Proximidade da referência"
                  value={proximity}
                  onChange={setProximity}
                  options={[
                    { value: "baixa", label: "baixa" },
                    { value: "media", label: "média" },
                    { value: "alta", label: "alta" },
                  ]}
                />
                <SegField<CtaMode>
                  label="CTA"
                  value={ctaMode}
                  onChange={setCtaMode}
                  options={[
                    { value: "sem_cta", label: "sem CTA" },
                    { value: "indireto", label: "indireto" },
                    { value: "reborn", label: "Reborn sutil" },
                    { value: "comentario", label: "comentário" },
                    { value: "reflexao", label: "reflexão" },
                  ]}
                />
              </div>
            </details>

            <button
              onClick={runAnalyze}
              disabled={analyzing || referenceText.trim().length < 30}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
              {analyzing ? "analisando referência..." : "→ analisar referência"}
            </button>
          </div>
        )}

        {/* TAB 2: ANALYSIS */}
        {tab === "analysis" && analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Diagnóstico estratégico.</h2>
                <p className="text-sm text-white/40 mt-1">DNA invisível da referência decodificado.</p>
              </div>
              <button
                onClick={runAngles}
                disabled={generatingAngles}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-white/30 text-white font-semibold rounded-xl text-sm"
              >
                {generatingAngles ? "gerando 15 ângulos..." : "→ gerar 15 ângulos"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AnalysisCard title="🎯 Tese central" content={analysis.referenceAnalysis.centralThesis} />
              <AnalysisCard title="⚡ Tensão escondida" content={analysis.referenceAnalysis.hiddenTension} />
              <AnalysisCard title="💔 Driver emocional" content={analysis.referenceAnalysis.emotionalDriver} />
              <AnalysisCard title="🩹 Dor da audiência" content={analysis.referenceAnalysis.audiencePain} />
              <AnalysisCard title="⚔️ Inimigo criado" content={analysis.referenceAnalysis.enemy} />
              <AnalysisCard
                title="💥 Crença atacada"
                content={analysis.referenceAnalysis.beliefBeingAttacked}
              />
              <AnalysisCard
                title="🏗️ Crença instalada"
                content={analysis.referenceAnalysis.beliefBeingBuilt}
              />
              <AnalysisCard title="🪝 Tipo de hook" content={analysis.hookAnalysis.hookType} />
            </div>

            <Section title="🪝 hook analysis">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 space-y-3">
                <p className="text-white/85 italic">&ldquo;{analysis.hookAnalysis.hookText}&rdquo;</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <Field label="Mecanismo de atenção" value={analysis.hookAnalysis.attentionMechanism} />
                  <Field label="Curiosity gap" value={analysis.hookAnalysis.curiosityGap} />
                  <Field label="Soco emocional" value={analysis.hookAnalysis.emotionalPunch} />
                  <Field label="Por que funciona" value={analysis.hookAnalysis.whyItWorks} />
                  <Field label="Risco se reusar" value={analysis.hookAnalysis.riskOfBeingGeneric} colSpan={2} />
                </div>
                {analysis.hookAnalysis.possibleBrunoVersions.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-purple-400/70 uppercase tracking-widest mb-2">
                      versões Bruno do mesmo MECANISMO (só inspiração, não copia)
                    </p>
                    <ul className="space-y-1.5">
                      {analysis.hookAnalysis.possibleBrunoVersions.map((v, i) => (
                        <li key={i} className="text-sm text-white/80">
                          → {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            <Section title="🧬 narrative DNA">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
                <p className="text-xs text-white/40 mb-3">
                  Arquétipo: <span className="text-purple-300">{analysis.narrativeDNA.archetype}</span>
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <Field label="Abertura" value={analysis.narrativeDNA.openingMove} />
                  <Field label="Setup" value={analysis.narrativeDNA.contextSetup} />
                  <Field label="Construção de tensão" value={analysis.narrativeDNA.tensionBuild} />
                  <Field label="Momento de prova" value={analysis.narrativeDNA.proofMoment} />
                  <Field label="Virada" value={analysis.narrativeDNA.turnPoint} />
                  <Field label="Entrega do insight" value={analysis.narrativeDNA.insightDelivery} />
                  <Field label="Pico emocional" value={analysis.narrativeDNA.emotionalPeak} />
                  <Field label="Fechamento" value={analysis.narrativeDNA.closingMove} />
                  <Field label="Padrão de CTA" value={analysis.narrativeDNA.ctaPattern} />
                  <Field label="Ritmo de parágrafos" value={analysis.narrativeDNA.paragraphRhythm} />
                  <Field label="Cadência de frases" value={analysis.narrativeDNA.sentenceCadence} colSpan={2} />
                </div>
              </div>
            </Section>

            <Section title="🗺️ inspiration map">
              <div className="bg-purple-500/[0.04] border border-purple-500/20 rounded-xl p-5 space-y-3 text-sm">
                <Field label="Princípio reusável" value={analysis.inspirationMap.reusablePrinciple} />
                <Field label="Emoção adaptável" value={analysis.inspirationMap.adaptableEmotion} />
                <Field label="Estrutura segura" value={analysis.inspirationMap.safeStructure} />

                <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.05]">
                  <Field label="Conexão pessoal Bruno" value={analysis.inspirationMap.brunoPersonalConnection} />
                  <Field label="Conexão Reborn" value={analysis.inspirationMap.rebornConnection} />
                  <Field label="Conexão mercado" value={analysis.inspirationMap.marketConnection} />
                  <Field label="Conexão founder" value={analysis.inspirationMap.founderConnection} />
                </div>

                {analysis.inspirationMap.contentWarnings.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <p className="text-xs text-amber-400/80 mb-1.5">⚠️ Avisos</p>
                    <ul className="space-y-1">
                      {analysis.inspirationMap.contentWarnings.map((w, i) => (
                        <li key={i} className="text-sm text-amber-200/70">→ {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.inspirationMap.originalityBoundaries.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <p className="text-xs text-red-400/80 mb-1.5">⛔ Fronteiras de originalidade</p>
                    <ul className="space-y-1">
                      {analysis.inspirationMap.originalityBoundaries.map((b, i) => (
                        <li key={i} className="text-sm text-red-200/70">→ {b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* TAB 3: ANGLES */}
        {tab === "angles" && angles && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">15 ângulos originais.</h2>
              <p className="text-sm text-white/40 mt-1">
                Cada um é AUTORAL — partem da matéria-prima Bruno, não da história do autor original. Clica no que vai virar post.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {angles.map((a, i) => (
                <AngleCard
                  key={a.id}
                  index={i + 1}
                  angle={a}
                  loading={generatingPost && selectedAngleId === a.id}
                  onUse={() => runGeneratePost(a)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EDITOR */}
        {tab === "editor" && post && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Post final.</h2>
                <p className="text-sm text-white/40 mt-1">{post.wordCount} palavras · score {post.score?.finalScore ?? "—"}/100</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(fullPost, "full")}
                  className="text-xs text-white/40 hover:text-white/80 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
                >
                  {copied === "full" ? "copiado ✓" : "copiar tudo"}
                </button>
                {currentInspirationId && (
                  <button
                    onClick={() => {
                      setInspirationStatus(currentInspirationId, "favorito");
                      setLibrary(getAllInspirations());
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    ⭐ favoritar
                  </button>
                )}
              </div>
            </div>

            {/* Score grid */}
            {post.score && <ScoreGrid score={post.score} />}

            {/* Originality */}
            {post.originality && <OriginalityCard report={post.originality} />}

            {/* Hook */}
            <Block label="Hook" copied={copied === "hook"} onCopy={() => copyToClipboard(post.hook, "hook")}>
              <p className="text-white font-semibold text-base">{post.hook}</p>
            </Block>

            {/* Alternative hooks */}
            {post.alternativeHooks && post.alternativeHooks.length > 1 && (
              <details className="bg-white/[0.02] border border-white/[0.06] rounded-xl group">
                <summary className="cursor-pointer px-5 py-3 text-xs text-white/50 hover:text-white/80 flex items-center justify-between">
                  <span>🪝 {post.alternativeHooks.length} hooks alternativos (clica pra trocar)</span>
                  <span className="text-white/30 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-4 space-y-2">
                  {post.alternativeHooks.map((h, i) => {
                    const active = h === post.hook;
                    return (
                      <button
                        key={i}
                        onClick={() => swapHook(h)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                          active
                            ? "bg-purple-500/10 border-purple-500/40 text-white"
                            : "bg-white/[0.02] border-white/[0.06] text-white/75 hover:border-white/20"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </details>
            )}

            {/* Post body */}
            <Block label="Post" copied={copied === "post"} onCopy={() => copyToClipboard(post.post, "post")}>
              <div className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{post.post}</div>
            </Block>

            {/* CTA */}
            {post.cta && (
              <Block label="CTA" copied={copied === "cta"} onCopy={() => copyToClipboard(post.cta!, "cta")} accent="green">
                <p className="text-white/90 text-sm leading-relaxed">{post.cta}</p>
              </Block>
            )}

            {/* Refinement buttons */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">refinar</p>
              <div className="flex flex-wrap gap-2">
                {REFINE_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => runRefine(action)}
                    disabled={refining !== null}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-purple-500/40 text-white/50 hover:text-purple-300 transition-all disabled:opacity-30"
                  >
                    {refining === action ? "..." : getRefineLabel(action)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LIBRARY */}
        {tab === "library" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Biblioteca.</h2>
              <p className="text-sm text-white/40 mt-1">
                {library.length === 0
                  ? "Nenhuma inspiração ainda."
                  : `${library.length} inspiração${library.length !== 1 ? "ões" : ""} salvas.`}
              </p>
            </div>
            {library.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">⚡</div>
                <p>Cole uma referência na aba 1 pra começar.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {library.map((insp) => (
                  <LibraryCard
                    key={insp.id}
                    insp={insp}
                    onLoad={() => loadFromLibrary(insp)}
                    onDelete={() => handleDeleteFromLibrary(insp.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function TabBtn({
  id,
  label,
  active,
  onClick,
  disabled,
  badge,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-id={id}
      className={`px-4 py-3 text-sm transition-all border-b-2 whitespace-nowrap ${
        active
          ? "border-purple-500 text-white"
          : disabled
          ? "border-transparent text-white/20 cursor-not-allowed"
          : "border-transparent text-white/50 hover:text-white"
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">
        {label} {hint && <span className="text-white/25 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SegField<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <FieldGroup label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              opt.value === value
                ? "bg-purple-500/15 border-purple-500/50 text-purple-200"
                : "bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </FieldGroup>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs text-white/40 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function AnalysisCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{title}</p>
      <p className="text-sm text-white/85 leading-relaxed">{content}</p>
    </div>
  );
}

function Field({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <div className={colSpan === 2 ? "md:col-span-2" : ""}>
      <p className="text-[10px] text-white/35 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-white/80">{value}</p>
    </div>
  );
}

function AngleCard({
  index,
  angle,
  onUse,
  loading,
}: {
  index: number;
  angle: AngleOption;
  onUse: () => void;
  loading: boolean;
}) {
  const ranking =
    angle.brunoFitScore + angle.originalityScore - angle.riskScore;
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 space-y-3 hover:border-purple-500/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className="text-[10px] text-white/30">#{index} · {angle.recommendedFormat}</span>
          <h3 className="text-base font-semibold text-white mt-0.5">{angle.title}</h3>
        </div>
        <span className="text-xs font-mono text-purple-300 shrink-0">{ranking}</span>
      </div>
      <p className="text-sm text-white/70 leading-snug">{angle.thesis}</p>
      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <span>fit Bruno: <span className="text-blue-300">{angle.brunoFitScore}</span></span>
        <span>orig: <span className="text-green-300">{angle.originalityScore}</span></span>
        <span>risco: <span className="text-amber-300">{angle.riskScore}</span></span>
        <span>polêm: <span className="text-red-300">{angle.controversyLevel}/10</span></span>
      </div>
      <p className="text-[11px] text-white/50 italic">{angle.whyItCouldWork}</p>
      <button
        onClick={onUse}
        disabled={loading}
        className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm"
      >
        {loading ? "gerando post..." : "→ criar post com esse ângulo"}
      </button>
    </div>
  );
}

function ScoreGrid({ score }: { score: import("@/lib/inspiration/types").PostScore }) {
  const items: { label: string; value: number }[] = [
    { label: "hook", value: score.hookStrength },
    { label: "emoção", value: score.emotionalCharge },
    { label: "originalidade", value: score.originality },
    { label: "voz Bruno", value: score.brunoVoice },
    { label: "clareza", value: score.clarity },
    { label: "polêmica", value: score.controversy },
    { label: "share", value: score.shareability },
    { label: "comentário", value: score.commentPotential },
    { label: "autoridade", value: score.authority },
    { label: "humanidade", value: score.humanFeel },
  ];
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 uppercase tracking-widest">score</span>
        <span className="text-2xl font-mono font-bold text-purple-300">{score.finalScore}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <p className="text-[10px] text-white/35 uppercase">{it.label}</p>
            <p
              className={`text-sm font-mono ${
                it.value >= 85 ? "text-green-300" : it.value >= 70 ? "text-blue-300" : "text-amber-300"
              }`}
            >
              {it.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OriginalityCard({ report }: { report: import("@/lib/inspiration/types").OriginalityReport }) {
  const safe = report.isSafeToPublish && report.similarityScore < 35;
  return (
    <div
      className={`border rounded-xl p-4 ${
        safe
          ? "bg-green-500/[0.04] border-green-500/20"
          : "bg-red-500/[0.04] border-red-500/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-white/50">
          {safe ? "✓ originalidade" : "⚠️ risco de cópia"}
        </p>
        <p className={`text-sm font-mono ${safe ? "text-green-300" : "text-red-300"}`}>
          similaridade {report.similarityScore}%
        </p>
      </div>
      {report.copiedPhrases.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] text-white/40 mb-1">frases parecidas:</p>
          <ul className="space-y-1">
            {report.copiedPhrases.map((p, i) => (
              <li key={i} className="text-xs text-red-200/70">→ &ldquo;{p}&rdquo;</li>
            ))}
          </ul>
        </div>
      )}
      {!safe && report.rewriteInstructions && (
        <p className="text-xs text-amber-200/70 mt-2 italic">{report.rewriteInstructions}</p>
      )}
    </div>
  );
}

function Block({
  label,
  copied,
  onCopy,
  children,
  accent = "purple",
}: {
  label: string;
  copied: boolean;
  onCopy: () => void;
  children: React.ReactNode;
  accent?: "purple" | "green";
}) {
  const accentClass = accent === "green" ? "text-green-400/70" : "text-purple-400/70";
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs ${accentClass} uppercase tracking-widest font-medium`}>{label}</span>
        <button onClick={onCopy} className="text-xs text-white/30 hover:text-white/70">
          {copied ? "copiado ✓" : "copiar"}
        </button>
      </div>
      {children}
    </div>
  );
}

function LibraryCard({
  insp,
  onLoad,
  onDelete,
}: {
  insp: SavedInspiration;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const date = new Date(insp.createdAt).toLocaleDateString("pt-BR");
  const status = insp.status;
  const statusColor = {
    novo: "text-white/40",
    analisado: "text-blue-300",
    usado: "text-purple-300",
    favorito: "text-amber-300",
    descartado: "text-white/25",
    virou_template: "text-green-300",
  }[status];
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 space-y-2 hover:border-purple-500/20 transition-all">
      <div className="flex items-center justify-between text-xs">
        <span className={`uppercase tracking-widest ${statusColor}`}>{status}</span>
        <span className="text-white/30">{date}</span>
      </div>
      <p className="text-sm text-white/85 line-clamp-3">
        {insp.reference.targetTopic || insp.reference.userIntent || insp.reference.rawContent.slice(0, 120)}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        {insp.analysis && <span>✓ análise</span>}
        {insp.angles && <span>✓ {insp.angles.length} ângulos</span>}
        {insp.finalPost && <span>✓ post · score {insp.finalPost.score?.finalScore ?? "—"}</span>}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onLoad}
          className="flex-1 text-xs py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg"
        >
          abrir
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-3 py-1.5 text-white/30 hover:text-red-400"
        >
          deletar
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all";
