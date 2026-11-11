import { data } from '../lib'
import { Figure, PageHead, Rich } from '../ui'

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function Block({ b }) {
  switch (b.type) {
    case 'h':
      return b.level === 1
        ? <h2 id={slug(b.text)} className="rep-h1">{b.text}</h2>
        : <h3 id={slug(b.text)} className="rep-h2">{b.text}</h3>
    case 'p':
      return <p className={b.caption ? 'rep-caption' : 'rep-p'}><Rich text={b.text} /></p>
    case 'ul':
      return <ul className="bullets">{b.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>
    case 'table':
      return (
        <div className="rep-table">
          {b.caption && <div className="rep-caption"><strong>Table {b.number}. </strong>{b.caption}</div>}
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr>{b.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )
    case 'fig':
      return <Figure src={b.src} caption={b.caption} number={b.number} />
    default:
      return null
  }
}

export default function Report() {
  const heads = data.report.filter((b) => b.type === 'h')
  const jump = (t) => document.getElementById(slug(t))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <>
      <PageHead kicker="Methodology report" title={data.title}>{data.subtitle}</PageHead>
      <div className="toolbar">
        <a className="btn primary" href="downloads/Methodology_Report_SupeRR_Selector_R1.docx" download>Download the report (DOCX)</a>
      </div>
      <div className="report">
        <nav className="toc">
          <div className="toc-title">Contents</div>
          {heads.map((h, i) => (
            <button key={i} className={`toc-item l${h.level}`} onClick={() => jump(h.text)}>{h.text}</button>
          ))}
        </nav>
        <article className="report-body">
          {data.report.map((b, i) => <Block key={i} b={b} />)}
        </article>
      </div>
    </>
  )
}
