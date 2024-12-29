import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";
import {
  deleteAuctionItem,
  deletePaymentProof,
  fetchAllUsers,
  getAllPaymentProofs,
  getPaymentProofDetail,
  monthlyRevenue,
  updateProofStatus,
  fetchAllUserDetails,
  fetchAllCategorySuggestions,
  approveCategorySuggestion,
  rejectCategorySuggestion,
  getAllReportedAuctions,
  updateReportStatus,
} from "../controllers/superAdminController.js";

const router = express.Router();

router.delete(
  "/auctionitem/delete/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  deleteAuctionItem
);

router.get(
  "/paymentproofs/getall",
  isAuthenticated,
  isAuthorized("Super Admin"),
  getAllPaymentProofs
);

router.get(
  "/paymentproof/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  getPaymentProofDetail
);

router.put(
  "/paymentproof/status/update/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  updateProofStatus
);

router.delete(
  "/paymentproof/delete/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  deletePaymentProof
);

router.get(
  "/users/getall",
  isAuthenticated,
  isAuthorized("Super Admin"),
  fetchAllUsers
);

router.get(
  "/monthlyincome",
  isAuthenticated,
  isAuthorized("Super Admin"),
  monthlyRevenue
);

router.get(
  "/users/details",
  isAuthenticated,
  isAuthorized("Super Admin"),
  fetchAllUserDetails
);

router.get(
  "/category/suggestions",
  isAuthenticated,
  isAuthorized("Super Admin"),
  fetchAllCategorySuggestions
);

router.put(
  "/category/suggestions/approve/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  approveCategorySuggestion
);

router.put(
  "/category/suggestions/reject/:id",
  isAuthenticated,
  isAuthorized("Super Admin"),
  rejectCategorySuggestion
);

router.get(
  "/reported-auctions",
  isAuthenticated,
  isAuthorized("Super Admin"),
  getAllReportedAuctions
);

router.put(
  "/reports/:id/status", 
  isAuthenticated,
  isAuthorized("Super Admin"),
  updateReportStatus
);

export default router;
