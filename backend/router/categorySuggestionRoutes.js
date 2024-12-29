import express from "express";
import { suggestCategory } from "../controllers/categorySuggestionController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/suggest-category",
  isAuthenticated,
  isAuthorized("Auctioneer"),
  suggestCategory
);

export default router;