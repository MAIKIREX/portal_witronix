"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { useCurrentUser } from "@/features/auth/hooks/use-session";
import { ROLE_LABELS } from "@/lib/labels";

export default function ProfilePage() {
  const user = useCurrentUser();

  return (
    <div className="space-y-8">
      <PageHeader title="Mi cuenta" description="Tus datos y tu contrasena." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-sm font-medium">Datos</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rol</dt>
                <dd>{ROLE_LABELS[user.role]}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs">
              Para cambiar tu nombre o tu email, avisa a un administrador.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-medium">Cambiar contrasena</h2>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
