import EmbedMap from "@/components/map/EmbedMap"

export const metadata = { title: "AirQo Air Quality Map" }

export default async function WebsiteMapIntegration({
  searchParams,
}: {
  searchParams: Promise<{ grid_id?: string | string[] }>
}) {
  const { grid_id } = await searchParams
  const gridId = typeof grid_id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(grid_id) ? grid_id : null
  if (!gridId) {
    return <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div><h1 className="text-xl font-semibold">Choose an AirQo grid</h1>
        <p className="mt-2">Add a valid grid_id to the map URL: ?grid_id=YOUR_GRID_ID</p></div>
    </main>
  }
  return <EmbedMap gridId={gridId} />
}
