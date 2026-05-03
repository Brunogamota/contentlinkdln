"use client";

import { useState } from "react";
import { NeuralReference } from "@/lib/neural/types";
import { ScoreGrid, TopScore } from "./ScoreBadge";

interface ReferenceCardProps {
  reference: NeuralReference;
  onDelete: (id: string) => void;
  onToggleStrong: (id: string) => void;
}

export function ReferenceCard({ reference, onDelete, onToggleStrong }: ReferenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { strategicAnalysis: sa, scores } = reference;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        reference.isStrongReference
          ? "border-yellow-500/40 bg-yellow-500/[0.04]"
          : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      {/* Image + Header */}
      <div className="flex gap-4 p-4">
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
          <img
            src={reference.imageUrl}
            alt={reference.originalFileName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {reference.isStrongReference && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                  ⚡ FORTE
                </span>
              )}
              <span className="text-[10px] bg-white/5 text-white/40 border border-white/[0.08] px-2 py-0.5 rounded-full">
                {sa.contentType}
              </span>
            </div>
            <TopScore scores={scores} />
          </div>
          <p className="text-sm font-medium text-white/90 leading-tight truncate">
            {sa.mainSubject}
          </p>
          <p className="text-xs text-white/40 mt-0.5 truncate">
            {sa.dominantEmotion} · {sa.toneOfVoice}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {reference.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="px-4 pb-3">
        <ScoreGrid scores={scores} />
      </div>

      {/* Expanded Analysis */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
          <AnalysisRow label="Hook" value={sa.identifiedHook} />
          <AnalysisRow label="Estrutura" value={sa.narrativeStructure} />
          <AnalysisRow label="Por que funciona" value={sa.whyItWorks} />
          <AnalysisRow
            label="Padrões de linguagem"
            value={sa.languagePatterns.join(" · ")}
          />
          <AnalysisRow
            label="Gatilhos psicológicos"
            value={sa.psychologicalTriggers.join(" · ")}
          />
          <AnalysisRow
            label="O que reutilizar"
            value={sa.reusableElements.join(" · ")}
          />
          {reference.extractedText && (
            <AnalysisRow label="Texto extraído" value={reference.extractedText} />
          )}
          <div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Tags estratégicas</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {sa.strategicTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-purple-400/70 bg-purple-500/10 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-4 gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? "▲ fechar análise" : "▼ ver análise completa"}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStrong(reference.id)}
            className={`text-xs px-2 py-1 rounded-lg border transition-all ${
              reference.isStrongReference
                ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                : "border-white/10 text-white/30 hover:border-yellow-500/30 hover:text-yellow-400/60"
            }`}
          >
            ⚡ {reference.isStrongReference ? "forte" : "marcar forte"}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(reference.id)}
                className="text-xs px-2 py-1 rounded-lg border border-red-500/50 text-red-400 bg-red-500/10"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white/30"
              >
                cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white/30 hover:border-red-500/30 hover:text-red-400/60 transition-all"
            >
              deletar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
