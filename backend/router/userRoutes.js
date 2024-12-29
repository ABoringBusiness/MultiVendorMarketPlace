import express from "express";
import {
  fetchLeaderboard,
  getProfile,
  login,
  logout,
  register,
  changePassword,
  updateProfile,
  getSellerProfile,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  forgotPassword,
  resetPassword,
  deleteAccount 
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", isAuthenticated, getProfile);
router.get("/logout", isAuthenticated, logout);
router.get("/leaderboard", fetchLeaderboard);
router.put("/change-password", isAuthenticated, changePassword);
router.put("/update-profile", isAuthenticated, updateProfile);
router.get("/seller/:id", getSellerProfile);
router.post("/wishlist/add", isAuthenticated, addToWishlist);
router.delete("/wishlist/remove", isAuthenticated, removeFromWishlist);
router.get("/wishlist/:userId", isAuthenticated, getWishlist);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.delete("/deleteAccount", isAuthenticated, deleteAccount); 

export default router;
