import data from './data/dashboard.json'

export { data }

// Rajasthan Royals palette: royal pink, royal blue, navy and gold
export const C = {
  pink: '#EA1A85',
  blue: '#254AA5',
  navy: '#14215A',
  gold: '#D4A017',
  grey: '#B4BBCB',
  ink: '#111a3a',
  muted: '#5f6b85',
  grid: '#ECEEF5',
}

export const KIND = { bat: 'Batters', bowl: 'Bowlers' }
export const UNIT = { bat: 'innings', bowl: 'spells' }

const fixed = (x, d) => {
  const v = Number(x).toFixed(d)
  return Number(v) === 0 ? (0).toFixed(d) : v
}

export const isNum = (x) => x !== null && x !== undefined && Number.isFinite(Number(x))
export const num = (x, d = 1) => (isNum(x) ? fixed(x, d) : '–')
export const pct = (x, d = 0) => (isNum(x) ? `${fixed(100 * x, d)}%` : '–')
export const int = (x) => (isNum(x) ? Math.round(x).toLocaleString('en-US') : '–')
export const signed = (x, d = 1) => {
  if (!isNum(x)) return '–'
  const v = fixed(x, d)
  return Number(v) > 0 ? `+${v}` : v
}
export const team = (p) => [p.ipl_team, p.country].filter(Boolean).join(' · ')
export const go = (path) => {
  window.location.hash = `/${path}`
}
export const player = (kind, id) => data.players[kind].find((p) => p.id === Number(id))

/** Colour scale used by the heat maps (light → RR pink → deep purple). */
const STOPS = [
  [0, [255, 248, 225]],
  [0.3, [250, 176, 90]],
  [0.6, [228, 0, 124]],
  [1, [59, 10, 69]],
]
export function heat(t) {
  const x = Math.max(0, Math.min(1, t))
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i]
    const [t0, c0] = STOPS[i - 1]
    if (x <= t1) {
      const f = (x - t0) / (t1 - t0)
      const c = c0.map((v, k) => Math.round(v + f * (c1[k] - v)))
      return { bg: `rgb(${c.join(',')})`, fg: x > 0.5 ? '#fff' : C.ink }
    }
  }
  return { bg: 'rgb(59,10,69)', fg: '#fff' }
}

/** Green (rank 1) → amber → red (rank 30+) for the sensitivity grid. */
export function rankColour(r) {
  if (!isNum(r)) return { bg: '#7F1D1D', fg: '#fff' }
  const t = Math.min(1, (r - 1) / 29)
  const a = [22, 163, 74]
  const b = [250, 204, 21]
  const c = [220, 38, 38]
  const mix = (p, q, f) => p.map((v, k) => Math.round(v + f * (q[k] - v)))
  const col = t < 0.5 ? mix(a, b, t / 0.5) : mix(b, c, (t - 0.5) / 0.5)
  return { bg: `rgb(${col.join(',')})`, fg: t < 0.15 || t > 0.75 ? '#fff' : C.ink }
}

/** Find the bullet list that follows a heading in the report blocks. */
export function reportList(headingStart) {
  const i = data.report.findIndex((b) => b.type === 'h' && b.text.startsWith(headingStart))
  if (i < 0) return []
  const ul = data.report.slice(i + 1).find((b) => b.type === 'ul')
  return ul ? ul.items : []
}
