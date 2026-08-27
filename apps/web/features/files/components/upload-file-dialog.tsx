"use client";

import { useState } from "react";
import { FileCategory } from "@witronix/shared";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/features/renders/components/upload-dropzone";
import { FILE_CATEGORY_LABELS } from "@/lib/labels";
import { useFileUpload, type UploadPhase } from "../hooks/use-file-upload";

const CATEGORY_ITEMS = Object.values(FileCategory).map((category) => ({
  value: category,
  label: FILE_CATEGORY_LABELS[category],
}));

const PHASE_LABEL: Record<UploadPhase, string> = {
  idle: "",
  creating: "Preparando la subida…",
  uploading: "Subiendo archivo…",
  confirming: "Confirmando…",
  done: "Listo",
  error: "",
};

export function UploadFileDialog({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FileCategory>(FileCategory.PLANO);
  const [description, setDescription] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(true);

  const upload = useFileUpload();
  const busy = upload.phase !== "idle" && upload.phase !== "error";

  function close() {
    setOpen(false);
    setFile(null);
    setName("");
    setDescription("");
    setCategory(FileCategory.PLANO);
    setVisibleToClient(true);
    upload.reset();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !name.trim()) return;

    const result = await upload.createFile(projectId, file, {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      isVisibleToClient: visibleToClient,
    });
    if (!result) return;

    await onUploaded();
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        Subir documento
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>
              Planos, fichas tecnicas, certificaciones, contratos…
            </DialogDescription>
          </DialogHeader>

          <UploadDropzone
            file={file}
            onSelect={(selected) => {
              setFile(selected);
              // Se propone el nombre del archivo sin extension como titulo,
              // que es lo que el usuario suele querer.
              if (selected && !name) {
                setName(selected.name.replace(/\.[^.]+$/, ""));
              }
            }}
            disabled={busy}
          />

          <div className="space-y-2">
            <Label htmlFor="file-name">Nombre</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              disabled={busy}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              items={CATEGORY_ITEMS}
              value={category}
              onValueChange={(value) => setCategory(value as FileCategory)}
              disabled={busy}
            >
              <SelectTrigger aria-label="Categoria del documento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-description">Descripcion (opcional)</Label>
            <Textarea
              id="file-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              disabled={busy}
            />
          </div>

          {/* Documentos internos: presupuestos en borrador, notas del equipo… */}
          <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={visibleToClient}
              onChange={(e) => setVisibleToClient(e.target.checked)}
              disabled={busy}
              className="accent-primary size-4"
            />
            Visible para el cliente
          </label>

          {busy && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-sm">
                <span>{PHASE_LABEL[upload.phase]}</span>
                {upload.phase === "uploading" && (
                  <span className="text-muted-foreground tabular-nums">
                    {upload.progress}%
                  </span>
                )}
              </div>
              <Progress
                value={upload.phase === "uploading" ? upload.progress : 100}
              />
            </div>
          )}

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
            <Button type="submit" disabled={!file || !name.trim() || busy}>
              <Upload />
              Subir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
