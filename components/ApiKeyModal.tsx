"use client";

import { useState, useEffect } from "react";
import { getApiKey, setApiKey, hasApiKey } from "@/lib/settings";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ open, onClose }: Props) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) setValue(getApiKey());
  }, [open]);

  const save = () => {
    setApiKey(value);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div>
          <h2 className="text-base font-bold text-white">Configurar API Key</h2>
          <p className="text-xs text-white/40 mt-1">
            Sua key fica salva só no seu browser. Nunca é enviada pra nenhum servidor nosso.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <p className="text-[11px] text-white/25">
            Pega em{" "}
            <span className="text-blue-400/70">platform.openai.com/api-keys</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white/70 text-sm rounded-xl transition-all"
          >
            cancelar
          </button>
          <button
            onClick={save}
            disabled={!value.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
          >
            {saved ? "salvo ✓" : "salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApiKeyButton({ onClick }: { onClick: () => void }) {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(hasApiKey());
  }, []);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
        configured
          ? "border-green-500/30 text-green-400/70 hover:border-green-500/50"
          : "border-orange-500/40 text-orange-400 hover:border-orange-500/60 animate-pulse"
      }`}
    >
      <span>{configured ? "🔑" : "⚠️"}</span>
      <span>{configured ? "key ok" : "add key"}</span>
    </button>
  );
}
