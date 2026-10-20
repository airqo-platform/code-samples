export function AppLoader() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading AirQo"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.08),_transparent_42%)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center text-center">
        <div className="relative grid h-24 w-24 place-items-center" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-border" />
          <div className="absolute inset-0 animate-[spin_1.35s_cubic-bezier(0.65,0,0.35,1)_infinite] rounded-full border-[3px] border-transparent border-r-primary/40 border-t-primary motion-reduce:animate-none" />
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary shadow-[0_12px_32px_hsl(var(--primary)/0.28)]">
            <span className="text-lg font-bold tracking-tight text-primary-foreground">airqo</span>
          </div>
          <span className="absolute right-1 top-3 h-2.5 w-2.5 rounded-full bg-success ring-4 ring-background" />
        </div>
        <p className="mt-6 text-base font-semibold text-foreground">Preparing your air quality data</p>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">This should only take a moment.</p>
        <span className="sr-only">Loading, please wait.</span>
      </div>
    </main>
  )
}

export default AppLoader
