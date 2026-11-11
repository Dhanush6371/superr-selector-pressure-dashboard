import { useEffect, useState } from 'react'
import Overview from './pages/Overview'
import Rankings from './pages/Rankings'
import Player from './pages/Player'
import Pressure from './pages/Pressure'
import Reliability from './pages/Reliability'
import Report from './pages/Report'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'player', label: 'Players' },
  { id: 'pressure', label: 'Pressure Index' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'methodology', label: 'Full report' },
]

/** Simple pink-and-blue crest (not the official club logo). */
export function Crest({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="crest" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EA1A85" />
          <stop offset="1" stopColor="#254AA5" />
        </linearGradient>
      </defs>
      <path d="M24 2 44 9v14c0 12-8.6 20.5-20 23C12.6 43.5 4 35 4 23V9z" fill="url(#crest)" stroke="#D4A017" strokeWidth="2" />
      <text x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Outfit, Inter, sans-serif">RR</text>
    </svg>
  )
}

function parse() {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [page = 'overview', ...rest] = h.split('/')
  return { page: NAV.some((n) => n.id === page) ? page : 'overview', rest }
}

export default function App() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const pages = {
    overview: <Overview />,
    rankings: <Rankings />,
    player: <Player kind={route.rest[0]} id={route.rest[1]} />,
    pressure: <Pressure />,
    reliability: <Reliability />,
    methodology: <Report />,
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/overview">
            <Crest />
            <span className="brand-text">
              <span className="brand-title">SupeRR Pressure Lab</span>
              <span className="brand-sub">Most reliable players under pressure · Round 1</span>
            </span>
          </a>
          <nav className="tabs" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.id} href={`#/${n.id}`} className={route.page === n.id ? 'active' : ''}>{n.label}</a>
            ))}
          </nav>
        </div>
        <div className="topbar-stripe" />
      </header>
      <main className="container">{pages[route.page]}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <span>SupeRR Selector Season 2 · Round 1 · IPL and T20I ball-by-ball data, 2022–2026</span>
          <span>Every number on this site comes from the reproducible pipeline in <code>pressure_model/</code></span>
        </div>
      </footer>
    </div>
  )
}
