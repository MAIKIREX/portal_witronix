"use client";

import { useRef, useState } from "react";
import { FileImage, Upload, X } from "lucide-react";
import { ALLOWED_MIME_TYPES } from "@witronix/shared";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 500;

/**
 * Selector de archivo con arrastrar y soltar.
 *
 * Se valida en el cliente lo mismo que valida el backend (tipo y tamano) para
 * no gastar una peticion que devolveria 400 y, sobre todo, para no empezar a
 * subir 400 MB que van a ser rechazados.
 */
export function UploadDropzone({
  file,
  onSelect,
  disabled,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(candidate: File): string | null {
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      return `El archivo pesa ${formatBytes(candidate.size)} y el limite son ${MAX_SIZE_MB} MB.`;
    }
    // El tipo se compara con la misma lista que usa el backend
    // (ALLOWED_MIME_TYPES en @witronix/shared).
    if (candidate.type && !ALLOWED_MIME_TYPES.includes(candidate.type)) {
      return `Tipo de archivo no permitido: ${candidate.type}`;
    }
    return null;
  }

  function handleFile(candidate: File | undefined) {
    if (!candidate) return;
    const problem = validate(candidate);
    setError(problem);
    onSelect(problem ? null : candidate);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <FileImage className="text-muted-foreground size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(file.size)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => {
            onSelect(null);
            setError(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          aria-label="Quitar archivo"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <Upload className="text-muted-foreground size-5" />
        <p className="text-sm">Arrastra el archivo aqui</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Elegir archivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
