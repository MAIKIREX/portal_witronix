"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TargetType } from "@witronix/shared";
import { ClipboardCheck } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { usePermissions } from "@/features/auth/hooks/use-permissions";
import { approvalsApi } from "../api";

/**
 * Pide la aprobacion de un objeto concreto (normalmente una version de render).
 * Solo para el equipo interno: @Roles(ADMIN, PROJECT_MANAGER, TECHNICIAN).
 */
export function RequestApprovalButton({
  projectId,
  targetType,
  targetId,
  label = "Solicitar aprobacion",
}: {
  projectId: string;
  targetType: TargetType;
  targetId: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const { canRequestApproval } = usePermissions();

  const { mutate, isPending } = useMutation(
    () =>
      approvalsApi.create(projectId, {
        targetType,
        targetId,
        comment: comment.trim() || undefined,
      }),
    {
      successToast: "Aprobacion solicitada",
      onSuccess: (approval) => {
        setOpen(false);
        setComment("");
        router.push(`/proyectos/${projectId}/aprobaciones/${approval.id}`);
      },
    },
  );

  if (!canRequestApproval) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <ClipboardCheck />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar aprobacion</DialogTitle>
          <DialogDescription>
            El cliente recibira un aviso para revisarlo.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Contexto para quien revisa (opcional)"
          rows={3}
          maxLength={2000}
          disabled={isPending}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={() => void mutate()}>
            Solicitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
