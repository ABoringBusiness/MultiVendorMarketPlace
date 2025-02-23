import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { connection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import authRouter from "./router/auth.js";
import userRouter from "./router/userRoutes.js";
import auctionItemRouter from "./router/auctionItemRoutes.js";
import bidRouter from "./router/bidRoutes.js";
import categorySuggestionRoutes from "./router/categorySuggestionRoutes.js";
import commissionRouter from "./router/commissionRouter.js";
import reportRoutes from "./router/reportAuctionRouter.js";
import superAdminRouter from "./router/superAdminRoutes.js";
import productRouter from "./router/productRoutes.js";
import sellerRouter from "./router/sellerRoutes.js";
import orderRouter from "./router/orderRoutes.js";
import { endedAuctionCron } from "./automation/endedAuctionCron.js";
import { verifyCommissionCron } from "./automation/verifyCommissionCron.js";
import { checkReportedAuctionsCron } from "./automation/AuctionReportsCron.js"

const app = express();
config();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auctionitem", auctionItemRouter);
app.use("/api/v1/bid", bidRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/category", categorySuggestionRoutes);
app.use("/api/v1/superadmin", superAdminRouter);
app.use("/api/v1/report", reportRoutes);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/sellers", sellerRouter);
app.use("/api/v1/orders", orderRouter);


endedAuctionCron();
verifyCommissionCron();
checkReportedAuctionsCron();
connection();
app.use(errorMiddleware);

export default app;
