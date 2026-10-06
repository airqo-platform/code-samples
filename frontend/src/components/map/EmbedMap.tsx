"use client"

import dynamic from "next/dynamic"

const GridMap = dynamic(() => import("./GridMap"), {
  ssr: false,
  loading: () => <div role="status" className="flex h-screen items-center justify-center">Loading map…</div>,
})

export default function EmbedMap({ gridId }: { gridId: string }) {
  return <GridMap key={gridId} gridId={gridId} />
}
