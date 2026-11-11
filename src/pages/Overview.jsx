import { data, go, int, num, pct, signed, team, UNIT } from '../lib'
import { Card, Explain, ProbBar, RankBadge, Stat } from '../ui'

function TopList({ kind }) {
  const rows = data.players[kind].slice(0, 10)
  return (
    <Card title={`Top 10 ${kind === 'bat' ? 'batters' : 'bowlers'} under pressure`}
      subtitle="Final ranking, rank 1 = highest rated. Click a player for the full profile.">
      <div className="list-head">
        <span>#</span><span>Player</span><span>Value</span><span>Consistency</span><span>Certainty</span>
      </div>
      <ol className="toplist">
        {rows.map((p) => (
          <li key={p.id} onClick={() => go(`player/${kind}/${p.id}`)} tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && go(`player/${kind}/${p.id}`)}>
            <RankBadge rank={p.rank} />
            <div className="tl-main">
              <div className="tl-name">{p.name}</div>
              <div className="tl-team">{team(p)}</div>
            </div>
            <div className="tl-metric">
              <span>{signed(p.overall_rv)}</span>
              <small>runs /100 balls</small>
            </div>
            <div className="tl-metric">
              <span>{int(p.successes)}/{int(p.pressure_inns)}</span>
              <small>pressure {UNIT[kind]} won</small>
            </div>
            <div className="tl-prob">
              <ProbBar p={p.p_top10} />
              <small>chance of top 10</small>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export default function Overview() {
  const s = data.stats
  const rs = s.ratings
  const sb = rs.bat.split_half
  const sw = rs.bowl.split_half
  const w = data.weights
  return (
    <>
      <header className="hero">
        <div>
          <div className="hero-kicker">SupeRR Selector Season 2 · Round 1</div>
          <h1>{data.title}</h1>
          <p className="hero-sub">
            The ten batters and ten bowlers who perform most reliably when a match is on the line, chosen from{' '}
            {int(s.data.deliveries_rated)} IPL and T20I deliveries between 2022 and 2026.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="#/rankings">Explore the rankings</a>
            <a className="btn ghost" href="#/methodology">Read the full report</a>
          </div>
        </div>
        <div className="hero-picks">
          {['bat', 'bowl'].map((k) => {
            const p = data.players[k][0]
            return (
              <div className="pick" key={k} onClick={() => go(`player/${k}/${p.id}`)}>
                <div className="pick-badge">#1</div>
                <div>
                  <div className="pick-label">{k === 'bat' ? 'Top batter' : 'Top bowler'} under pressure</div>
                  <div className="pick-name">{p.name}</div>
                  <div className="pick-team">{team(p)} · {pct(p.p_top10)} chance of a top-10 finish</div>
                </div>
              </div>
            )
          })}
        </div>
      </header>

      <div className="grid kpis">
        <Stat label="Deliveries rated" value={int(s.data.deliveries_rated)}
          sub={`${s.data.matches_rated} matches · ${s.data.ipl_matches} IPL · ${s.data.t20i_matches} T20I`} />
        <Stat label="High-pressure deliveries" value={`Top ${pct(1 - data.config.high_pressure_quantile)}`}
          sub={`Pressure Index ≥ ${num(rs.pressure_threshold_pi, 2)}`} />
        <Stat accent label="Win-probability swing they carry" value={pct(s.pressure.wp_swing_share_in_hp)}
          sub="of all movement in who wins, from 20% of deliveries" />
        <Stat label="Players ranked" value={`${rs.bat.eligible_players} · ${rs.bowl.eligible_players}`}
          sub={`batters · bowlers with ≥ ${data.config.min_balls} pressure deliveries`} />
      </div>

      <div className="grid two">
        <TopList kind="bat" />
        <TopList kind="bowl" />
      </div>

      <Card title="How the lists were built">
        <div className="steps">
          <div className="step">
            <div className="step-n">1</div>
            <h4>Measure pressure on every ball</h4>
            <p>A ball-by-ball win-probability model estimates how much each delivery can change who wins.
              That is the <strong>Pressure Index</strong>. The top 20% of deliveries count as high pressure;
              knock-out games get a {data.config.knockout_multiplier}× stakes multiplier.</p>
            <a href="#/pressure">See the Pressure Index →</a>
          </div>
          <div className="step">
            <div className="step-n">2</div>
            <h4>Value every delivery fairly</h4>
            <p>Each ball is compared with what an <strong>average player</strong> would do in exactly that
              situation (score, wickets, balls left, target, league and season), with dismissals costed in
              runs and the quality of the opponent removed.</p>
            <a href="#/methodology">Read the method →</a>
          </div>
          <div className="step">
            <div className="step-n">3</div>
            <h4>Rank on level and consistency</h4>
            <p>Score = {w.level} × expected value per pressure ball + {w.consistency} × share of pressure{' '}
              innings that beat expectation, minus one bootstrap standard error so that a high rank needs both a
              high score <em>and</em> enough evidence.</p>
            <a href="#/rankings">See the scores →</a>
          </div>
        </div>
      </Card>

      <Card title="Key finding: rising to the occasion is not a repeatable skill"
        subtitle="Correlation of players' numbers between two random halves of the matches (average of 20 splits)">
        <div className="finding">
          {[
            ['Usual record predicts pressure record in other matches', sb.usual_predicts_press.split_half_r, sw.usual_predicts_press.split_half_r],
            ['Pressure record predicts pressure record in other matches', sb.press_predicts_press.split_half_r, sw.press_predicts_press.split_half_r],
            ['The rise or dip under pressure repeats', sb.diff_raw.split_half_r, sw.diff_raw.split_half_r],
          ].map(([label, b, bw]) => (
            <div className="finding-row" key={label}>
              <div className="finding-label">{label}</div>
              <div className="finding-vals">
                <span className="chip pink">Batters r = {signed(b, 2)}</span>
                <span className="chip blue">Bowlers r = {signed(bw, 2)}</span>
              </div>
            </div>
          ))}
        </div>
        <Explain title="What this means">
          A player's pressure record on its own is mostly noise: a few hundred deliveries cannot separate players
          reliably, and how far someone "rises" or "dips" under pressure does not carry over to other matches. The
          players who deliver under pressure are very good players who do it often. So the ranking uses
          each player's opponent-adjusted value per ball across all situations as its level, and keeps the
          pressure-specific evidence where it is repeatable: a minimum body of pressure work, and{' '}
          {pct(w.consistency)} of the score for consistency in pressure innings.{' '}
          <a href="#/reliability">See every test →</a>
        </Explain>
      </Card>
    </>
  )
}
