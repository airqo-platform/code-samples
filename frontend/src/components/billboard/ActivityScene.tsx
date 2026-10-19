import { activityForAir } from "@/lib/billboard"

export default function ActivityScene({ pm, preferred }: { pm: number | null | undefined; preferred: string }) {
  const activity = activityForAir(pm, preferred)
  const indoor = !["running", "football", "walking"].includes(activity)
  const yoga = activity === "yoga"
  const seated = activity === "reading" || activity === "resting"
  const closing = activity === "window"
  const label = { running: "Running outdoors", football: "Playing football", walking: "Taking a gentle walk", yoga: "Gentle yoga indoors", reading: "Reading indoors", resting: "Resting indoors", window: "Closing a window", unavailable: "Waiting for air quality data" }[activity]
  return <figure className="relative z-10 w-full max-w-80 text-center">
    <svg viewBox="0 0 320 235" role="img" aria-label={label} className={`activity-scene activity-${activity} mx-auto h-52 w-full`}>
      <ellipse cx="160" cy="213" rx="116" ry="9" fill="var(--billboard-accent)" opacity=".15" />
      {indoor ? <><path d="M36 208V24h248v184" fill="var(--billboard-panel)" stroke="var(--billboard-line)" strokeWidth="4" /><path d="M220 42h46v64h-46zM243 42v64m-23-32h46" fill="none" stroke="var(--billboard-accent)" strokeWidth="3" />{closing && <path d="m220 42-24 13v62l24-11z" fill="var(--billboard-card)" stroke="var(--billboard-accent)" strokeWidth="3" />}</> : <><circle cx="254" cy="44" r="18" fill="#fbbf24" /><path d="M52 207v-63m-25 16 25-44 25 44z" fill="#34d399" stroke="#059669" strokeWidth="4" /><path d="M32 212h256" stroke="#34d399" strokeWidth="3" /></>}
      {seated && <path d="M107 124v80m0-39h98v39m0-80v41" fill="none" stroke="var(--billboard-accent)" strokeWidth="14" strokeLinecap="round" />}
      {yoga && <rect x="78" y="205" width="166" height="7" rx="3" fill="#38bdf8" />}
      <g className={indoor ? "activity-calm" : "activity-bounce"}>
        <g fill="none" stroke="#1d4ed8" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
          <path className={!indoor ? "activity-leg-a" : ""} d={yoga ? "m157 151-41 43 42 7" : seated ? "m153 150 35 19 9 35" : "m157 146-22 59"} />
          <path className={!indoor ? "activity-leg-b" : ""} d={yoga ? "m162 151 42 43-44 7" : seated ? "m152 150-18 22-7 32" : "m162 146 27 57"} />
        </g>
        <path d="m157 91 2 58" stroke="#0ea5e9" strokeWidth="35" strokeLinecap="round" />
        <g fill="none" stroke="#b77951" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
          <path className={!indoor ? "activity-arm-a" : ""} d={yoga ? "m143 101-29 43-11-10" : seated ? "m142 103-12 37 29 6" : "m144 101-25 25-15-14"} />
          <path className={!indoor ? "activity-arm-b" : ""} d={closing ? "m174 102 30-13 16-15" : yoga ? "m173 101 29 43 11-10" : seated ? "m174 103 18 30-30 13" : "m174 101 24 25 16-14"} />
        </g>
        <circle cx="158" cy="62" r="21" fill="#b77951" /><path d="M137 57q-4-26 23-23 25 0 20 26l-10-13-33 10" fill="#292524" />
        <circle cx="164" cy="62" r="2" fill="#292524" /><path d="m161 73 7-1" stroke="#643b2b" strokeWidth="2" strokeLinecap="round" />
        {activity === "reading" && <path d="m138 122 22 7 23-7v28l-23 7-22-7z" fill="#fbbf24" stroke="#fef3c7" strokeWidth="2" />}
      </g>
      {activity === "football" && <g className="activity-ball"><circle cx="239" cy="196" r="16" fill="white" stroke="#475569" strokeWidth="2" /><path d="m239 186 8 6-3 9h-10l-3-9z" fill="#334155" /></g>}
    </svg>
    <figcaption className="text-xs font-medium text-[var(--billboard-muted)]">{label}</figcaption>
  </figure>
}
