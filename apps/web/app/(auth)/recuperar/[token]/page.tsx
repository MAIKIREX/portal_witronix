"use client";

import { use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

/**
 * Destino de los enlaces de recuperacion que envia el backend
 * (`${PORTAL_URL}/recuperar/${token}` en mail.service.ts).
 *
 * En Next 16 `params` es una Promise: en un Client Component se desenvuelve
 * con `use()`. `PageProps<'/recuperar/[token]'>` es un helper global generado
 * por Next, no hay que importarlo.
 */
export default function ResetPasswordPage(
  props: PageProps<"/recuperar/[token]">,
) {
  const { token } = use(props.params);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contrasena</CardTitle>
        <CardDescription>
          Elige una contrasena para tu cuenta del portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
