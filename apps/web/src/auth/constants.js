export const authTabs = [
  { id: "login", label: "Login" },
  { id: "customer", label: "Customer signup" },
  { id: "retailer", label: "Retailer apply" },
];

export const defaultLoginForm = {
  email: "",
  password: "",
  code: "",
};

export const defaultCustomerForm = {
  name: "",
  email: "",
  password: "",
};

export const defaultRetailerForm = {
  name: "",
  email: "",
  password: "",
  shopName: "",
  paymentReference: "TEST-PAY-001",
};

function buildProductFallbackImage(title, accentA, accentB) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" rx="36" fill="url(#bg)" />
      <circle cx="650" cy="110" r="90" fill="rgba(255,255,255,0.22)" />
      <circle cx="130" cy="470" r="120" fill="rgba(255,255,255,0.18)" />
      <text x="60" y="300" fill="#2d2340" font-size="52" font-family="Arial, sans-serif" font-weight="700">
        ${title}
      </text>
      <text x="60" y="360" fill="#2d2340" font-size="26" font-family="Arial, sans-serif">
        Tan Tan Marketplace
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const dashboardContent = {
  admin: {
    title: "Admin dashboard",
    description: "Approve retailers, monitor onboarding, and keep the marketplace trusted.",
    heroStats: (pendingRetailers) => [
      { label: "Pending approvals", value: String(pendingRetailers.length).padStart(2, "0") },
      { label: "Account type", value: "Admin" },
      { label: "Security", value: "Protected" },
    ],
    panels: [
      {
        title: "Platform controls",
        items: ["Review retailer applications", "Verify payment-linked signups", "Approve access for verified shops"],
      },
      {
        title: "Admin seed login",
        items: ["Email: slei53922@gmail.com", "Password: asdfjkl;", "Admin role is hidden from selectors"],
      },
    ],
  },
  retailer: {
    title: "Retailer dashboard",
    description: "Your retailer account needs payment confirmation, code verification, and admin approval.",
    heroStats: () => [
      { label: "Payment", value: "Accepted" },
      { label: "Verification", value: "Code-based" },
      { label: "Access", value: "Retailer" },
    ],
    panels: [
      {
        title: "Retailer checklist",
        items: ["Payment accepted", "Email code verified", "Admin approval granted"],
      },
      {
        title: "Next moves",
        items: ["Respond to sourcing requests", "Upload receipts and proofs", "Manage outlet shipments"],
      },
    ],
  },
  customer: {
    title: "Customer dashboard",
    description: "Customer accounts stay free and can log in right after signup.",
    heroStats: () => [
      { label: "Account type", value: "Free" },
      { label: "Login mode", value: "Password" },
      { label: "Access", value: "Customer" },
    ],
    panels: [
      {
        title: "Customer tools",
        items: ["Track orders", "Save offers", "Create sourcing requests"],
      },
      {
        title: "Shopping flow",
        items: ["Browse products", "Compare retailers", "Review proof photos before shipping"],
      },
    ],
  },
};

export const customerDeals = [
  {
    id: "deal-1",
    brand: "Coach",
    title: "Willow Tote Bag",
    category: "Bags",
    type: "Tote",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("Coach Willow Tote", "#ffc8dd", "#cdb4db"),
    priceMMK: "615,000 MMK",
    originalPriceMMK: "875,000 MMK",
    discount: "30% OFF",
    retailer: "Bangkok Premium Finds",
    proof: "Receipt ready",
  },
  {
    id: "deal-2",
    brand: "Adidas",
    title: "Samba OG",
    category: "Shoes",
    type: "Sneakers",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("Adidas Samba", "#bde0fe", "#a2d2ff"),
    priceMMK: "338,000 MMK",
    originalPriceMMK: "495,000 MMK",
    discount: "32% OFF",
    retailer: "Sneaker Outlet Hub",
    proof: "Real photos uploaded",
  },
  {
    id: "deal-3",
    brand: "Nike",
    title: "Air Force 1 Low",
    category: "Shoes",
    type: "Sneakers",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("Nike Air Force 1", "#cdb4db", "#bde0fe"),
    priceMMK: "365,000 MMK",
    originalPriceMMK: "520,000 MMK",
    discount: "29% OFF",
    retailer: "City Outlet Runner",
    proof: "Receipt ready",
  },
  {
    id: "deal-4",
    brand: "Bath & Body Works",
    title: "Gift Set Trio",
    category: "Beauty",
    type: "Gift Set",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("BBW Gift Set", "#ffafcc", "#ffc8dd"),
    priceMMK: "88,000 MMK",
    originalPriceMMK: "135,000 MMK",
    discount: "35% OFF",
    retailer: "Glow Mall Shopper",
    proof: "Warehouse photos ready",
  },
  {
    id: "deal-5",
    brand: "Michael Kors",
    title: "Jet Set Crossbody",
    category: "Bags",
    type: "Crossbody",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("Jet Set Crossbody", "#cdb4db", "#ffafcc"),
    priceMMK: "428,000 MMK",
    originalPriceMMK: "620,000 MMK",
    discount: "31% OFF",
    retailer: "Bangkok Premium Finds",
    proof: "Receipt ready",
  },
  {
    id: "deal-6",
    brand: "New Balance",
    title: "530 Classic",
    category: "Shoes",
    type: "Running",
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    fallbackImage: buildProductFallbackImage("New Balance 530", "#bde0fe", "#cdb4db"),
    priceMMK: "355,000 MMK",
    originalPriceMMK: "510,000 MMK",
    discount: "30% OFF",
    retailer: "Sneaker Outlet Hub",
    proof: "Real photos uploaded",
  },
];

export const customerOrders = [
  {
    id: "ORD-2048",
    title: "Coach Willow Tote",
    status: "purchased",
    eta: "3 days to warehouse",
    proof: "Receipt uploaded",
  },
  {
    id: "ORD-2052",
    title: "Adidas Samba OG",
    status: "shipped",
    eta: "Arrives in 5 days",
    proof: "Real product photos approved",
  },
  {
    id: "ORD-2061",
    title: "BBW Gift Set",
    status: "pending",
    eta: "Waiting for payment confirmation",
    proof: "Offer received",
  },
];

export const customerChats = [
  {
    id: "chat-1",
    retailer: "Bangkok Premium Finds",
    message: "Your tote receipt is uploaded. Please review before shipment.",
    time: "10 min ago",
  },
  {
    id: "chat-2",
    retailer: "Sneaker Outlet Hub",
    message: "Size 39 is available today at outlet price.",
    time: "35 min ago",
  },
];

export const customerProofChecklist = [
  "Outlet receipt before shipment",
  "Real product photos after purchase",
  "Order tracking status with ETA",
  "Retailer chat for price and proof updates",
];

export const retailerPipelineRequests = [
  {
    id: "REQ-401",
    customer: "Nes",
    item: "Adidas Samba OG",
    budgetMMK: "360,000 MMK",
    status: "new",
    note: "Need size 39 with receipt photo.",
  },
  {
    id: "REQ-402",
    customer: "Moe",
    item: "Coach Willow Tote",
    budgetMMK: "650,000 MMK",
    status: "quoted",
    note: "Color preference is chalk white.",
  },
  {
    id: "REQ-403",
    customer: "Su",
    item: "BBW Gift Set",
    budgetMMK: "95,000 MMK",
    status: "waiting",
    note: "Need 3 sets for birthday gifts.",
  },
];

export const retailerOrderQueue = [
  {
    id: "ORD-R11",
    customer: "Nes",
    item: "Coach Willow Tote",
    status: "purchased",
    nextStep: "Upload outlet receipt",
  },
  {
    id: "ORD-R14",
    customer: "Moe",
    item: "Adidas Samba OG",
    status: "packing",
    nextStep: "Share final product photos",
  },
  {
    id: "ORD-R18",
    customer: "Su",
    item: "BBW Gift Set",
    status: "shipped",
    nextStep: "Update tracking ETA",
  },
];

export const retailerProofBoard = [
  "Receipt uploads waiting: 2",
  "Customer photo approvals: 3",
  "Tracking updates due today: 1",
];

export const retailerChatFeed = [
  {
    id: "retail-chat-1",
    customer: "Nes",
    message: "Please send receipt before payment confirmation.",
    time: "12 min ago",
  },
  {
    id: "retail-chat-2",
    customer: "Moe",
    message: "Can you confirm the bag strap length?",
    time: "28 min ago",
  },
];
