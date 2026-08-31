export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
