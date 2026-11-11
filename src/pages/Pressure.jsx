import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import { C, data, heat, int, num, pct, signed } from '../lib'
import { Card, Explain, Figure, PageHead, Segmented, SimpleTable, TipBox } from '../ui'

const OUTCOME = { W: 'wicket', X: 'wide / no-ball', 0: 'dot ball' }

function ExampleMatch() {
  const em = data.example_match
  const rows = em.deliveries.map((d, i) => ({ ...d, i, wp: 100 * d.chase_wp }))
  const brk = rows.findIndex((r) => r.innings === 2)
  const ticks = rows.filter((r) => r.label.endsWith('.1') && r.overid % 2 === 1).map((r) => r.i)
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={rows} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="i" ticks={ticks} tickFormatter={(i) => rows[i].overid} tick={{ fontSize: 12 }} />
        <YAxis yAxisId="wp" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <YAxis yAxisId="li" orientation="right" tick={{ fontSize: 12 }} />
        <ReferenceLine yAxisId="wp" x={brk - 0.5} stroke={C.ink} strokeDasharray="4 4"
          label={{ value: `${em.chasing_team} chase starts`, position: 'insideTopRight', fontSize: 12 }} />
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const r = payload[0].payload
          return (
            <TipBox title={`Innings ${r.innings}, over ${r.label}`} rows={[
              ['Batter v bowler', `${r.striker_name} v ${r.bowler_name}`],
              ['Score', `${int(r.score_before)}/${r.wkts_before}`],
              r.innings === 2 ? ['Needed', `${int(r.runs_needed)} off ${r.balls_left}`] : null,
              ['Outcome', OUTCOME[r.outcome] || `${r.outcome} run${r.outcome === '1' ? '' : 's'}`],
              [`${em.chasing_team} win probability`, `${num(r.wp, 1)}%`],
              ['Leverage Index', num(r.li, 2)],
              ['High pressure?', r.hp ? 'yes' : 'no'],
            ]} />
          )
        }} />
        <Bar isAnimationActive={false} yAxisId="li" dataKey="li" barSize={3}>
          {rows.map((r) => <Cell key={r.i} fill={r.hp ? C.pink : C.grey} fillOpacity={0.75} />)}
        </Bar>
        <Line yAxisId="wp" type="monotone" dataKey="wp" stroke={C.blue} strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function Heatmap({ which }) {
  const hm = data.heatmaps[which]
  const rows = [...hm.columns.keys()].reverse()
  return (
    <div className="heat">
      <div className="heat-grid" style={{ gridTemplateColumns: `72px repeat(${hm.overs.length}, 1fr)` }}>
        {rows.map((ci) => (
          <div className="heat-row" key={ci} style={{ display: 'contents' }}>
            <div className="heat-label">{hm.columns[ci]}{which === 'wickets' && ci === hm.columns.length - 1 ? '+' : ''}</div>
            {hm.overs.map((o, oi) => {
              const v = hm.values[oi][ci]
              const c = v === null ? null : heat(v / 4)
              return (
                <div key={o} className="heat-cell" style={c ? { background: c.bg, color: c.fg } : {}}
                  title={v === null ? 'no deliveries' : `over ${o}, ${which === 'rrr' ? 'required rate' : 'wickets lost'} ${hm.columns[ci]}: mean LI ${num(v, 2)}`}>
                  {v === null ? '' : num(v, 1)}
                </div>
              )
            })}
          </div>
        ))}
        <div />
        {hm.overs.map((o) => <div key={o} className="heat-x">{o}</div>)}
      </div>
      <div className="heat-legend">
        <span>0</span><div className="heat-bar" /><span>4+ (×average)</span>
      </div>
    </div>
  )
}

function ByOver() {
  const byOver = {}
  data.li_by_over.forEach((r) => {
    byOver[r.overid] = byOver[r.overid] || { over: r.overid }
    byOver[r.overid][`li${r.innings}`] = r.mean_li
    byOver[r.overid][`hp${r.innings}`] = 100 * r.hp_share
  })
  const rows = Object.values(byOver)
  const thr = data.stats.ratings.pressure_threshold_pi
  return (
    <div className="grid two tight">
      <div>
        <h4 className="chart-title">Average Leverage Index by over</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="over" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ReferenceLine y={thr} stroke={C.muted} strokeDasharray="4 4" label={{ value: `high-pressure threshold ${num(thr, 2)}`, fontSize: 12, position: 'insideBottomRight', fill: C.muted }} />
            <Tooltip formatter={(v) => num(v, 2)} labelFormatter={(o) => `Over ${o}`} />
            <Legend />
            <Line isAnimationActive={false} dataKey="li1" name="1st innings" stroke={C.blue} strokeWidth={2.5} dot={false} />
            <Line isAnimationActive={false} dataKey="li2" name="Chase" stroke={C.pink} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="chart-title">% of deliveries that are high pressure</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="over" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => `${num(v, 1)}%`} labelFormatter={(o) => `Over ${o}`} />
            <Legend />
            <Bar isAnimationActive={false} dataKey="hp1" name="1st innings" fill={C.blue} radius={[3, 3, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="hp2" name="Chase" fill={C.pink} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const METRICS = [
  { value: 'run_outs_per_1000_balls', label: 'Run-outs /1000' },
  { value: 'wickets_per_100_balls', label: 'Wickets /100' },
  { value: 'wides_noballs_per_100_balls', label: 'Wides + no-balls /100' },
  { value: 'dot_pct', label: 'Dot-ball %' },
  { value: 'boundary_pct', label: 'Boundary %' },
]

function Behaviour() {
  const [m, setM] = useState('run_outs_per_1000_balls')
  const phases = ['Powerplay', 'Middle', 'Death']
  const rows = phases.map((ph) => {
    const g = (grp) => data.behaviour_phase.find((r) => r.phase === ph && r.group === grp)
    return { phase: ph, other: g('other')?.[m], hp: g('high pressure')?.[m] }
  })
  return (
    <>
      <div className="toolbar"><Segmented size="sm" options={METRICS} value={m} onChange={setM} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="phase" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => num(v, 2)} />
          <Legend />
          <Bar isAnimationActive={false} dataKey="other" name="Other chase deliveries" fill={C.grey} radius={[4, 4, 0, 0]} />
          <Bar isAnimationActive={false} dataKey="hp" name="High-pressure deliveries" fill={C.pink} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

function Calibration() {
  const [inn, setInn] = useState('2')
  const wp = data.stats.wp
  const used = wp[`innings_${inn}_raw`]
  const recal = wp[`innings_${inn}_calibrated`]
  return (
    <>
      <div className="toolbar">
        <Segmented size="sm" options={[{ value: '1', label: '1st innings' }, { value: '2', label: 'Chase' }]} value={inn} onChange={setInn} />
        <span className="muted small">Brier score {num(used.brier, 3)} (constant forecast {num(used.brier_constant, 3)})</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 18 }}>
          <CartesianGrid stroke={C.grid} />
          <XAxis type="number" dataKey="predicted" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v) => pct(v)} tick={{ fontSize: 12 }}
            label={{ value: 'Predicted win probability', position: 'bottom', offset: 10, fontSize: 12.5, fill: C.muted }} />
          <YAxis type="number" dataKey="actual" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v) => pct(v)} tick={{ fontSize: 12 }} width={52}
            label={{ value: 'Actual win rate', angle: -90, position: 'insideLeft', offset: 2, fontSize: 12.5, fill: C.muted, style: { textAnchor: 'middle' } }} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={C.ink} strokeDasharray="4 4" />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const r = payload[0].payload
            return <TipBox title={`Bin ${r.bin}`} rows={[['Predicted', pct(r.predicted, 1)], ['Actual', pct(r.actual, 1)], ['Deliveries', int(r.n)]]} />
          }} />
          <Scatter isAnimationActive={false} name="Model used for the Pressure Index" data={used.table} fill={C.pink} line shape="circle" />
          <Scatter isAnimationActive={false} name="Re-calibrated (diagnostic only)" data={recal.table} fill={C.grey} line shape="square" />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="legend">
        <span><i className="dot" />Model used for the Pressure Index</span>
        <span><i style={{ background: C.grey }} />Re-calibrated (diagnostic only)</span>
        <span><i className="line" />Perfect calibration</span>
      </div>
    </>
  )
}

export default function Pressure() {
  const pv = data.stats.pressure
  const [hm, setHm] = useState('rrr')
  const close = pv.chase_hp_share_by_closeness
  const within = Object.fromEntries(data.behaviour_phase.map((r) => [`${r.phase}|${r.group}`, r]))
  const dh = within['Death|high pressure']
  const doth = within['Death|other']
  const tierCols = ['Tier', 'Share of deliveries', 'Mean PI', 'Avg WP swing', 'Runs/over', 'Dot %', 'Wkts /100', 'Run-outs /1000', 'Chase %', 'Death overs %']
  const comp = pv.hp_composition
  return (
    <>
      <PageHead kicker="Defining pressure" title="The Pressure Index">
        Pressure is how much a single delivery can change who wins. For every ball we estimate the batting side's
        chance of winning before it, and how far that chance would move across everything that could happen on it.
      </PageHead>

      <Card title={`How pressure moves through a match: ${data.example_match.title}`}
        subtitle={`${data.example_match.batting_first} v ${data.example_match.chasing_team}. Blue line = ${data.example_match.chasing_team} win probability; bars = Leverage Index of each delivery (pink = high pressure).`}>
        <ExampleMatch />
        <Explain>
          The <strong>Leverage Index (LI)</strong> of a delivery is the expected absolute change in win probability
          over all its possible outcomes (dot, single, boundary, wicket, wide…), divided by the average over every
          delivery, so 1 = an average ball. The <strong>Pressure Index</strong> is LI × {data.config.knockout_multiplier}{' '}
          in knock-out matches. The top 20% of deliveries (PI ≥ {num(data.stats.ratings.pressure_threshold_pi, 2)}) are
          high pressure. In this final, {pv.example_match.inn1_hp} of {pv.example_match.inn1_n} first-innings
          deliveries qualify, against all {pv.example_match.inn2_n} of the rain-reduced chase, which peaks on the last
          two balls. Hover the chart to see each ball.
        </Explain>
      </Card>

      <Card title="Where pressure peaks in a chase" subtitle="Mean Leverage Index of chase deliveries (1 = average delivery)"
        actions={<Segmented size="sm" options={[{ value: 'rrr', label: 'by required run rate' }, { value: 'wickets', label: 'by wickets lost' }]} value={hm} onChange={setHm} />}>
        <Heatmap which={hm} />
        <Explain>
          One number captures the factors the brief lists: required run rate, wickets in hand, balls remaining, stage
          of the innings and closeness of the contest. Pressure is highest late in close chases and fades when the
          chase is easy (required rate under 6) or out of reach (15+). In chases, {pct(close['WP 40-60%'])} of
          deliveries are high pressure when the match is in the balance (win probability 40–60%) and
          only {pct(close['<10/>90%'])} when it is all but decided.
        </Explain>
      </Card>

      <Card title="When pressure happens" subtitle="First innings against the chase">
        <ByOver />
        <Explain>
          {pct(comp.inn2_Powerplay + comp.inn2_Middle + comp.inn2_Death)} of high-pressure deliveries come in chases.
          While setting a total, a whole innings remains to make up for any single ball, so first-innings deliveries
          move the result less; only {pct(data.stats.ratings.high_pressure_share_by_innings['1'], 1)} of them qualify,
          almost all in the powerplay or the death. Every player still gets these chances: the median player bats in
          the chase in {pct(pv.batter_chase_match_share_median)} of his matches.
        </Explain>
      </Card>

      <div className="grid two">
        <Card title="Players behave differently under it" subtitle="Chase deliveries in the same phase, split by the Pressure Index">
          <Behaviour />
          <Explain>
            Comparing deliveries in the same phase removes the "it's just the death overs" explanation. At the death
            of a chase, high-pressure deliveries produce {num(dh.run_outs_per_1000_balls, 1)} run-outs per 1000 balls
            against {num(doth.run_outs_per_1000_balls, 1)}, and more wides and no-balls ({num(dh.wides_noballs_per_100_balls, 1)}{' '}
            against {num(doth.wides_noballs_per_100_balls, 1)} per 100), while batters take more risk (dot balls{' '}
            {num(dh.dot_pct, 0)}% against {num(doth.dot_pct, 0)}%).
          </Explain>
        </Card>
        <Card title="Is the win-probability model right?" subtitle="Predicted win probability against what actually happened">
          <Calibration />
          <Explain>
            Points on the dashed line are perfectly calibrated. The model is built from ball outcomes only and
            tracks real results closely; it is slightly over-confident in lopsided first-innings states. A
            re-calibration on match results barely improves it and proved unstable, so it is reported as a
            diagnostic only.
          </Explain>
        </Card>
      </div>

      <Card title="League-wide behaviour by pressure tier" subtitle={`High-pressure deliveries carry ${pct(pv.wp_swing_share_in_hp)} of all win-probability movement; the top 5% alone carry ${pct(pv.wp_swing_share_in_top5)}.`}>
        <SimpleTable columns={tierCols} align={['nowrap', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r']}
          rows={data.behaviour_tier.map((r) => [r.tier, `${num(r.share_of_deliveries_pct, 0)}%`, num(r.mean_PI, 2),
            `${num(r.avg_abs_WP_swing_pct, 2)}%`, num(r.runs_per_over, 2), num(r.dot_pct, 1), num(r.wickets_per_100_balls, 2),
            num(r.run_outs_per_1000_balls, 2), `${num(r.second_innings_pct, 0)}%`, `${num(r.death_overs_pct, 0)}%`])} />
      </Card>

      <Card title="The 15 most pressurised deliveries in the data" subtitle="Ranked by Pressure Index. Result: runs scored off the ball, W = wicket.">
        <SimpleTable columns={['Competition', 'Over', 'Batter', 'Bowler', 'Needed', 'Batting side WP', 'Pressure Index', 'Result']}
          align={['', 'r', '', '', 'r', 'r', 'r', 'c']}
          rows={data.most_pressurised.map((r) => [r.comp_name, `${r.overid}.${r.over_ball_num}`, r.striker_name, r.bowler_name,
            `${int(r.runs_needed)} off ${r.balls_left}`, pct(r.wp_bat_before), num(r.pi, 1), r.outcome])} />
      </Card>

      <div>
        <Card title="What a wicket costs in a chase" subtitle="Runs, IPL 2025 scoring environment">
          <SimpleTable columns={['Balls left', 'Wickets lost', 'Runs needed', 'Chase win prob.', 'Wicket cost (run expectancy, used)', 'Wicket cost (win-prob. equivalent)']}
            align={['r', 'r', 'r', 'r', 'r', 'r']}
            rows={data.wicket_cost.map((r) => [r.balls_left, r.wickets_lost, r.runs_needed, pct(r.chase_wp),
              num(r.wicket_cost_run_expectancy, 1), num(r.wicket_cost_wp_runs, 1)])} />
          <Explain>
            Each delivery's value charges a dismissal the runs it takes off the innings, from the same dynamic
            programme. It tracks the run-equivalent implied by the win-probability table, so early wickets cost far
            more than late ones (on average {num(data.stats.value.wicket_cost_by_phase.Powerplay, 1)} runs in the
            powerplay, {num(data.stats.value.wicket_cost_by_phase.Middle, 1)} in the middle overs and{' '}
            {num(data.stats.value.wicket_cost_by_phase.Death, 1)} at the death).
          </Explain>
        </Card>
      </div>

      <Card title="The static charts from the report">
        <div className="grid two tight">
          <Figure src="figures/fig_pressure_maps.png" caption="Average Leverage Index of chase deliveries by over and required run rate (left) and by over and wickets lost (right)." />
          <Figure src="figures/fig_example_match.png" caption="The IPL 2023 final: win probability and the Leverage Index of every delivery." />
        </div>
      </Card>
    </>
  )
}
