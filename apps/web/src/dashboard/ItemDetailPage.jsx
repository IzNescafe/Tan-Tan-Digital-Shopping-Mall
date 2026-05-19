import { useEffect, useState } from "react";

function ItemDetailImage({ product }) {
  const fallbackSource = product.fallbackImage || product.image || "";
  const [source, setSource] = useState(product.image || fallbackSource);

  useEffect(() => {
    setSource(product.image || fallbackSource);
  }, [product.image, fallbackSource]);

  return (
    <img
      className="detail-image"
      src={source}
      alt={product.title}
      onError={() => {
        if (source !== fallbackSource) {
          setSource(fallbackSource);
        }
      }}
    />
  );
}

function ItemDetailPage({ product, session, onBack, onAcceptOffer }) {
  const handleClosePage = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  const handleAcceptOffer = () => {
    if (typeof onAcceptOffer === "function") {
      onAcceptOffer(product);
    }
  };

  if (!product) {
    return (
      <main className="main-layout">
        <section className="hero-panel auth-layout">
          <div className="hero-copy">
            <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close item detail">
              <span aria-hidden="true">{"\u2715"}</span>
            </button>
            <p className="eyebrow">Item detail</p>
            <h2>Item not found.</h2>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="main-layout">
      <section className="hero-panel detail-layout">
        <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close item detail">
          <span aria-hidden="true">{"\u2715"}</span>
        </button>

        <div className="detail-image-panel">
          <ItemDetailImage product={product} />
          <span className="discount-badge">{product.discount}</span>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">Item detail</p>
          <h2>{product.title}</h2>
          <div className="detail-meta-row">
            <span className="deal-brand">{product.brand}</span>
            <span className="deal-type">{product.type}</span>
            <span className="deal-type">{product.category}</span>
          </div>
          <div className="price-row">
            <strong>{product.priceMMK}</strong>
            <span>{product.originalPriceMMK}</span>
          </div>
          <p className="hero-text">{product.description}</p>

          <div className="detail-info-grid">
            <article className="value-card">
              <p>Retailer: {product.retailer}</p>
            </article>
            <article className="value-card">
              <p>Proof: {product.proof}</p>
            </article>
            <article className="value-card">
              <p>Status: Ready to order</p>
            </article>
          </div>

          <div className="hero-actions">
            {session?.role === "customer" ? (
              <button className="primary-button" type="button" onClick={handleAcceptOffer}>
                Accept offer
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ItemDetailPage;
