export type SceneCategory = "good" | "moderate" | "sensitive" | "unhealthy" | "very" | "hazardous"
export type RealisticScene = { category: SceneCategory; index: number; title: string; motion: string; src: string; actionSrc: string; duration: number }

const scenes: Record<SceneCategory, [string, string][]> = {
  good: [["A refreshing run", "jog"], ["Time for football", "kick"], ["A moment of yoga", "balance"], ["Enjoy a bicycle ride", "cycle"], ["Stretch before you start", "stretch"]],
  moderate: [["Take a gentle walk", "walk"], ["Take a restful break", "rest"], ["A gentle shoulder stretch", "stretch"], ["Enjoy a quiet read", "read"], ["Check the air before heading out", "check"]],
  sensitive: [["Gentle yoga indoors", "balance"], ["Read in a cleaner indoor space", "read"], ["Make time for drawing indoors", "sketch"], ["Rest and stay hydrated indoors", "drink"], ["Try a gentle seated stretch indoors", "stretch"]],
  unhealthy: [["Choose a quiet indoor read", "read"], ["Enjoy an indoor puzzle", "puzzle"], ["Work from a cleaner indoor space", "type"], ["Take a quiet indoor break", "rest"], ["Use cleaner indoor air where available", "purify"]],
  very: [["Check your air purifier", "purify"], ["Take a quiet indoor moment", "balance"], ["Limit polluted outdoor air entering", "close"], ["Follow local air quality updates", "check"], ["Choose a calm indoor activity", "sketch"]],
  hazardous: [["Keep polluted outdoor air outside", "close"], ["Use cleaner indoor air where available", "purify"], ["Rest in a cleaner indoor space", "rest"], ["Follow local protective guidance", "breathe"], ["Choose a quiet indoor read", "read"]],
}

export function sceneCategory(pm: number | null | undefined): SceneCategory | null {
  if (pm == null || !Number.isFinite(pm) || pm < 0) return null
  return pm <= 9.1 ? "good" : pm <= 35.49 ? "moderate" : pm <= 55.49 ? "sensitive" : pm <= 125.49 ? "unhealthy" : pm <= 225.49 ? "very" : "hazardous"
}

export function scenesForCategory(category: SceneCategory): RealisticScene[] {
  const duration: Record<string, number> = { jog: 1600, walk: 2400, kick: 2800, cycle: 2000, read: 3600, check: 3600, stretch: 4400, balance: 4800, rest: 5200, drink: 3600, type: 2400, close: 4000, purify: 4000, sketch: 3200, puzzle: 4000, breathe: 5200 }
  return scenes[category].map(([title, motion], index) => ({ category, index, title, motion, src: `/images/billboard/realistic/${category}-${index + 1}.webp`, actionSrc: `/images/billboard/realistic/${category}-${index + 1}-action.webp`, duration: duration[motion] || 1800 }))
}

// A shuffled bag plays every scene once before repeating. Also avoid a repeat
// across bag boundaries, rather than choosing randomly on every timer tick.
export function shuffledScenes(previous?: number, random = Math.random) {
  const order = [0, 1, 2, 3, 4]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order[0] === previous) [order[0], order[1]] = [order[1], order[0]]
  return order
}
