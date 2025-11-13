import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import serverless from "serverless-http";

// ✅ Initialize Express
const app = express();

// ✅ Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://bucket-server-less-1.s3-website-us-east-1.amazonaws.com"
];

// ✅ CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {

  res.status(200).json({ status: "OK", message: "Server is running" });

});


// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/superadmin", superadminRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/rating", ratingRouter);

// ✅ DB Connection
connectDb();

// ✅ Export for AWS Lambda
export const handler = serverless(app);

// ✅ Local testing (only runs when using: IS_LOCAL=true)
if (process.env.IS_LOCAL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Local server running at http://localhost:${PORT}`);
  });
}

