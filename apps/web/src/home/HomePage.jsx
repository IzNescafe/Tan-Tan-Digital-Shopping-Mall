function createHeroFallback(title, accentA, accentB) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="680" viewBox="0 0 900 680">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
      </defs>
      <rect width="900" height="680" rx="36" fill="url(#g)" />
      <text x="60" y="330" fill="#2d2340" font-size="58" font-family="Arial, sans-serif" font-weight="700">
        ${title}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const trendingItems = [
  {
    title: "Coach Willow Tote",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    fallbackImage: createHeroFallback("Coach Willow Tote", "#ffc8dd", "#cdb4db"),
    price: "615,000 MMK",
    originalPrice: "875,000 MMK",
    discount: "30% OFF",
    detail: "Coach outlet bestseller",
  },
  {
    title: "Adidas Samba",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    fallbackImage: createHeroFallback("Adidas Samba", "#bde0fe", "#a2d2ff"),
    price: "338,000 MMK",
    originalPrice: "495,000 MMK",
    discount: "32% OFF",
    detail: "Top sneaker request",
  },
  {
    title: "Bath & Body Works Set",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    fallbackImage: createHeroFallback("BBW Gift Set", "#ffafcc", "#ffc8dd"),
    price: "88,000 MMK",
    originalPrice: "135,000 MMK",
    discount: "37% OFF",
    detail: "Fast-selling gift bundle",
  },
];

const valuePoints = ["Verified retailers", "Receipt and proof photos", "Easy order tracking"];

function HomePage({
  apiReady,
  session,
  onOpenLogin,
  onOpenCustomerSignup,
  onOpenRetailerApply,
  onOpenDashboard,
}) {
  return (
    <main className="main-layout">
      <section className="hero-panel marketing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Thailand outlet marketplace</p>
          <h2>Branded outlet deals for Myanmar customers.</h2>
          <p className="hero-text">Browse deals and track orders with proof.</p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={session ? onOpenDashboard : onOpenLogin}>
              {session ? "Open dashboard" : "Go to login"}
            </button>
            <span className={`api-pill ${apiReady ? "is-online" : "is-offline"}`}>
              API {apiReady ? "online" : "offline"}
            </span>
          </div>

          <div className="value-list">
            {valuePoints.map((point) => (
              <article key={point} className="value-card">
                <p>{point}</p>
              </article>
            ))}
          </div>

          {!session ? (
            <section className="home-login-panel">
              <div className="home-login-copy">
                <p className="preview-label">Quick access</p>
                <h3>Choose how you want to sign in</h3>
                <p className="panel-text">Customers can join free. Retailers can apply and continue the approval flow.</p>
              </div>
              <div className="home-login-actions">
                <button className="primary-button" type="button" onClick={onOpenLogin}>
                  Login
                </button>
                <button className="secondary-button" type="button" onClick={onOpenCustomerSignup}>
                  Customer signup
                </button>
                <button className="secondary-button" type="button" onClick={onOpenRetailerApply}>
                  Retailer apply
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="marketing-panel">
          <p className="preview-label">Featured deals</p>
          <h3>Popular deals</h3>
          <div className="trend-list">
            {trendingItems.map((item) => (
              <article key={item.title} className="trend-card">
                <div className="trend-image-wrap">
                  <img
                    className="trend-image"
                    src={item.image || item.fallbackImage}
                    alt={item.title}
                    onError={(event) => {
                      if (item.fallbackImage && event.currentTarget.src !== item.fallbackImage) {
                        event.currentTarget.src = item.fallbackImage;
                      }
                    }}
                  />
                  <span className="discount-badge">{item.discount}</span>
                </div>
                <h4>{item.title}</h4>
                <div className="price-row">
                  <strong>{item.price}</strong>
                  <span>{item.originalPrice}</span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default HomePage;
