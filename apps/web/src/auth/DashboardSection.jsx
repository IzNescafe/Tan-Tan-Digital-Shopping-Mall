function AdminQueueCard({ title, eyebrow, count }) {
  return (
    <article className="admin-queue-card">
      <p className="eyebrow">{eyebrow}</p>
      <strong>{String(count).padStart(2, "0")}</strong>
      <h3>{title}</h3>
    </article>
  );
}

function AdminReviewCard({
  kicker,
  title,
  summary,
  note,
  image,
  imageAlt,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  dangerActionLabel,
  onDangerAction,
}) {
  return (
    <article className="approval-card">
      <div className="approval-copy">
        <p className="collection-kicker">{kicker}</p>
        <h3>{title}</h3>
        <p className="panel-text">{summary}</p>
        {note ? <p className="panel-text">Note: {note}</p> : null}
        {image ? <img className="approval-receipt-preview" src={image} alt={imageAlt} /> : null}
      </div>
      <div className="approval-actions">
        {actionLabel ? (
          <button className="primary-button approval-action" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {secondaryActionLabel ? (
          <button className="secondary-button approval-action" type="button" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        ) : null}
        {dangerActionLabel ? (
          <button className="secondary-button approval-action danger-button" type="button" onClick={onDangerAction}>
            {dangerActionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function AdminEmptyCard({ title, text }) {
  return (
    <article className="approval-card approval-card-empty">
      <div className="approval-copy">
        <p className="collection-kicker">All clear</p>
        <h3>{title}</h3>
        <p className="panel-text">{text}</p>
      </div>
    </article>
  );
}

function DashboardSection({
  session,
  activeDashboard,
  activeStats = [],
  previewPanels = [],
  pendingRetailers = [],
  pendingPaymentOrders = [],
  pendingTransactionProofOrders = [],
  pendingDeliveryProofOrders = [],
  pendingFaceScanRetailers = [],
  pendingReports = [],
  approveRetailer,
  onConfirmOrderPayment,
  onReviewAdminProof,
  onReviewAdminFaceScan,
  onDeleteAdminProduct,
  onResolveAdminReport,
}) {
  const isAdmin = session?.role === "admin";
  const retailerQueue = Array.isArray(pendingRetailers) ? pendingRetailers : [];
  const paymentQueue = Array.isArray(pendingPaymentOrders) ? pendingPaymentOrders : [];
  const transactionProofQueue = Array.isArray(pendingTransactionProofOrders) ? pendingTransactionProofOrders : [];
  const deliveryProofQueue = Array.isArray(pendingDeliveryProofOrders) ? pendingDeliveryProofOrders : [];
  const faceScanQueue = Array.isArray(pendingFaceScanRetailers) ? pendingFaceScanRetailers : [];
  const reportQueue = Array.isArray(pendingReports) ? pendingReports : [];

  const adminQueueStats = [
    {
      eyebrow: "Onboarding",
      title: "Retailer approvals",
      count: retailerQueue.length,
      hint: "Shops waiting for payment and access approval.",
    },
    {
      eyebrow: "Payments",
      title: "Customer receipts",
      count: paymentQueue.length,
      hint: "Receipts that still need confirmation.",
    },
    {
      eyebrow: "Proofs",
      title: "Transaction uploads",
      count: transactionProofQueue.length,
      hint: "Retailer payment-side proof submissions.",
    },
    {
      eyebrow: "Delivery",
      title: "Delivery uploads",
      count: deliveryProofQueue.length,
      hint: "Shipment completion proof waiting for review.",
    },
    {
      eyebrow: "Identity",
      title: "Face scans",
      count: faceScanQueue.length,
      hint: "Retailer identity scans pending review.",
    },
    {
      eyebrow: "Safety",
      title: "Customer reports",
      count: reportQueue.length,
      hint: "Reported posts and retailers waiting for review.",
    },
  ];

  const adminSections = [
    {
      key: "retailers",
      eyebrow: "Onboarding",
      title: "Pending retailer accounts",
      emptyTitle: "No pending retailers",
      emptyText: "New retailer applications will appear here after payment and approval.",
      items: retailerQueue,
      renderItem: (retailer) => (
        <AdminReviewCard
          key={retailer.id}
          kicker={retailer.shopName || "Retailer"}
          title={retailer.email}
          summary={`Status: ${retailer.status} / Payment: ${retailer.paymentStatus} / Email verified: ${
            retailer.emailVerified ? "yes" : "no"
          }`}
          actionLabel="Approve retailer"
          onAction={() => approveRetailer(retailer.id)}
        />
      ),
    },
    {
      key: "receipts",
      eyebrow: "Payments",
      title: "Pending customer receipts",
      emptyTitle: "No pending payments",
      emptyText: "Uploaded customer receipts will appear here for admin confirmation.",
      items: paymentQueue,
      renderItem: (order) => (
        <AdminReviewCard
          key={order.id}
          kicker={order.retailerName || "Retailer"}
          title={order.title}
          summary={`Customer: ${order.customerName} / Status: ${order.status}`}
          note={order.receiptNote}
          image={order.receiptImage}
          imageAlt={`${order.title} receipt`}
          actionLabel="Confirm payment"
          onAction={() => onConfirmOrderPayment(order.id)}
        />
      ),
    },
    {
      key: "transaction-proofs",
      eyebrow: "Proofs",
      title: "Pending transaction proofs",
      emptyTitle: "No pending transaction proofs",
      emptyText: "Retailer transaction proof uploads will appear here for review.",
      items: transactionProofQueue,
      renderItem: (order) => (
        <AdminReviewCard
          key={order.id}
          kicker={order.retailerName || "Retailer"}
          title={order.title}
          summary={`Customer: ${order.customerName} / Status: ${order.status}`}
          note={order.transactionProofNote}
          image={order.transactionProofImage}
          imageAlt={`${order.title} transaction proof`}
          actionLabel="Review proof"
          onAction={() => onReviewAdminProof(order.id, "transaction")}
        />
      ),
    },
    {
      key: "delivery-proofs",
      eyebrow: "Delivery",
      title: "Pending delivery proofs",
      emptyTitle: "No pending delivery proofs",
      emptyText: "Retailer delivery proof uploads will appear here for review.",
      items: deliveryProofQueue,
      renderItem: (order) => (
        <AdminReviewCard
          key={order.id}
          kicker={order.retailerName || "Retailer"}
          title={order.title}
          summary={`Customer: ${order.customerName} / Status: ${order.status}`}
          note={order.deliveryProofNote}
          image={order.deliveryProofImage}
          imageAlt={`${order.title} delivery proof`}
          actionLabel="Review proof"
          onAction={() => onReviewAdminProof(order.id, "delivery")}
        />
      ),
    },
    {
      key: "face-scans",
      eyebrow: "Identity",
      title: "Pending retailer face scans",
      emptyTitle: "No pending face scans",
      emptyText: "Retailer face scan uploads will appear here for review.",
      items: faceScanQueue,
      renderItem: (retailer) => (
        <AdminReviewCard
          key={retailer.id}
          kicker={retailer.shopName || retailer.name || "Retailer"}
          title={retailer.email}
          summary={`Identity: ${retailer.identityStatus || "pending_review"} / Phone: ${retailer.phone || "not set"}`}
          image={retailer.faceScanImage}
          imageAlt={`${retailer.name || retailer.shopName || "Retailer"} face scan`}
          actionLabel="Review face scan"
          onAction={() => onReviewAdminFaceScan(retailer.id)}
        />
      ),
    },
    {
      key: "reports",
      eyebrow: "Safety",
      title: "Customer reports",
      emptyTitle: "No open reports",
      emptyText: "Reported posts and retailers will appear here for admin review.",
      items: reportQueue,
      renderItem: (report) => (
        <AdminReviewCard
          key={report.id}
          kicker={report.targetType === "product" ? "Reported post" : "Reported retailer"}
          title={
            report.targetType === "product"
              ? report.productTitle || "Product report"
              : report.retailerName || "Retailer report"
          }
          summary={`Reporter: ${report.reporterName || "Customer"} / Reason: ${report.reason || "Review requested"} / Retailer: ${
            report.retailerName || "Unknown"
          }`}
          note={report.details}
          image={report.productImage}
          imageAlt={report.productTitle || "Reported product"}
          actionLabel="Resolve report"
          onAction={() => onResolveAdminReport?.(report.id)}
          dangerActionLabel={report.targetType === "product" ? "Delete post" : ""}
          onDangerAction={report.targetType === "product" ? () => onDeleteAdminProduct?.(report.productId) : undefined}
        />
      ),
    },
  ];

  return (
    <section className="dashboard-section">
      {!isAdmin ? (
        <>
          <div className="section-heading">
            <p className="eyebrow">Dashboard</p>
            <h2>{activeDashboard ? activeDashboard.title : "Database auth preview is ready."}</h2>
            <p className="section-text">
              {activeDashboard
                ? `${activeDashboard.description} Signed in as ${session.name}.`
                : "Database-backed authentication and role-specific dashboards are ready."}
            </p>
          </div>

          <div className="stats-grid">
            {activeStats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          <div className="dashboard-grid">
            {previewPanels.map((panel) => (
              <article key={panel.title} className="dashboard-card">
                <p className="preview-label">Workspace panel</p>
                <h3>{panel.title}</h3>
                <ul>
                  {panel.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="approval-board">
          <div className="admin-queue-grid">
            {adminQueueStats.map((stat) => (
              <AdminQueueCard
                key={stat.title}
                eyebrow={stat.eyebrow}
                title={stat.title}
                count={stat.count}
              />
            ))}
          </div>

          <div className="admin-review-sections">
            {adminSections.map((section) => (
              <section key={section.key} className="admin-review-group">
                <div className="admin-review-heading">
                  <div>
                    <p className="eyebrow">{section.eyebrow}</p>
                    <h3>{section.title}</h3>
                  </div>
                  <span className="admin-review-count">{String(section.items.length).padStart(2, "0")}</span>
                </div>

                <div className="approval-list">
                  {section.items.length > 0
                    ? section.items.map((entry) => section.renderItem(entry))
                    : <AdminEmptyCard title={section.emptyTitle} text={section.emptyText} />}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardSection;
