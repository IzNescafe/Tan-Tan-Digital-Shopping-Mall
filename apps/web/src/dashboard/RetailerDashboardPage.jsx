import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../auth/api";

function formatChatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(label) {
  return String(label || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function RetailerDashboardPage({
  session,
  token,
  retailerDashboard,
  onUpdateRetailerProductStatus,
  onUpdateRetailerOrderStatus,
  onUpdateRetailerTracking,
  onUploadRetailerProof,
  onConfirmRetailerOrder,
  onConfirmOrderPayment,
  retailerOrderForms,
  onRetailerOrderFieldChange,
  onRetailerOrderFileChange,
  onToggleRetailerTracking,
  onToggleRetailerProof,
  openRetailerTrackingOrderId,
  openRetailerProofOrderId,
  isSubmitting,
}) {
  const pipelineRequests = retailerDashboard?.requests || [];
  const orderQueue = retailerDashboard?.orders || [];
  const inStockProducts = retailerDashboard?.inStockProducts || [];

  const [openChatId, setOpenChatId] = useState(null);
  const [activeChatMeta, setActiveChatMeta] = useState(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [chatMap, setChatMap] = useState({});
  const [chatDrafts, setChatDrafts] = useState({});
  const [loadingChatId, setLoadingChatId] = useState("");
  const [chatSidebarTop, setChatSidebarTop] = useState(220);
  const [conversationList, setConversationList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const latestIncomingRef = useRef({});
  const isInitializedRef = useRef(false);

  const chatTargets = useMemo(
    () =>
      conversationList.map((conversation) => ({
        requestId: conversation.requestId,
        title: conversation.title,
        counterpart: conversation.counterpart,
        contact: conversation.contact,
      })),
    [conversationList],
  );

  const pushNotification = useCallback((entry) => {
    setNotifications((current) => {
      if (current.some((item) => item.id === entry.id)) {
        return current;
      }

      return [...current, entry].slice(-3);
    });

    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== entry.id));
    }, 4500);
  }, []);

  const loadChat = useCallback(async (requestId, meta = null, silent = false) => {
    if (!silent) {
      setLoadingChatId(requestId);
    }

    if (meta) {
      setActiveChatMeta({ requestId, ...meta });
    }

    try {
      const payload = await apiRequest(`/requests/${requestId}/chat`, { token });
      setChatMap((current) => ({ ...current, [requestId]: payload.chats }));
      setActiveChatMeta((current) => ({
        requestId,
        title: payload.request?.productName || current?.title || meta?.title || "",
        counterpart: current?.counterpart || meta?.counterpart || "Customer",
        contact: payload.contact || current?.contact || meta?.contact || null,
      }));
      setOpenChatId(requestId);
      setUnreadMap((current) => ({ ...current, [requestId]: 0 }));
    } catch (error) {
      if (!silent) {
        setChatMap((current) => ({
          ...current,
          [requestId]: [{ id: `${requestId}-error`, senderRole: "system", senderName: "System", message: error.message }],
        }));
        setOpenChatId(requestId);
        setUnreadMap((current) => ({ ...current, [requestId]: 0 }));
      }
    } finally {
      if (!silent) {
        setLoadingChatId("");
      }
    }
  }, [token]);

  const openConversation = useCallback(
    (requestId, meta = null, silent = false) => {
      setIsInboxOpen(true);
      return loadChat(requestId, meta, silent);
    },
    [loadChat],
  );

  useEffect(() => {
    const updateSidebarTop = () => {
      const anchor =
        document.querySelector(".retailer-shell .customer-section.customer-section-wide") ||
        document.querySelector(".site-header");

      if (!anchor) {
        setChatSidebarTop(240);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      setChatSidebarTop(Math.max(24, Math.round(anchorRect.top + 8)));
    };

    updateSidebarTop();
    const anchor =
      document.querySelector(".retailer-shell .customer-section.customer-section-wide") ||
      document.querySelector(".site-header");
    const resizeObserver = typeof ResizeObserver !== "undefined" && anchor
      ? new ResizeObserver(() => updateSidebarTop())
      : null;

    if (anchor && resizeObserver) {
      resizeObserver.observe(anchor);
    }

    window.addEventListener("resize", updateSidebarTop);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateSidebarTop);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isDisposed = false;

    const loadConversations = async () => {
      try {
        const payload = await apiRequest("/chats/mine", { token });
        if (!isDisposed) {
          setConversationList(payload.conversations || []);
        }
      } catch {
        if (!isDisposed) {
          setConversationList([]);
        }
      }
    };

    loadConversations();

    const intervalId = window.setInterval(() => {
      loadConversations();
    }, 6000);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (!token || chatTargets.length === 0) {
      return;
    }

    let isDisposed = false;

    const syncChats = async () => {
      const results = await Promise.all(
        chatTargets.map(async (target) => {
          try {
            const payload = await apiRequest(`/requests/${target.requestId}/chat`, { token });
            return { target, chats: payload.chats };
          } catch {
            return null;
          }
        }),
      );

      if (isDisposed) {
        return;
      }

      const nextChatMap = {};

      results.forEach((entry) => {
        if (!entry) {
          return;
        }

        const { target, chats } = entry;
        nextChatMap[target.requestId] = chats;

        const latestIncomingMessage = chats.filter((chat) => chat.senderRole !== "retailer").at(-1);
        const latestIncomingAt = latestIncomingMessage?.createdAt
          ? new Date(latestIncomingMessage.createdAt).getTime()
          : 0;
        const previousIncomingAt = latestIncomingRef.current[target.requestId] || 0;

        if (
          latestIncomingAt &&
          isInitializedRef.current &&
          latestIncomingAt > previousIncomingAt &&
          openChatId !== target.requestId
        ) {
          setUnreadMap((current) => ({
            ...current,
            [target.requestId]: (current[target.requestId] || 0) + 1,
          }));
          pushNotification({
            id: `${target.requestId}-${latestIncomingMessage.id}`,
            title: target.counterpart,
            message: latestIncomingMessage.message,
            requestId: target.requestId,
            counterpart: target.counterpart,
            chatTitle: target.title,
          });
        }

        if (latestIncomingAt) {
          latestIncomingRef.current[target.requestId] = latestIncomingAt;
        }
      });

      setChatMap((current) => ({ ...current, ...nextChatMap }));
      isInitializedRef.current = true;
    };

    syncChats();

    const intervalId = window.setInterval(() => {
      syncChats();
    }, 4000);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [chatTargets, openChatId, pushNotification, token]);

  useEffect(() => {
    if (!isInboxOpen || !isChatExpanded) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("chat-hub-expanded");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("chat-hub-expanded");
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatExpanded, isInboxOpen]);

  const sendChat = async (requestId) => {
    const message = String(chatDrafts[requestId] || "").trim();
    if (!message) {
      return;
    }

    try {
      const payload = await apiRequest(`/requests/${requestId}/chat`, {
        method: "POST",
        token,
        body: JSON.stringify({ message }),
      });
      setChatMap((current) => ({
        ...current,
        [requestId]: [...(current[requestId] || []), payload.chat],
      }));
      setChatDrafts((current) => ({ ...current, [requestId]: "" }));
      openConversation(requestId, activeChatMeta?.requestId === requestId ? activeChatMeta : null, true);
    } catch (error) {
      setChatMap((current) => ({
        ...current,
        [requestId]: [
          ...(current[requestId] || []),
          { id: `${requestId}-send-error`, senderRole: "system", senderName: "System", message: error.message },
        ],
      }));
    }
  };

  const totalUnreadCount = Object.values(unreadMap).reduce((sum, count) => sum + Number(count || 0), 0);

  return (
    <main className="main-layout">
      <section className="dashboard-section">
        {notifications.length > 0 ? (
          <div className="chat-notification-stack" style={{ "--chat-notification-top": `${Math.max(170, chatSidebarTop - 90)}px` }}>
            {notifications.map((item) => (
              <button
                key={item.id}
                className="chat-notification-toast"
                type="button"
                onClick={() =>
                  openConversation(item.requestId, {
                    title: item.chatTitle,
                    counterpart: item.counterpart,
                    contact: conversationList.find((conversation) => conversation.requestId === item.requestId)?.contact || null,
                  })
                }
              >
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="customer-shell retailer-shell">
          <section className="customer-section customer-section-wide" id="retailer-products">
            <p className="preview-label">In stock posts</p>
            <h3>Items currently available</h3>
            <div className="deal-grid retailer-product-grid">
              {inStockProducts.length > 0 ? (
                inStockProducts.map((product) => (
                  <article key={product.id} className="deal-card">
                    <div className="deal-image-wrap deal-image-wrap-product">
                      <img className="deal-image" src={product.image} alt={product.title} />
                      <span className="discount-badge">{product.discount}</span>
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
                          onClick={() => onUpdateRetailerProductStatus(product.id, "sold")}
                        >
                          Mark sold
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No in-stock posts yet. Use the Post page to upload products.</div>
              )}
            </div>
          </section>

          <section className="customer-section customer-section-wide" id="retailer-requests">
            <p className="preview-label">Customer requests</p>
            <h3>Items customers want you to source</h3>
            <div className="retailer-request-grid">
              {pipelineRequests.length > 0 ? (
                pipelineRequests.map((request) => (
                  <article key={request.id} className="request-history-card">
                    <div className="order-topline">
                      <strong>{request.item}</strong>
                      <span className={`status-pill status-${request.status}`}>{request.status}</span>
                    </div>
                    <p>{request.customer}</p>
                    <p>{request.budgetMMK}</p>
                    <p>{request.note}</p>
                    <div className="chat-actions">
                      <button
                        className="secondary-button chat-trigger-button"
                        type="button"
                        onClick={() =>
                          openConversation(request.id, {
                            title: request.item,
                            counterpart: request.customer,
                            contact: request.contact || null,
                          })
                        }
                        disabled={loadingChatId === request.id}
                      >
                        {loadingChatId === request.id ? "Opening..." : "Open chat"}
                        {unreadMap[request.id] ? (
                          <span className="chat-notification-badge">{unreadMap[request.id]}</span>
                        ) : null}
                      </button>
                      <button
                        className="primary-button"
                        type="button"
                        disabled={isSubmitting || request.status === "ordered"}
                        onClick={() => onConfirmRetailerOrder(request.id)}
                      >
                        {request.status === "ordered" ? "Order confirmed" : "Confirm order"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No customer requests assigned yet.</div>
              )}
            </div>
          </section>

          <section className="customer-section customer-section-wide" id="retailer-orders">
            <p className="preview-label">Confirmed orders</p>
            <h3>Requests that already became orders</h3>
            <div className="order-list">
              {orderQueue.length > 0 ? (
                orderQueue.map((order) => {
                  const activeRetailerOrderForm = retailerOrderForms?.[order.id] || {};
                  const isRetailerTrackingOpen = openRetailerTrackingOrderId === order.id;
                  const isRetailerProofOpen = openRetailerProofOrderId === order.id;
                  return (
                  <article key={order.id} className="order-card">
                    <div className="order-topline">
                      <strong>{order.item}</strong>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </div>
                    <div className="compact-order-meta">
                      <p>Customer: {order.customer}</p>
                      <p>Order: {order.id.slice(-8)}</p>
                      <p>ETA: {order.eta}</p>
                    </div>
                    {order.contact?.phone || order.contact?.telegram || order.contact?.city ? (
                      <div className="chat-contact-card compact-contact-card">
                        {order.contact?.profileImage ? (
                          <img className="chat-contact-avatar" src={order.contact.profileImage} alt={order.customer} />
                        ) : null}
                        {order.contact?.phone ? <span>Phone: {order.contact.phone}</span> : null}
                        {order.contact?.telegram ? <span>Telegram: {order.contact.telegram}</span> : null}
                        {order.contact?.city ? <span>City: {order.contact.city}</span> : null}
                      </div>
                    ) : null}
                    <p className="compact-order-step">{order.nextStep}</p>
                    {order.trackingNote ? <p className="compact-order-step">Tracking: {order.trackingNote}</p> : null}
                    <div className="chat-actions">
                      {order.requestId ? (
                        <button
                          className="secondary-button chat-trigger-button"
                          type="button"
                          onClick={() =>
                            openConversation(order.requestId, {
                              title: order.item,
                              counterpart: order.customer,
                              contact: order.contact || null,
                            })
                          }
                          disabled={loadingChatId === order.requestId}
                        >
                          {loadingChatId === order.requestId ? "Opening..." : "Open chat"}
                          {unreadMap[order.requestId] ? (
                            <span className="chat-notification-badge">{unreadMap[order.requestId]}</span>
                          ) : null}
                        </button>
                      ) : null}
                      {order.receiptImage && !order.paymentConfirmedAt ? (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onConfirmOrderPayment(order.id)}
                        >
                          Confirm payment
                        </button>
                      ) : null}
                      {order.status === "purchased" ? (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUpdateRetailerOrderStatus(order.id, "packing")}
                        >
                          Mark packed
                        </button>
                      ) : null}
                      {order.status === "packing" ? (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUpdateRetailerOrderStatus(order.id, "shipped")}
                        >
                          Mark shipped
                        </button>
                      ) : null}
                      {order.status === "shipped" ? (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUpdateRetailerOrderStatus(order.id, "delivered")}
                        >
                          Mark delivered
                        </button>
                      ) : null}
                      {["shipped", "delivered"].includes(order.status) ? (
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onToggleRetailerTracking(order.id)}
                        >
                          {isRetailerTrackingOpen ? "Hide tracking" : "Tracking note"}
                        </button>
                      ) : null}
                      {["purchased", "packing", "shipped", "delivered"].includes(order.status) ? (
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            onToggleRetailerProof(
                              order.id,
                              order.status === "shipped" || order.status === "delivered" ? "delivery" : "transaction",
                            )
                          }
                        >
                          {isRetailerProofOpen ? "Hide proof" : order.status === "shipped" || order.status === "delivered" ? "Delivery proof" : "Transaction proof"}
                        </button>
                      ) : null}
                    </div>
                    {isRetailerTrackingOpen ? (
                      <div className="orders-receipt-box">
                        <textarea
                          className="orders-receipt-note"
                          rows="3"
                          placeholder="Add shipping or delivery update"
                          value={activeRetailerOrderForm.trackingNote || order.trackingNote || ""}
                          onChange={(event) => onRetailerOrderFieldChange(order.id, "trackingNote", event.target.value)}
                        />
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUpdateRetailerTracking(order.id)}
                        >
                          Save tracking note
                        </button>
                      </div>
                    ) : null}
                    {isRetailerProofOpen ? (
                      <div className="orders-receipt-box">
                        <label className="secondary-button orders-upload-button">
                          Upload proof
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={onRetailerOrderFileChange(order.id, "proofImage")}
                          />
                        </label>
                        <textarea
                          className="orders-receipt-note"
                          rows="3"
                          placeholder="Add proof note"
                          value={activeRetailerOrderForm.proofNote || ""}
                          onChange={(event) => onRetailerOrderFieldChange(order.id, "proofNote", event.target.value)}
                        />
                        {activeRetailerOrderForm.proofImage ? (
                          <img
                            className="orders-receipt-preview"
                            src={activeRetailerOrderForm.proofImage}
                            alt="Retailer proof preview"
                          />
                        ) : null}
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onUploadRetailerProof(order.id)}
                        >
                          Submit proof
                        </button>
                      </div>
                    ) : null}
                  </article>
                )})
              ) : (
                <div className="empty-state">No active orders yet.</div>
              )}
            </div>
          </section>
        </div>

        {conversationList.length > 0 ? (
          <button
            className="chat-launcher-button"
            type="button"
            onClick={() => {
              setIsInboxOpen(true);
              if (!openChatId && conversationList[0]) {
                openConversation(conversationList[0].requestId, {
                  title: conversationList[0].title,
                  counterpart: conversationList[0].counterpart,
                  contact: conversationList[0].contact || null,
                });
              }
            }}
          >
            <span className="chat-launcher-icon">💬</span>
            {totalUnreadCount > 0 ? <span className="chat-launcher-badge">{totalUnreadCount}</span> : null}
          </button>
        ) : null}

        {isInboxOpen ? (
          <aside
            className={`chat-hub-panel${isChatExpanded ? " is-expanded" : ""}`}
            style={{ "--chat-sidebar-top": `${chatSidebarTop}px` }}
          >
            <div className="chat-hub-sidebar">
              <div className="chat-hub-sidebar-topbar">
                <strong>Chats</strong>
                <button
                  className="secondary-button chat-close-button"
                  type="button"
                  aria-label="Close chat inbox"
                  title="Close chat inbox"
                  onClick={() => {
                    setIsInboxOpen(false);
                    setOpenChatId(null);
                    setActiveChatMeta(null);
                    setIsChatExpanded(false);
                  }}
                >
                  {"\u2715"}
                </button>
              </div>
              <div className="chat-hub-conversation-list">
                {conversationList.map((conversation) => (
                  <button
                    key={conversation.requestId}
                    className={`chat-hub-conversation-item${openChatId === conversation.requestId ? " is-active" : ""}`}
                    type="button"
                    onClick={() =>
                      openConversation(conversation.requestId, {
                        title: conversation.title,
                        counterpart: conversation.counterpart,
                        contact: conversation.contact || null,
                      })
                    }
                  >
                    <div className="chat-hub-conversation-head">
                      <div className="chat-counterpart">
                        {conversation.contact?.profileImage ? (
                          <img
                            className="chat-counterpart-avatar"
                            src={conversation.contact.profileImage}
                            alt={conversation.contact?.name || conversation.counterpart}
                          />
                        ) : (
                          <span className="chat-counterpart-fallback">
                            {getInitials(conversation.contact?.name || conversation.counterpart || "C")}
                          </span>
                        )}
                        <strong>{conversation.contact?.name || conversation.counterpart}</strong>
                      </div>
                      {unreadMap[conversation.requestId] ? (
                        <span className="chat-notification-badge">{unreadMap[conversation.requestId]}</span>
                      ) : null}
                    </div>
                    <span>{conversation.title}</span>
                    <p>{conversation.lastMessage}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={`request-chat-box is-hub${isChatExpanded ? " is-expanded" : ""}`}>
              {openChatId && activeChatMeta ? (
                <>
                <div className="request-chat-topbar">
                  <div>
                      <div className="chat-counterpart chat-counterpart-large">
                        {activeChatMeta.contact?.profileImage ? (
                          <img
                            className="chat-counterpart-avatar chat-counterpart-avatar-large"
                            src={activeChatMeta.contact.profileImage}
                            alt={activeChatMeta.contact?.name || activeChatMeta.counterpart || "Customer"}
                          />
                        ) : (
                          <span className="chat-counterpart-fallback chat-counterpart-fallback-large">
                            {getInitials(activeChatMeta.contact?.name || activeChatMeta.counterpart || "C")}
                          </span>
                        )}
                        <div className="chat-counterpart-copy">
                          <strong>{activeChatMeta.contact?.name || activeChatMeta.counterpart || "Customer"}</strong>
                          <span>{activeChatMeta.title}</span>
                        </div>
                      </div>
                      {activeChatMeta.contact?.phone || activeChatMeta.contact?.telegram || activeChatMeta.contact?.city ? (
                        <div className="chat-contact-card">
                          {activeChatMeta.contact?.profileImage ? (
                            <img
                              className="chat-contact-avatar"
                              src={activeChatMeta.contact.profileImage}
                              alt={activeChatMeta.counterpart || "Contact"}
                            />
                          ) : null}
                          {activeChatMeta.contact?.phone ? <span>Phone: {activeChatMeta.contact.phone}</span> : null}
                          {activeChatMeta.contact?.telegram ? <span>Telegram: {activeChatMeta.contact.telegram}</span> : null}
                          {activeChatMeta.contact?.city ? <span>City: {activeChatMeta.contact.city}</span> : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="chat-topbar-actions">
                      <button
                        className="secondary-button chat-close-button"
                        type="button"
                        aria-label={isChatExpanded ? "Exit full screen" : "Open full screen"}
                        title={isChatExpanded ? "Exit full screen" : "Open full screen"}
                        onClick={() => setIsChatExpanded((current) => !current)}
                      >
                        {isChatExpanded ? "\u2921" : "\u2922"}
                      </button>
                    </div>
                  </div>
                  <div className="request-chat-log">
                    {(chatMap[openChatId] || []).length > 0 ? (
                      chatMap[openChatId].map((chat) => (
                        <article key={chat.id} className={`chat-bubble is-${chat.senderRole}`}>
                          <div className="chat-bubble-head">
                            <strong>{chat.senderName}</strong>
                            <span>{formatChatTime(chat.createdAt)}</span>
                          </div>
                          <p>{chat.message}</p>
                        </article>
                      ))
                    ) : (
                      <div className="empty-state">Start the conversation if you have this item.</div>
                    )}
                  </div>
                  <div className="request-chat-compose">
                    <textarea
                      className="dashboard-textarea"
                      rows="3"
                      placeholder="Tell the customer you have this item, price, size, or stock"
                      value={chatDrafts[openChatId] || ""}
                      onChange={(event) =>
                        setChatDrafts((current) => ({ ...current, [openChatId]: event.target.value }))
                      }
                    />
                    <button className="primary-button" type="button" onClick={() => sendChat(openChatId)}>
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="chat-hub-empty">Choose a customer on the left to open the chat.</div>
              )}
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

export default RetailerDashboardPage;

