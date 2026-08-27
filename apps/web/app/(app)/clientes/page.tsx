"use client";

import { PageHeader } from "@/components/common/page-header";
import { ClientsList } from "@/features/clients/components/clients-list";
import { InviteUserDialog } from "@/features/auth/components/invite-user-dialog";

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Empresas y personas con acceso al portal."
        actions={<InviteUserDialog />}
      />
      <ClientsList />
    </div>
  );
}
