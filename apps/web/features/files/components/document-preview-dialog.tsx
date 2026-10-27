"use client";

import { Download, ExternalLink, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { detectDocumentKind } from "./document-media";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  filename: string;
  mimeType?: string | null;
  version: number;
  onRenew?: () => void;
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  url,
  filename,
  mimeType,
  version,
  onRenew,
}: DocumentPreviewDialogProps) {
  const kind = detectDocumentKind(mimeType, filename);
  const pdfUrl = url ? `${url}#toolbar=1&navpanes=1&view=FitH` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl w-full h-[90vh] flex flex-col p-0 overflow-hidden gap-0 rounded-xl bg-background border shadow-2xl">
        {/* Barra superior de herramientas del modal */}
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3 bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-8">
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase shrink-0">
              V{version}
            </span>
            <DialogTitle className="text-sm font-medium truncate text-foreground">
              {filename}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pr-6">
            {onRenew && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onRenew}
                title="Recargar enlace"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden md:inline">Recargar</span>
              </Button>
            )}

            {url && (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  render={
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir en pestaña nueva"
                    />
                  }
                  nativeButton={false}
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Pestaña nueva</span>
                </Button>

                <Button
                  variant="outline"
                  size="xs"
                  render={
                    <a
                      href={url}
                      download={filename}
                      title="Descargar archivo"
                    />
                  }
                  nativeButton={false}
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Cuerpo del visor dentro del modal */}
        <div className="relative flex-1 w-full h-full min-h-0 bg-muted/20 overflow-hidden">
          {!url ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Cargando documento…
            </div>
          ) : kind === "pdf" ? (
            <iframe
              src={pdfUrl}
              title={`Previsualización de ${filename}`}
              className="size-full border-0 bg-white dark:bg-zinc-950"
            />
          ) : kind === "image" ? (
            <div className="flex size-full items-center justify-center p-4 overflow-auto bg-zinc-950/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={filename}
                className="max-h-full max-w-full object-contain rounded shadow-md"
              />
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm font-medium">
                Este formato ({filename.split(".").pop()?.toUpperCase()}) no dispone de visor embebido.
              </p>
              <Button
                size="sm"
                render={<a href={url} download={filename} />}
                nativeButton={false}
              >
                <Download className="size-4" />
                Descargar archivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
