"use client";

import { useRef, useState } from "react";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
    );
    if (valid.length > 0) onUpload(valid);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
        isUploading
          ? "border-blue-500/30 bg-blue-500/5 cursor-not-allowed"
          : isDragging
          ? "border-blue-400/70 bg-blue-500/10"
          : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
          </div>
          <p className="text-sm text-blue-400">analisando com IA...</p>
          <p className="text-xs text-white/25">isso leva alguns segundos</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
            🧠
          </div>
          <div>
            <p className="text-sm text-white/70 font-medium">
              solte prints aqui ou clique para enviar
            </p>
            <p className="text-xs text-white/30 mt-1">
              JPG, PNG, WEBP · até 5MB · múltiplos arquivos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
