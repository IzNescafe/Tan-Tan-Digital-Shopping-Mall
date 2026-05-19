import { useCallback, useEffect, useRef, useState } from "react";
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

function CustomerRequestsPage({
  session,
  token,
  customerRequests = [],
  customerOrders = [],
  requestForm,
  updateRequestForm,
  onSubmitCustomerRequest,
  onBack,
  isSubmitting,
}) {
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

  const handleClosePage = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    window.history.back();
  };

  const chatTargets = conversationList.map((conversation) => ({
    requestId: conversation.requestId,
    title: conversation.title,
    counterpart: conversation.counterpart,
    contact: conversation.contact,
  }));

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
        counterpart: current?.counterpart || meta?.counterpart || "Retailer chat",
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
      const header = document.querySelector(".site-header");
      if (!header) {
        setChatSidebarTop(260);
        return;
      }

      const headerRect = header.getBoundingClientRect();
      setChatSidebarTop(Math.max(260, Math.round(headerRect.bottom + 24)));
    };

    updateSidebarTop();
    const header = document.querySelector(".site-header");
    const resizeObserver = typeof ResizeObserver !== "undefined" && header
      ? new ResizeObserver(() => updateSidebarTop())
      : null;

    if (header && resizeObserver) {
      resizeObserver.observe(header);
    }

    window.addEventListener("resize", updateSidebarTop);
    window.addEventListener("scroll", updateSidebarTop, { passive: true });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateSidebarTop);
      window.removeEventListener("scroll", updateSidebarTop);
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

        const latestIncomingMessage = chats.filter((chat) => chat.senderRole !== "customer").at(-1);
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
        <button className="subpage-close-button" type="button" onClick={handleClosePage} aria-label="Close requests page">
          <span aria-hidden="true">{"\u2715"}</span>
        </button>

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

        <div className="section-heading">
          <p className="eyebrow">Requests</p>
          <h2>{session.name}&apos;s request page</h2>
        </div>

        <div className="customer-shell">
          <section className="customer-section">
            <p className="preview-label">New request</p>
            <h3>Ask for a product</h3>
            <p className="panel-text">Send budget, brand, size, and notes. Retailers can reply with offers.</p>
            <form className="request-form" onSubmit={onSubmitCustomerRequest}>
              <input
                className="inline-input"
                name="productName"
                type="text"
                placeholder="Product name"
                value={requestForm.productName}
                onChange={updateRequestForm}
              />
              <input
                className="inline-input"
                name="budgetMMK"
                type="text"
                placeholder="Budget in MMK"
                value={requestForm.budgetMMK}
                onChange={updateRequestForm}
              />
              <textarea
                className="dashboard-textarea"
                name="details"
                placeholder="Brand, size, color, notes"
                rows="5"
                value={requestForm.details}
                onChange={updateRequestForm}
              />
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </section>

          <section className="customer-section">
            <p className="preview-label">Saved requests</p>
            <h3>Your request history</h3>
            <div className="request-history">
              {customerRequests.length > 0 ? (
                customerRequests.map((request) => (
                  <article key={request.id} className="request-history-card">
                    <strong>{request.productName}</strong>
                    <p>{request.budgetMMK}</p>
                    <p>{request.status}</p>
                    <p>{request.assignedRetailerName ? `Retailer: ${request.assignedRetailerName}` : "Waiting for a retailer to connect"}</p>
                    <div className="chat-actions">
                      <button
                        className="secondary-button chat-trigger-button"
                        type="button"
                        onClick={() =>
                          openConversation(request.id, {
                            title: request.productName,
                            counterpart: request.assignedRetailerName || "Retailer chat",
                            contact: customerOrders.find((order) => order.requestId === request.id)?.contact || null,
                          })
                        }
                        disabled={loadingChatId === request.id}
                      >
                        {loadingChatId === request.id ? "Opening..." : "Open chat"}
                        {unreadMap[request.id] ? (
                          <span className="chat-notification-badge">{unreadMap[request.id]}</span>
                        ) : null}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No requests yet. Submit your first request here.</div>
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
            <span className="chat-launcher-icon">{"\u{1F4AC}"}</span>
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
                            {getInitials(conversation.contact?.name || conversation.counterpart || "R")}
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
                            alt={activeChatMeta.contact?.name || activeChatMeta.counterpart || "Retailer"}
                          />
                        ) : (
                          <span className="chat-counterpart-fallback chat-counterpart-fallback-large">
                            {getInitials(activeChatMeta.contact?.name || activeChatMeta.counterpart || "R")}
                          </span>
                        )}
                        <div className="chat-counterpart-copy">
                          <strong>{activeChatMeta.contact?.name || activeChatMeta.counterpart || "Retailer chat"}</strong>
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
                      <div className="empty-state">No messages yet.</div>
                    )}
                  </div>
                  <div className="request-chat-compose">
                    <textarea
                      className="dashboard-textarea"
                      rows="3"
                      placeholder="Reply to retailer here"
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
                <div className="chat-hub-empty">Choose a retailer on the left to open the chat.</div>
              )}
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

export default CustomerRequestsPage;
