import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";

let memoryServer = null;
let isConnected = false;

// Detect Lambda environment
const isLambdaEnv = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const connectDb = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri =
    process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/foodway";

  try {
    console.log("🔗 Connecting to MongoDB...");

    await mongoose.connect(mongoUri, {
      dbName: "foodway",
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5,
      family: 4,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${mongoUri}`);
    return mongoose.connection;

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    // Lambda: Do NOT crash — allow API to run
    if (isLambdaEnv) {
      console.log("⚠️ Running in Lambda without MongoDB connection");
      return null; // <-- important!
    }

    // Local fallback for dev only
    console.log("⚙️ Starting in-memory MongoDB (local fallback)...");
    try {
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log("✅ Connected to in-memory MongoDB");

      const bcrypt = (await import("bcryptjs")).default;

      const existingAdmin = await User.findOne({
        email: "superadmin@foodway.com",
      });

      if (!existingAdmin) {
        const admin = new User({
          fullName: "Super Admin",
          email: "superadmin@foodway.com",
          password: await bcrypt.hash("superadmin123", 10),
          mobile: "9999999999",
          role: "superadmin",
          isApproved: true,
        });
        await admin.save();
      }

      if ((await Category.countDocuments()) === 0) {
        await Category.create([
          { name: "Snacks" },
          { name: "Main Course" },
          { name: "Desserts" },
          { name: "Beverages" },
        ]);
      }

      isConnected = true;
      return mongoose.connection;

    } catch (memErr) {
      console.error("❌ In-memory DB error:", memErr.message);
      return null;
    }
  }
};

export default connectDb;

