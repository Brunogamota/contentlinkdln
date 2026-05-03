"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NeuralReference } from "@/lib/neural/types";
import {
  getAllReferences,
  saveReference,
  deleteReference,
  toggleStrongReference,
} from "@/lib/neural/store";
import { UploadZone } from "@/components/neural-base/UploadZone";
import { ReferenceCard } from "@/components/neural-base/ReferenceCard";

export default function NeuralBasePage() {
  const [references, setReferences] = useState<NeuralReference[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    setReferences(getAllReferences());
  }, []);

  const refresh = () => setReferences(getAllReferences());

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadErrors([]);
    setUploadingCount(files.length);
    setUploadedCount(0);

    const errors: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/neural/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          errors.push(`${file.name}: ${data.error}`);
        } else {
          saveReference(data as NeuralReference);
          setUploadedCount((c) => c + 1);
        }
      } catch {
        errors.push(`${file.name}: erro de conexão`);
      }
    }

    setUploadErrors(errors);
    setIsUploading(false);
    setUploadingCount(0);
    setUploadedCount(0);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteReference(id);
    refresh();
  };

  const handleToggleStrong = (id: string) => {
    toggleStrongReference(id);
    refresh();
  };

  const filtered = search.trim()
    ? references.filter(
        (r) =>
          r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          r.strategicAnalysis.mainSubject.toLowerCase().includes(search.toLowerCase()) ||
          r.strategicAnalysis.contentType.toLowerCase().includes(search.toLowerCase())
      )
    : references;

  const strongCount = references.filter((r) => r.isStrongReference).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white/30 hover:text-white/70 transition-colors text-sm"
            >
              ← voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span className="text-purple-400">🧠</span> base neural
              </h1>
              <p className="text-xs text-white/25 mt-0.5">
                {references.length} referência{references.length !== 1 ? "s" : ""}
                {strongCount > 0 && ` · ${strongCount} forte${strongCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full">
              inteligência proprietária
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight leading-tight">
            Seu cérebro de referências.
            <br />
            <span className="text-white/25">Quanto mais prints, melhor o gerador fica.</span>
          </h2>
        </div>

        {/* Upload Zone */}
        <div className="space-y-3">
          <UploadZone onUpload={handleUpload} isUploading={isUploading} />

          {isUploading && uploadingCount > 1 && (
            <p className="text-xs text-center text-white/30">
              analisando {uploadedCount} de {uploadingCount}...
            </p>
          )}

          {uploadErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
              {uploadErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* References */}
        {references.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/40 uppercase tracking-widest shrink-0">
                Referências
              </label>
              {references.length > 2 && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="filtrar por tag ou assunto..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                />
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">
                nenhuma referência com "{search}"
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((ref) => (
                  <ReferenceCard
                    key={ref.id}
                    reference={ref}
                    onDelete={handleDelete}
                    onToggleStrong={handleToggleStrong}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {references.length === 0 && !isUploading && (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">🧠</div>
            <p className="text-white/40 text-sm">base neural vazia</p>
            <p className="text-white/20 text-xs max-w-xs mx-auto">
              Sobe prints de posts que performaram bem. A IA extrai padrões e usa como contexto na geração.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
