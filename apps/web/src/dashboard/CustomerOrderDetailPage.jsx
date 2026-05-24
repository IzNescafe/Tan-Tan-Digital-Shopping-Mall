function formatTimelineTime(value) {
  if (!value) {
    return "Waiting";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Waiting";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CustomerOrderDetailPage({
  order,
  isLoading,
  isSubmitting,
  orderReceiptForm,
  isReceiptOpen,
  onToggleReceipt,
  onReceiptFileChange,
  onReceiptNoteChange,
  onUploadReceipt,
  onCustomerOrderAction,
  onCustomerConfirmDelivered,
  onReportRetailer,
  onBack,
}) {
  const handleClosePage = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  if (isLoading) {
    return (
      <main className="main-layout">
        <section className="hero-panel auth-layout">
          <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close order detail">
            <span aria-hidden="true">{"\u2715"}</span>
          </button>
          <div className="hero-copy">
            <p className="eyebrow">Order detail</p>
            <h2>Loading order...</h2>
          </div>
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="main-layout">
        <section className="hero-panel auth-layout">
          <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close order detail">
            <span aria-hidden="true">{"\u2715"}</span>
          </button>
          <div className="hero-copy">
            <p className="eyebrow">Order detail</p>
            <h2>Order not found.</h2>
          </div>
        </section>
      </main>
    );
  }

  const receiptForm = orderReceiptForm || {};
  const canCancel = !["shipped", "delivered", "canceled"].includes(order.status);
  const canAccept = order.status === "pending";
  const canUploadReceipt =
    !order.paymentConfirmedAt &&
    !order.receiptUploadedAt &&
    ["accepted", "purchased", "packing", "shipped", "delivered"].includes(order.status);
  const canConfirmDelivered =
    order.status === "delivered" && order.paymentConfirmedAt && !order.customerDeliveredConfirmedAt;

  return (
    <main className="main-layout">
      <section className="hero-panel order-detail-layout">
        <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close order detail">
          <span aria-hidden="true">{"\u2715"}</span>
        </button>

        <div className="order-detail-main">
          <div className="order-detail-header">
            <div>
              <p className="eyebrow">Order detail</p>
              <h2>{order.title}</h2>
              <p className="hero-text">{order.nextStep}</p>
            </div>
            <span className={`status-pill status-${order.status}`}>{order.status}</span>
          </div>

          <div className="order-detail-grid">
            <article className="order-detail-card order-detail-card-wide">
              <div className="catalog-heading">
                <h4>Order summary</h4>
                <span>{order.id}</span>
              </div>
              <div className="order-detail-pill-row">
                <span className="profile-meta-pill">ETA: {order.eta}</span>
                <span className="profile-meta-pill">Retailer: {order.retailerName || "Retailer"}</span>
                {order.requestSummary?.budgetMMK ? (
                  <span className="profile-meta-pill">Budget: {order.requestSummary.budgetMMK}</span>
                ) : null}
              </div>
              <div className="order-detail-info-grid">
                <div className="value-card">
                  <p>Requested item: {order.requestSummary?.productName || order.title}</p>
                </div>
                <div className="value-card">
                  <p>Payment: {order.paymentConfirmedAt ? "Confirmed" : order.status === "payment_pending" ? "Under review" : "Pending"}</p>
                </div>
                <div className="value-card">
                  <p>Receipt: {order.receiptImage ? "Uploaded" : "Not uploaded yet"}</p>
                </div>
                <div className="value-card">
                  <p>Tracking: {order.trackingNote ? "Shared by retailer" : "Not shared yet"}</p>
                </div>
              </div>
            </article>

            <article className="order-detail-card">
              <div className="catalog-heading">
                <h4>Retailer contact</h4>
                <span>{order.contact?.name || order.retailerName || "Retailer"}</span>
              </div>
              <div className="order-detail-contact-list">
                <div className="value-card"><p>Phone: {order.contact?.phone || "Not shared yet"}</p></div>
                <div className="value-card"><p>Telegram: {order.contact?.telegram || "Not shared yet"}</p></div>
                <div className="value-card"><p>City: {order.contact?.city || "Not shared yet"}</p></div>
                <div className="value-card"><p>Address: {order.contact?.address || "Not shared yet"}</p></div>
              </div>
            </article>

            <article className="order-detail-card">
              <div className="catalog-heading">
                <h4>Request note</h4>
                <span>{order.requestSummary?.status || "saved"}</span>
              </div>
              <p className="order-detail-note">
                {order.requestSummary?.details || "No request note was saved for this order."}
              </p>
            </article>

            <article className="order-detail-card">
              <div className="catalog-heading">
                <h4>Tracking note</h4>
                <span>{order.trackingUpdatedAt ? "Updated" : "Pending"}</span>
              </div>
              <p className="order-detail-note">
                {order.trackingNote || "Retailer has not shared a tracking note yet."}
              </p>
            </article>

            <article className="order-detail-card">
              <div className="catalog-heading">
                <h4>Retailer proofs</h4>
                <span>
                  {order.deliveryProofImage
                    ? "Delivery proof"
                    : order.transactionProofImage
                      ? "Transaction proof"
                      : "Pending"}
                </span>
              </div>
              <div className="order-detail-proof-grid">
                <div className="order-detail-receipt-preview">
                  <strong>Transaction proof</strong>
                  {order.transactionProofImage ? (
                    <>
                      <img className="orders-receipt-preview" src={order.transactionProofImage} alt="Transaction proof" />
                      {order.transactionProofNote ? <p>{order.transactionProofNote}</p> : null}
                    </>
                  ) : (
                    <p>No transaction proof uploaded yet.</p>
                  )}
                </div>
                <div className="order-detail-receipt-preview">
                  <strong>Delivery proof</strong>
                  {order.deliveryProofImage ? (
                    <>
                      <img className="orders-receipt-preview" src={order.deliveryProofImage} alt="Delivery proof" />
                      {order.deliveryProofNote ? <p>{order.deliveryProofNote}</p> : null}
                    </>
                  ) : (
                    <p>No delivery proof uploaded yet.</p>
                  )}
                </div>
              </div>
            </article>

            <article className="order-detail-card order-detail-card-wide">
              <div className="catalog-heading">
                <h4>Timeline</h4>
                <span>{order.timeline?.length || 0} steps</span>
              </div>
              <div className="order-timeline">
                {(order.timeline || []).map((step) => (
                  <div key={step.id} className={`order-timeline-item${step.complete ? " is-complete" : ""}`}>
                    <span className="order-timeline-dot" />
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                    </div>
                    <span>{formatTimelineTime(step.at)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="order-detail-card order-detail-card-wide">
              <div className="catalog-heading">
                <h4>Actions</h4>
                <span>{order.status}</span>
              </div>
              <div className="order-detail-actions">
                {canAccept ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onCustomerOrderAction(order.id, "accept")}
                  >
                    Accept order
                  </button>
                ) : null}

                {canUploadReceipt ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onToggleReceipt(order.id)}
                  >
                    {isReceiptOpen ? "Hide receipt upload" : "Pay now"}
                  </button>
                ) : null}

                {canCancel ? (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onCustomerOrderAction(order.id, "cancel")}
                  >
                    Cancel order
                  </button>
                ) : null}

                {canConfirmDelivered ? (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onCustomerConfirmDelivered(order.id)}
                  >
                    Confirm delivered
                  </button>
                ) : null}

                <button
                  className="secondary-button danger-button"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    onReportRetailer?.({
                      retailerId: order.contact?.id,
                      retailerName: order.contact?.name || order.retailerName,
                    })
                  }
                >
                  Report retailer
                </button>
              </div>

              {canUploadReceipt && isReceiptOpen ? (
                <div className="order-detail-receipt-box">
                  <label className="secondary-button orders-upload-button">
                    Upload receipt
                    <input type="file" accept="image/*" hidden onChange={onReceiptFileChange(order.id)} />
                  </label>
                  <textarea
                    className="orders-receipt-note"
                    rows="3"
                    placeholder="Optional payment note"
                    value={receiptForm.receiptNote || ""}
                    onChange={(event) => onReceiptNoteChange(order.id, event.target.value)}
                  />
                  {receiptForm.receiptImage ? (
                    <img className="orders-receipt-preview" src={receiptForm.receiptImage} alt="Receipt preview" />
                  ) : null}
                  <button
                    className="primary-button"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onUploadReceipt(order.id)}
                  >
                    Submit receipt
                  </button>
                </div>
              ) : null}

              {order.receiptImage ? (
                <div className="order-detail-receipt-preview">
                  <strong>Latest receipt</strong>
                  <img className="orders-receipt-preview" src={order.receiptImage} alt="Uploaded receipt" />
                  {order.receiptNote ? <p>{order.receiptNote}</p> : null}
                </div>
              ) : null}

              {order.customerDeliveredConfirmedAt ? (
                <div className="order-detail-receipt-preview">
                  <strong>Delivered confirmation</strong>
                  <p>Customer confirmed successful delivery on {formatTimelineTime(order.customerDeliveredConfirmedAt)}.</p>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CustomerOrderDetailPage;
