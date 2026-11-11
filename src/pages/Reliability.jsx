import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, data, int, KIND, num, pct, rankColour, reportList, signed } from '../lib'
import { Card, Explain, PageHead, Rich, Segmented, SimpleTable, TipBox } from '../ui'

const KINDS = [{ value: 'bat', label: 'Batters' }, { value: 'bowl', label: 'Bowlers' }]

/** X-axis tick that wraps a label onto several short lines (split on \n). */
function WrapTick({ x, y, payload }) {
  const lines = String(payload.value).split('\n')
  return (
    <g transform={`translate(${x},${y + 14})`}>
      {lines.map((l, i) => (
        <text key={i} x={0} y={i * 15} textAnchor="middle" fontSize={11.5} fill={C.muted}>{l}</text>
      ))}
    </g>
  )
}

function ClutchChart({ kind }) {
  const r = data.stats.ratings[kind]
  const items = [
    ['usual_predicts_press', 'Usual record\npredicts pressure\nrecord elsewhere', 'Usual record predicts pressure record elsewhere'],
    ['press_predicts_press', 'Pressure record\npredicts pressure\nrecord elsewhere', 'Pressure record predicts pressure record elsewhere'],
    ['partial_press_given_usual', 'Pressure record\nadds beyond usual\n(partial r)', 'Pressure record adds beyond usual (partial r)'],
    ['diff_raw', 'Rise / dip\nrepeats', 'Rise / dip (pressure minus usual) repeats'],
  ]
  const rows = items.map(([k, label, full]) => ({ label, full, split: r.split_half[k].split_half_r, chrono: r.chronological[k] }))
  const vals = rows.flatMap((x) => [x.split, x.chrono])
  const lo = Math.min(-0.1, Math.floor(Math.min(...vals) * 10) / 10)
  const hi = Math.max(0.1, Math.ceil(Math.max(...vals) * 10) / 10)
  const ticks = []
  for (let t = Math.round(lo * 10); t <= Math.round(hi * 10); t++) ticks.push(t / 10)
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={rows} margin={{ top: 4, right: 10, left: 0, bottom: 10 }} barGap={4}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" interval={0} tick={<WrapTick />} height={62} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} domain={[lo, hi]} ticks={ticks} tickFormatter={(v) => num(v, 1)} width={40} />
        <ReferenceLine y={0} stroke={C.ink} />
        <Tooltip cursor={{ fill: 'rgba(37,74,165,0.06)' }} content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const p = payload[0].payload
          return <TipBox title={p.full} rows={[['Random halves', signed(p.split, 2)], ['Before vs after Jul 2024', signed(p.chrono, 2)]]} />
        }} />
        <Legend verticalAlign="top" align="left" height={30} iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12.5 }} />
        <Bar isAnimationActive={false} dataKey="split" name="Random half of matches vs other half" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={42} />
        <Bar isAnimationActive={false} dataKey="chrono" name="Before Jul 2024 vs after" fill={C.gold} radius={[4, 4, 0, 0]} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function NoiseBars({ kind }) {
  const ts = data.stats.ratings[kind].true_spread_eligible
  const items = [['usual_raw', 'Usual record'], ['press_raw', 'Pressure record'], ['diff_raw', 'Rise / dip (pressure − usual)']]
  return (
    <div className="noise">
      {items.map(([k, label]) => {
        const t = ts[k]
        const trueShare = Math.min(1, (t.true_sd / t.observed_sd) ** 2)
        return (
          <div className="noise-row" key={k}>
            <div className="noise-label">{label}<span className="muted small"> · SD {num(t.observed_sd, 0)}, noise {num(t.rms_se, 0)}</span></div>
            <div className="noise-bar">
              <div className="noise-true" style={{ width: `${100 * trueShare}%` }} />
              <div className="noise-noise" style={{ width: `${100 * (1 - trueShare)}%` }} />
            </div>
            <div className="noise-pct">{pct(trueShare)} real</div>
          </div>
        )
      })}
    </div>
  )
}

function SensitivityGrid({ kind }) {
  const s = data.sensitivity[kind]
  return (
    <div className="table-wrap">
      <table className="tbl sens">
        <thead>
          <tr><th>Player</th>{s.variants.map((v) => <th key={v} className="rot"><span>{v}</span></th>)}</tr>
        </thead>
        <tbody>
          {s.players.map((p, i) => (
            <tr key={p}>
              <td className="strong nowrap">{p}</td>
              {s.ranks[i].map((r, j) => {
                const c = rankColour(r)
                return <td key={j} className="c" style={{ background: c.bg, color: c.fg }}>{r === null ? 'n/e' : r}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Reliability() {
  const [kind, setKind] = useState('bat')
  const rs = data.stats.ratings
  const r = rs[kind]
  const sh = r.split_half
  const ch = r.chronological
  const measures = [['overall_rv', 'Expected value (all situations)'], ['press_rv', 'Pressure record only'],
    ['usual_rv', 'Usual record only'], ['diff_raw', 'Rise / dip'], ['success_rate', 'Pressure-innings consistency']]
  const seeds = rs.seed_check?.[kind] || []
  const sens = data.sensitivity[kind].summary
  const limitations = reportList('7.4')
  return (
    <>
      <PageHead kicker="Reliability and limitations" title="How far can these rankings be trusted?">
        Repeatability tests, the clutch test, rank uncertainty, robustness to every modelling choice, and the
        known limitations.
      </PageHead>
      <div className="toolbar"><Segmented options={KINDS} value={kind} onChange={setKind} /></div>

      <div className="grid two">
        <Card title="The clutch test" subtitle={`${KIND[kind]}: what predicts performance under pressure in unseen matches?`}>
          <ClutchChart kind={kind} />
          <Explain>
            A player's usual record predicts his pressure record in other matches (r = {signed(sh.usual_predicts_press.split_half_r, 2)})
            better than his own pressure record does (r = {signed(sh.press_predicts_press.split_half_r, 2)}). Once the usual record is known,
            the pressure record adds little (partial r = {signed(sh.partial_press_given_usual.split_half_r, 2)}), and the
            rise or dip does not repeat (r = {signed(sh.diff_raw.split_half_r, 2)}).
          </Explain>
        </Card>
        <Card title="How much of each record is signal?" subtitle="Share of the spread between eligible players that is real, not sampling noise">
          <NoiseBars kind={kind} />
          <div className="legend"><span><i style={{ background: C.pink }} />true differences</span><span><i style={{ background: '#E2E6EF' }} />sampling noise</span></div>
          <Explain>
            Observed spread² = true spread² + noise². With a few hundred pressure deliveries per player the noise
            dominates the pressure record, and the rise/dip is almost entirely noise. That is why the level component
            uses all deliveries.
          </Explain>
        </Card>
      </div>

      <Card title="Repeatability of each measure" subtitle={`Correlation between halves of the data; typical overlap ${sh.n_players_typical} ${KIND[kind].toLowerCase()}`}>
        <SimpleTable columns={['Measure', 'Split-half r', 'Full-sample (Spearman-Brown)', 'Before vs after Jul 2024']}
          align={['', 'r', 'r', 'r']}
          rows={measures.map(([k, label]) => [label, signed(sh[k].split_half_r, 2), signed(sh[k].spearman_brown_full, 2), signed(ch[k], 2)])} />
      </Card>

      <div className="grid two">
        <Card title="Is the list stable to the random seed?" subtitle={`${seeds.length} independent bootstrap runs of ${int(data.config.bootstrap_reps)} resamples, pooled for the final ranking`}>
          <SimpleTable columns={['Seed', 'Same ten players', 'Same order', 'Positions that differ']} align={['', 'c', 'c', '']}
            rows={seeds.map((x) => [x.seed, x.same_players ? '✓' : '✗', x.same_order ? '✓' : '✗', x.positions_that_differ.join(', ') || '–'])} />
          <Explain>
            Every run on its own picks the same ten {KIND[kind].toLowerCase()}. Where the order differs, it is between
            adjacent players whose scores are within bootstrap noise; the final order uses all {int(data.config.bootstrap_total)} resamples.
          </Explain>
        </Card>
        <Card title="How certain is the order?" subtitle="What the bootstrap says about the final list">
          <SimpleTable columns={['Player', 'Final rank', 'Likely range', 'P(top 10)']} align={['', 'r', 'r', 'r']}
            rows={data.players[kind].slice(0, 10).map((p) => [p.name, p.rank, `${num(p.rank_p10, 0)}–${num(p.rank_p90, 0)}`, pct(p.p_top10)])} />
        </Card>
      </div>

      <Card title="Do the lists depend on our choices?" subtitle="Each alternative re-runs the full rating and is compared with the main ranking">
        <SimpleTable columns={['Alternative', 'Eligible players', 'Top-10 overlap', 'Main top 10 still in top 15', 'Rank correlation']}
          align={['', 'r', 'r', 'r', 'r']}
          rows={sens.map((x) => [x.variant, x.eligible, `${x.top10_overlap}/10`, `${x.main_top10_in_variant_top15}/10`, num(x.spearman_vs_main, 2)])} />
      </Card>

      <Card title="Rank of our top 10 under every alternative" subtitle="Green = near the top, red = far down or not eligible (n/e)">
        <SensitivityGrid kind={kind} />
        <Explain>
          Choices about the pressure threshold, knock-out multiplier, weights, shrinkage, opponent adjustment and the
          reliability penalty move players by a few places. The big change comes only from ranking on the
          pressure-only record, which the clutch test shows is mostly noise.
        </Explain>
      </Card>

      <Card title="Limitations">
        <ul className="bullets">{limitations.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>
      </Card>
    </>
  )
}
