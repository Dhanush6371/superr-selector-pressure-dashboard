import { useEffect, useState } from 'react'
import { pct } from './lib'

/** Renders **bold** segments used by the report text. */
export function Rich({ text }) {
  const parts = String(text).split('**')
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))
}

export function Card({ title, subtitle, actions, children, className = '', id }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Explain({ title = 'How to read this', children }) {
  return (
    <div className="explain">
      <div className="explain-icon" aria-hidden>i</div>
      <div>
        <div className="explain-title">{title}</div>
        <div className="explain-body">{children}</div>
      </div>
    </div>
  )
}

export function Stat({ label, value, sub, accent }) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Segmented({ options, value, onChange, size }) {
  return (
    <div className={`seg ${size || ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value}
          className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProbBar({ p }) {
  return (
    <div className="prob">
      <div className="prob-track"><div className="prob-fill" style={{ width: `${Math.round(100 * (p || 0))}%` }} /></div>
      <span>{pct(p)}</span>
    </div>
  )
}

export function RankBadge({ rank }) {
  return <span className={`rank-badge ${rank <= 3 ? 'gold' : ''}`}>{rank}</span>
}

export function Figure({ src, caption, number }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <figure className="fig">
      <button className="fig-img" onClick={() => setOpen(true)} title="Click to enlarge">
        <img src={src} alt={caption} loading="lazy" />
      </button>
      <figcaption>{number ? <strong>Figure {number}. </strong> : null}<Rich text={caption} /></figcaption>
      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <img src={src} alt={caption} />
          <p><Rich text={caption} /></p>
        </div>
      )}
    </figure>
  )
}

export function SimpleTable({ columns, rows, align }) {
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr>{columns.map((c, i) => <th key={i} className={align?.[i] || ''}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((v, j) => <td key={j} className={align?.[j] || ''}>{v}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TipBox({ title, rows }) {
  return (
    <div className="tip">
      {title && <div className="tip-title">{title}</div>}
      {rows.filter(Boolean).map(([k, v], i) => (
        <div className="tip-row" key={i}><span>{k}</span><strong>{v}</strong></div>
      ))}
    </div>
  )
}

export function PageHead({ kicker, title, children }) {
  return (
    <header className="page-head">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1>{title}</h1>
      {children && <p className="lede">{children}</p>}
    </header>
  )
}
