"use client";

import { PageHeader } from "@/components/common/page-header";
import { NotificationsInbox } from "@/features/notifications/components/notifications-inbox";

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Notificaciones"
        description="Avisos de tus proyectos."
      />
      <NotificationsInbox />
    </div>
  );
}
