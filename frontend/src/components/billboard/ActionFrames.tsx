"use client"

import { useState, type CSSProperties } from "react"

export default function ActionFrames({ src, poster, title, duration, paused, loop }: { src: string; poster: string; title: string; duration: number; paused: boolean; loop: boolean }) {
  const [ready, setReady] = useState(false)
  const style = {
    animationName: loop ? "action-cycle" : "action-gesture",
    animationDuration: `${loop ? duration : duration / 2}ms`,
    animationTimingFunction: `steps(${loop ? 8 : 7}, end)`,
    animationDirection: loop ? "normal" : "alternate",
    animationPlayState: paused ? "paused" : "running",
    visibility: ready ? "visible" : "hidden",
  } as CSSProperties
  return <div role="img" aria-label={title} className="relative mx-auto h-full w-[180px] overflow-hidden">
    {!ready && <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain object-bottom" />}
    <img src={src} alt="" width={1536} height={256} onLoad={() => setReady(true)} onError={() => setReady(false)} className="action-strip" style={style} />
  </div>
}
