# SupeRR Pressure Lab

Interactive dashboard for **SupeRR Selector Season 2, Round 1: the most reliable IPL and T20I players under pressure (2022–2026)**.



Pages: overview with the final top-10 lists, full rankings, player profiles, the Pressure Index, reliability checks, and the complete methodology report with all figures.

Built with React, Vite and Recharts. All numbers come from `src/data/dashboard.json`, exported by the analysis pipeline.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Every push to `main` is built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.
