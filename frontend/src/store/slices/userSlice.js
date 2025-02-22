import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    isAuthenticated: false,
    user: {},
    leaderboard: [],
    sellerProfile: null,
  },
  reducers: {
    registerRequest(state) {
      state.loading = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    registerSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    registerFailed(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
    },
    loginRequest(state) {
      state.loading = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    loginFailed(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
    },
    fetchUserRequest(state) {
      state.loading = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    fetchUserSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    fetchUserFailed(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
    },
    logoutSuccess(state) {
      state.isAuthenticated = false;
      state.user = {};
    },
    logoutFailed(state) {
      state.loading = false;
      // Keep current auth state on logout failure
    },
    fetchLeaderboardRequest(state, action) {
      state.loading = true;
      state.leaderboard = [];
    },
    fetchLeaderboardSuccess(state, action) {
      state.loading = false;
      state.leaderboard = action.payload;
    },
    fetchLeaderboardFailed(state, action) {
      state.loading = false;
      state.leaderboard = [];
    },
    changePasswordRequest(state, action) {
      state.loading = true;
    },
    changePasswordSuccess(state, action) {
      state.loading = false;
    },
    changePasswordFailed(state, action) {
      state.loading = false;
    },
    updateUserRequest(state, action) {
      state.loading = true;
    },
    updateUserSuccess(state, action) {
      state.loading = false;
      state.user = action.payload.user;
    },
    updateUserFailed(state, action) {
      state.loading = false;
    },
    fetchSellerProfileRequest(state, action) {
      state.loading = true;
      state.sellerProfile = null;
    },
    fetchSellerProfileSuccess(state, action) {
      state.loading = false;
      state.sellerProfile = action.payload;
    },
    fetchSellerProfileFailed(state, action) {
      state.loading = false;
      state.sellerProfile = null;
    },//
    deleteAccountRequest(state) {
      state.loading = true;
    },
    deleteAccountSuccess(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
    },
    deleteAccountFailed(state) {
      state.loading = false;
    },//
    addToWishlistRequest(state, action) {
      state.loading = true;
    },
    addToWishlistSuccess(state, action) {
      state.loading = false;
      state.user.wishlist = [...state.user.wishlist, action.payload];
    },
    addToWishlistFailed(state, action) {
      state.loading = false;
    },
    removeFromWishlistRequest(state, action) {
      state.loading = true;
    },
    removeFromWishlistSuccess(state, action) {
      state.loading = false;
      state.user.wishlist = state.user.wishlist.filter(
        (item) => item._id !== action.payload
      );
    },
    removeFromWishlistFailed(state, action) {
      state.loading = false;
    },
    getWishlistRequest(state, action) {
      state.loading = true;
    },
    getWishlistSuccess(state, action) {
      state.loading = false;
      state.user.wishlist = action.payload;
    },
    getWishlistFailed(state, action) {
      state.loading = false;
    },
    clearUserState(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
      state.sellerProfile = null;
    },    
    clearAllErrors(state) {
      state.loading = false;
      // Keep existing state when clearing errors
    },
  },
});

export const updateUserProfile = (data) => async (dispatch) => {
  dispatch(userSlice.actions.updateUserRequest());
  try {
    const response = await axios.put(
      "http://localhost:5000/api/v1/user/update-profile",
      data,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    dispatch(userSlice.actions.updateUserSuccess(response.data));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.updateUserFailed());
    toast.error(error.response?.data?.message || "Failed to update profile");
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const fetchSellerProfile = (sellerId) => async (dispatch) => {
  dispatch(userSlice.actions.fetchSellerProfileRequest());
  try {
    const response = await axios.get(
      `http://localhost:5000/api/v1/user/seller/${sellerId}`,
      {
        withCredentials: true,
      }
    );
    dispatch(userSlice.actions.fetchSellerProfileSuccess(response.data));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.fetchSellerProfileFailed());
    toast.error(error.response?.data?.message || "Failed to fetch seller profile");
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const register = (data) => async (dispatch) => {
  dispatch(userSlice.actions.registerRequest());
  try {
    const response = await axios.post(
      "http://localhost:5000/api/v1/user/register",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    dispatch(userSlice.actions.registerSuccess(response.data));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.registerFailed());
    toast.error(error.response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(userSlice.actions.loginRequest());
  try {
    const response = await axios.post(
      "http://localhost:5000/api/v1/user/login",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(userSlice.actions.loginSuccess(response.data));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.loginFailed());
    toast.error(error.response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const logout = () => async (dispatch) => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/v1/user/logout",
      { withCredentials: true }
    );
    dispatch(userSlice.actions.logoutSuccess());
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.logoutFailed());
    toast.error(error.response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const fetchUser = () => async (dispatch) => {
  dispatch(userSlice.actions.fetchUserRequest());
  try {
    const response = await axios.get("http://localhost:5000/api/v1/user/me", {
      withCredentials: true,
    });
    dispatch(userSlice.actions.fetchUserSuccess(response.data.user));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.fetchUserFailed());
    dispatch(userSlice.actions.clearAllErrors());
    console.error(error);
  }
};

export const fetchLeaderboard = () => async (dispatch) => {
  dispatch(userSlice.actions.fetchLeaderboardRequest());
  try {
    const response = await axios.get(
      "http://localhost:5000/api/v1/user/leaderboard",
      {
        withCredentials: true,
      }
    );
    dispatch(
      userSlice.actions.fetchLeaderboardSuccess(response.data.leaderboard)
    );
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.fetchLeaderboardFailed());
    dispatch(userSlice.actions.clearAllErrors());
    console.error(error);
  }
};

export const changePassword = (data) => async (dispatch) => {
  dispatch(userSlice.actions.changePasswordRequest());
  try {
    const response = await axios.put(
      "http://localhost:5000/api/v1/user/change-password",
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(userSlice.actions.changePasswordSuccess());
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.changePasswordFailed());
    toast.error(error.response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  }
};

//
export const deleteUserAccount = () => async (dispatch) => {
  dispatch(userSlice.actions.deleteAccountRequest());
  try {
    const response = await axios.delete("http://localhost:5000/api/v1/user/deleteAccount", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`, 
      },
    });
    dispatch(userSlice.actions.deleteAccountSuccess());
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearUserState());
  } catch (error) {
    dispatch(userSlice.actions.deleteAccountFailed());
    toast.error(error.response?.data?.message || "Failed to delete account");
  }
};


export const addToWishlist = (userId, auctionId) => async (dispatch) => {
  dispatch(userSlice.actions.addToWishlistRequest());
  try {
    const response = await axios.post(
      "http://localhost:5000/api/v1/user/wishlist/add",
      { userId, auctionId },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    dispatch(userSlice.actions.addToWishlistSuccess(response.data.auction));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.addToWishlistFailed());
    toast.error(error.response?.data?.message || "Failed to add to wishlist");
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const removeFromWishlist = (userId, auctionId) => async (dispatch) => {
  dispatch(userSlice.actions.removeFromWishlistRequest());
  try {
    const response = await axios.delete(
      "http://localhost:5000/api/v1/user/wishlist/remove",
      {
        data: { userId, auctionId },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    dispatch(userSlice.actions.removeFromWishlistSuccess(auctionId));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.removeFromWishlistFailed());
    toast.error(error.response?.data?.message || "Failed to remove from wishlist");
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const getWishlist = (userId) => async (dispatch) => {
  dispatch(userSlice.actions.getWishlistRequest());
  try {
    const response = await axios.get(
      `http://localhost:5000/api/v1/user/wishlist/${userId}`,
      {
        withCredentials: true,
      }
    );
    dispatch(userSlice.actions.getWishlistSuccess(response.data.wishlist));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.getWishlistFailed());
    toast.error(error.response?.data?.message || "Failed to fetch wishlist");
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const { clearUserState } = userSlice.actions;

export default userSlice.reducer;
