"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useSession } from "@/features/auth/hooks/use-session";

/**
 * Raiz: reparte segun haya sesion o no.
 * No pinta nada propio; espera a que termine la rehidratacion.
 */
export default function RootPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    else if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  return <LoadingScreen />;
}
