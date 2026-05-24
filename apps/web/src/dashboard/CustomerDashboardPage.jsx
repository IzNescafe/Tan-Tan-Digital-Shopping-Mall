import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../auth/api";

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key];
    groups[value] = groups[value] ? [...groups[value], item] : [item];
    return groups;
  }, {});
}

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

function ProductThumb({ deal, className }) {
  const fallbackSource = deal.fallbackImage || deal.image || "";
  const [source, setSource] = useState(deal.image || fallbackSource);

  useEffect(() => {
    setSource(deal.image || fallbackSource);
  }, [deal.image, fallbackSource]);

  return (
    <img
      className={className}
      src={source}
      alt={deal.title}
      loading="lazy"
      onError={() => {
        if (source !== fallbackSource) {
          setSource(fallbackSource);
        }
      }}
    />
  );
}

function DealCard({ deal, onOpenItem }) {
  return (
    <article className="deal-card">
      <div className="deal-image-wrap">
        <ProductThumb className="deal-image" deal={deal} />
        <span className="discount-badge">{deal.discount}</span>
      </div>
      <div className="deal-card-body">
        <div className="deal-hero">
          <span className="deal-brand">{deal.brand}</span>
          <span className="deal-type">{deal.type}</span>
        </div>
        <h3>{deal.title}</h3>
        <p className="deal-meta">
          {deal.category} - {deal.retailer}
        </p>
        <div className="price-row">
          <strong>{deal.priceMMK}</strong>
          <span>{deal.originalPriceMMK}</span>
        </div>
        <p className="deal-proof">{deal.proof}</p>
        <div className="deal-actions">
          <button className="primary-button" type="button" onClick={() => onOpenItem(deal.id)}>
            View offer
          </button>
          <button className="secondary-button" type="button">
            Save
          </button>
        </div>
      </div>
    </article>
  );
}

function CustomerDashboardPage({
  session,
  token,
  products = [],
  onOpenItem,
  customerOrders = [],
  onOpenOrder,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeBrand, setActiveBrand] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
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
  const safeProducts = Array.isArray(products) ? products : [];
  const categoryFilters = ["All", ...new Set(safeProducts.map((product) => product.category))];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const categoryFilteredProducts =
    activeFilter === "All"
      ? safeProducts
      : safeProducts.filter((product) => product.category === activeFilter);
  const filteredProducts =
    activeBrand === "All"
      ? categoryFilteredProducts
      : categoryFilteredProducts.filter((product) => product.brand === activeBrand);
  const searchedProducts = normalizedSearch
    ? filteredProducts.filter((product) =>
        [product.title, product.brand, product.category, product.type, product.retailer]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : filteredProducts;
  const dealsByCategory = groupBy(searchedProducts, "category");
  const dealsByBrand = groupBy(searchedProducts, "brand");

  const openBrandFilter = (brand) => {
    setActiveBrand((current) => (current === brand ? "All" : brand));
    document.getElementById("featured-deals")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      setConversationList([]);
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
    const intervalId = window.setInterval(loadConversations, 6000);

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
            const payload = await apiRequest(`/requests/${target.requestId}/chat?poll=1`, { token });
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
    const intervalId = window.setInterval(syncChats, 4000);

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
        <div className="customer-shell customer-market-shell">
          <section className="customer-section customer-section-wide customer-market-featured" id="featured-deals">
            <div className="customer-section-heading">
              <div>
                <p className="preview-label">Discount marketplace</p>
                <h3>Today&apos;s featured deals</h3>
              </div>
              <div className="market-tools">
                <input
                  className="inline-input search-input"
                  type="search"
                  placeholder="Search by item, brand, category"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {activeBrand !== "All" ? (
                  <button
                    className="filter-chip is-active"
                    type="button"
                    onClick={() => {
                      setActiveBrand("All");
                      document.getElementById("featured-deals")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Brand: {activeBrand} x
                  </button>
                ) : null}
                <div className="filter-row">
                  {categoryFilters.map((filter) => (
                    <button
                      key={filter}
                      className={`filter-chip ${activeFilter === filter ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="deal-grid featured-deal-grid">
              {searchedProducts.slice(0, 4).map((deal) => (
                <DealCard key={deal.id} deal={deal} onOpenItem={onOpenItem} />
              ))}
            </div>
            {searchedProducts.length === 0 ? (
              <div className="empty-state">No items matched your search or filter.</div>
            ) : null}
          </section>

          <section className="customer-section customer-section-wide customer-market-catalog" id="category-groups">
            <p className="preview-label">Browse by category</p>
            <h3>Shop by item type</h3>
            <div className="catalog-stack">
              {Object.entries(dealsByCategory).map(([category, deals]) => (
                <div key={category} className="catalog-group">
                  <div className="catalog-heading">
                    <h4>{category}</h4>
                    <span>{deals.length} items</span>
                  </div>
                  <div className="deal-grid">
                    {deals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} onOpenItem={onOpenItem} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="customer-section customer-section-wide customer-market-brands" id="brand-groups">
            <p className="preview-label">Browse by brand</p>
            <h3>Popular outlet brands</h3>
            <div className="brand-grid">
              {Object.entries(dealsByBrand).map(([brand, deals]) => (
                <article
                  key={brand}
                  className={`brand-card ${activeBrand === brand ? "is-active" : ""}`}
                  onClick={() => openBrandFilter(brand)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openBrandFilter(brand);
                    }
                  }}
                >
                  <div className="catalog-heading">
                    <h4>{brand}</h4>
                    <span>{deals.length} deals</span>
                  </div>
                  <div className="brand-card-list">
                    {deals.map((deal) => (
                      <div key={deal.id} className="brand-item-row">
                        <ProductThumb className="brand-item-image" deal={deal} />
                        <div>
                          <strong>{deal.title}</strong>
                          <p>
                            {deal.type} - {deal.priceMMK}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="customer-section customer-section-wide customer-market-orders" id="orders-section">
            <p className="preview-label">Orders</p>
            <h3>Your active orders</h3>
            <div className="request-history">
              {customerOrders.length > 0 ? (
                customerOrders.slice(0, 4).map((order) => (
                  <article key={order.id} className="request-history-card">
                    <div className="orders-dropdown-topline">
                      <strong>{order.title}</strong>
                      <span className={`status-pill status-${order.status}`}>{order.status}</span>
                    </div>
                    <p>{order.nextStep}</p>
                    <p>{order.eta}</p>
                    <div className="chat-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onOpenOrder?.(order.id)}
                      >
                        View details
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No orders yet. Accept a retailer quote to start one.</div>
              )}
            </div>
          </section>
        </div>

        <button
          className="chat-launcher-button"
          type="button"
          aria-label="Open chats"
          title="Open chats"
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

export default CustomerDashboardPage;
