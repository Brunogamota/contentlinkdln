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
        {/* 1. Tamanho */}
        <Section title="Tamanho do post" emoji="📏">
          <Seg<ContentLengthMode>
            value={config.contentLengthMode}
            onChange={(v) => update("contentLengthMode", v)}
            options={[
              { value: "short", label: "curto", hint: "até 600" },
              { value: "medium", label: "médio", hint: "600–1200" },
              { value: "long", label: "longo", hint: "1200–2500" },
              { value: "custom", label: "custom" },
            ]}
          />
          {config.contentLengthMode === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumberInput
                label="mínimo"
                value={config.minChars}
                onChange={(v) => update("minChars", v)}
                min={50}
                max={5000}
              />
              <NumberInput
                label="máximo"
                value={config.maxChars}
                onChange={(v) => update("maxChars", v)}
                min={100}
                max={5000}
              />
            </div>
          )}
          <Toggle
            label="respeitar limite rigidamente"
            value={config.hardLimit}
            onChange={(v) => update("hardLimit", v)}
          />
        </Section>

        <Divider />

        {/* 2. Tom e tensão */}
        <Section title="Tom e tensão" emoji="🔥">
          <Field label="Intensidade">
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
          <Field label="Polêmica">
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
        </Section>

        <Divider />

        {/* 3. Narrativa */}
        <Section title="Narrativa" emoji="📖">
          <Field label="Storytelling">
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
          <Field label="Estrutura">
            <Seg<PostStructure>
              value={config.postStructure}
              onChange={(v) => update("postStructure", v)}
              options={[
                { value: "classic", label: "clássico" },
                { value: "story_insight", label: "história" },
                { value: "bullets_punch", label: "bullets" },
                { value: "free_flow", label: "fluxo livre" },
              ]}
            />
          </Field>
        </Section>

        <Divider />

        {/* 4. Estratégia */}
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

        {/* 5. Estilo */}
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
          <Field label="Variação criativa">
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
        </Section>

        <Divider />

        {/* 6. Anti-IA */}
        <Section title="Anti-IA" emoji="🚫">
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
              label="evitar estrutura perfeita demais"
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
