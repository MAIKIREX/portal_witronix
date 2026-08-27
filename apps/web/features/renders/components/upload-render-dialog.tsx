"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RenderType } from "@witronix/shared";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RENDER_TYPE_LABELS } from "@/lib/labels";
import { useRenderUpload, type UploadPhase } from "../hooks/use-render-upload";
import { UploadDropzone } from "./upload-dropzone";

const TYPE_ITEMS = Object.values(RenderType).map((type) => ({
  value: type,
  label: RENDER_TYPE_LABELS[type],
}));

const PHASE_LABEL: Record<UploadPhase, string> = {
  idle: "",
  creating: "Preparando la subida…",
  uploading: "Subiendo archivo…",
  confirming: "Confirmando…",
  done: "Listo",
  error: "",
};

/**
 * Tras confirmar, el backend genera la miniatura en SEGUNDO PLANO: `thumbnailKey`
 * llega null en la respuesta. Por eso se vuelve a pedir el listado unos segundos
 * despues, para que la miniatura aparezca sola sin que el usuario recargue.
 */
const THUMBNAIL_DELAY_MS = 4000;

function scheduleThumbnailRefresh(refetch: () => void | Promise<void>) {
  setTimeout(() => void refetch(), THUMBNAIL_DELAY_MS);
}

// ---------------------------------------------------------------------------
//  Render nuevo
// ---------------------------------------------------------------------------

export function UploadRenderDialog({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState<RenderType>(RenderType.INTERIOR);
  const [description, setDescription] = useState("");

  const upload = useRenderUpload();
  const busy = upload.phase !== "idle" && upload.phase !== "error";

  function close() {
    setOpen(false);
    setFile(null);
    setTitle("");
    setArea("");
    setDescription("");
    setType(RenderType.INTERIOR);
    upload.reset();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) return;

    const result = await upload.createRender(projectId, file, {
      title: title.trim(),
      area: area.trim() || undefined,
      type,
      description: description.trim() || undefined,
    });

    if (!result) return; // el hook ya ha avisado del error
    await onUploaded();
    scheduleThumbnailRefresh(onUploaded);
    close();
    router.push(`/proyectos/${projectId}/renders/${result.renderId}`);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        Subir render
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Subir render</DialogTitle>
            <DialogDescription>
              El archivo se sube directamente al almacenamiento.
            </DialogDescription>
          </DialogHeader>

          <UploadDropzone file={file} onSelect={setFile} disabled={busy} />

          <div className="space-y-2">
            <Label htmlFor="render-title">Titulo</Label>
            <Input
              id="render-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={busy}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="render-area">Area (opcional)</Label>
              <Input
                id="render-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                maxLength={120}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(value) => setType(value as RenderType)}
                disabled={busy}
              >
                <SelectTrigger aria-label="Tipo de render">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="render-description">Descripcion (opcional)</Label>
            <Textarea
              id="render-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={busy}
            />
          </div>

          <UploadProgress upload={upload} />

          <DialogFooter>
            {busy ? (
              <Button type="button" variant="outline" onClick={upload.cancel}>
                Cancelar
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={close}>
                Cerrar
              </Button>
            )}
            <Button type="submit" disabled={!file || !title.trim() || busy}>
              <Upload />
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
//  Version nueva de un render existente
// ---------------------------------------------------------------------------

export function UploadVersionDialog({
  renderId,
  onUploaded,
}: {
  renderId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const upload = useRenderUpload();
  const busy = upload.phase !== "idle" && upload.phase !== "error";

  function close() {
    setOpen(false);
    setFile(null);
    setNotes("");
    upload.reset();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    const version = await upload.addVersion(
      renderId,
      file,
      notes.trim() || undefined,
    );
    if (!version) return;

    await onUploaded();
    scheduleThumbnailRefresh(onUploaded);
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus />
        Nueva version
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Subir una version nueva</DialogTitle>
            <DialogDescription>
              Las versiones anteriores se conservan; no se sobrescribe nada.
            </DialogDescription>
          </DialogHeader>

          <UploadDropzone file={file} onSelect={setFile} disabled={busy} />

          <div className="space-y-2">
            <Label htmlFor="version-notes">Notas del cambio (opcional)</Label>
            <Textarea
              id="version-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={busy}
              placeholder="Que ha cambiado respecto a la version anterior"
            />
          </div>

          <UploadProgress upload={upload} />

          <DialogFooter>
            {busy ? (
              <Button type="button" variant="outline" onClick={upload.cancel}>
                Cancelar
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={close}>
                Cerrar
              </Button>
            )}
            <Button type="submit" disabled={!file || busy}>
              <Upload />
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadProgress({
  upload,
}: {
  upload: ReturnType<typeof useRenderUpload>;
}) {
  if (upload.phase === "idle" || upload.phase === "error") return null;

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span>{PHASE_LABEL[upload.phase]}</span>
        {upload.phase === "uploading" && (
          <span className="text-muted-foreground tabular-nums">
            {upload.progress}%
          </span>
        )}
      </div>
      {/* Durante "creating" y "confirming" no hay porcentaje real: se deja la
          barra al valor que corresponda para no fingir progreso. */}
      <Progress
        value={upload.phase === "uploading" ? upload.progress : 100}
      />
    </div>
  );
}
