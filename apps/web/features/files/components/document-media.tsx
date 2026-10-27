"use client";

import { useState } from "react";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DocumentKind = "pdf" | "image" | "spreadsheet" | "cad" | "archive" | "text" | "other";

export function detectDocumentKind(
  mimeType?: string | null,
  filename?: string | null,
): DocumentKind {
  const ext = (filename?.split(".").pop() ?? "").toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }

  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"].includes(ext)
  ) {
    return "image";
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("ms-excel") ||
    ["xlsx", "xls", "csv"].includes(ext)
  ) {
    return "spreadsheet";
  }

  if (
    ["dwg", "dxf", "rvt", "ifc", "step", "stp", "skp", "bim"].includes(ext) ||
    mime === "image/vnd.dwg" ||
    mime === "application/acad"
  ) {
    return "cad";
  }

  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    ["zip", "7z", "rar", "tar", "gz"].includes(ext)
  ) {
    return "archive";
  }

  if (mime.startsWith("text/") || ["txt", "md", "json", "log"].includes(ext)) {
    return "text";
  }

  return "other";
}

interface DocumentMediaProps {
  src: string;
  filename: string;
  mimeType?: string | null;
  sizeBytes?: string | number;
  onRenew?: () => void;
  className?: string;
}

export function DocumentMedia({
  src,
  filename,
  mimeType,
  sizeBytes,
  onRenew,
  className,
}: DocumentMediaProps) {
  const kind = detectDocumentKind(mimeType, filename);

  switch (kind) {
    case "pdf":
      return (
        <PdfViewer
          src={src}
          filename={filename}
          onRenew={onRenew}
          className={className}
        />
      );
    case "image":
      return (
        <ImageViewer
          src={src}
          filename={filename}
          onRenew={onRenew}
          className={className}
        />
      );
    default:
      return (
        <FallbackViewer
          kind={kind}
          src={src}
          filename={filename}
          sizeBytes={sizeBytes}
          className={className}
        />
      );
  }
}

function PdfViewer({
  src,
  filename,
  onRenew,
  className,
}: {
  src: string;
  filename: string;
  onRenew?: () => void;
  className?: string;
}) {
  const [iframeError, setIframeError] = useState(false);

  // Configuramos parámetros de visualización estándar de Adobe/Chromium PDF:
  // - navpanes=1: activa el panel lateral con miniaturas de páginas
  // - toolbar=1: barra de herramientas nativa con zoom, paginación y búsqueda
  // - view=FitH: ajusta el ancho de página automáticamente
  const pdfEmbedUrl = `${src}#toolbar=1&navpanes=1&view=FitH`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Barra superior de herramientas del visor de PDF */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
            PDF
          </span>
          <span className="text-muted-foreground truncate max-w-[220px] sm:max-w-xs font-medium">
            {filename}
          </span>
          <span className="hidden md:inline text-muted-foreground/70">
            · Soporta múltiples páginas, miniaturas y zoom nativo
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onRenew && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onRenew}
              title="Renovar enlace de visualización"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Recargar</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="xs"
            render={
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir PDF en pestaña completa"
              />
            }
            nativeButton={false}
          >
            <Maximize2 className="size-3.5" />
            <span>Pantalla completa</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            render={
              <a
                href={src}
                download={filename}
                title="Descargar archivo PDF"
              />
            }
            nativeButton={false}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </Button>
        </div>
      </div>

      {/* Contenedor del documento PDF */}
      <div className="relative w-full h-[650px] sm:h-[750px] lg:h-[820px] bg-muted/20">
        {iframeError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No se pudo cargar el visor integrado</p>
              <p className="text-xs text-muted-foreground">
                Puedes abrir el documento directamente en una pestaña nueva.
              </p>
            </div>
            <Button
              size="sm"
              render={
                <a href={src} target="_blank" rel="noopener noreferrer" />
              }
              nativeButton={false}
            >
              <ExternalLink className="size-4" />
              Abrir PDF en pestaña nueva
            </Button>
          </div>
        ) : (
          <iframe
            src={pdfEmbedUrl}
            title={`Visualización de ${filename}`}
            className="size-full border-0 bg-white dark:bg-zinc-950"
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      {/* Nota de ayuda para pantallas táctiles o móviles */}
      <div className="border-t bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>
          Navega entre páginas con la rueda del ratón o con la barra lateral de miniaturas del visor.
        </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium sm:hidden"
        >
          Ver en pestaña nueva
        </a>
      </div>
    </div>
  );
}

function ImageViewer({
  src,
  filename,
  onRenew,
  className,
}: {
  src: string;
  filename: string;
  onRenew?: () => void;
  className?: string;
}) {
  const [fit, setFit] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
            Imagen
          </span>
          <span className="text-muted-foreground truncate max-w-[220px] sm:max-w-xs font-medium">
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setFit((v) => !v)}
            title={fit ? "Ver tamaño 100%" : "Ajustar al contenedor"}
          >
            {fit ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
            <span>{fit ? "100%" : "Ajustar"}</span>
          </Button>

          {onRenew && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onRenew}
              title="Renovar enlace de visualización"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="xs"
            render={
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir imagen original"
              />
            }
            nativeButton={false}
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Abrir original</span>
          </Button>

          <Button
            variant="ghost"
            size="xs"
            render={<a href={src} download={filename} title="Descargar imagen" />}
            nativeButton={false}
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Contenedor de la imagen */}
      <div className="relative flex min-h-[480px] max-h-[750px] w-full items-center justify-center overflow-auto bg-muted/30 p-4">
        {loadFailed ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium">No se pudo cargar la imagen</p>
            {onRenew && (
              <Button size="xs" variant="outline" onClick={onRenew}>
                Reintentar
              </Button>
            )}
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={filename}
            onError={() => setLoadFailed(true)}
            className={cn(
              "transition-all duration-150 rounded shadow-sm",
              fit ? "max-h-[700px] w-auto max-w-full object-contain" : "max-w-none",
            )}
          />
        )}
      </div>
    </div>
  );
}

function FallbackViewer({
  kind,
  src,
  filename,
  sizeBytes,
  className,
}: {
  kind: DocumentKind;
  src: string;
  filename: string;
  sizeBytes?: string | number;
  className?: string;
}) {
  const ext = (filename.split(".").pop() ?? "").toUpperCase();

  const config: Record<
    DocumentKind,
    {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      desc: string;
    }
  > = {
    pdf: {
      icon: FileText,
      label: "Documento PDF",
      desc: `Archivo PDF (${ext}). Descárgalo para abrirlo en tu lector de documentos.`,
    },
    image: {
      icon: FileText,
      label: "Imagen",
      desc: `Archivo de imagen (${ext}). Descárgalo para abrirlo en tu visor de imágenes.`,
    },
    cad: {
      icon: Layers,
      label: "Plano Técnico / Modelo CAD-BIM",
      desc: `Este archivo (${ext}) contiene geometría técnica o planimetría especializada. Para revisarlo o editarlo con precisión milimétrica, descárgalo y ábrelo en AutoCAD, Revit u otro visor BIM.`,
    },
    spreadsheet: {
      icon: FileSpreadsheet,
      label: "Hoja de Cálculo",
      desc: `Archivo tabular (${ext}). Para visualizar fórmulas, tablas de cómputo y métricas, descárgalo para abrirlo en Excel o tu programa de hojas de cálculo preferido.`,
    },
    archive: {
      icon: FileArchive,
      label: "Archivo Comprimido",
      desc: `Paquete de archivos comprimidos (${ext}). Descárgalo para descomprimir y explorar su contenido en tu equipo.`,
    },
    text: {
      icon: FileCode,
      label: "Documento de Texto o Código",
      desc: `Archivo en formato ${ext}. Puedes descargarlo o abrirlo directamente en tu navegador.`,
    },
    other: {
      icon: FileText,
      label: "Documento del Proyecto",
      desc: `Archivo en formato ${ext || "binario"}. Descárgalo para abrirlo con el software compatible correspondiente en tu sistema.`,
    },
  };

  const selectedConfig = config[kind];
  const Icon = selectedConfig.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 sm:p-12 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
        <Icon className="size-10 text-primary" />
      </div>

      <div className="mt-4 max-w-md space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
            {ext}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {selectedConfig.label}
          </span>
        </div>

        <h3 className="font-heading text-base font-semibold text-foreground break-all">
          {filename}
        </h3>

        {sizeBytes && (
          <p className="text-xs font-mono text-muted-foreground">
            {formatBytes(sizeBytes)}
          </p>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed pt-2">
          {selectedConfig.desc}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="sm"
          render={<a href={src} download={filename} />}
          nativeButton={false}
        >
          <Download className="size-4" />
          Descargar archivo
        </Button>

        <Button
          size="sm"
          variant="outline"
          render={<a href={src} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          <ExternalLink className="size-4" />
          Abrir en pestaña nueva
        </Button>
      </div>
    </div>
  );
}
