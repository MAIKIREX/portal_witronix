"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/http";
import { filesApi } from "../api";

/**
 * Descarga un documento.
 *
 * La URL firmada se pide EN EL MOMENTO del clic, no al pintar la fila: caduca
 * en 300 s, asi que precargarla para toda una tabla daria enlaces muertos en
 * cuanto el usuario se entretuviera un poco.
 */
export function DownloadButton({
  fileId,
  versionId,
  disabled,
  label,
  icon = <Download />,
  variant = "ghost",
}: {
  fileId: string;
  versionId?: string;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  variant?: "ghost" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const result = versionId
        ? await filesApi.downloadVersion(fileId, versionId)
        : await filesApi.download(fileId);

      // Se abre en una pestana nueva en vez de navegar: si el navegador decide
      // mostrar el archivo en lugar de descargarlo (un PDF, por ejemplo), el
      // usuario no pierde la pagina en la que estaba.
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.rel = "noreferrer";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      sileo.error({
        title: "No se pudo descargar",
        description: isApiError(error) ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={label ? "sm" : "icon-sm"}
      disabled={disabled || loading}
      onClick={handleDownload}
      aria-label={label ? undefined : "Descargar"}
    >
      {loading ? <Loader2 className="animate-spin" /> : icon}
      {label}
    </Button>
  );
}
