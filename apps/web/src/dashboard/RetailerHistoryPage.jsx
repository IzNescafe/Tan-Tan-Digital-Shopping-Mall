function RetailerHistoryPage({ retailerDashboard, onUpdateRetailerProductStatus, onBack, isSubmitting }) {
  const soldProducts = retailerDashboard?.soldProducts || [];
  const inStockProducts = retailerDashboard?.inStockProducts || [];
  const handleClosePage = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  return (
    <main className="main-layout">
      <section className="dashboard-section">
        <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close history page">
          <span aria-hidden="true">{"\u2715"}</span>
        </button>

        <div className="customer-shell retailer-shell">
          <section className="customer-section customer-section-wide">
            <div className="customer-section-heading">
              <div>
                <p className="preview-label">Sales history</p>
                <h3>Sold posts memory</h3>
              </div>
              <div className="post-studio-banner history-summary-pills">
                <span className="deal-brand">{soldProducts.length} sold</span>
                <span className="deal-brand">{inStockProducts.length} in stock</span>
              </div>
            </div>

            <div className="deal-grid retailer-product-grid">
              {soldProducts.length > 0 ? (
                soldProducts.map((product) => (
                  <article key={product.id} className="deal-card">
                    <div className="deal-image-wrap deal-image-wrap-product">
                      <img className="deal-image" src={product.image} alt={product.title} />
                      <span className="discount-badge">Sold</span>
                    </div>
                    <div className="deal-card-body">
                      <div className="deal-hero">
                        <span className="deal-brand">{product.brand}</span>
                        <span className="deal-type">{product.type}</span>
                      </div>
                      <h3>{product.title}</h3>
                      <p className="deal-meta">{product.category}</p>
                      <div className="price-row">
                        <strong>{product.priceMMK}</strong>
                        <span>{product.originalPriceMMK}</span>
                      </div>
                      <div className="deal-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUpdateRetailerProductStatus?.(product.id, "active")}
                        >
                          Restore to stock
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No sold posts yet. Sold items will be saved here automatically.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default RetailerHistoryPage;
