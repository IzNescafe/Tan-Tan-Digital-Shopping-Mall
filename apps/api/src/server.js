import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tan-tan-marketplace";

const ADMIN_EMAIL = "slei53922@gmail.com";
const ADMIN_PASSWORD = "asdfjkl;";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const transporter =
  process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_APP_PASSWORD,
        },
      })
    : null;

const sampleProducts = [
  {
    id: "deal-1",
    brand: "Coach",
    title: "Willow Tote Bag",
    category: "Bags",
    type: "Tote",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    priceMMK: "615,000 MMK",
    originalPriceMMK: "875,000 MMK",
    discount: "30% OFF",
    retailerName: "Bangkok Premium Finds",
    proof: "Receipt ready",
    description: "Outlet tote with receipt proof and shipment updates.",
    status: "active",
  },
  {
    id: "deal-2",
    brand: "Adidas",
    title: "Samba OG",
    category: "Shoes",
    type: "Sneakers",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    priceMMK: "338,000 MMK",
    originalPriceMMK: "495,000 MMK",
    discount: "32% OFF",
    retailerName: "Sneaker Outlet Hub",
    proof: "Real photos uploaded",
    description: "Outlet pair with popular women sizes and real product photos before shipment.",
    status: "active",
  },
  {
    id: "deal-3",
    brand: "Nike",
    title: "Air Force 1 Low",
    category: "Shoes",
    type: "Sneakers",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    priceMMK: "365,000 MMK",
    originalPriceMMK: "520,000 MMK",
    discount: "29% OFF",
    retailerName: "City Outlet Runner",
    proof: "Receipt ready",
    description: "Classic pair with proof photos and outlet receipt support.",
    status: "active",
  },
  {
    id: "deal-4",
    brand: "Bath & Body Works",
    title: "Gift Set Trio",
    category: "Beauty",
    type: "Gift Set",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    priceMMK: "88,000 MMK",
    originalPriceMMK: "135,000 MMK",
    discount: "35% OFF",
    retailerName: "Glow Mall Shopper",
    proof: "Warehouse photos ready",
    description: "Giftable beauty set from outlet stock.",
    status: "active",
  },
  {
    id: "deal-5",
    brand: "Michael Kors",
    title: "Jet Set Crossbody",
    category: "Bags",
    type: "Crossbody",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
    priceMMK: "428,000 MMK",
    originalPriceMMK: "620,000 MMK",
    discount: "31% OFF",
    retailerName: "Bangkok Premium Finds",
    proof: "Receipt ready",
    description: "Crossbody bag with receipt proof and updated delivery ETA.",
    status: "active",
  },
  {
    id: "deal-6",
    brand: "New Balance",
    title: "530 Classic",
    category: "Shoes",
    type: "Running",
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    priceMMK: "355,000 MMK",
    originalPriceMMK: "510,000 MMK",
    discount: "30% OFF",
    retailerName: "Sneaker Outlet Hub",
    proof: "Real photos uploaded",
    description: "Running pair with customer-friendly proof photo flow.",
    status: "active",
  },
];

function now() {
  return new Date().toISOString();
}

function asString(value) {
  return value == null ? "" : String(value);
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function collection(name) {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database is not connected.");
  }
  return db.collection(name);
}

function hashPassword(password, salt = crypto.randomUUID()) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, savedHash] = asString(passwordHash).split(":");
  if (!salt || !savedHash) {
    return false;
  }
  const computed = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(savedHash, "hex"), Buffer.from(computed, "hex"));
}

function matchesPassword(user, password) {
  if (user?.passwordHash) {
    return verifyPassword(password, user.passwordHash);
  }
  if (user?.password) {
    return String(user.password) === String(password);
  }
  return false;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: asString(user.id),
    role: asString(user.role),
    name: asString(user.name),
    email: asString(user.email),
    shopName: asString(user.shopName),
    phone: asString(user.phone),
    telegram: asString(user.telegram),
    city: asString(user.city),
    township: asString(user.township),
    address: asString(user.address),
    profileNote: asString(user.profileNote),
    profileImage: asString(user.profileImage),
    faceScanImage: asString(user.faceScanImage),
    faceScanReviewedAt: asString(user.faceScanReviewedAt),
    identityStatus: asString(user.identityStatus),
    paymentReference: asString(user.paymentReference),
    paymentStatus: asString(user.paymentStatus),
    emailVerified: Boolean(user.emailVerified),
    status: asString(user.status),
  };
}

function buildContactCard(user, fallbackName = "") {
  if (!user && !fallbackName) {
    return null;
  }

  return {
    id: asString(user?.id),
    name: asString(user?.shopName || user?.name || fallbackName),
    phone: asString(user?.phone),
    telegram: asString(user?.telegram),
    city: asString(user?.city),
    township: asString(user?.township),
    address: asString(user?.address),
    profileImage: asString(user?.profileImage),
  };
}

function buildProduct(product, usersById) {
  const retailer = usersById.get(asString(product.retailerId));
  const retailerName =
    retailer?.shopName || retailer?.name || asString(product.retailerName) || "Retailer";

  return {
    id: asString(product.id),
    brand: asString(product.brand),
    title: asString(product.title),
    category: asString(product.category),
    type: asString(product.type),
    image: asString(product.image),
    priceMMK: asString(product.priceMMK),
    originalPriceMMK: asString(product.originalPriceMMK),
    discount: asString(product.discount),
    retailer: retailerName,
    retailerName,
    proof: asString(product.proof),
    description: asString(product.description),
    status: asString(product.status || "active"),
  };
}

function buildRequestSummary(request, usersById) {
  const assignedRetailer =
    usersById.get(asString(request.assignedRetailerId)) ||
    usersById.get(asString(request.retailerId));
  const assignedRetailerName =
    asString(request.assignedRetailerName) ||
    assignedRetailer?.shopName ||
    assignedRetailer?.name ||
    "";

  return {
    id: asString(request.id),
    productName: asString(request.productName),
    budgetMMK: asString(request.budgetMMK),
    details: asString(request.details),
    status: asString(request.status || "open"),
    assignedRetailerId: asString(request.assignedRetailerId || request.retailerId),
    assignedRetailerName,
    createdAt: asString(request.createdAt),
    updatedAt: asString(request.updatedAt || request.createdAt),
  };
}

function formatOrderEta(order) {
  if (order.eta) {
    return asString(order.eta);
  }
  if (order.status === "delivered") return "Delivered";
  if (order.status === "shipped") return "On the way";
  if (order.status === "packing") return "Preparing shipment";
  if (order.paymentConfirmedAt) return "Preparing purchase";
  return "Waiting for next update";
}

function buildOrderNextStep(order) {
  if (order.status === "canceled") return "Order was canceled.";
  if (order.status === "pending") return "Please accept or cancel this order.";
  if (!order.paymentConfirmedAt && !order.receiptUploadedAt && ["accepted", "purchased", "packing", "shipped", "delivered"].includes(order.status)) {
    return "Upload your payment receipt to continue.";
  }
  if (order.receiptUploadedAt && !order.paymentConfirmedAt) {
    return "Waiting for retailer or admin to confirm payment.";
  }
  if (order.status === "accepted") return "Upload your payment receipt to continue.";
  if (order.status === "payment_pending") return "Waiting for retailer or admin to confirm payment.";
  if (order.status === "purchased") return "Retailer confirmed payment and will prepare the item.";
  if (order.status === "packing") return "Order is being packed.";
  if (order.status === "shipped") return asString(order.trackingNote) || "Order is on the way.";
  if (order.status === "delivered" && !order.customerDeliveredConfirmedAt) {
    return "Please confirm the delivery after checking the package.";
  }
  if (order.status === "delivered") return "Order completed successfully.";
  return "Waiting for next update.";
}

function buildOrderTimeline(order) {
  return [
    {
      id: "confirmed",
      label: "Order confirmed",
      detail: "Retailer converted your request into an order.",
      complete: true,
      at: order.createdAt,
    },
    {
      id: "accepted",
      label: "Customer response",
      detail: order.acceptedAt ? "You accepted the order." : "Accept the order to continue.",
      complete: Boolean(order.acceptedAt),
      at: order.acceptedAt,
    },
    {
      id: "receipt",
      label: "Payment receipt",
      detail: order.receiptUploadedAt ? "Payment receipt uploaded." : "Upload receipt after you are ready to pay.",
      complete: Boolean(order.receiptUploadedAt),
      at: order.receiptUploadedAt,
    },
    {
      id: "payment-confirmed",
      label: "Payment confirmed",
      detail: order.paymentConfirmedAt
        ? "Retailer or admin confirmed your payment."
        : "Retailer or admin still needs to confirm payment.",
      complete: Boolean(order.paymentConfirmedAt),
      at: order.paymentConfirmedAt,
    },
    {
      id: "shipping",
      label: "Shipping and delivery",
      detail:
        order.status === "delivered"
          ? "Delivered successfully."
          : order.status === "shipped"
            ? "Your order is on the way."
            : order.status === "packing"
              ? "Retailer is preparing shipment."
              : "Shipping has not started yet.",
      complete: ["packing", "shipped", "delivered"].includes(asString(order.status)),
      at: order.deliveredAt || order.shippedAt || order.packedAt,
    },
    {
      id: "proofs",
      label: "Retailer proof uploads",
      detail:
        order.deliveryProofImage || order.transactionProofImage
          ? "Retailer uploaded supporting proof."
          : "Retailer proof is still pending.",
      complete: Boolean(order.deliveryProofImage || order.transactionProofImage),
      at: order.deliveryProofUploadedAt || order.transactionProofUploadedAt,
    },
    {
      id: "customer-confirmed",
      label: "Customer delivered confirmation",
      detail: order.customerDeliveredConfirmedAt
        ? "Customer confirmed the delivery."
        : "Customer confirmation is still pending.",
      complete: Boolean(order.customerDeliveredConfirmedAt),
      at: order.customerDeliveredConfirmedAt,
    },
  ];
}

function buildCustomerOrder(order, usersById, requestsById) {
  const request = requestsById.get(asString(order.requestId));
  const retailer = usersById.get(asString(order.retailerId));
  const title = asString(order.itemTitle || order.title || request?.productName || "Order item");

  return {
    id: asString(order.id),
    requestId: asString(order.requestId),
    title,
    status: asString(order.status || "pending"),
    eta: formatOrderEta(order),
    nextStep: buildOrderNextStep(order),
    proof: order.deliveryProofImage
      ? "Delivery proof uploaded"
      : order.transactionProofImage
        ? "Transaction proof uploaded"
        : "Proof pending",
    retailerName: retailer?.shopName || retailer?.name || asString(order.retailerName) || "Retailer",
    contact: buildContactCard(retailer, asString(order.retailerName) || "Retailer"),
    receiptImage: asString(order.receiptImage),
    receiptNote: asString(order.receiptNote),
    receiptUploadedAt: asString(order.receiptUploadedAt),
    paymentConfirmedAt: asString(order.paymentConfirmedAt),
    paymentConfirmedByRole: asString(order.paymentConfirmedByRole),
    paymentConfirmedByName: asString(order.paymentConfirmedByName),
    trackingNote: asString(order.trackingNote),
    trackingUpdatedAt: asString(order.trackingUpdatedAt),
    transactionProofImage: asString(order.transactionProofImage),
    transactionProofNote: asString(order.transactionProofNote),
    transactionProofUploadedAt: asString(order.transactionProofUploadedAt),
    transactionProofReviewedAt: asString(order.transactionProofReviewedAt),
    transactionProofReviewedByName: asString(order.transactionProofReviewedByName),
    deliveryProofImage: asString(order.deliveryProofImage),
    deliveryProofNote: asString(order.deliveryProofNote),
    deliveryProofUploadedAt: asString(order.deliveryProofUploadedAt),
    deliveryProofReviewedAt: asString(order.deliveryProofReviewedAt),
    deliveryProofReviewedByName: asString(order.deliveryProofReviewedByName),
    customerDeliveredConfirmedAt: asString(order.customerDeliveredConfirmedAt),
    acceptedAt: asString(order.acceptedAt),
    packedAt: asString(order.packedAt),
    shippedAt: asString(order.shippedAt),
    deliveredAt: asString(order.deliveredAt),
  };
}

function buildOrderDetail(order, usersById, requestsById) {
  const request = requestsById.get(asString(order.requestId));
  return {
    ...buildCustomerOrder(order, usersById, requestsById),
    requestSummary: request ? buildRequestSummary(request, usersById) : null,
    timeline: buildOrderTimeline(order),
  };
}

function buildRetailerOrder(order, usersById, requestsById) {
  const customer = usersById.get(asString(order.customerId));
  const base = buildCustomerOrder(order, usersById, requestsById);
  return {
    ...base,
    item: base.title,
    customer: customer?.name || asString(order.customerName) || "Customer",
    contact: buildContactCard(customer, asString(order.customerName) || "Customer"),
  };
}

function buildRetailerRequest(request, usersById) {
  const customer = usersById.get(asString(request.userId || request.customerId));
  return {
    id: asString(request.id),
    customer: customer?.name || "Customer",
    item: asString(request.productName),
    budgetMMK: asString(request.budgetMMK),
    status: asString(request.status || "open"),
    note: asString(request.details),
    contact: buildContactCard(customer, "Customer"),
  };
}

function canRetailerAccessRequest(request, retailerId, ordersByRequestId) {
  const assignedRetailerId = asString(request.assignedRetailerId || request.retailerId);
  const order = ordersByRequestId.get(asString(request.id));

  if (assignedRetailerId) {
    return assignedRetailerId === retailerId;
  }

  if (order) {
    return asString(order.retailerId) === retailerId;
  }

  return true;
}

function buildConversation(request, viewer, usersById, ordersByRequestId, chatsByRequestId) {
  const order = ordersByRequestId.get(asString(request.id));
  const customer = usersById.get(asString(request.userId || request.customerId || order?.customerId));
  const retailer =
    usersById.get(asString(request.assignedRetailerId || request.retailerId || order?.retailerId));
  const chats = chatsByRequestId.get(asString(request.id)) || [];
  const latest = chats.at(-1);

  const isCustomer = viewer.role === "customer";
  const contact = isCustomer
    ? buildContactCard(retailer, asString(request.assignedRetailerName) || "Retailer chat")
    : buildContactCard(customer, "Customer");
  const counterpart = isCustomer ? contact?.name || "Retailer chat" : contact?.name || "Customer";

  return {
    requestId: asString(request.id),
    title: asString(request.productName),
    counterpart,
    contact,
    lastMessage: asString(latest?.message || request.details),
    updatedAt: asString(latest?.createdAt || latest?.updatedAt || request.updatedAt || request.createdAt),
  };
}

async function sendVerificationEmail(email, code) {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: email,
      subject: "Tan Tan Marketplace verification code",
      text: `Your verification code is ${code}`,
    });
    return true;
  } catch {
    return false;
  }
}

async function seedIfNeeded() {
  const usersCollection = collection("users");
  const productsCollection = collection("products");

  const hasAdmin = await usersCollection.findOne({ role: "admin" });
  if (!hasAdmin) {
    await usersCollection.insertOne({
      id: makeId("user"),
      role: "admin",
      name: "Tan Tan Admin",
      email: ADMIN_EMAIL,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      shopName: "",
      phone: "",
      telegram: "",
      city: "",
      township: "",
      address: "",
      profileNote: "",
      profileImage: "",
      faceScanImage: "",
      faceScanReviewedAt: "",
      identityStatus: "verified",
      paymentReference: "",
      paymentStatus: "accepted",
      emailVerified: true,
      status: "approved",
      createdAt: now(),
    });
  }

  const productCount = await productsCollection.countDocuments();
  if (productCount === 0) {
    await productsCollection.insertMany(
      sampleProducts.map((product) => ({
        ...product,
        retailerId: "",
        createdAt: now(),
        updatedAt: now(),
      })),
    );
  }
}

async function issueRetailerVerificationCode(user) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await collection("outboxes").insertOne({
    id: makeId("outbox"),
    email: user.email,
    subject: "Tan Tan Marketplace verification code",
    code,
    type: "retailer_verification",
    message: `Your verification code is ${code}`,
    userId: user.id,
    createdAt: now(),
  });
  await sendVerificationEmail(user.email, code);
  return code;
}

async function getLatestVerificationCode(email) {
  return collection("outboxes")
    .find({
      email,
      $or: [{ type: "retailer_verification" }, { type: { $exists: false } }],
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(1)
    .next();
}

async function findUserByEmail(email) {
  return collection("users").findOne({
    email: { $regex: new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });
}

async function createSession(userId) {
  const sessions = collection("sessions");
  const token = crypto.randomUUID();
  await sessions.deleteMany({ userId });
  await sessions.insertOne({
    id: makeId("session"),
    token,
    userId,
    createdAt: now(),
  });
  return token;
}

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  const session = await collection("sessions").findOne({ token });
  if (!session) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  const user = await collection("users").findOne({ id: asString(session.userId) });
  if (!user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  req.token = token;
  req.user = user;
  return next();
});

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "Forbidden." });
    }
    return next();
  };
}

app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const readyState = mongoose.connection.readyState;
    res.json({ ok: readyState === 1, database: "mongo" });
  }),
);

app.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const [users, products] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("products")
        .find({
          $or: [{ status: { $exists: false } }, { status: { $ne: "sold" } }],
        })
        .sort({ createdAt: -1, _id: -1 })
        .toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    res.json({ products: products.map((product) => buildProduct(product, usersById)) });
  }),
);

app.post(
  "/auth/register/customer",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const users = collection("users");
    const existing = await findUserByEmail(String(email).trim());
    if (existing) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    await users.insertOne({
      id: makeId("user"),
      role: "customer",
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash: hashPassword(password),
      shopName: "",
      phone: "",
      telegram: "",
      city: "",
      township: "",
      address: "",
      profileNote: "",
      profileImage: "",
      faceScanImage: "",
      faceScanReviewedAt: "",
      identityStatus: "not_required",
      paymentReference: "",
      paymentStatus: "accepted",
      emailVerified: true,
      status: "approved",
      createdAt: now(),
    });

    return res.json({ message: "Customer account created." });
  }),
);

app.post(
  "/auth/register/retailer",
  asyncHandler(async (req, res) => {
    const { name, email, password, shopName, paymentReference } = req.body || {};
    if (!name || !email || !password || !shopName) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and shop name are required." });
    }

    const users = collection("users");
    const existing = await findUserByEmail(String(email).trim());
    if (existing) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    await users.insertOne({
      id: makeId("user"),
      role: "retailer",
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash: hashPassword(password),
      shopName: String(shopName).trim(),
      phone: "",
      telegram: "",
      city: "",
      township: "",
      address: "",
      profileNote: "",
      profileImage: "",
      faceScanImage: "",
      faceScanReviewedAt: "",
      identityStatus: "scan_required",
      paymentReference: asString(paymentReference),
      paymentStatus: "submitted",
      emailVerified: false,
      status: "pending",
      createdAt: now(),
    });

    return res.json({ message: "Retailer application submitted." });
  }),
);

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password, code } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user || !matchesPassword(user, password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role === "retailer") {
      const status = asString(user.status || "pending");
      if (!["approved", "active"].includes(status)) {
        return res
          .status(403)
          .json({ message: "Retailer account is waiting for admin approval." });
      }

      if (!user.emailVerified) {
        let latestCode = await getLatestVerificationCode(user.email);
        if (!latestCode) {
          await issueRetailerVerificationCode(user);
          latestCode = await getLatestVerificationCode(user.email);
        }

        if (!code) {
          return res
            .status(403)
            .json({ message: "Verification code required.", codeRequired: true });
        }

        if (!latestCode || String(latestCode.code) !== String(code).trim()) {
          return res
            .status(403)
            .json({ message: "Verification code is incorrect.", codeRequired: true });
        }

        await collection("users").updateOne(
          { id: user.id },
          {
            $set: {
              emailVerified: true,
              updatedAt: now(),
            },
          },
        );
        user.emailVerified = true;
      }
    }

    const token = await createSession(asString(user.id));
    return res.json({ token, user: sanitizeUser(user) });
  }),
);

app.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const refreshedUser = await collection("users").findOne({ id: req.user.id });
    res.json({ user: sanitizeUser(refreshedUser || req.user) });
  }),
);

app.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const refreshedUser = await collection("users").findOne({ id: req.user.id });
    res.json({ user: sanitizeUser(refreshedUser || req.user) });
  }),
);

app.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      "name",
      "shopName",
      "phone",
      "telegram",
      "city",
      "township",
      "address",
      "profileNote",
      "profileImage",
      "faceScanImage",
      "paymentReference",
    ];

    const nextValues = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        nextValues[field] = req.body[field] || "";
      }
    }

    if (
      req.user.role === "retailer" &&
      Object.prototype.hasOwnProperty.call(nextValues, "faceScanImage") &&
      nextValues.faceScanImage
    ) {
      nextValues.identityStatus = "pending_review";
      nextValues.faceScanReviewedAt = "";
    }

    if (Object.keys(nextValues).length > 0) {
      nextValues.updatedAt = now();
      await collection("users").updateOne({ id: req.user.id }, { $set: nextValues });
    }

    const refreshedUser = await collection("users").findOne({ id: req.user.id });
    res.json({ user: sanitizeUser(refreshedUser) });
  }),
);

app.post(
  "/requests",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const { productName, budgetMMK, details } = req.body || {};
    if (!productName || !budgetMMK || !details) {
      return res
        .status(400)
        .json({ message: "Product name, budget, and details are required." });
    }

    const request = {
      id: makeId("request"),
      userId: req.user.id,
      productName: String(productName).trim(),
      budgetMMK: String(budgetMMK).trim(),
      details: String(details).trim(),
      status: "open",
      assignedRetailerId: "",
      assignedRetailerName: "",
      createdAt: now(),
      updatedAt: now(),
    };

    await collection("requests").insertOne(request);
    const users = await collection("users").find({}).toArray();
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    res.json({ request: buildRequestSummary(request, usersById) });
  }),
);

app.get(
  "/requests/mine",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests")
        .find({
          userId: req.user.id,
          status: { $nin: ["ordered", "canceled"] },
        })
        .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
        .toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    res.json({ requests: requests.map((request) => buildRequestSummary(request, usersById)) });
  }),
);

app.get(
  "/orders/mine",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const [users, orders, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("orders")
        .find({ customerId: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .toArray(),
      collection("requests").find({}).toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ orders: orders.map((order) => buildCustomerOrder(order, usersById, requestsById)) });
  }),
);

app.get(
  "/orders/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await collection("orders").findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const allowed =
      req.user.role === "admin" ||
      asString(order.customerId) === req.user.id ||
      asString(order.retailerId) === req.user.id;
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildOrderDetail(order, usersById, requestsById) });
  }),
);

app.get(
  "/requests/:id/chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [request, orders, users, chats] = await Promise.all([
      collection("requests").findOne({ id: req.params.id }),
      collection("orders").find({}).toArray(),
      collection("users").find({}).toArray(),
      collection("requestchats")
        .find({ requestId: req.params.id })
        .sort({ createdAt: 1, _id: 1 })
        .toArray(),
    ]);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const ordersByRequestId = new Map(orders.map((order) => [asString(order.requestId), order]));
    const order = ordersByRequestId.get(asString(request.id));

    let allowed = false;
    let contact = null;

    if (req.user.role === "admin") {
      allowed = true;
    } else if (req.user.role === "customer") {
      allowed = asString(request.userId || request.customerId) === req.user.id;
      const retailer =
        usersById.get(asString(request.assignedRetailerId || request.retailerId || order?.retailerId)) || null;
      contact = buildContactCard(retailer, asString(request.assignedRetailerName) || "Retailer chat");
    } else if (req.user.role === "retailer") {
      allowed = canRetailerAccessRequest(request, req.user.id, ordersByRequestId);
      const customer = usersById.get(asString(request.userId || request.customerId || order?.customerId)) || null;
      contact = buildContactCard(customer, "Customer");
    }

    if (!allowed) {
      return res.status(403).json({ message: "Forbidden." });
    }

    res.json({
      request: buildRequestSummary(request, usersById),
      contact,
      chats: chats.map((chat) => ({
        id: asString(chat.id),
        requestId: asString(chat.requestId),
        senderRole: asString(chat.senderRole),
        senderName: asString(chat.senderName),
        message: asString(chat.message),
        createdAt: asString(chat.createdAt),
      })),
    });
  }),
);

app.post(
  "/requests/:id/chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const [request, orders, users] = await Promise.all([
      collection("requests").findOne({ id: req.params.id }),
      collection("orders").find({}).toArray(),
      collection("users").find({}).toArray(),
    ]);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const ordersByRequestId = new Map(orders.map((order) => [asString(order.requestId), order]));
    const order = ordersByRequestId.get(asString(request.id));

    let allowed = false;
    if (req.user.role === "admin") {
      allowed = true;
    } else if (req.user.role === "customer") {
      allowed = asString(request.userId || request.customerId) === req.user.id;
    } else if (req.user.role === "retailer") {
      allowed = canRetailerAccessRequest(request, req.user.id, ordersByRequestId);
    }

    if (!allowed) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const updates = { updatedAt: now() };
    if (req.user.role === "retailer" && !asString(request.assignedRetailerId || request.retailerId)) {
      updates.assignedRetailerId = req.user.id;
      updates.assignedRetailerName = req.user.shopName || req.user.name;
      request.assignedRetailerId = updates.assignedRetailerId;
      request.assignedRetailerName = updates.assignedRetailerName;
    }

    if (Object.keys(updates).length > 0) {
      await collection("requests").updateOne({ id: request.id }, { $set: updates });
    }

    const resolvedRetailerId =
      asString(request.assignedRetailerId || request.retailerId || order?.retailerId) ||
      (req.user.role === "retailer" ? req.user.id : "");

    const chat = {
      id: makeId("chat"),
      requestId: request.id,
      customerId: asString(request.userId || request.customerId || order?.customerId),
      retailerId: resolvedRetailerId,
      senderRole: req.user.role,
      senderName: req.user.shopName || req.user.name,
      message,
      createdAt: now(),
      updatedAt: now(),
    };

    await collection("requestchats").insertOne(chat);
    res.json({
      chat: {
        id: chat.id,
        requestId: chat.requestId,
        senderRole: chat.senderRole,
        senderName: chat.senderName,
        message: chat.message,
        createdAt: chat.createdAt,
      },
    });
  }),
);

app.get(
  "/chats/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [requests, orders, users, chats] = await Promise.all([
      collection("requests").find({}).toArray(),
      collection("orders").find({}).toArray(),
      collection("users").find({}).toArray(),
      collection("requestchats").find({}).toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const ordersByRequestId = new Map(orders.map((order) => [asString(order.requestId), order]));
    const chatsByRequestId = chats.reduce((map, chat) => {
      const key = asString(chat.requestId);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(chat);
      map.get(key).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return map;
    }, new Map());

    let scopedRequests = requests;
    if (req.user.role === "customer") {
      scopedRequests = requests.filter((request) => asString(request.userId || request.customerId) === req.user.id);
    } else if (req.user.role === "retailer") {
      const relevantRequestIds = new Set([
        ...orders.filter((order) => asString(order.retailerId) === req.user.id).map((order) => asString(order.requestId)),
        ...requests
          .filter((request) => asString(request.assignedRetailerId || request.retailerId) === req.user.id)
          .map((request) => asString(request.id)),
        ...chats
          .filter((chat) => asString(chat.retailerId) === req.user.id)
          .map((chat) => asString(chat.requestId)),
      ]);

      scopedRequests = requests.filter((request) => relevantRequestIds.has(asString(request.id)));
    }

    const conversations = scopedRequests
      .filter((request) => chatsByRequestId.has(asString(request.id)) || ordersByRequestId.has(asString(request.id)) || asString(request.assignedRetailerId))
      .map((request) =>
        buildConversation(request, req.user, usersById, ordersByRequestId, chatsByRequestId),
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ conversations });
  }),
);

app.get(
  "/retailer/dashboard",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const [requests, orders, users, products] = await Promise.all([
      collection("requests").find({}).toArray(),
      collection("orders").find({ retailerId: req.user.id }).sort({ createdAt: -1, _id: -1 }).toArray(),
      collection("users").find({}).toArray(),
      collection("products")
        .find({ retailerId: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .toArray(),
    ]);

    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    const ordersByRequestId = new Map(orders.map((order) => [asString(order.requestId), order]));

    const scopedRequests = requests
      .filter((request) => {
        const status = asString(request.status || "open");
        if (["ordered", "canceled"].includes(status)) {
          return false;
        }

        const assignedRetailerId = asString(request.assignedRetailerId || request.retailerId);
        if (!assignedRetailerId) {
          return true;
        }

        return assignedRetailerId === req.user.id;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((request) => buildRetailerRequest(request, usersById));

    const inStockProducts = products
      .filter((product) => asString(product.status || "active") !== "sold")
      .map((product) => buildProduct(product, usersById));
    const soldProducts = products
      .filter((product) => asString(product.status) === "sold")
      .map((product) => buildProduct(product, usersById));

    res.json({
      overview: { shopName: req.user.shopName || req.user.name },
      requests: scopedRequests,
      orders: orders.map((order) => buildRetailerOrder(order, usersById, requestsById)),
      inStockProducts,
      soldProducts,
    });
  }),
);

app.post(
  "/retailer/products",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const product = {
      id: makeId("product"),
      retailerId: req.user.id,
      retailerName: req.user.shopName || req.user.name,
      title: asString(req.body?.title || "Untitled product"),
      brand: asString(req.body?.brand || "Brand"),
      category: asString(req.body?.category || "General"),
      type: asString(req.body?.type || "Product"),
      priceMMK: asString(req.body?.priceMMK),
      originalPriceMMK: asString(req.body?.originalPriceMMK),
      discount: asString(req.body?.discount),
      proof: asString(req.body?.proof || req.body?.proofNote || "Proof ready"),
      description: asString(req.body?.description),
      image: asString(req.body?.image),
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };

    await collection("products").insertOne(product);
    res.json({ product });
  }),
);

app.patch(
  "/retailer/products/:id/status",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const products = collection("products");
    const product = await products.findOne({ id: req.params.id, retailerId: req.user.id });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const status = asString(req.body?.status || product.status || "active");
    await products.updateOne(
      { id: req.params.id, retailerId: req.user.id },
      { $set: { status, updatedAt: now() } },
    );

    res.json({ product: { ...product, status } });
  }),
);

app.post(
  "/requests/:id/confirm-order",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const requests = collection("requests");
    const orders = collection("orders");
    const request = await requests.findOne({ id: req.params.id });
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const existingOrder = await orders.findOne({ requestId: request.id });
    let order = existingOrder;

    if (!order) {
      order = {
        id: makeId("order"),
        requestId: request.id,
        retailerId: req.user.id,
        retailerName: req.user.shopName || req.user.name,
        customerId: asString(request.userId || request.customerId),
        customerName: "",
        itemTitle: asString(request.productName),
        status: "pending",
        nextStep: "Please accept or cancel this order.",
        eta: "Waiting for customer confirmation",
        receiptImage: "",
        receiptNote: "",
        receiptUploadedAt: "",
        paymentConfirmedAt: "",
        paymentConfirmedByRole: "",
        paymentConfirmedByName: "",
        trackingNote: "",
        trackingUpdatedAt: "",
        packedAt: "",
        shippedAt: "",
        deliveredAt: "",
        transactionProofImage: "",
        transactionProofNote: "",
        transactionProofUploadedAt: "",
        transactionProofReviewedAt: "",
        transactionProofReviewedByName: "",
        deliveryProofImage: "",
        deliveryProofNote: "",
        deliveryProofUploadedAt: "",
        deliveryProofReviewedAt: "",
        deliveryProofReviewedByName: "",
        customerDeliveredConfirmedAt: "",
        createdAt: now(),
        updatedAt: now(),
      };
      await orders.insertOne(order);
    }

    await requests.updateOne(
      { id: request.id },
      {
        $set: {
          status: "ordered",
          assignedRetailerId: req.user.id,
          assignedRetailerName: req.user.shopName || req.user.name,
          updatedAt: now(),
        },
      },
    );

    const [users, allRequests] = await Promise.all([
      collection("users").find({}).toArray(),
      requests.find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(allRequests.map((entry) => [asString(entry.id), entry]));
    res.json({ order: buildRetailerOrder(order, usersById, requestsById) });
  }),
);

app.patch(
  "/orders/:id/customer-action",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, customerId: req.user.id });
    const action = asString(req.body?.action);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updates = { updatedAt: now() };
    if (action === "accept") {
      updates.status = "accepted";
      updates.acceptedAt = now();
      updates.eta = "Upload payment receipt";
    } else if (action === "cancel") {
      updates.status = "canceled";
      updates.canceledAt = now();
      updates.eta = "Canceled";
    } else if (action === "pay") {
      updates.status = "payment_pending";
    } else {
      return res.status(400).json({ message: "Unsupported customer action." });
    }

    await orders.updateOne({ id: req.params.id, customerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const nextOrder = { ...order, ...updates };
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildCustomerOrder(nextOrder, usersById, requestsById) });
  }),
);

app.post(
  "/orders/:id/receipt",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, customerId: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (!req.body?.receiptImage) {
      return res.status(400).json({ message: "Receipt image is required." });
    }

    const updates = {
      receiptImage: req.body.receiptImage,
      receiptNote: asString(req.body?.receiptNote),
      receiptUploadedAt: now(),
      updatedAt: now(),
    };

    if (!order.paymentConfirmedAt && ["pending", "accepted", "payment_pending"].includes(asString(order.status))) {
      updates.status = "payment_pending";
      updates.eta = "Waiting for payment confirmation";
    }

    await orders.updateOne({ id: req.params.id, customerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildCustomerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.post(
  "/orders/:id/confirm-payment",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!["retailer", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (req.user.role === "retailer" && asString(order.retailerId) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const updates = {
      paymentConfirmedAt: now(),
      paymentConfirmedByRole: req.user.role,
      paymentConfirmedByName: req.user.shopName || req.user.name,
      updatedAt: now(),
    };

    if (["pending", "accepted", "payment_pending"].includes(asString(order.status))) {
      updates.status = "purchased";
      updates.eta = "Retailer is preparing the order";
    }

    await orders.updateOne({ id: req.params.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    const nextOrder = { ...order, ...updates };
    res.json({
      order:
        req.user.role === "retailer"
          ? buildRetailerOrder(nextOrder, usersById, requestsById)
          : buildCustomerOrder(nextOrder, usersById, requestsById),
    });
  }),
);

app.patch(
  "/orders/:id/retailer-status",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, retailerId: req.user.id });
    const nextStatus = asString(req.body?.status);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (!order.paymentConfirmedAt) {
      return res
        .status(400)
        .json({ message: "Confirm payment before updating delivery status." });
    }
    if (!["packing", "shipped", "delivered"].includes(nextStatus)) {
      return res.status(400).json({ message: "Unsupported retailer status." });
    }

    const updates = {
      status: nextStatus,
      eta:
        req.body?.eta ||
        (nextStatus === "packing"
          ? "Packing now"
          : nextStatus === "shipped"
            ? "Shipped"
            : "Delivered"),
      updatedAt: now(),
    };

    if (nextStatus === "packing") updates.packedAt = now();
    if (nextStatus === "shipped") updates.shippedAt = now();
    if (nextStatus === "delivered") updates.deliveredAt = now();

    await orders.updateOne({ id: req.params.id, retailerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildRetailerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.patch(
  "/orders/:id/tracking-note",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, retailerId: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updates = {
      trackingNote: asString(req.body?.trackingNote),
      trackingUpdatedAt: now(),
      updatedAt: now(),
    };

    await orders.updateOne({ id: req.params.id, retailerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildRetailerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.post(
  "/orders/:id/retailer-proof",
  requireAuth,
  requireRole("retailer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, retailerId: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const proofType = asString(req.body?.proofType);
    const image = asString(req.body?.image);
    if (!image) {
      return res.status(400).json({ message: "Proof image is required." });
    }

    const updates = { updatedAt: now() };
    if (proofType === "transaction") {
      updates.transactionProofImage = image;
      updates.transactionProofNote = asString(req.body?.note);
      updates.transactionProofUploadedAt = now();
      updates.transactionProofReviewedAt = "";
      updates.transactionProofReviewedByName = "";
    } else if (proofType === "delivery") {
      updates.deliveryProofImage = image;
      updates.deliveryProofNote = asString(req.body?.note);
      updates.deliveryProofUploadedAt = now();
      updates.deliveryProofReviewedAt = "";
      updates.deliveryProofReviewedByName = "";
    } else {
      return res.status(400).json({ message: "Unsupported proof type." });
    }

    await orders.updateOne({ id: req.params.id, retailerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildRetailerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.post(
  "/orders/:id/customer-confirm-delivered",
  requireAuth,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.id, customerId: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const updates = {
      customerDeliveredConfirmedAt: now(),
      updatedAt: now(),
    };

    await orders.updateOne({ id: req.params.id, customerId: req.user.id }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildCustomerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.get(
  "/admin/pending-retailers",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const retailers = await collection("users")
      .find({ role: "retailer", status: "pending" })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json({ retailers: retailers.map((retailer) => sanitizeUser(retailer)) });
  }),
);

app.get(
  "/admin/pending-payments",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const [users, orders, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("orders")
        .find({
          receiptImage: { $exists: true, $ne: "" },
          $or: [{ paymentConfirmedAt: { $exists: false } }, { paymentConfirmedAt: "" }],
        })
        .sort({ receiptUploadedAt: -1, createdAt: -1, _id: -1 })
        .toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ orders: orders.map((order) => buildRetailerOrder(order, usersById, requestsById)) });
  }),
);

app.get(
  "/admin/pending-transaction-proofs",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const [users, orders, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("orders")
        .find({
          transactionProofImage: { $exists: true, $ne: "" },
          $or: [{ transactionProofReviewedAt: { $exists: false } }, { transactionProofReviewedAt: "" }],
        })
        .sort({ transactionProofUploadedAt: -1, createdAt: -1, _id: -1 })
        .toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ orders: orders.map((order) => buildRetailerOrder(order, usersById, requestsById)) });
  }),
);

app.get(
  "/admin/pending-delivery-proofs",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const [users, orders, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("orders")
        .find({
          deliveryProofImage: { $exists: true, $ne: "" },
          $or: [{ deliveryProofReviewedAt: { $exists: false } }, { deliveryProofReviewedAt: "" }],
        })
        .sort({ deliveryProofUploadedAt: -1, createdAt: -1, _id: -1 })
        .toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ orders: orders.map((order) => buildRetailerOrder(order, usersById, requestsById)) });
  }),
);

app.get(
  "/admin/pending-face-scans",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const retailers = await collection("users")
      .find({
        role: "retailer",
        faceScanImage: { $exists: true, $ne: "" },
        identityStatus: "pending_review",
      })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    res.json({ retailers: retailers.map((retailer) => sanitizeUser(retailer)) });
  }),
);

app.post(
  "/admin/retailers/:retailerId/approve",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const users = collection("users");
    const retailer = await users.findOne({ id: req.params.retailerId, role: "retailer" });
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    await users.updateOne(
      { id: req.params.retailerId, role: "retailer" },
      {
        $set: {
          status: "approved",
          paymentStatus: "accepted",
          updatedAt: now(),
        },
      },
    );

    await issueRetailerVerificationCode(retailer);
    const refreshed = await users.findOne({ id: req.params.retailerId, role: "retailer" });
    res.json({ retailer: sanitizeUser(refreshed), message: "Retailer approved." });
  }),
);

app.post(
  "/admin/orders/:orderId/review-proof",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const orders = collection("orders");
    const order = await orders.findOne({ id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const proofType = asString(req.body?.proofType);
    const updates = { updatedAt: now() };
    if (proofType === "delivery") {
      updates.deliveryProofReviewedAt = now();
      updates.deliveryProofReviewedByName = req.user.name;
    } else {
      updates.transactionProofReviewedAt = now();
      updates.transactionProofReviewedByName = req.user.name;
    }

    await orders.updateOne({ id: req.params.orderId }, { $set: updates });
    const [users, requests] = await Promise.all([
      collection("users").find({}).toArray(),
      collection("requests").find({}).toArray(),
    ]);
    const usersById = new Map(users.map((user) => [asString(user.id), user]));
    const requestsById = new Map(requests.map((request) => [asString(request.id), request]));
    res.json({ order: buildRetailerOrder({ ...order, ...updates }, usersById, requestsById) });
  }),
);

app.post(
  "/admin/retailers/:retailerId/review-face-scan",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const users = collection("users");
    const retailer = await users.findOne({ id: req.params.retailerId, role: "retailer" });
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found." });
    }

    const approved = req.body?.approved !== false;
    const updates = {
      faceScanReviewedAt: now(),
      identityStatus: approved ? "approved" : "rejected",
      updatedAt: now(),
    };

    await users.updateOne({ id: req.params.retailerId, role: "retailer" }, { $set: updates });
    const refreshed = await users.findOne({ id: req.params.retailerId, role: "retailer" });
    res.json({ retailer: sanitizeUser(refreshed) });
  }),
);

app.use(
  (error, _req, res, _next) => {
    res.status(500).json({
      message: "Server error.",
      detail: error?.message || "Unknown error.",
    });
  },
);

async function start() {
  await mongoose.connect(MONGODB_URI);
  await seedIfNeeded();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tan Tan API listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
