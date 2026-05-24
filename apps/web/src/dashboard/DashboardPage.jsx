import CustomerDashboardPage from "./CustomerDashboardPage";
import CustomerOrderDetailPage from "./CustomerOrderDetailPage";
import CustomerRequestsPage from "./CustomerRequestsPage";
import ItemDetailPage from "./ItemDetailPage";
import RetailerDashboardPage from "./RetailerDashboardPage";
import RetailerHistoryPage from "./RetailerHistoryPage";
import RetailerPostsPage from "./RetailerPostsPage";
import UserProfilePage from "./UserProfilePage";
import DashboardSection from "../auth/DashboardSection";

function DashboardPage(props) {
  if (props.page === "item-detail") {
    return (
      <ItemDetailPage
        product={props.selectedProduct}
        session={props.session}
        onBack={props.onBackToDashboard}
        onAcceptOffer={props.onAcceptOffer}
        onReportProduct={props.onReportProduct}
        onReportRetailer={props.onReportRetailer}
        isSubmitting={props.isSubmitting}
      />
    );
  }

  if (props.page === "order-detail") {
    return (
      <CustomerOrderDetailPage
        order={props.selectedOrder}
        isLoading={props.isOrderDetailLoading}
        isSubmitting={props.isSubmitting}
        orderReceiptForm={props.orderReceiptForm}
        isReceiptOpen={props.isReceiptOpen}
        onToggleReceipt={props.onToggleReceipt}
        onReceiptFileChange={props.onReceiptFileChange}
        onReceiptNoteChange={props.onReceiptNoteChange}
        onUploadReceipt={props.onUploadCustomerReceipt}
        onCustomerOrderAction={props.onCustomerOrderAction}
        onCustomerConfirmDelivered={props.onCustomerConfirmDelivered}
        onReportRetailer={props.onReportRetailer}
        onBack={props.onBackToDashboard}
      />
    );
  }

  if (props.page === "profile") {
    return (
      <UserProfilePage
        session={props.session}
        statusMessage={props.statusMessage}
        isSubmitting={props.isSubmitting}
        onSaveProfile={props.onSaveProfile}
        onBack={props.onBackToDashboard}
      />
    );
  }

  if (props.session?.role === "customer") {
    if (props.page === "customer-requests") {
      return (
        <CustomerRequestsPage
          session={props.session}
          token={props.token}
          customerRequests={props.customerRequests}
          customerOrders={props.customerOrders}
          requestForm={props.requestForm}
          updateRequestForm={props.updateRequestForm}
          onSubmitCustomerRequest={props.onSubmitCustomerRequest}
          onBack={props.onBackToDashboard}
          isSubmitting={props.isSubmitting}
        />
      );
    }

    return (
      <CustomerDashboardPage
        session={props.session}
        token={props.token}
        products={props.products}
        onOpenItem={props.onOpenItem}
        onOpenRequests={props.onNavigateToRequests}
        customerOrders={props.customerOrders}
        onOpenOrder={props.onOpenOrder}
      />
    );
  }

  if (props.session?.role === "retailer") {
    if (props.page === "retailer-posts") {
      return (
        <RetailerPostsPage
          session={props.session}
          retailerDashboard={props.retailerDashboard}
          onSubmitRetailerProduct={props.onSubmitRetailerProduct}
          editingProduct={props.editingRetailerProduct}
          onCancelEditRetailerProduct={props.onCancelEditRetailerProduct}
          onEditRetailerProduct={props.onStartEditRetailerProduct}
          onDeleteRetailerProduct={props.onDeleteRetailerProduct}
          onBack={props.onBackToDashboard}
          statusMessage={props.statusMessage}
          isSubmitting={props.isSubmitting}
        />
      );
    }

    if (props.page === "retailer-history") {
      return (
        <RetailerHistoryPage
          session={props.session}
          retailerDashboard={props.retailerDashboard}
          onUpdateRetailerProductStatus={props.onUpdateRetailerProductStatus}
          onDeleteRetailerProduct={props.onDeleteRetailerProduct}
          onBack={props.onBackToDashboard}
          isSubmitting={props.isSubmitting}
        />
      );
    }

    return (
      <RetailerDashboardPage
        session={props.session}
        token={props.token}
        retailerDashboard={props.retailerDashboard}
        onUpdateRetailerProductStatus={props.onUpdateRetailerProductStatus}
        onUpdateRetailerOrderStatus={props.onUpdateRetailerOrderStatus}
        onUpdateRetailerTracking={props.onUpdateRetailerTracking}
        onUploadRetailerProof={props.onUploadRetailerProof}
        onConfirmRetailerOrder={props.onConfirmRetailerOrder}
        onConfirmOrderPayment={props.onConfirmOrderPayment}
        onEditRetailerProduct={props.onStartEditRetailerProduct}
        onDeleteRetailerProduct={props.onDeleteRetailerProduct}
        retailerOrderForms={props.retailerOrderForms}
        onRetailerOrderFieldChange={props.onRetailerOrderFieldChange}
        onRetailerOrderFileChange={props.onRetailerOrderFileChange}
        onToggleRetailerTracking={props.onToggleRetailerTracking}
        onToggleRetailerProof={props.onToggleRetailerProof}
        openRetailerTrackingOrderId={props.openRetailerTrackingOrderId}
        openRetailerProofOrderId={props.openRetailerProofOrderId}
        isSubmitting={props.isSubmitting}
      />
    );
  }

  return (
    <main className="main-layout">
      <DashboardSection {...props} />
    </main>
  );
}

export default DashboardPage;
