import { useEffect, useState } from "react";
import AuthFormPanel from "./auth/AuthFormPanel";
import { apiRequest } from "./auth/api";
import {
  authTabs,
  customerDeals,
  dashboardContent,
  defaultCustomerForm,
  defaultLoginForm,
  defaultRetailerForm,
} from "./auth/constants";
import DashboardPage from "./dashboard/DashboardPage";
import HomePage from "./home/HomePage";

function normalizeProducts(source) {
  if (!Array.isArray(source) || source.length === 0) {
    return customerDeals;
  }

  return source.map((product) => {
    const fallbackProduct =
      customerDeals.find((entry) => entry.id === product.id) ||
      customerDeals.find(
        (entry) =>
          entry.title.toLowerCase() === String(product.title || "").toLowerCase() &&
          entry.brand.toLowerCase() === String(product.brand || "").toLowerCase(),
      ) ||
      customerDeals[0];

    return {
      ...fallbackProduct,
      ...product,
      image: product.image || fallbackProduct.image || fallbackProduct.fallbackImage,
      fallbackImage: product.fallbackImage || fallbackProduct.fallbackImage,
      description:
        product.description ||
        fallbackProduct.description ||
        `${product.brand || fallbackProduct.brand} item with proof and retailer support.`,
    };
  });
}

function getRouteState() {
  const path = window.location.pathname.toLowerCase();

  if (path === "/login") {
    return { page: "login", itemId: null, orderId: null };
  }

  if (path.startsWith("/dashboard/items/")) {
    return {
      page: "item-detail",
      itemId: window.location.pathname.split("/").pop() || null,
      orderId: null,
    };
  }

  if (path.startsWith("/dashboard/orders/")) {
    return {
      page: "order-detail",
      itemId: null,
      orderId: window.location.pathname.split("/").pop() || null,
    };
  }

  if (path === "/dashboard/requests") {
    return { page: "customer-requests", itemId: null, orderId: null };
  }

  if (path === "/dashboard/retailer-posts") {
    return { page: "retailer-posts", itemId: null, orderId: null };
  }

  if (path === "/dashboard/retailer-history") {
    return { page: "retailer-history", itemId: null, orderId: null };
  }

  if (path === "/dashboard/profile") {
    return { page: "profile", itemId: null, orderId: null };
  }

  if (path === "/dashboard") {
    return { page: "dashboard", itemId: null, orderId: null };
  }

  return { page: "home", itemId: null, orderId: null };
}

function AuthApp() {
  const initialRoute = getRouteState();
  const [page, setPage] = useState(initialRoute.page);
  const [selectedItemId, setSelectedItemId] = useState(initialRoute.itemId);
  const [selectedOrderId, setSelectedOrderId] = useState(initialRoute.orderId);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailLoading, setIsOrderDetailLoading] = useState(false);
  const [tab, setTab] = useState("login");
  const [apiReady, setApiReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem("tan-tan-token") || "");
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [customerForm, setCustomerForm] = useState(defaultCustomerForm);
  const [retailerForm, setRetailerForm] = useState(defaultRetailerForm);
  const [needsRetailerCode, setNeedsRetailerCode] = useState(false);
  const [pendingRetailers, setPendingRetailers] = useState([]);
  const [pendingPaymentOrders, setPendingPaymentOrders] = useState([]);
  const [pendingTransactionProofOrders, setPendingTransactionProofOrders] = useState([]);
  const [pendingDeliveryProofOrders, setPendingDeliveryProofOrders] = useState([]);
  const [pendingFaceScanRetailers, setPendingFaceScanRetailers] = useState([]);
  const [products, setProducts] = useState(customerDeals);
  const [customerRequests, setCustomerRequests] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [orderReceiptForms, setOrderReceiptForms] = useState({});
  const [openReceiptOrderId, setOpenReceiptOrderId] = useState("");
  const [retailerOrderForms, setRetailerOrderForms] = useState({});
  const [openRetailerTrackingOrderId, setOpenRetailerTrackingOrderId] = useState("");
  const [openRetailerProofOrderId, setOpenRetailerProofOrderId] = useState("");
  const [retailerDashboard, setRetailerDashboard] = useState(null);
  const [requestForm, setRequestForm] = useState({
    productName: "",
    budgetMMK: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubPage = Boolean(session) && !["home", "login", "dashboard"].includes(page);

  const refreshProductCatalog = async () => {
    const payload = await apiRequest("/products");
    setProducts(normalizeProducts(payload.products));
  };

  const refreshAdminQueues = async () => {
    const [retailersPayload, paymentsPayload, transactionProofsPayload, deliveryProofsPayload, faceScansPayload] =
      await Promise.all([
        apiRequest("/admin/pending-retailers", { token }),
        apiRequest("/admin/pending-payments", { token }),
        apiRequest("/admin/pending-transaction-proofs", { token }),
        apiRequest("/admin/pending-delivery-proofs", { token }),
        apiRequest("/admin/pending-face-scans", { token }),
      ]);

    setPendingRetailers(Array.isArray(retailersPayload.retailers) ? retailersPayload.retailers : []);
    setPendingPaymentOrders(Array.isArray(paymentsPayload.orders) ? paymentsPayload.orders : []);
    setPendingTransactionProofOrders(
      Array.isArray(transactionProofsPayload.orders) ? transactionProofsPayload.orders : [],
    );
    setPendingDeliveryProofOrders(Array.isArray(deliveryProofsPayload.orders) ? deliveryProofsPayload.orders : []);
    setPendingFaceScanRetailers(Array.isArray(faceScansPayload.retailers) ? faceScansPayload.retailers : []);
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteState();
      setPage(route.page);
      setSelectedItemId(route.itemId);
      setSelectedOrderId(route.orderId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    apiRequest("/health")
      .then(() => setApiReady(true))
      .catch(() => {
        setApiReady(false);
        setStatusMessage({
          type: "error",
          text: "API server is not running yet. Start apps/api before using database login.",
        });
      });
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    apiRequest("/auth/me", { token })
      .then((payload) => setSession(payload.user))
      .catch(() => {
        window.localStorage.removeItem("tan-tan-token");
        setToken("");
        setSession(null);
        if (["dashboard", "item-detail", "order-detail"].includes(getRouteState().page)) {
          navigateTo("login", true);
        }
      });
  }, [token]);

  const navigateTo = (nextPage, replace = false, options = {}) => {
    let nextPath = "/";

    if (nextPage === "login") {
      nextPath = "/login";
    } else if (nextPage === "customer-requests") {
      nextPath = "/dashboard/requests";
    } else if (nextPage === "retailer-posts") {
      nextPath = "/dashboard/retailer-posts";
    } else if (nextPage === "retailer-history") {
      nextPath = "/dashboard/retailer-history";
    } else if (nextPage === "profile") {
      nextPath = "/dashboard/profile";
    } else if (nextPage === "dashboard") {
      nextPath = "/dashboard";
    } else if (nextPage === "item-detail") {
      nextPath = `/dashboard/items/${options.itemId}`;
    } else if (nextPage === "order-detail") {
      nextPath = `/dashboard/orders/${options.orderId}`;
    }

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", nextPath);
    setPage(nextPage);
    setSelectedItemId(options.itemId || null);
    setSelectedOrderId(options.orderId || null);
  };

  const refreshSelectedOrderDetail = async (orderId) => {
    if (!token || !orderId) {
      return;
    }

    setIsOrderDetailLoading(true);
    const payload = await apiRequest(`/orders/${orderId}`, { token });
    setSelectedOrder(payload.order);
    setIsOrderDetailLoading(false);
  };

  const syncOrderAcrossViews = (orderId, nextOrder) => {
    setRetailerDashboard((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        orders: (current.orders || []).map((order) =>
          order.id === orderId ? { ...order, ...nextOrder, item: nextOrder.title || order.item } : order,
        ),
      };
    });

    setCustomerOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...nextOrder } : order)));

    if (page === "order-detail" && selectedOrderId === orderId) {
      return refreshSelectedOrderDetail(orderId);
    }

    setSelectedOrder((current) => (current?.id === orderId ? { ...current, ...nextOrder } : current));
    return Promise.resolve();
  };

  useEffect(() => {
    if (!apiReady) {
      return;
    }

    refreshProductCatalog()
      .then(() => {})
      .catch((error) => {
        setProducts(customerDeals);
        setStatusMessage({
          type: "error",
          text: error.message,
        });
      });
  }, [apiReady]);

  useEffect(() => {
    if (!token || !session || session.role !== "customer" || page !== "order-detail" || !selectedOrderId) {
      setSelectedOrder(null);
      setIsOrderDetailLoading(false);
      return;
    }

    let isDisposed = false;
    setIsOrderDetailLoading(true);

    apiRequest(`/orders/${selectedOrderId}`, { token })
      .then((payload) => {
        if (!isDisposed) {
          setSelectedOrder(payload.order);
          setIsOrderDetailLoading(false);
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setSelectedOrder(null);
          setIsOrderDetailLoading(false);
          setStatusMessage({
            type: "error",
            text: error.message,
          });
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [page, selectedOrderId, session, token]);

  useEffect(() => {
    if (!selectedOrderId) {
      return;
    }

    const matchingOrder = customerOrders.find((order) => order.id === selectedOrderId);
    if (matchingOrder) {
      setSelectedOrder((current) => (current ? { ...current, ...matchingOrder } : matchingOrder));
    }
  }, [customerOrders, selectedOrderId]);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      setPendingRetailers([]);
      setPendingPaymentOrders([]);
      setPendingTransactionProofOrders([]);
      setPendingDeliveryProofOrders([]);
      setPendingFaceScanRetailers([]);
    } else {
      refreshAdminQueues()
        .then(() => {})
        .catch((error) => {
          setStatusMessage({
            type: "error",
            text: error.message,
          });
        });
    }

    if (!session || session.role !== "customer") {
      setCustomerRequests([]);
      setCustomerOrders([]);
    } else {
      Promise.all([apiRequest("/requests/mine", { token }), apiRequest("/orders/mine", { token })])
        .then(([requestsPayload, ordersPayload]) => {
          setCustomerRequests(requestsPayload.requests);
          setCustomerOrders(ordersPayload.orders);
        })
        .catch((error) => {
          setStatusMessage({
            type: "error",
            text: error.message,
          });
        });
    }

    if (!session || session.role !== "retailer") {
      setRetailerDashboard(null);
    } else {
      apiRequest("/retailer/dashboard", { token })
        .then((payload) => {
          setRetailerDashboard(payload);
        })
        .catch((error) => {
          setStatusMessage({
            type: "error",
            text: error.message,
          });
        });
    }
  }, [session, token]);

  useEffect(() => {
    if (!isSubPage) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        navigateTo("dashboard");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSubPage]);

  const updateForm = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleCustomerSignup = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/auth/register/customer", {
        method: "POST",
        body: JSON.stringify(customerForm),
      });
      setStatusMessage({
        type: "success",
        text: "Customer account created. You can log in immediately.",
      });
      setLoginForm((current) => ({
        ...current,
        email: customerForm.email,
        password: customerForm.password,
      }));
      setCustomerForm(defaultCustomerForm);
      setTab("login");
      navigateTo("login");
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetailerSignup = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/auth/register/retailer", {
        method: "POST",
        body: JSON.stringify(retailerForm),
      });
      setStatusMessage({
        type: "success",
        text: "Retailer application received. Admin approval is required before a verification code is emailed.",
      });
      setLoginForm({
        email: retailerForm.email,
        password: retailerForm.password,
        code: "",
      });
      setRetailerForm(defaultRetailerForm);
      setTab("login");
      navigateTo("login");
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      window.localStorage.setItem("tan-tan-token", payload.token);
      setToken(payload.token);
      setSession(payload.user);
      setNeedsRetailerCode(false);
      setStatusMessage({
        type: "success",
        text: `Welcome back, ${payload.user.name}.`,
      });
      navigateTo(payload.user.role === "customer" ? "home" : "dashboard");
    } catch (error) {
      setNeedsRetailerCode(Boolean(error.payload?.codeRequired) || loginForm.code.length > 0);
      setStatusMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCustomerRequest = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/requests", {
        method: "POST",
        token,
        body: JSON.stringify(requestForm),
      });
      setCustomerRequests((current) => [payload.request, ...current]);
      setRequestForm({
        productName: "",
        budgetMMK: "",
        details: "",
      });
      setStatusMessage({
        type: "success",
        text: "Customer request submitted successfully.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptProductOffer = (product) => {
    if (!product) {
      return;
    }

    setRequestForm({
      productName: product.title || "",
      budgetMMK: product.priceMMK || "",
      details: [
        product.brand,
        product.type,
        product.category,
        product.retailer ? `Retailer: ${product.retailer}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    });
    setStatusMessage({
      type: "success",
      text: "Offer added to your request form. Review it and submit to continue.",
    });
    navigateTo("customer-requests");
  };

  const handleSubmitRetailerProduct = async (productForm) => {
    setIsSubmitting(true);

    try {
      await apiRequest("/retailer/products", {
        method: "POST",
        token,
        body: JSON.stringify(productForm),
      });
      const [dashboardPayload] = await Promise.all([
        apiRequest("/retailer/dashboard", { token }),
        refreshProductCatalog(),
      ]);
      setRetailerDashboard(dashboardPayload);
      setStatusMessage({
        type: "success",
        text: "Product published successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRetailerProductStatus = async (productId, status) => {
    setIsSubmitting(true);

    try {
      await apiRequest(`/retailer/products/${productId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      const [dashboardPayload] = await Promise.all([
        apiRequest("/retailer/dashboard", { token }),
        refreshProductCatalog(),
      ]);
      setRetailerDashboard(dashboardPayload);
      setStatusMessage({
        type: "success",
        text: status === "sold" ? "Product moved to history." : "Product status updated.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRetailerOrder = async (requestId) => {
    setIsSubmitting(true);

    try {
      const confirmPayload = await apiRequest(`/requests/${requestId}/confirm-order`, {
        method: "POST",
        token,
      });

      setRetailerDashboard((current) => {
        if (!current) {
          return current;
        }

        const confirmedRequest = (current.requests || []).find((entry) => entry.id === requestId);
        const nextRequests = (current.requests || []).filter((entry) => entry.id !== requestId);

        const existingOrders = current.orders || [];
        const nextOrders = [
          {
            id: confirmPayload.order.id,
            customer: confirmedRequest?.customer || "Customer",
            item: confirmPayload.order.title,
            status: confirmPayload.order.status,
            nextStep: confirmPayload.order.nextStep,
            eta: confirmPayload.order.eta,
          },
          ...existingOrders,
        ];

        return {
          ...current,
          requests: nextRequests,
          orders: nextOrders,
        };
      });

      if (session?.role === "customer") {
        const ordersPayload = await apiRequest("/orders/mine", { token });
        setCustomerOrders(ordersPayload.orders);
      }
      setStatusMessage({
        type: "success",
        text: "Request moved to confirmed orders.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerOrderAction = async (orderId, action) => {
    setIsSubmitting(true);

    try {
      const payload = await apiRequest(`/orders/${orderId}/customer-action`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ action }),
      });
      setCustomerOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, ...payload.order } : order)),
      );
      if (page === "order-detail" && selectedOrderId === orderId) {
        await refreshSelectedOrderDetail(orderId);
      } else {
        setSelectedOrder((current) => (current?.id === orderId ? { ...current, ...payload.order } : current));
      }
      setStatusMessage({
        type: "success",
        text:
          action === "accept"
            ? "Order accepted. You can pay now."
            : action === "pay"
              ? "Payment submitted. Waiting for confirmation."
              : "Order canceled successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptFileChange = (orderId) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setOrderReceiptForms((current) => ({
        ...current,
        [orderId]: {
          ...current[orderId],
          receiptImage: String(reader.result || ""),
        },
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleReceiptNoteChange = (orderId, value) => {
    setOrderReceiptForms((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        receiptNote: value,
      },
    }));
  };

  const handleToggleReceipt = (orderId) => {
    setOpenReceiptOrderId((current) => (current === orderId ? "" : orderId));
  };

  const handleUploadCustomerReceipt = async (orderId) => {
    const receiptForm = orderReceiptForms[orderId] || {};
    if (!receiptForm.receiptImage) {
      setStatusMessage({
        type: "error",
        text: "Please upload a receipt image first.",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const payload = await apiRequest(`/orders/${orderId}/receipt`, {
        method: "POST",
        token,
        body: JSON.stringify(receiptForm),
      });
      setCustomerOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, ...payload.order } : order)),
      );
      if (page === "order-detail" && selectedOrderId === orderId) {
        await refreshSelectedOrderDetail(orderId);
      } else {
        setSelectedOrder((current) => (current?.id === orderId ? { ...current, ...payload.order } : current));
      }
      setOrderReceiptForms((current) => ({
        ...current,
        [orderId]: { receiptImage: "", receiptNote: "" },
      }));
      setOpenReceiptOrderId("");
      setStatusMessage({
        type: "success",
        text: "Receipt uploaded successfully. Waiting for confirmation.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrderPayment = async (orderId) => {
    setIsSubmitting(true);

    try {
      const payload = await apiRequest(`/orders/${orderId}/confirm-payment`, {
        method: "POST",
        token,
      });
      await syncOrderAcrossViews(orderId, payload.order);
      setPendingPaymentOrders((current) => current.filter((order) => order.id !== orderId));
      if (session?.role === "admin") {
        await refreshAdminQueues();
      }
      setStatusMessage({
        type: "success",
        text: "Payment confirmed successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRetailerOrderStatus = async (orderId, status) => {
    setIsSubmitting(true);

    try {
      const payload = await apiRequest(`/orders/${orderId}/retailer-status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      await syncOrderAcrossViews(orderId, payload.order);

      setStatusMessage({
        type: "success",
        text:
          status === "packing"
            ? "Order moved to packing."
            : status === "shipped"
              ? "Order marked as shipped."
              : "Order marked as delivered.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetailerOrderFieldChange = (orderId, field, value) => {
    setRetailerOrderForms((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
  };

  const handleRetailerOrderFileChange = (orderId, field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRetailerOrderForms((current) => ({
        ...current,
        [orderId]: {
          ...current[orderId],
          [field]: String(reader.result || ""),
        },
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleToggleRetailerTracking = (orderId) => {
    setOpenRetailerTrackingOrderId((current) => (current === orderId ? "" : orderId));
  };

  const handleToggleRetailerProof = (orderId, proofType = "transaction") => {
    setRetailerOrderForms((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        proofType,
      },
    }));
    setOpenRetailerProofOrderId((current) => (current === orderId ? "" : orderId));
  };

  const handleRetailerTrackingUpdate = async (orderId) => {
    const form = retailerOrderForms[orderId] || {};
    const trackingNote = String(form.trackingNote || "").trim();

    if (!trackingNote) {
      setStatusMessage({
        type: "error",
        text: "Tracking note is required.",
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload = await apiRequest(`/orders/${orderId}/tracking-note`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ trackingNote }),
      });
      await syncOrderAcrossViews(orderId, payload.order);
      setOpenRetailerTrackingOrderId("");
      setStatusMessage({
        type: "success",
        text: "Tracking note updated successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetailerProofUpload = async (orderId) => {
    const form = retailerOrderForms[orderId] || {};
    const proofType = String(form.proofType || "transaction");
    const proofImage = String(form.proofImage || "").trim();
    const proofNote = String(form.proofNote || "").trim();

    if (!proofImage) {
      setStatusMessage({
        type: "error",
        text: "Please upload a proof image first.",
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload = await apiRequest(`/orders/${orderId}/retailer-proof`, {
        method: "POST",
        token,
        body: JSON.stringify({ proofType, image: proofImage, note: proofNote }),
      });
      await syncOrderAcrossViews(orderId, payload.order);
      setOpenRetailerProofOrderId("");
      setStatusMessage({
        type: "success",
        text: proofType === "delivery" ? "Delivery proof uploaded." : "Transaction proof uploaded.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerConfirmDelivered = async (orderId) => {
    setIsSubmitting(true);
    try {
      const payload = await apiRequest(`/orders/${orderId}/customer-confirm-delivered`, {
        method: "POST",
        token,
      });
      await syncOrderAcrossViews(orderId, payload.order);
      setStatusMessage({
        type: "success",
        text: "Delivery confirmed successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (profileForm) => {
    setIsSubmitting(true);

    try {
      const payload = await apiRequest("/profile", {
        method: "PATCH",
        token,
        body: JSON.stringify(profileForm),
      });

      setSession(payload.user);
      setRetailerDashboard((current) =>
        current && payload.user.role === "retailer"
          ? {
              ...current,
              overview: {
                ...current.overview,
                shopName: payload.user.shopName || payload.user.name,
              },
            }
          : current,
      );
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveRetailer = async (retailerId) => {
    try {
      await apiRequest(`/admin/retailers/${retailerId}/approve`, {
        method: "POST",
        token,
      });
      await refreshAdminQueues();
      setStatusMessage({
        type: "success",
        text: "Retailer approved successfully.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  const handleReviewAdminProof = async (orderId, proofType) => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/admin/orders/${orderId}/review-proof`, {
        method: "POST",
        token,
        body: JSON.stringify({ proofType }),
      });
      await refreshAdminQueues();
      setStatusMessage({
        type: "success",
        text: proofType === "transaction" ? "Transaction proof reviewed." : "Delivery proof reviewed.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewFaceScan = async (retailerId) => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/admin/retailers/${retailerId}/review-face-scan`, {
        method: "POST",
        token,
      });
      await refreshAdminQueues();
      setStatusMessage({
        type: "success",
        text: "Retailer face scan reviewed successfully.",
      });
      return true;
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("tan-tan-token");
    setToken("");
    setSession(null);
    setSelectedOrder(null);
    setSelectedOrderId(null);
    setRetailerOrderForms({});
    setOpenRetailerTrackingOrderId("");
    setOpenRetailerProofOrderId("");
    setStatusMessage({
      type: "success",
      text: "Logged out successfully.",
    });
    navigateTo("home");
  };

  const activeDashboard = session ? dashboardContent[session.role] : null;
  const activeStats = activeDashboard
    ? activeDashboard.heroStats(pendingRetailers)
    : [
        { label: "Database auth", value: apiReady ? "Ready" : "Offline" },
        { label: "Customer signup", value: "Free" },
        { label: "Retailer access", value: "Payment + code" },
      ];

  const previewPanels = activeDashboard?.panels || [
    {
      title: "Customer signup",
      items: ["Free registration", "Password-based login", "No approval required"],
    },
    {
      title: "Retailer onboarding",
      items: ["Payment accepted", "Verification code emailed after admin approval", "Admin approval required before access"],
    },
    {
      title: "Admin access",
      items: ["Hidden from signup selector", "Login by seeded admin email", "Approves retailers from dashboard"],
    },
  ];

  const selectedProduct = products.find((product) => product.id === selectedItemId) || null;

  const renderPage = () => {
    if (
      page === "dashboard" ||
      page === "item-detail" ||
      page === "order-detail" ||
      page === "customer-requests" ||
      page === "retailer-posts" ||
      page === "retailer-history" ||
      page === "profile"
    ) {
      if (!session) {
        return (
          <main className="main-layout">
            <section className="hero-panel auth-layout">
              <div className="hero-copy">
                <p className="eyebrow">Login required</p>
                <h2>Login first to open the dashboard.</h2>
                <p className="hero-text">
                  Customer, retailer, admin account တို့ရဲ့ dashboard access ကို authentication နဲ့
                  ထိန်းထားပါတယ်။
                </p>
                <button className="primary-button" type="button" onClick={() => navigateTo("login")}>
                  Go to login
                </button>
              </div>
            </section>
          </main>
        );
      }

      if (page === "item-detail") {
        return (
          <DashboardPage
            page={page}
            session={session}
            selectedProduct={selectedProduct}
            onBackToDashboard={() => navigateTo("dashboard")}
            onAcceptOffer={handleAcceptProductOffer}
          />
        );
      }

      return (
        <DashboardPage
          page={page}
          session={session}
          token={token}
          statusMessage={statusMessage}
          activeDashboard={activeDashboard}
          activeStats={activeStats}
          previewPanels={previewPanels}
          pendingRetailers={pendingRetailers}
          pendingPaymentOrders={pendingPaymentOrders}
          pendingTransactionProofOrders={pendingTransactionProofOrders}
          pendingDeliveryProofOrders={pendingDeliveryProofOrders}
          pendingFaceScanRetailers={pendingFaceScanRetailers}
          approveRetailer={approveRetailer}
          onConfirmOrderPayment={handleConfirmOrderPayment}
          onReviewAdminProof={handleReviewAdminProof}
          onReviewAdminFaceScan={handleReviewFaceScan}
          products={products}
          customerRequests={customerRequests}
          customerOrders={customerOrders}
          selectedOrder={selectedOrder}
          isOrderDetailLoading={isOrderDetailLoading}
          orderReceiptForm={selectedOrderId ? orderReceiptForms[selectedOrderId] : null}
          isReceiptOpen={openReceiptOrderId === selectedOrderId}
          retailerDashboard={retailerDashboard}
          onSubmitRetailerProduct={handleSubmitRetailerProduct}
          onUpdateRetailerProductStatus={handleUpdateRetailerProductStatus}
          onConfirmRetailerOrder={handleConfirmRetailerOrder}
          onCustomerOrderAction={handleCustomerOrderAction}
          onUploadCustomerReceipt={handleUploadCustomerReceipt}
          onUpdateRetailerOrderStatus={handleUpdateRetailerOrderStatus}
          onUpdateRetailerTracking={handleRetailerTrackingUpdate}
          onUploadRetailerProof={handleRetailerProofUpload}
          onCustomerConfirmDelivered={handleCustomerConfirmDelivered}
          retailerOrderForms={retailerOrderForms}
          onRetailerOrderFieldChange={handleRetailerOrderFieldChange}
          onRetailerOrderFileChange={handleRetailerOrderFileChange}
          onToggleRetailerTracking={handleToggleRetailerTracking}
          onToggleRetailerProof={handleToggleRetailerProof}
          openRetailerTrackingOrderId={openRetailerTrackingOrderId}
          openRetailerProofOrderId={openRetailerProofOrderId}
          requestForm={requestForm}
          updateRequestForm={updateForm(setRequestForm)}
          onSubmitCustomerRequest={handleSubmitCustomerRequest}
          onNavigateToRequests={() => navigateTo("customer-requests")}
          onOpenItem={(itemId) => navigateTo("item-detail", false, { itemId })}
          onOpenOrder={(orderId) => navigateTo("order-detail", false, { orderId })}
          onAcceptOffer={handleAcceptProductOffer}
          onToggleReceipt={handleToggleReceipt}
          onReceiptFileChange={handleReceiptFileChange}
          onReceiptNoteChange={handleReceiptNoteChange}
          onSaveProfile={handleSaveProfile}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (page === "login") {
      return (
        <main className="main-layout">
          <section className="hero-panel auth-layout auth-page-layout">
            <div className="hero-copy">
              <p className="eyebrow">Login</p>
              <h2>Sign in once and go straight to your role dashboard.</h2>
              <p className="hero-text">
                Customer signup stays free. Retailer onboarding includes payment testing, a verification code, and
                admin approval before dashboard access.
              </p>

              {statusMessage ? (
                <div className={`status-banner is-${statusMessage.type}`}>{statusMessage.text}</div>
              ) : null}

              <div className="role-grid compact-role-grid">
                <article className="role-card is-active">
                  <p className="collection-kicker">Customer</p>
                  <h3>Free account and direct login flow.</h3>
                </article>
                <article className="role-card is-active">
                  <p className="collection-kicker">Retailer</p>
                  <h3>Payment accepted, inbox code, and admin approval.</h3>
                </article>
              </div>
            </div>

            <AuthFormPanel
              authTabs={authTabs}
              tab={tab}
              setTab={setTab}
              loginForm={loginForm}
              customerForm={customerForm}
              retailerForm={retailerForm}
              needsRetailerCode={needsRetailerCode}
              isSubmitting={isSubmitting}
              updateLoginForm={updateForm(setLoginForm)}
              updateCustomerForm={updateForm(setCustomerForm)}
              updateRetailerForm={updateForm(setRetailerForm)}
              onLogin={handleLogin}
              onCustomerSignup={handleCustomerSignup}
              onRetailerSignup={handleRetailerSignup}
            />
          </section>
        </main>
      );
    }

    return (
      <HomePage
        apiReady={apiReady}
        session={session}
        onOpenLogin={() => {
          setTab("login");
          navigateTo("login");
        }}
        onOpenCustomerSignup={() => {
          setTab("customer");
          navigateTo("login");
        }}
        onOpenRetailerApply={() => {
          setTab("retailer");
          navigateTo("login");
        }}
        onOpenDashboard={() => navigateTo("dashboard")}
      />
    );
  };

  return (
    <div className={`app-shell${isSubPage ? " is-subpage" : ""}`}>
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      {!isSubPage ? <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark">TT</span>
          <div>
            <p className="eyebrow">Tan Tan Marketplace</p>
            <h1>Trusted outlet marketplace.</h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="nav-hover-panel is-static">
            <button
              className={`secondary-button header-nav-button ${!session && page === "home" ? "is-active" : ""}`}
              type="button"
              onClick={() => navigateTo("home")}
            >
              Home
            </button>
            {session ? (
              <>
                {page === "dashboard" && session.role === "customer"
                  ? (
                      <>
                        <button
                          className="secondary-button header-nav-button"
                          type="button"
                          onClick={() => navigateTo("customer-requests")}
                        >
                          Requests
                        </button>
                        <button className="secondary-button header-nav-button" type="button" onClick={() => navigateTo("profile")}>
                          Profile
                        </button>
                      </>
                    )
                  : page === "dashboard" && session.role === "retailer"
                  ? (
                      <>
                        <button
                          className="secondary-button header-nav-button"
                          type="button"
                          onClick={() => navigateTo("retailer-posts")}
                        >
                          Post
                        </button>
                        <button
                          className="secondary-button header-nav-button"
                          type="button"
                          onClick={() => navigateTo("retailer-history")}
                        >
                          History
                        </button>
                        <button className="secondary-button header-nav-button" type="button" onClick={() => navigateTo("profile")}>
                          Profile
                        </button>
                      </>
                    )
                  : (
                      <>
                        <button className="secondary-button header-nav-button" type="button" onClick={() => navigateTo("profile")}>
                          Profile
                        </button>
                      </>
                    )}
                {page === "dashboard" && session.role === "customer" ? (
                  <details className="orders-dropdown">
                    <summary className="secondary-button header-nav-button">
                      Orders
                      {customerOrders.some((order) => ["pending", "accepted", "payment_pending"].includes(order.status)) ? " *" : ""}
                    </summary>
                    <div className="orders-dropdown-menu">
                      {customerOrders.map((order) => (
                        <article key={order.id} className="orders-dropdown-item">
                          <div className="orders-dropdown-topline">
                            <strong>{order.title}</strong>
                            <span className={`status-pill status-${order.status}`}>{order.status}</span>
                          </div>
                          <span>{order.id}</span>
                          {order.retailerName ? <span>Retailer: {order.retailerName}</span> : null}
                          {order.contact?.phone ? <span>Phone: {order.contact.phone}</span> : null}
                          {order.contact?.telegram ? <span>Telegram: {order.contact.telegram}</span> : null}
                          {order.contact?.city ? <span>City: {order.contact.city}</span> : null}
                          <span>{order.eta}</span>
                          <span>{order.nextStep}</span>
                          <div className="orders-dropdown-actions">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => navigateTo("order-detail", false, { orderId: order.id })}
                            >
                              View details
                            </button>
                            {order.status === "pending" ? (
                              <>
                                <button
                                  className="primary-button"
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleCustomerOrderAction(order.id, "accept")}
                                >
                                  Accept
                                </button>
                                <button
                                  className="secondary-button"
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleCustomerOrderAction(order.id, "cancel")}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : null}
                            {order.status === "accepted" ? (
                              <>
                                <button
                                  className="primary-button"
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleToggleReceipt(order.id)}
                                >
                                  Pay now
                                </button>
                                <button
                                  className="secondary-button"
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleCustomerOrderAction(order.id, "cancel")}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : null}
                          </div>
                          {order.status === "accepted" && openReceiptOrderId === order.id ? (
                            <div className="orders-receipt-box">
                              <label className="secondary-button orders-upload-button">
                                Upload receipt
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={handleReceiptFileChange(order.id)}
                                />
                              </label>
                              <textarea
                                className="orders-receipt-note"
                                rows="3"
                                placeholder="Optional payment note"
                                value={orderReceiptForms[order.id]?.receiptNote || ""}
                                onChange={(event) => handleReceiptNoteChange(order.id, event.target.value)}
                              />
                              {orderReceiptForms[order.id]?.receiptImage ? (
                                <img
                                  className="orders-receipt-preview"
                                  src={orderReceiptForms[order.id].receiptImage}
                                  alt="Receipt preview"
                                />
                              ) : null}
                              <button
                                className="primary-button"
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleUploadCustomerReceipt(order.id)}
                              >
                                Submit receipt
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </details>
                ) : null}
                <button className="secondary-button header-nav-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button
                className={`nav-cta header-nav-button ${page === "login" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigateTo("login")}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header> : null}
      {renderPage()}
    </div>
  );
}

export default AuthApp;
