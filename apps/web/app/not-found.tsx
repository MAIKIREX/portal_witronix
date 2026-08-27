import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground font-mono text-sm">404</p>
        <h1 className="font-heading text-xl font-semibold">
          Esta pagina no existe
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Puede que el enlace sea antiguo o que no tengas acceso a este
          recurso.
        </p>
      </div>
      {/* OJO: el estilo shadcn de este proyecto es base-nova, sobre @base-ui/react
          y NO sobre Radix. Aqui no existe `asChild`: para renderizar el boton
          como otro elemento se usa `render` + `nativeButton={false}`. */}
      <Button render={<Link href="/" />} nativeButton={false}>
        Volver al inicio
      </Button>
    </main>
  );
}
