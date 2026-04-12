const featuredCollections = [
  {
    title: "Outlet Finds",
    description: "Seasonal sneakers, bags, and wardrobe staples sourced from Bangkok outlet malls.",
    tone: "soft-violet",
  },
  {
    title: "Custom Requests",
    description: "Customers send a dream item and budget, retailers reply with curated offers.",
    tone: "soft-pink",
  },
  {
    title: "Proof of Authenticity",
    description: "Receipts, real product photos, and status updates keep every order transparent.",
    tone: "soft-blue",
  },
];

const stats = [
  { label: "Verified retailers", value: "120+" },
  { label: "Avg. savings", value: "28%" },
  { label: "Request response", value: "< 4 hrs" },
];

const workflow = [
  {
    step: "01",
    title: "Browse or request",
    text: "Shop listed products or post a custom request with your target brand, size, and budget.",
  },
  {
    step: "02",
    title: "Receive curated offers",
    text: "Approved retailers respond with pricing, proof details, and expected delivery timelines.",
  },
  {
    step: "03",
    title: "Track with confidence",
    text: "Follow order status, chat with the retailer, and review receipts before shipment.",
  },
];

function App() {
  return (
    <div className="app-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark">TT</span>
          <div>
            <p className="eyebrow">Tan Tan Marketplace</p>
            <h1>Authentic outlet shopping with a softer, trust-first feel.</h1>
          </div>
        </div>

        <nav className="top-nav" aria-label="Primary">
          <a href="#collections">Collections</a>
          <a href="#workflow">How it works</a>
          <a href="#dashboard">Dashboard</a>
          <a className="nav-cta" href="#launch">
            Launch theme
          </a>
        </nav>
      </header>

      <main>
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Project-wide visual direction</p>
            <h2>
              Thistle, candy pink, and sky blue now anchor the entire frontend mood.
            </h2>
            <p className="hero-text">
              This starter theme turns your palette into reusable brand tokens, layered surfaces,
              and soft marketplace UI blocks that can scale into catalog, request, chat, and admin
              pages.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#collections">
                Explore themed sections
              </a>
              <a className="secondary-button" href="#brand-system">
                View brand tokens
              </a>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <aside className="hero-preview" id="dashboard">
            <div className="preview-card preview-main">
              <p className="preview-label">Retailer dashboard</p>
              <h3>Today&apos;s sourcing board</h3>
              <ul>
                <li>3 pending customer requests</li>
                <li>7 items awaiting proof upload</li>
                <li>2 orders ready to ship</li>
              </ul>
            </div>

            <div className="preview-stack">
              <div className="preview-card preview-accent">
                <p className="preview-label">Theme colors</p>
                <div className="palette-row" aria-label="Theme palette swatches">
                  <span style={{ backgroundColor: "var(--color-thistle)" }} />
                  <span style={{ backgroundColor: "var(--color-fairy-tale)" }} />
                  <span style={{ backgroundColor: "var(--color-carnation)" }} />
                  <span style={{ backgroundColor: "var(--color-uranian)" }} />
                  <span style={{ backgroundColor: "var(--color-sky)" }} />
                </div>
              </div>

              <div className="preview-card preview-note" id="brand-system">
                <p className="preview-label">Design rule</p>
                <h3>Every new screen inherits these tokens first.</h3>
              </div>
            </div>
          </aside>
        </section>

        <section className="collection-section" id="collections">
          <div className="section-heading">
            <p className="eyebrow">Key experiences</p>
            <h2>Styled to feel gentle, premium, and trustworthy.</h2>
          </div>

          <div className="collection-grid">
            {featuredCollections.map((collection) => (
              <article key={collection.title} className={`collection-card ${collection.tone}`}>
                <p className="collection-kicker">Feature area</p>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="section-heading">
            <p className="eyebrow">Customer journey</p>
            <h2>A visual system ready for the marketplace flow.</h2>
          </div>

          <div className="workflow-grid">
            {workflow.map((item) => (
              <article key={item.step} className="workflow-card">
                <span className="workflow-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="launch-banner" id="launch">
          <p className="eyebrow">Theme status</p>
          <h2>The project now has a single pastel brand language to build on.</h2>
          <p>
            Use these tokens and sections as the default reference for future pages like auth,
            product listings, requests, chat, and admin dashboards.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
