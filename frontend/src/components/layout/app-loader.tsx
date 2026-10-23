export function AppLoader() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading AirQo"
    >
      <div className="SecondaryMainloader route-loader text-primary" aria-label="Loading" />
    </main>
  )
}

export default AppLoader
