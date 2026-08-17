const mongoose = require("mongoose");

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}

module.exports = connectMongo;
