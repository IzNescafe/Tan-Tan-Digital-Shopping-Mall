import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tan-tan-marketplace";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("collections", collections.map((entry) => entry.name).join(", "));

  for (const name of ["users", "products", "requests", "orders", "requestchats", "sessions", "outboxes"]) {
    const count = await db.collection(name).countDocuments();
    console.log(`${name}:${count}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
