"use client";

import { ReferenceScore } from "@/lib/neural/types";

const SCORE_CONFIG: {
  key: keyof ReferenceScore;
  label: string;
  color: string;
}[] = [
  { key: "virality", label: "Viral", color: "text-pink-400" },
  { key: "authority", label: "Auto", color: "text-blue-400" },
  { key: "controversy", label: "Polêm", color: "text-orange-400" },
  { key: "clarity", label: "Clar", color: "text-green-400" },
  { key: "authenticity", label: "Auth", color: "text-purple-400" },
  { key: "adaptationPotential", label: "Adapt", color: "text-yellow-400" },
];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-current ${color} transition-all`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ScoreGrid({ scores }: { scores: ReferenceScore }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-2">
      {SCORE_CONFIG.map(({ key, label, color }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40">{label}</span>
            <span className={`text-[10px] font-mono font-bold ${color}`}>
              {scores[key]}
            </span>
          </div>
          <ScoreBar value={scores[key]} color={color} />
        </div>
      ))}
    </div>
  );
}

export function TopScore({ scores }: { scores: ReferenceScore }) {
  const top = SCORE_CONFIG.reduce((best, curr) =>
    scores[curr.key] > scores[best.key] ? curr : best
  );
  return (
    <span className={`text-xs font-bold ${top.color}`}>
      {top.label} {scores[top.key]}
    </span>
  );
}
