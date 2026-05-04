"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getApiKey } from "@/lib/settings";
import { ApiKeyModal, ApiKeyButton } from "@/components/ApiKeyModal";
import {
  SavedInspiration,
  AngleOption,
  GeneratedPost,
  PostConfig,
  CtaMode,
  PostIntensity,
  PostTone,
  TargetAudience,
  ProximityToReference,
  OutputLengthOption,
} from "@/lib/inspiration/types";
import { getAllInspirations, saveInspiration, newInspirationId } from "@/lib/inspiration/store";
import { PRESET_CATEGORIES, getCategoryEmoji, getCategoryLabel } from "@/lib/brain/categories";
import { buildBrainStats, BrainStats } from "@/lib/brain/stats";
import { retrieveTopInspirations, ScoredInspiration } from "@/lib/brain/retrieval";
import { AggregateSynthesis } from "@/lib/inspiration/prompts/synthesize";

type Tab = "dashboard" | "browse" | "create";

export default function BrainPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [library, setLibrary] = useState<SavedInspiration[]>([]);
  const [error, setError] = useState("");

  // Browse filters
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterArchetype, setFilterArchetype] = useState<string>("");
  const [filterHook, setFilterHook] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  // Create flow
  const [createTopic, setCreateTopic] = useState("");
  const [createDesiredAngle, setCreateDesiredAngle] = useState("");
  const [createCategories, setCreateCategories] = useState<string[]>([]);
  const [createLimit, setCreateLimit] = useState(8);
  const [createIntensity, setCreateIntensity] = useState<PostIntensity>("forte");
  const [createTone, setCreateTone] = useState<PostTone>("bastidor");
  const [createAudience, setCreateAudience] = useState<TargetAudience>("founders");
  const [createCta, setCreateCta] = useState<CtaMode>("indireto");
  const [createLength, setCreateLength] = useState<OutputLengthOption>(2000);
  const [createProximity, setCreateProximity] = useState<ProximityToReference>("baixa");

  const [retrieved, setRetrieved] = useState<ScoredInspiration[] | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [aggregate, setAggregate] = useState<AggregateSynthesis | null>(null);
  const [aggregateAngles, setAggregateAngles] = useState<AngleOption[] | null>(null);
  const [generatingPost, setGeneratingPost] = useState<string | null>(null);
  const [finalPost, setFinalPost] = useState<GeneratedPost | null>(null);
  const [copied, setCopied] = useState<"hook" | "post" | "cta" | "full" | null>(null);

  useEffect(() => {
    setLibrary(getAllInspirations());
  }, []);

  const stats: BrainStats = useMemo(() => buildBrainStats(library), [library]);

  const filteredLibrary = useMemo(() => {
    const tokens = searchText.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    return library.filter((i) => {
      if (i.status === "descartado") return false;
      if (filterCategory && !(i.categories || []).includes(filterCategory)) return false;
      if (filterArchetype && !(i.autoTags || []).includes(`archetype:${filterArchetype}`)) return false;
      if (filterHook && !(i.autoTags || []).includes(`hook:${filterHook}`)) return false;
      if (tokens.length > 0) {
        const corpus = `${i.reference.targetTopic} ${i.reference.userIntent} ${i.reference.rawContent} ${(i.autoTags || []).join(" ")}`.toLowerCase();
        if (!tokens.every((t) => corpus.includes(t))) return false;
      }
      return true;
    });
  }, [library, filterCategory, filterArchetype, filterHook, searchText]);

  /* ---------------- create flow ---------------- */

  const runRetrieve = () => {
    if (!createTopic.trim()) {
      setError("Informe o tópico-alvo.");
      return;
    }
    setError("");
    const top = retrieveTopInspirations(library, {
      topic: createTopic,
      desiredAngle: createDesiredAngle,
      categories: createCategories,
      limit: createLimit,
    } as Parameters<typeof retrieveTopInspirations>[1]);
    setRetrieved(top);
    setAggregate(null);
    setAggregateAngles(null);
    setFinalPost(null);
  };

  const toggleRetrievedInspiration = (id: string) => {
    if (!retrieved) return;
    setRetrieved(retrieved.filter((r) => r.inspiration.id !== id));
  };

  const runSynthesize = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    if (!retrieved || retrieved.length === 0) {
      setError("Nada pra sintetizar — recupera inspirações primeiro.");
      return;
    }
    setSynthesizing(true);
    setError("");
    setAggregate(null);
    setAggregateAngles(null);
    try {
      const res = await fetch("/api/brain/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          topic: createTopic,
          desiredAngle: createDesiredAngle,
          categories: createCategories,
          inspirations: retrieved.map((r) => r.inspiration),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao sintetizar.");
        return;
      }
      setAggregate(data);
      setAggregateAngles(data.angles);
    } catch {
      setError("Erro de conexão na síntese.");
    } finally {
      setSynthesizing(false);
    }
  };

  const runGenerateFromAngle = async (angle: AngleOption) => {
    const apiKey = getApiKey();
    if (!apiKey) return setShowKeyModal(true);
    if (!aggregate || !retrieved) return;
    setGeneratingPost(angle.id);
    setFinalPost(null);
    setError("");
    const config: PostConfig = {
      outputLength: createLength,
      intensity: createIntensity,
      tone: createTone,
      cta: createCta,
      proximityToReference: createProximity,
      targetAudience: createAudience,
    };
    try {
      const res = await fetch("/api/brain/generate-from-aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          topic: createTopic,
          angle,
          aggregate,
          sources: retrieved.map((r) => r.inspiration),
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar post.");
        return;
      }
      setFinalPost(data);

      // Salva o post agregado como SavedInspiration própria pra biblioteca
      const id = newInspirationId();
      saveInspiration({
        id,
        reference: {
          id,
          type: "multi",
          rawContent: `[SÍNTESE BRAIN] tópico: ${createTopic}`,
          extractedText: `Síntese de ${retrieved.length} referências do brain`,
          userIntent: createDesiredAngle || "geração via brain synthesize",
          targetTopic: createTopic,
          intensityLevel: 8,
          outputLength: createLength,
          proximityToReference: createProximity,
          ctaMode: createCta,
          createdAt: new Date().toISOString(),
        },
        finalPost: data,
        status: "usado",
        tags: ["brain-synthesis"],
        categories: createCategories,
        autoTags: ["source:brain-aggregate", `topic:${createTopic.toLowerCase().slice(0, 30)}`],
        manualTags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLibrary(getAllInspirations());
    } catch {
      setError("Erro de conexão na geração.");
    } finally {
      setGeneratingPost(null);
    }
  };

  const copyToClipboard = async (text: string, type: "hook" | "post" | "cta" | "full") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullFinalPost = finalPost
    ? finalPost.cta
      ? `${finalPost.hook}\n\n${finalPost.post}\n\n${finalPost.cta}`
      : `${finalPost.hook}\n\n${finalPost.post}`
    : "";

  const toggleCreateCategory = (id: string) => {
    setCreateCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ApiKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />

      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/70 transition-colors text-sm">
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-fuchsia-400">🧠</span> mega brain
              </h1>
              <p className="text-xs text-white/25 mt-0.5">
                {stats.total} inspiraç{stats.total === 1 ? "ão" : "ões"} · fica mais inteligente quanto mais você alimenta
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/inspiration"
              className="text-xs px-3 py-2 border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-lg"
            >
              + nova inspiração
            </Link>
            <ApiKeyButton onClick={() => setShowKeyModal(true)} />
          </div>
        </div>
      </header>

      <div className="border-b border-white/5 px-6 sticky top-[72px] bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          <TabBtn label="dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <TabBtn label="browse" active={tab === "browse"} onClick={() => setTab("browse")} badge={library.length} />
          <TabBtn label="smart create" active={tab === "create"} onClick={() => setTab("create")} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Dashboard.</h2>
              <p className="text-sm text-white/40 mt-1">
                Visão agregada de tudo que tá no brain. Padrões dominantes saltam aos olhos.
              </p>
            </div>

            {stats.total === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">🧠</div>
                <p className="text-white/40">brain vazio</p>
                <p className="text-white/25 text-sm max-w-sm mx-auto">
                  Vai em{" "}
                  <Link href="/inspiration" className="text-purple-400 underline">
                    /inspiration
                  </Link>{" "}
                  e adiciona a primeira referência. Quanto mais você alimenta, mais inteligente fica.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="total" value={stats.total} />
                  <Stat label="com análise" value={stats.withAnalysis} />
                  <Stat label="com post final" value={stats.withFinalPost} />
                  <Stat label="favoritos" value={stats.favorites} />
                </div>

                <BarSection title="🏷️ por categoria" items={stats.byCategory.slice(0, 12)} renderLabel={(id) => `${getCategoryEmoji(id)} ${getCategoryLabel(id)}`} />

                <div className="grid md:grid-cols-2 gap-6">
                  <BarSection title="🎭 archetypes dominantes" items={stats.byArchetype.slice(0, 8)} />
                  <BarSection title="🪝 hooks mais frequentes" items={stats.byHookType.slice(0, 8)} />
                  <BarSection title="💔 paleta emocional" items={stats.byEmotion.slice(0, 8)} />
                  <BarSection title="⚔️ inimigos recorrentes" items={stats.byEnemy.slice(0, 8)} />
                </div>

                <BarSection title="🧪 temas extraídos do domínio" items={stats.topThemes.slice(0, 12)} />
              </>
            )}
          </div>
        )}

        {/* BROWSE */}
        {tab === "browse" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Browse.</h2>
              <p className="text-sm text-white/40 mt-1">
                Filtra a biblioteca por categoria, archetype, hook ou texto livre.
              </p>
            </div>

            <div className="space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <FilterRow label="🏷️ categoria">
                <FilterChip
                  label="todas"
                  active={!filterCategory}
                  onClick={() => setFilterCategory("")}
                />
                {stats.byCategory.map((c) => (
                  <FilterChip
                    key={c.id}
                    label={`${getCategoryEmoji(c.id)} ${getCategoryLabel(c.id)} (${c.count})`}
                    active={filterCategory === c.id}
                    onClick={() => setFilterCategory(filterCategory === c.id ? "" : c.id)}
                  />
                ))}
              </FilterRow>

              {stats.byArchetype.length > 0 && (
                <FilterRow label="🎭 archetype">
                  <FilterChip
                    label="todos"
                    active={!filterArchetype}
                    onClick={() => setFilterArchetype("")}
                  />
                  {stats.byArchetype.slice(0, 8).map((a) => (
                    <FilterChip
                      key={a.id}
                      label={`${a.id.replace(/_/g, " ")} (${a.count})`}
                      active={filterArchetype === a.id}
                      onClick={() => setFilterArchetype(filterArchetype === a.id ? "" : a.id)}
                    />
                  ))}
                </FilterRow>
              )}

              {stats.byHookType.length > 0 && (
                <FilterRow label="🪝 hook">
                  <FilterChip
                    label="todos"
                    active={!filterHook}
                    onClick={() => setFilterHook("")}
                  />
                  {stats.byHookType.slice(0, 8).map((h) => (
                    <FilterChip
                      key={h.id}
                      label={`${h.id.replace(/_/g, " ")} (${h.count})`}
                      active={filterHook === h.id}
                      onClick={() => setFilterHook(filterHook === h.id ? "" : h.id)}
                    />
                  ))}
                </FilterRow>
              )}

              <input
                type="text"
                placeholder="busca livre (tese, dor, inimigo, autor…)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>

            <p className="text-xs text-white/40">{filteredLibrary.length} resultado{filteredLibrary.length !== 1 ? "s" : ""}</p>

            {filteredLibrary.length === 0 ? (
              <div className="text-center py-12 text-white/30">nenhum resultado pros filtros</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredLibrary.map((insp) => (
                  <InspirationListCard key={insp.id} insp={insp} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SMART CREATE */}
        {tab === "create" && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Smart Create.</h2>
              <p className="text-sm text-white/40 mt-1">
                Você define um tópico e categorias. O brain pesca as N inspirações mais relevantes da
                biblioteca, sintetiza padrões agregados e gera ângulos. Quanto mais brain, melhor o output.
              </p>
            </div>

            {/* Step 1: Topic + filters */}
            <div className="space-y-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <FieldGroup label="Tópico-alvo">
                <input
                  type="text"
                  placeholder="ex: founder que economiza em adquirente e perde 3x em chargeback"
                  value={createTopic}
                  onChange={(e) => setCreateTopic(e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Ângulo desejado (opcional)">
                <input
                  type="text"
                  placeholder="ex: ataque direto à crença de que pagamentos é commodity"
                  value={createDesiredAngle}
                  onChange={(e) => setCreateDesiredAngle(e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Categorias-foco (filtra do brain)">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CATEGORIES.map((c) => (
                    <FilterChip
                      key={c.id}
                      label={`${c.emoji} ${c.label}`}
                      active={createCategories.includes(c.id)}
                      onClick={() => toggleCreateCategory(c.id)}
                    />
                  ))}
                </div>
              </FieldGroup>

              <div className="flex items-center gap-3">
                <label className="text-xs text-white/50">
                  pescar top
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={createLimit}
                    onChange={(e) => setCreateLimit(parseInt(e.target.value, 10) || 8)}
                    className="ml-2 w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                  />
                </label>
                <button
                  onClick={runRetrieve}
                  disabled={!createTopic.trim() || library.length === 0}
                  className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg"
                >
                  → recuperar do brain
                </button>
              </div>
              {library.length === 0 && (
                <p className="text-xs text-amber-400/70">
                  brain vazio — adicione referências em /inspiration primeiro
                </p>
              )}
            </div>

            {/* Step 2: Retrieved */}
            {retrieved && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-sm uppercase tracking-widest text-white/40">
                    {retrieved.length} inspiraç{retrieved.length !== 1 ? "ões" : "ão"} pescada{retrieved.length !== 1 ? "s" : ""}
                  </h3>
                  <button
                    onClick={runSynthesize}
                    disabled={synthesizing || retrieved.length === 0}
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-white/5 disabled:text-white/20 text-white text-sm font-semibold rounded-lg"
                  >
                    {synthesizing ? "sintetizando..." : "→ sintetizar padrões + gerar 15 ângulos"}
                  </button>
                </div>
                {retrieved.length === 0 ? (
                  <p className="text-sm text-white/40 italic">
                    Nada relevante encontrado. Tenta categorias diferentes ou adiciona mais referências.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {retrieved.map((r) => (
                      <RetrievedCard
                        key={r.inspiration.id}
                        scored={r}
                        onRemove={() => toggleRetrievedInspiration(r.inspiration.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Aggregate synthesis */}
            {aggregate && (
              <div className="space-y-4 bg-fuchsia-500/[0.04] border border-fuchsia-500/20 rounded-xl p-5">
                <h3 className="text-sm uppercase tracking-widest text-fuchsia-300">síntese agregada</h3>
                <SynthBlock label="🔄 padrões recorrentes" items={aggregate.recurringPatterns} />
                <SynthBlock label="🎭 archetypes dominantes" items={aggregate.dominantArchetypes} />
                <SynthBlock label="🪝 hooks recorrentes" items={aggregate.dominantHooks} />
                <SynthBlock label="💔 paleta emocional" items={aggregate.emotionalPalette} />
                <SynthBlock label="⚔️ inimigos agregados" items={aggregate.marketEnemiesAggregated} />
                <SynthBlock label="🧪 princípios reusáveis" items={aggregate.reusablePrinciples} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-fuchsia-300 mb-1">⚡ edge único do Bruno</p>
                  <p className="text-sm text-white/85 italic">{aggregate.brunoEdge}</p>
                </div>
                {aggregate.contentWarnings.length > 0 && (
                  <SynthBlock label="⚠️ avisos" items={aggregate.contentWarnings} tone="warn" />
                )}
                {aggregate.originalityBoundaries.length > 0 && (
                  <SynthBlock label="⛔ fronteiras de originalidade" items={aggregate.originalityBoundaries} tone="danger" />
                )}
              </div>
            )}

            {/* Step 4: Angles */}
            {aggregateAngles && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-sm uppercase tracking-widest text-white/40">
                    15 ângulos do agregado
                  </h3>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-white/40 hover:text-white">⚙️ config do post</summary>
                    <div className="mt-3 grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/10 rounded-lg p-3 max-w-md">
                      <SmallSelect<PostIntensity>
                        label="intensidade"
                        value={createIntensity}
                        onChange={setCreateIntensity}
                        options={[
                          { value: "leve", label: "leve" },
                          { value: "medio", label: "médio" },
                          { value: "forte", label: "forte" },
                          { value: "brutal", label: "brutal" },
                        ]}
                      />
                      <SmallSelect<PostTone>
                        label="tom"
                        value={createTone}
                        onChange={setCreateTone}
                        options={[
                          { value: "desabafo", label: "desabafo" },
                          { value: "bastidor", label: "bastidor" },
                          { value: "polemico", label: "polêmico" },
                          { value: "educativo", label: "educativo" },
                          { value: "storytelling", label: "storytelling" },
                          { value: "social_selling_sutil", label: "social selling" },
                          { value: "analise_mercado", label: "análise" },
                        ]}
                      />
                      <SmallSelect<TargetAudience>
                        label="audiência"
                        value={createAudience}
                        onChange={setCreateAudience}
                        options={[
                          { value: "founders", label: "founders" },
                          { value: "sellers", label: "sellers" },
                          { value: "executivos", label: "executivos" },
                          { value: "mercado_pagamentos", label: "pagamentos" },
                          { value: "geral", label: "geral" },
                        ]}
                      />
                      <SmallSelect<CtaMode>
                        label="CTA"
                        value={createCta}
                        onChange={setCreateCta}
                        options={[
                          { value: "sem_cta", label: "sem CTA" },
                          { value: "indireto", label: "indireto" },
                          { value: "reborn", label: "Reborn sutil" },
                          { value: "comentario", label: "comentário" },
                          { value: "reflexao", label: "reflexão" },
                        ]}
                      />
                      <SmallSelect<ProximityToReference>
                        label="proximidade"
                        value={createProximity}
                        onChange={setCreateProximity}
                        options={[
                          { value: "baixa", label: "baixa" },
                          { value: "media", label: "média" },
                          { value: "alta", label: "alta" },
                        ]}
                      />
                      <SmallSelect<OutputLengthOption>
                        label="tamanho"
                        value={createLength}
                        onChange={setCreateLength}
                        options={[
                          { value: 1000, label: "1000 pal" },
                          { value: 2000, label: "2000 pal" },
                          { value: 3000, label: "3000 pal" },
                          { value: 5000, label: "5000 pal" },
                        ]}
                      />
                    </div>
                  </details>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {aggregateAngles.map((a, i) => {
                    const ranking = a.brunoFitScore + a.originalityScore - a.riskScore;
                    return (
                      <div
                        key={a.id}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-[10px] text-white/30">
                              #{i + 1} · {a.recommendedFormat}
                            </span>
                            <h4 className="text-sm font-semibold mt-0.5">{a.title}</h4>
                          </div>
                          <span className="text-xs font-mono text-fuchsia-300 shrink-0">{ranking}</span>
                        </div>
                        <p className="text-xs text-white/70">{a.thesis}</p>
                        <div className="flex items-center gap-3 text-[10px] text-white/40">
                          <span>fit: <span className="text-blue-300">{a.brunoFitScore}</span></span>
                          <span>orig: <span className="text-green-300">{a.originalityScore}</span></span>
                          <span>risco: <span className="text-amber-300">{a.riskScore}</span></span>
                        </div>
                        <button
                          onClick={() => runGenerateFromAngle(a)}
                          disabled={generatingPost !== null}
                          className="w-full py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-white/5 disabled:text-white/20 text-white text-xs font-medium rounded-lg"
                        >
                          {generatingPost === a.id ? "gerando..." : "→ criar post"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Final post */}
            {finalPost && (
              <div className="space-y-4 bg-fuchsia-500/[0.04] border border-fuchsia-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-base font-bold">post final</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-white/40">{finalPost.wordCount} pal</span>
                    {finalPost.score && (
                      <span className="font-mono text-fuchsia-300">score {finalPost.score.finalScore}/100</span>
                    )}
                    {finalPost.originality && (
                      <span
                        className={`font-mono ${
                          finalPost.originality.isSafeToPublish ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        sim {finalPost.originality.similarityScore}%
                      </span>
                    )}
                    <button
                      onClick={() => copyToClipboard(fullFinalPost, "full")}
                      className="text-xs px-3 py-1 border border-white/10 hover:border-white/30 rounded-lg"
                    >
                      {copied === "full" ? "copiado ✓" : "copiar tudo"}
                    </button>
                  </div>
                </div>
                <FinalBlock label="hook" copied={copied === "hook"} onCopy={() => copyToClipboard(finalPost.hook, "hook")}>
                  <p className="text-white font-semibold">{finalPost.hook}</p>
                </FinalBlock>
                <FinalBlock label="post" copied={copied === "post"} onCopy={() => copyToClipboard(finalPost.post, "post")}>
                  <div className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{finalPost.post}</div>
                </FinalBlock>
                {finalPost.cta && (
                  <FinalBlock label="cta" copied={copied === "cta"} onCopy={() => copyToClipboard(finalPost.cta!, "cta")}>
                    <p className="text-white/90 text-sm">{finalPost.cta}</p>
                  </FinalBlock>
                )}
                <p className="text-xs text-white/40 italic">
                  ✓ post salvo no /inspiration com tag &ldquo;brain-synthesis&rdquo; pra retomar refino lá.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* --------------------------- subcomponents --------------------------- */

function TabBtn({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm transition-all border-b-2 whitespace-nowrap ${
        active ? "border-fuchsia-500 text-white" : "border-transparent text-white/50 hover:text-white"
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-2xl font-mono font-bold mt-1">{value}</p>
    </div>
  );
}

function BarSection({
  title,
  items,
  renderLabel,
}: {
  title: string;
  items: { id: string; count: number }[];
  renderLabel?: (id: string) => string;
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">{title}</h3>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3">
            <div className="text-xs text-white/70 w-44 sm:w-56 truncate shrink-0">
              {renderLabel ? renderLabel(it.id) : it.id.replace(/_/g, " ")}
            </div>
            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500/60 to-purple-500/60 rounded-full"
                style={{ width: `${(it.count / max) * 100}%` }}
              />
            </div>
            <div className="text-xs font-mono text-white/50 w-8 text-right shrink-0">{it.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-white/40 uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
        active
          ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-200"
          : "bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/20"
      }`}
    >
      {label}
    </button>
  );
}

function InspirationListCard({ insp }: { insp: SavedInspiration }) {
  const date = new Date(insp.createdAt).toLocaleDateString("pt-BR");
  const cats = insp.categories || [];
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/30">{date}</span>
        <span className="text-fuchsia-300 capitalize">{insp.status}</span>
      </div>
      <p className="text-sm text-white/85 line-clamp-3">
        {insp.reference.targetTopic ||
          insp.reference.userIntent ||
          insp.reference.rawContent.slice(0, 120)}
      </p>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <span
              key={c}
              className="text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full"
            >
              {getCategoryEmoji(c)} {getCategoryLabel(c)}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        {insp.analysis && <span>✓ análise</span>}
        {insp.angles && <span>✓ {insp.angles.length} ângulos</span>}
        {insp.finalPost && <span>✓ post · score {insp.finalPost.score?.finalScore ?? "—"}</span>}
      </div>
      <Link
        href="/inspiration"
        className="block text-center text-xs py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg"
      >
        abrir em /inspiration
      </Link>
    </div>
  );
}

function RetrievedCard({
  scored,
  onRemove,
}: {
  scored: ScoredInspiration;
  onRemove: () => void;
}) {
  const insp = scored.inspiration;
  return (
    <div className="bg-white/[0.04] border border-fuchsia-500/20 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-fuchsia-300">score {scored.score}</span>
        <button onClick={onRemove} className="text-[10px] text-white/30 hover:text-red-400">
          remover
        </button>
      </div>
      <p className="text-sm text-white/85 line-clamp-2">
        {insp.reference.targetTopic || insp.reference.rawContent.slice(0, 100)}
      </p>
      {insp.analysis && (
        <p className="text-[11px] text-white/50 italic line-clamp-2">
          {insp.analysis.referenceAnalysis.centralThesis}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {scored.matchReasons.slice(0, 3).map((r, i) => (
          <span key={i} className="text-[9px] bg-fuchsia-500/10 text-fuchsia-300/80 px-1.5 py-0.5 rounded">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-white/50 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

function SmallSelect<T extends string | number>({
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
    <label className="block">
      <span className="text-[10px] text-white/35 uppercase tracking-widest block mb-1">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const num = Number(raw);
          onChange((isNaN(num) || raw === "" ? raw : num) as T);
        }}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)} className="bg-[#0a0a0a]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SynthBlock({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone?: "warn" | "danger";
}) {
  if (items.length === 0) return null;
  const color = tone === "danger" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-fuchsia-300";
  return (
    <div>
      <p className={`text-xs uppercase tracking-widest mb-1.5 ${color}`}>{label}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-white/80">→ {it}</li>
        ))}
      </ul>
    </div>
  );
}

function FinalBlock({
  label,
  copied,
  onCopy,
  children,
}: {
  label: string;
  copied: boolean;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-fuchsia-400/70 uppercase tracking-widest">{label}</span>
        <button onClick={onCopy} className="text-xs text-white/30 hover:text-white/70">
          {copied ? "copiado ✓" : "copiar"}
        </button>
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-fuchsia-500/50";
