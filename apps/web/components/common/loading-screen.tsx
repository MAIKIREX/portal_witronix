/**
 * Pantalla de carga a pagina completa, para la rehidratacion de sesion.
 *
 * Deliberadamente sobria: durante el arranque no sabemos aun si el usuario
 * va a ver el portal o el login, asi que no se insinua ninguno de los dos.
 */
export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="border-muted border-t-primary size-6 animate-spin rounded-full border-2"
        aria-hidden="true"
      />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
