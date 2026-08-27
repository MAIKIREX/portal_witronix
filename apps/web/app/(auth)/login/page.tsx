import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Entrar · Portal Witronix" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Accede con la cuenta que te ha facilitado Witronix.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* LoginForm lee `redirect` con useSearchParams, que exige un limite
            de <Suspense> o `next build` falla al prerenderizar. */}
        <Suspense fallback={<div className="h-56" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
