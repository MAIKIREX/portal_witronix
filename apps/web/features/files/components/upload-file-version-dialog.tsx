"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/features/renders/components/upload-dropzone";
import { useFileUpload } from "../hooks/use-file-upload";

/** Version nueva de un documento existente. Las anteriores se conservan. */
export function UploadFileVersionDialog({
  fileId,
  onUploaded,
}: {
  fileId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const upload = useFileUpload();
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
      fileId,
      file,
      notes.trim() || undefined,
    );
    if (!version) return;
    await onUploaded();
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
              El historico se conserva; no se sobrescribe nada.
            </DialogDescription>
          </DialogHeader>

          <UploadDropzone file={file} onSelect={setFile} disabled={busy} />

          <div className="space-y-2">
            <Label htmlFor="file-version-notes">
              Notas del cambio (opcional)
            </Label>
            <Textarea
              id="file-version-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={busy}
              placeholder="Que ha cambiado respecto a la version anterior"
            />
          </div>

          {busy && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {upload.phase === "uploading"
                    ? "Subiendo archivo…"
                    : upload.phase === "confirming"
                      ? "Confirmando…"
                      : "Preparando la subida…"}
                </span>
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
