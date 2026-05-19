import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tan-tan-marketplace";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  for (const name of ["users", "products", "requests", "orders", "requestchats", "sessions", "outboxes"]) {
    const doc = await db.collection(name).findOne({});
    console.log(`--- ${name} ---`);
    console.log(JSON.stringify(doc, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
