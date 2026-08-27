"use client";

import { use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInvitationForm } from "@/features/auth/components/accept-invitation-form";

/**
 * Destino de los enlaces de invitacion que envia el backend
 * (`${PORTAL_URL}/invitacion/${token}` en mail.service.ts).
 */
export default function AcceptInvitationPage(
  props: PageProps<"/invitacion/[token]">,
) {
  const { token } = use(props.params);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activa tu cuenta</CardTitle>
        <CardDescription>
          Te han invitado al portal de proyectos de Witronix.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInvitationForm token={token} />
      </CardContent>
    </Card>
  );
}
