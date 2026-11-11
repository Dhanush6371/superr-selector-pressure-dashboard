import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { C, data, go, int, KIND, num, pct, player, signed, team, UNIT } from '../lib'
import { Card, Explain, PageHead, ProbBar, Segmented, Stat, TipBox } from '../ui'

const KINDS = [{ value: 'bat', label: 'Batters' }, { value: 'bowl', label: 'Bowlers' }]

function rankWithin(kind, key, p) {
  const vals = data.players[kind].map((x) => x[key]).filter((v) => v !== null)
  return 1 + vals.filter((v) => v > p[key]).length
}

function Comparison({ kind, p }) {
  const rows = kind === 'bat'
    ? [
      ['Deliveries faced', int(p.balls_P), int(p.balls_N)],
      ['Runs', int(p.runs_P), int(p.runs_N)],
      ['Strike rate', num(p.SR_pressure, 1), num(p.SR_normal, 1)],
      ['Average', num(p.avg_pressure, 1), num(p.avg_normal, 1)],
      ['Dot-ball %', num(p.dot_pct_pressure, 1), num(p.dot_pct_normal, 1)],
      ['Run value per 100 balls', `${signed(p.press_raw, 1)} ± ${num(p.press_se, 0)}`, `${signed(p.usual_raw, 1)} ± ${num(p.usual_se, 0)}`],
    ]
    : [
      ['Legal balls bowled', int(p.balls_P), int(p.balls_N)],
      ['Economy', num(p.econ_pressure, 2), num(p.econ_normal, 2)],
      ['Wickets', int(p.outs_P), int(p.outs_N)],
      ['Balls per wicket', num(p.balls_per_wkt_pressure, 1), num(p.balls_per_wkt_normal, 1)],
      ['Dot-ball %', num(p.dot_pct_pressure, 1), num(p.dot_pct_normal, 1)],
      ['Run value per 100 balls', `${signed(p.press_raw, 1)} ± ${num(p.press_se, 0)}`, `${signed(p.usual_raw, 1)} ± ${num(p.usual_se, 0)}`],
    ]
  return (
    <div className="table-wrap">
      <table className="tbl compare">
        <thead><tr><th /><th className="pinkh">High pressure</th><th>Other deliveries</th></tr></thead>
        <tbody>{rows.map(([k, a, b]) => <tr key={k}><td>{k}</td><td className="strong">{a}</td><td>{b}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function InningsChart({ kind, p }) {
  const inns = (data.innings[kind][String(p.id)] || []).map((r, i) => ({ ...r, i }))
  if (!inns.length) return <p className="muted">No pressure {UNIT[kind]} recorded.</p>
  // one tick at the first pressure innings of each year
  const yearTicks = inns.filter((r, i) => i === 0 || r.date.slice(0, 4) !== inns[i - 1].date.slice(0, 4)).map((r) => r.i)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={inns} margin={{ top: 10, right: 16, bottom: 10, left: 8 }}>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="i" ticks={yearTicks} tickFormatter={(i) => inns[i]?.date?.slice(0, 4)} tick={{ fontSize: 12.5 }} interval={0} />
        <YAxis tick={{ fontSize: 12 }} width={56} label={{ value: 'runs vs average player', angle: -90, position: 'insideLeft', offset: 4, fontSize: 12.5, fill: C.muted, style: { textAnchor: 'middle' } }} />
        <ReferenceLine y={0} stroke={C.ink} />
        <Tooltip cursor={{ fill: 'rgba(37,74,165,0.06)' }} content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const r = payload[0].payload
          return (
            <TipBox title={`${r.date} · ${r.competition}`} rows={[
              ['Opponent', r.opponent],
              ['Innings', r.innings === 2 ? (kind === 'bat' ? 'chasing' : 'defending') : (kind === 'bat' ? 'setting a total' : 'bowling first')],
              ['High-pressure deliveries', r.n],
              ['Runs vs average player', signed(r.rv, 1)],
              ['Result', r.success ? 'beat expectation' : 'below expectation'],
            ]} />
          )
        }} />
        <Bar isAnimationActive={false} dataKey="rv" radius={[3, 3, 0, 0]}>
          {inns.map((r) => <Cell key={r.i} fill={r.success ? C.pink : C.grey} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Player({ kind: k, id }) {
  const kind = k === 'bowl' ? 'bowl' : 'bat'
  const list = data.players[kind]
  const p = player(kind, id) || list[0]
  const n = list.length
  const evRank = rankWithin(kind, 'overall_rv', p)
  const csRank = rankWithin(kind, 'success_rate', p)
  return (
    <>
      <PageHead kicker="Player profile" title={p.name}>
        {team(p)} · {p.ipl_matches} IPL and {p.t20i_matches} T20I matches in the data ({p.first_year}–{p.last_year})
      </PageHead>
      <div className="toolbar">
        <Segmented options={KINDS} value={kind} onChange={(v) => go(`player/${v}/${data.players[v][0].id}`)} />
        <select className="select" value={p.id} onChange={(e) => go(`player/${kind}/${e.target.value}`)}>
          {list.map((x) => <option key={x.id} value={x.id}>{x.rank}. {x.name}</option>)}
        </select>
      </div>

      <div className="grid kpis">
        <Stat accent label={`${KIND[kind].slice(0, -1)} rank`} value={`#${p.rank}`} sub={`of ${n} eligible · point-score rank ${p.point_rank}`} />
        <Stat label="Chance of a top-10 finish" value={pct(p.p_top10)} sub={`likely rank ${num(p.rank_p10, 0)}–${num(p.rank_p90, 0)} (10th–90th pct)`} />
        <Stat label="Expected value per ball" value={signed(p.overall_rv)} sub={`runs per 100 balls · ${evRank} of ${n}`} />
        <Stat label={`Pressure ${UNIT[kind]} won`} value={`${int(p.successes)}/${int(p.pressure_inns)}`} sub={`shrunk rate ${pct(p.success_rate)} · ${csRank} of ${n}`} />
      </div>

      <div className="grid two">
        <Card title="Under pressure vs usual" subtitle="Raw numbers, and run value adjusted for match situation and opponent">
          <Comparison kind={kind} p={p} />
          <Explain>
            Run value is runs {kind === 'bat' ? 'added' : 'saved'} per 100 balls compared with an average player in the
            identical situation, with dismissals valued at the runs they cost. The ± figure is one standard error: a
            gap between the two columns smaller than about twice that is within normal variation.
          </Explain>
        </Card>
        <Card title="Why this rank" subtitle="How the final score is assembled">
          <div className="breakdown">
            <div><span>Expected value (× {data.weights.level})</span><strong>{signed(p.contrib_level, 2)}</strong></div>
            <div><span>Consistency (× {data.weights.consistency})</span><strong>{signed(p.contrib_consistency, 2)}</strong></div>
            <div className="sum"><span>Point score</span><strong>{num(p.score, 3)}</strong></div>
            <div><span>Bootstrap standard error</span><strong>− {num(p.score_se, 3)}</strong></div>
            <div className="sum total"><span>Final score</span><strong>{num(p.reliability_score, 3)}</strong></div>
          </div>
          <ProbBar p={p.p_top10} />
          <p className="muted small">Share of {int(data.config.bootstrap_total)} match resamples in which he finishes in the top 10.</p>
        </Card>
      </div>

      <Card title={`Every pressure ${kind === 'bat' ? 'innings' : 'spell'}`}
        subtitle={`Matches with ≥ ${kind === 'bat' ? data.config.cons_balls_bat : data.config.cons_balls_bowl} high-pressure deliveries, in date order. Pink = beat the average-player expectation.`}>
        <InningsChart kind={kind} p={p} />
        <Explain>
          Each bar is one match: the runs this player {kind === 'bat' ? 'added' : 'saved'} over the high-pressure
          deliveries of that match, compared with an average player in the same situations and against the same
          opponents. The consistency score counts the pink bars ({int(p.successes)} of {int(p.pressure_inns)}),
          shrunk toward the league rate so a short record cannot look perfect by chance.
        </Explain>
      </Card>
    </>
  )
}
