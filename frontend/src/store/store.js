import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import commissionReducer from "./slices/commissionSlice";
import auctionReducer from "./slices/auctionSlice";
import bidReducer from "./slices/bidSlice";
import superAdminReducer from "./slices/superAdminSlice";
import categorySuggestionReducer from "./slices/categorySuggestionSlice";
import adminCategorySuggestionReducer from "./slices/adminCategorySuggestionSlice";
import reportReducer from "./slices/reportAuctionSlice";
export const store = configureStore({
  reducer: {
    user: userReducer,
    commission: commissionReducer,
    auction: auctionReducer,
    bid: bidReducer,
    superAdmin: superAdminReducer,
    categorySuggestion: categorySuggestionReducer,
    adminCategorySuggestions: adminCategorySuggestionReducer,
    report: reportReducer,
  },
});
