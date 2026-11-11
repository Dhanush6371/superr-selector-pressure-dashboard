import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { C, data, go, int, KIND, num, pct, signed, team, UNIT } from '../lib'
import { Card, Explain, PageHead, ProbBar, RankBadge, Segmented, TipBox } from '../ui'

const KINDS = [{ value: 'bat', label: 'Batters' }, { value: 'bowl', label: 'Bowlers' }]

/** Y-axis tick that keeps a player's name on one line. */
function NameTick({ x, y, payload }) {
  return (
    <text x={x - 8} y={y} dy={4} textAnchor="end" fontSize={13} fontWeight={600} fill={C.ink}>{payload.value}</text>
  )
}

function niceTicks(lo, hi, target = 6) {
  const raw = (hi - lo) / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)
  const start = Math.floor(lo / step) * step
  const out = []
  for (let t = start; t <= hi + 1e-9; t += step) out.push(Math.round(t * 100) / 100)
  return out
}

function ComponentsChart({ kind }) {
  const rows = data.players[kind].slice(0, 10).map((p) => ({ ...p, label: `${p.rank}. ${p.name}` }))
  const w = data.weights
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={rows} layout="vertical" stackOffset="sign" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={C.grid} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => num(v, 1)} />
        <YAxis type="category" dataKey="label" width={210} tick={<NameTick />} tickLine={false} axisLine={false} interval={0} />
        <Tooltip cursor={{ fill: 'rgba(37,74,165,0.06)' }} content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const p = payload[0].payload
          return (
            <TipBox title={p.name} rows={[
              [`Expected value (×${w.level})`, num(p.contrib_level, 2)],
              [`Consistency (×${w.consistency})`, num(p.contrib_consistency, 2)],
              ['Point score', num(p.score, 3)],
              ['Bootstrap standard error', `− ${num(p.score_se, 3)}`],
              ['Final (reliability) score', num(p.reliability_score, 3)],
            ]} />
          )
        }} />
        <ReferenceLine x={0} stroke={C.ink} />
        <Bar isAnimationActive={false} dataKey="contrib_level" name="Expected value" stackId="s" fill={C.pink} radius={[0, 4, 4, 0]} />
        <Bar isAnimationActive={false} dataKey="contrib_consistency" name="Consistency" stackId="s" fill={C.blue} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function RankIntervals({ kind }) {
  const rows = data.players[kind].slice(0, 15)
  const max = Math.ceil(Math.max(...rows.map((r) => r.rank_p90)) / 10) * 10
  const x = (v) => `${((v - 1) / (max - 1)) * 100}%`
  const ticks = [1, ...Array.from({ length: max / 10 }, (_, i) => (i + 1) * 10)]
  return (
    <div className="ri">
      {rows.map((r) => (
        <div className="ri-row" key={r.id} onClick={() => go(`player/${kind}/${r.id}`)}>
          <div className="ri-name"><span className="muted">{r.rank}.</span> {r.name}</div>
          <div className="ri-track">
            <div className="ri-cut" style={{ left: x(10.5) }} />
            <div className="ri-bar" style={{ left: x(r.rank_p10), width: `calc(${x(r.rank_p90)} - ${x(r.rank_p10)})` }} />
            <div className="ri-med" style={{ left: x(r.rank_median) }} title={`median rank ${num(r.rank_median, 0)}`} />
            <div className="ri-dot" style={{ left: x(r.rank) }} title={`final rank ${r.rank}`} />
          </div>
          <div className="ri-p">{pct(r.p_top10)}</div>
        </div>
      ))}
      <div className="ri-row ri-axis">
        <div className="ri-name" />
        <div className="ri-track bare">
          {ticks.map((t) => <span key={t} style={{ left: x(t) }}>{t}</span>)}
        </div>
        <div className="ri-p muted">P(top 10)</div>
      </div>
    </div>
  )
}

function RecordScatter({ kind }) {
  const all = data.players[kind]
  const top = all.slice(0, 10)
  const rest = all.slice(10)
  const vals = all.flatMap((p) => [p.usual_raw, p.press_raw]).filter((v) => v !== null)
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals))
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1] < Math.max(...vals) ? ticks[ticks.length - 1] + (ticks[1] - ticks[0]) : ticks[ticks.length - 1]
  if (hi > ticks[ticks.length - 1]) ticks.push(hi)
  const tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
      <TipBox title={`${p.rank}. ${p.name}`} rows={[
        ['Pressure record', `${signed(p.press_raw, 0)} ± ${num(p.press_se, 0)}`],
        ['Usual record', `${signed(p.usual_raw, 0)} ± ${num(p.usual_se, 0)}`],
        ['Pressure deliveries', int(p.pressure_balls)],
      ]} />
    )
  }
  return (
    <ResponsiveContainer width="100%" height={480}>
      <ScatterChart margin={{ top: 10, right: 24, bottom: 34, left: 18 }}>
        <CartesianGrid stroke={C.grid} />
        <XAxis type="number" dataKey="usual_raw" domain={[lo, hi]} ticks={ticks} tick={{ fontSize: 12 }}
          label={{ value: 'Usual record (runs above average per 100 non-pressure balls)', position: 'bottom', offset: 10, fontSize: 12.5, fill: C.muted }} />
        <YAxis type="number" dataKey="press_raw" domain={[lo, hi]} ticks={ticks} tick={{ fontSize: 12 }} width={56}
          label={{ value: 'Pressure record (per 100 pressure balls)', angle: -90, position: 'insideLeft', offset: 4, fontSize: 12.5, fill: C.muted, style: { textAnchor: 'middle' } }} />
        <ZAxis range={[60, 60]} />
        <ReferenceLine segment={[{ x: lo, y: lo }, { x: hi, y: hi }]} stroke={C.ink} strokeDasharray="4 4" />
        <Tooltip content={tip} />
        <Scatter isAnimationActive={false} data={rest} fill={C.grey} fillOpacity={0.75} cursor="pointer"
          onClick={(p) => go(`player/${kind}/${p.id}`)} />
        <Scatter isAnimationActive={false} data={top} fill={C.pink} cursor="pointer" onClick={(p) => go(`player/${kind}/${p.id}`)} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

const COLS = {
  bat: [
    ['rank', '#'], ['name', 'Player'], ['pressure_balls', 'Press. deliveries'], ['success_rate', 'Press. innings won'],
    ['SR_pressure', 'SR press. / usual'], ['avg_pressure', 'Avg press.'], ['press_raw', 'Press. / usual record'],
    ['overall_rv', 'Expected value'], ['score', 'Score'], ['reliability_score', 'Final score'], ['p_top10', 'P(top 10)'],
  ],
  bowl: [
    ['rank', '#'], ['name', 'Player'], ['pressure_balls', 'Press. deliveries'], ['success_rate', 'Press. spells won'],
    ['econ_pressure', 'Econ press. / usual'], ['wkts_pressure', 'Wkts press.'], ['press_raw', 'Press. / usual record'],
    ['overall_rv', 'Expected value'], ['score', 'Score'], ['reliability_score', 'Final score'], ['p_top10', 'P(top 10)'],
  ],
}

function cell(kind, key, p) {
  switch (key) {
    case 'rank': return <RankBadge rank={p.rank} />
    case 'name': return <div className="name-cell"><div className="strong">{p.name}</div><div className="muted small">{team(p)}</div></div>
    case 'pressure_balls': return int(p.pressure_balls)
    case 'success_rate': return `${int(p.successes)}/${int(p.pressure_inns)}`
    case 'SR_pressure': return `${num(p.SR_pressure, 0)} / ${num(p.SR_normal, 0)}`
    case 'avg_pressure': return num(p.avg_pressure, 1)
    case 'econ_pressure': return `${num(p.econ_pressure, 2)} / ${num(p.econ_normal, 2)}`
    case 'wkts_pressure': return int(p.wkts_pressure)
    case 'press_raw': return `${signed(p.press_raw, 0)} / ${signed(p.usual_raw, 0)}`
    case 'overall_rv': return signed(p.overall_rv)
    case 'score': return num(p.score, 2)
    case 'reliability_score': return <strong>{num(p.reliability_score, 2)}</strong>
    case 'p_top10': return <ProbBar p={p.p_top10} />
    default: return p[key]
  }
}

function FullTable({ kind }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'rank', dir: 1 })
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const f = data.players[kind].filter((p) => !s || `${p.name} ${team(p)}`.toLowerCase().includes(s))
    const k = sort.key
    return [...f].sort((a, b) => {
      const va = a[k] ?? -Infinity
      const vb = b[k] ?? -Infinity
      if (typeof va === 'string') return sort.dir * va.localeCompare(vb)
      return sort.dir * (va - vb)
    })
  }, [kind, q, sort])
  const click = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : (key === 'rank' || key === 'name' ? 1 : -1) }))
  return (
    <>
      <div className="table-tools">
        <input className="search" placeholder="Search player or team…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted small">{rows.length} of {data.players[kind].length} eligible {KIND[kind].toLowerCase()} · click a column to sort, a row to open the profile</span>
      </div>
      <div className="table-wrap tall">
        <table className="tbl hover">
          <thead>
            <tr>
              {COLS[kind].map(([key, label]) => (
                <th key={key} onClick={() => click(key)} className="sortable">
                  {label}{sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} onClick={() => go(`player/${kind}/${p.id}`)} className={p.rank <= 10 ? 'top10' : ''}>
                {COLS[kind].map(([key]) => <td key={key}>{cell(kind, key, p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Rankings() {
  const [kind, setKind] = useState('bat')
  const w = data.weights
  const cfg = data.config
  const ts = data.stats.ratings[kind].true_spread_eligible.press_raw
  return (
    <>
      <PageHead kicker="Rankings" title={`${KIND[kind]}: who delivers under pressure`}>
        Every eligible player, how his score is built, and how certain his rank is.
      </PageHead>
      <div className="toolbar"><Segmented options={KINDS} value={kind} onChange={setKind} /></div>

      <Explain title="How the score works">
        <strong>Score = {w.level} × expected value per high-pressure ball + {w.consistency} × pressure-innings
          consistency.</strong> Expected value is the opponent-adjusted runs a player adds (batting) or saves
        (bowling) per ball compared with an average player in the same situation, shrunk for sample size.
        Consistency is the share of pressure {UNIT[kind]} ({kind === 'bat' ? cfg.cons_balls_bat : cfg.cons_balls_bowl}+
        high-pressure deliveries in a match) in which he beat that expectation. Both are measured in units of the true
        spread between players. The <strong>final score</strong> subtracts one bootstrap standard error, so a short
        or volatile record ranks below an equally good, longer one. Eligibility: ≥ {cfg.min_balls} pressure deliveries
        and ≥ {cfg.min_inns} pressure {UNIT[kind]}.
      </Explain>

      <div className="grid two">
        <Card title="What drives each top-10 score" subtitle="Contribution of each component (hover for the final score)">
          <ComponentsChart kind={kind} />
          <div className="legend"><span><i style={{ background: C.pink }} />Expected value</span><span><i style={{ background: C.blue }} />Consistency</span></div>
        </Card>
        <Card title="How certain is each rank?" subtitle={`10th–90th percentile of rank over ${int(cfg.bootstrap_total)} match resamples`}>
          <RankIntervals kind={kind} />
          <div className="legend">
            <span><i className="bar" />likely range</span>
            <span><i className="dot" />final rank</span>
            <span><i className="med" />median rank</span>
            <span><i className="cut" />top-10 cut-off</span>
          </div>
        </Card>
      </div>

      <Card title="Pressure record vs usual record" subtitle="Each dot is an eligible player; pink = final top 10. Points above the dashed line did better under pressure than usual.">
        <RecordScatter kind={kind} />
        <Explain>
          The pressure records spread by a standard deviation of {num(ts.observed_sd, 0)} runs per 100 balls, but
          sampling noise alone accounts for {num(ts.rms_se, 0)}: only about {pct((ts.true_sd / ts.observed_sd) ** 2)} of
          the spread reflects real differences between players. That is why the ranking does not simply reward the
          dots furthest above the line. Hover a dot to see its standard errors.
        </Explain>
      </Card>

      <Card title={`All eligible ${KIND[kind].toLowerCase()}`}>
        <FullTable kind={kind} />
      </Card>
    </>
  )
}
