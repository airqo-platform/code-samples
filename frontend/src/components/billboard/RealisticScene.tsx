"use client"

import { useEffect, useRef, useState } from "react"
import ActionFrames from "./ActionFrames"
import { sceneCategory, scenesForCategory, shuffledScenes } from "@/lib/realistic-scenes"

export default function RealisticScene({ pm }: { pm: number | null | undefined }) {
  const category = sceneCategory(pm)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const bag = useRef<number[]>([])
  const previous = useRef<number>()
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const changed = () => setReduced(preference.matches)
    changed(); preference.addEventListener("change", changed)
    return () => preference.removeEventListener("change", changed)
  }, [])
  useEffect(() => {
    bag.current = shuffledScenes(); previous.current = undefined
    const first = bag.current.shift()!
    previous.current = first; setIndex(first)
  }, [category])
  useEffect(() => {
    if (!category || paused || reduced) return
    const timer = setInterval(() => {
      if (!bag.current.length) bag.current = shuffledScenes(previous.current)
      const next = bag.current.shift()!
      previous.current = next; setIndex(next)
    }, 9000)
    return () => clearInterval(timer)
  }, [category, paused, reduced])
  useEffect(() => {
    if (!category || reduced) return
    // Preload only the next scene in this category, never all thirty images.
    const next = bag.current[0]
    if (next != null) { const image = new window.Image(); image.src = scenesForCategory(category)[next].actionSrc }
  }, [category, index, reduced])
  if (!category) return null
  const scene = scenesForCategory(category)[index]
  const loop = ["jog", "walk", "cycle", "type"].includes(scene.motion)
  return <figure className={`realistic-scene relative z-10 w-full max-w-80 text-center ${paused || reduced ? "is-paused" : ""}`}>
    <div className="realistic-stage relative mx-auto flex h-60 items-end justify-center overflow-hidden">
      <span aria-hidden="true" className="realistic-shadow absolute bottom-1 h-3 w-32 rounded-[50%] bg-black/15 blur-sm" />
      <div key={scene.src} className="realistic-enter relative h-full w-full">
        {reduced ? <img src={scene.src} alt={scene.title} width={360} height={360} className="mx-auto h-full w-full object-contain object-bottom" /> : <ActionFrames src={scene.actionSrc} poster={scene.src} title={scene.title} duration={scene.duration * (loop ? 1 : 2)} paused={paused} loop={loop} />}
      </div>
    </div>
    <figcaption className="mt-2 text-xs font-medium text-[var(--billboard-muted)]">{scene.title}</figcaption>
    {!reduced && <button type="button" onClick={() => setPaused(!paused)} className="mt-2 rounded-lg px-3 py-1 text-xs text-[var(--billboard-muted)] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)]">{paused ? "Play animations" : "Pause animations"}</button>}
  </figure>
}
