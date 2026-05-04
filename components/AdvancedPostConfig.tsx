"use client";

import { useState } from "react";
import {
  AdvancedPostConfig,
  ContentLengthMode,
  Intensity,
  StorytellingLevel,
  ControversyLevel,
  PostGoal,
  CtaType,
  HumanizationLevel,
  PostStructure,
  CreativeVariation,
  SentenceStyle,
  StructureMode,
  HookStyle,
  EndingStyle,
  RebornMention,
  OutputFormat,
  PresetName,
} from "@/lib/advanced-config/types";
import { PRESETS, DEFAULT_CONFIG } from "@/lib/advanced-config/defaults";

interface Props {
  config: AdvancedPostConfig;
  onChange: (config: AdvancedPostConfig) => void;
}

export function AdvancedPostConfigPanel({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = <K extends keyof AdvancedPostConfig>(key: K, value: AdvancedPostConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const applyPreset = (name: PresetName) => {
    onChange(PRESETS[name]);
  };

  const reset = () => onChange(DEFAULT_CONFIG);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white/80 border border-white/[0.08] hover:border-white/20 rounded-xl px-4 py-2.5 transition-all"
      >
        <span>⚙️</span>
        <span>configurações avançadas</span>
        <span className="text-white/30">+</span>
      </button>
    );
  }

  return (
    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white"
        >
          <span>⚙️</span>
          <span className="font-medium">configurações avançadas</span>
          <span className="text-white/30">−</span>
        </button>
        <div className="flex items-center gap-1.5 flex-wrap">
          <PresetBtn label="Bruno" emoji="🥷" onClick={() => applyPreset("bruno")} />
          <PresetBtn label="Técnico" emoji="🧠" onClick={() => applyPreset("technical")} />
          <PresetBtn label="Viral" emoji="🎯" onClick={() => applyPreset("viral")} />
          <button
            onClick={reset}
            className="text-[11px] text-white/30 hover:text-white/70 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-all"
          >
            reset
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        {/* PIPELINE — toggles que controlam o motor de geração */}
        <Section title="Motor de geração" emoji="🧠">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle
              label="usar DNA do autor (Bruno)"
              value={config.useAuthorDNA}
              onChange={(v) => update("useAuthorDNA", v)}
            />
            <Toggle
              label="gerar variações de hook (5)"
              value={config.generateHookVariations}
              onChange={(v) => update("generateHookVariations", v)}
            />
          </div>
        </Section>

        <Divider />

        {/* CÉREBRO DO BRUNO — Sliders 0-10 */}
        <Section title="Cérebro do Bruno (controle fino)" emoji="🎚️">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Slider
              label="Intensidade"
              value={config.intensitySlider}
              onChange={(v) => update("intensitySlider", v)}
              hint=">=8: cortante e sem filtro"
            />
            <Slider
              label="Polêmica"
              value={config.controversySlider}
              onChange={(v) => update("controversySlider", v)}
              hint=">=8: confronto direto ao mercado"
            />
            <Slider
              label="Autoridade"
              value={config.authoritySlider}
              onChange={(v) => update("authoritySlider", v)}
              hint=">=8: precisão técnica e bastidor operacional"
            />
            <Slider
              label="Storytelling"
              value={config.storytellingSlider}
              onChange={(v) => update("storytellingSlider", v)}
              hint=">=8: cena real e progressão narrativa"
            />
            <Slider
              label="Profundidade técnica"
              value={config.technicalDepth}
              onChange={(v) => update("technicalDepth", v)}
              hint=">=8: usa termos do domínio (chargeback, fallback, adquirente…)"
            />
            <Slider
              label="Peso emocional"
              value={config.emotionalWeight}
              onChange={(v) => update("emotionalWeight", v)}
              hint=">=8: traz custo psicológico real"
            />
            <Slider
              label="Imperfeição humana"
              value={config.humanImperfection}
              onChange={(v) => update("humanImperfection", v)}
              hint=">=8: quebra de ritmo, frase incompleta OK"
            />
            <Slider
              label="Sutileza comercial"
              value={config.salesSubtlety}
              onChange={(v) => update("salesSubtlety", v)}
              hint=">=8: zero pitch, Reborn só como contexto"
            />
            <Slider
              label="Anti-IA"
              value={config.antiAILevel}
              onChange={(v) => update("antiAILevel", v)}
              hint=">=8: ativa rewrite automático"
            />
          </div>
        </Section>

        <Divider />

        {/* Tamanho */}
        <Section title="Tamanho do post" emoji="📏">
          <Seg<ContentLengthMode>
            value={config.contentLengthMode}
            onChange={(v) => update("contentLengthMode", v)}
            options={[
              { value: "short", label: "curto", hint: "300–600 pal" },
              { value: "medium", label: "médio", hint: "700–1200 pal" },
              { value: "long", label: "longo", hint: "1200–2000 pal" },
              { value: "deep_dive", label: "deep dive", hint: "2000–3500 pal" },
              { value: "custom", label: "custom" },
            ]}
          />
          <Field label={`Word target: ${config.wordTarget}`}>
            <input
              type="number"
              min={100}
              max={5000}
              step={50}
              value={config.wordTarget}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) update("wordTarget", n);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </Field>
          {config.contentLengthMode === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumberInput
                label="min chars"
                value={config.minChars}
                onChange={(v) => update("minChars", v)}
                min={50}
                max={10000}
              />
              <NumberInput
                label="max chars"
                value={config.maxChars}
                onChange={(v) => update("maxChars", v)}
                min={100}
                max={10000}
              />
            </div>
          )}
          <Toggle
            label="respeitar limite rigidamente (chars)"
            value={config.hardLimit}
            onChange={(v) => update("hardLimit", v)}
          />
        </Section>

        <Divider />

        {/* Estrutura + Hook + Final + Reborn + Formato */}
        <Section title="Arquitetura do post" emoji="🏗️">
          <Field label="Estrutura">
            <Seg<StructureMode>
              value={config.structureMode}
              onChange={(v) => update("structureMode", v)}
              options={[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "storytelling", label: "Storytelling" },
                { value: "essay", label: "Ensaio" },
                { value: "founder_rant", label: "Founder Rant" },
                { value: "technical_breakdown", label: "Technical Breakdown" },
              ]}
            />
          </Field>
          <Field label="Tipo de hook">
            <Seg<HookStyle>
              value={config.hookStyle}
              onChange={(v) => update("hookStyle", v)}
              options={[
                { value: "dangerous_opinion", label: "opinião perigosa" },
                { value: "specific_observation", label: "observação específica" },
                { value: "confession", label: "confissão" },
                { value: "market_attack", label: "ataque ao mercado" },
                { value: "counterintuitive", label: "contraintuitivo" },
                { value: "story_opening", label: "abertura de história" },
              ]}
            />
          </Field>
          <Field label="Final">
            <Seg<EndingStyle>
              value={config.endingStyle}
              onChange={(v) => update("endingStyle", v)}
              options={[
                { value: "punch", label: "soco seco" },
                { value: "open_loop", label: "loop aberto" },
                { value: "reflection", label: "reflexão" },
                { value: "provocation", label: "provocação" },
                { value: "soft_cta", label: "CTA sutil" },
              ]}
            />
          </Field>
          <Field label="Menção à Reborn">
            <Seg<RebornMention>
              value={config.rebornMention}
              onChange={(v) => update("rebornMention", v)}
              options={[
                { value: "none", label: "nenhuma" },
                { value: "subtle", label: "sutil" },
                { value: "contextual", label: "contextual" },
                { value: "direct", label: "direta" },
              ]}
            />
          </Field>
          <Field label="Formato de saída">
            <Seg<OutputFormat>
              value={config.outputFormat}
              onChange={(v) => update("outputFormat", v)}
              options={[
                { value: "linkedin", label: "LinkedIn" },
                { value: "newsletter", label: "Newsletter" },
                { value: "twitter_thread", label: "Thread X" },
              ]}
            />
          </Field>
        </Section>

        <Divider />

        {/* Tom segmentado clássico — kept for backward compatibility */}
        <Section title="Tom (segmentado, broad strokes)" emoji="🎯">
          <Field label="Intensidade (segmento)">
            <Seg<Intensity>
              value={config.intensity}
              onChange={(v) => update("intensity", v)}
              options={[
                { value: "light", label: "leve" },
                { value: "medium", label: "médio" },
                { value: "strong", label: "forte" },
                { value: "aggressive", label: "agressivo" },
              ]}
            />
          </Field>
          <Field label="Polêmica (segmento)">
            <Seg<ControversyLevel>
              value={config.controversyLevel}
              onChange={(v) => update("controversyLevel", v)}
              options={[
                { value: "neutral", label: "neutro" },
                { value: "provocative", label: "provocativo" },
                { value: "controversial", label: "polêmico" },
                { value: "enemy_attack", label: "inimigo público" },
              ]}
            />
          </Field>
          <Field label="Storytelling (segmento)">
            <Seg<StorytellingLevel>
              value={config.storytellingLevel}
              onChange={(v) => update("storytellingLevel", v)}
              options={[
                { value: "none", label: "sem história" },
                { value: "example", label: "exemplo" },
                { value: "light_backstage", label: "bastidor leve" },
                { value: "heavy_backstage", label: "bastidor pesado" },
              ]}
            />
          </Field>
        </Section>

        <Divider />

        {/* Estratégia */}
        <Section title="Estratégia" emoji="🎯">
          <Field label="Objetivo">
            <Seg<PostGoal>
              value={config.postGoal}
              onChange={(v) => update("postGoal", v)}
              options={[
                { value: "engagement", label: "engajamento" },
                { value: "authority", label: "autoridade" },
                { value: "dm_conversion", label: "DM" },
                { value: "education", label: "educação" },
                { value: "series_narrative", label: "série" },
              ]}
            />
          </Field>
          <Field label="CTA">
            <Seg<CtaType>
              value={config.ctaType}
              onChange={(v) => update("ctaType", v)}
              options={[
                { value: "none", label: "sem CTA" },
                { value: "reflection", label: "reflexão" },
                { value: "comment", label: "comentário" },
                { value: "dm", label: "DM" },
                { value: "indirect", label: "indireto" },
              ]}
            />
          </Field>
        </Section>

        <Divider />

        {/* Estilo */}
        <Section title="Estilo" emoji="🎨">
          <Field label="Humanização">
            <Seg<HumanizationLevel>
              value={config.humanizationLevel}
              onChange={(v) => update("humanizationLevel", v)}
              options={[
                { value: "structured", label: "estruturado" },
                { value: "natural", label: "natural" },
                { value: "leaked_conversation", label: "conversa vazada" },
                { value: "bruno_signature", label: "Bruno Mota" },
              ]}
            />
          </Field>
          <Field label="Variação criativa (temperature)">
            <Seg<CreativeVariation>
              value={config.creativeVariation}
              onChange={(v) => update("creativeVariation", v)}
              options={[
                { value: "low", label: "baixa" },
                { value: "medium", label: "média" },
                { value: "high", label: "alta" },
                { value: "controlled_chaos", label: "caótica" },
              ]}
            />
          </Field>
          <Field label="Frases">
            <Seg<SentenceStyle>
              value={config.sentenceStyle}
              onChange={(v) => update("sentenceStyle", v)}
              options={[
                { value: "short", label: "curtas" },
                { value: "mixed", label: "mistas" },
                { value: "dense", label: "densas" },
              ]}
            />
          </Field>
          <Field label="Estrutura clássica (legacy)">
            <Seg<PostStructure>
              value={config.postStructure}
              onChange={(v) => update("postStructure", v)}
              options={[
                { value: "classic", label: "clássica" },
                { value: "story_insight", label: "história+insight" },
                { value: "bullets_punch", label: "bullets" },
                { value: "free_flow", label: "fluxo livre" },
              ]}
            />
          </Field>
        </Section>

        <Divider />

        {/* Anti-IA */}
        <Section title="Anti-IA (toggles finos)" emoji="🚫">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle
              label="evitar clichês de LinkedIn"
              value={config.avoidLinkedinCliches}
              onChange={(v) => update("avoidLinkedinCliches", v)}
            />
            <Toggle
              label="evitar tom motivacional"
              value={config.avoidMotivationalTone}
              onChange={(v) => update("avoidMotivationalTone", v)}
            />
            <Toggle
              label="evitar estrutura perfeita"
              value={config.avoidPerfectStructure}
              onChange={(v) => update("avoidPerfectStructure", v)}
            />
            <Toggle
              label="evitar palavras genéricas"
              value={config.avoidGenericWords}
              onChange={(v) => update("avoidGenericWords", v)}
            />
            <Toggle
              label="permitir gírias leves"
              value={config.allowLightSlang}
              onChange={(v) => update("allowLightSlang", v)}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-white/35">{label}</p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.05]" />;
}

interface SegOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              active
                ? "bg-blue-500/15 border-blue-500/50 text-blue-200"
                : "bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/80"
            }`}
          >
            <span>{opt.label}</span>
            {opt.hint && (
              <span className={`text-[10px] ${active ? "text-blue-400/70" : "text-white/25"}`}>
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 text-left ${
        value
          ? "bg-green-500/[0.07] border-green-500/25 text-green-200/90"
          : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] shrink-0 ${
          value ? "bg-green-400/30 border-green-400/60 text-green-200" : "border-white/20"
        }`}
      >
        {value ? "✓" : ""}
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-white/35 block mb-1">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
      />
    </label>
  );
}

function Slider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const intensityColor =
    value >= 9
      ? "text-red-400"
      : value >= 7
      ? "text-amber-400"
      : value >= 4
      ? "text-blue-300"
      : "text-white/40";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/65">{label}</span>
        <span className={`text-[12px] font-mono tabular-nums ${intensityColor}`}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 bg-white/[0.05] rounded-full appearance-none cursor-pointer accent-blue-500"
      />
      {hint && <p className="text-[10px] text-white/30 leading-tight">{hint}</p>}
    </div>
  );
}

function PresetBtn({
  label,
  emoji,
  onClick,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
