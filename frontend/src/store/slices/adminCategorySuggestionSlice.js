import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const adminCategorySuggestionSlice = createSlice({
  name: "adminCategorySuggestions",
  initialState: {
    loading: false,
    suggestions: [],
  },
  reducers: {
    requestCategorySuggestions(state) {
      state.loading = true;
      state.suggestions = [];
    },
    successCategorySuggestions(state, action) {
      state.loading = false;
      state.suggestions = action.payload;
    },
    failureCategorySuggestions(state) {
      state.loading = false;
    },
    requestApproveSuggestion(state) {
      state.loading = true;
    },
    successApproveSuggestion(state) {
      state.loading = false;
    },
    failureApproveSuggestion(state) {
      state.loading = false;
    },
    requestRejectSuggestion(state) {
      state.loading = true;
    },
    successRejectSuggestion(state) {
      state.loading = false;
    },
    failureRejectSuggestion(state) {
      state.loading = false;
    },
  },
});

export const getCategorySuggestions = () => async (dispatch) => {
  dispatch(adminCategorySuggestionSlice.actions.requestCategorySuggestions());
  try {
    const response = await axios.get(
      "http://localhost:5000/api/v1/superadmin/category/suggestions",
      { withCredentials: true }
    );
    dispatch(adminCategorySuggestionSlice.actions.successCategorySuggestions(response.data.suggestions));
  } catch (error) {
    dispatch(adminCategorySuggestionSlice.actions.failureCategorySuggestions());
    console.error(error.response.data.message);
  }
};

export const approveCategorySuggestion = (id) => async (dispatch) => {
  dispatch(adminCategorySuggestionSlice.actions.requestApproveSuggestion());
  try {
    const response = await axios.put(
      `http://localhost:5000/api/v1/superadmin/category/suggestions/approve/${id}`,
      {},
      { withCredentials: true }
    );
    dispatch(adminCategorySuggestionSlice.actions.successApproveSuggestion());
    toast.success(response.data.message);
    dispatch(getCategorySuggestions());
  } catch (error) {
    dispatch(adminCategorySuggestionSlice.actions.failureApproveSuggestion());
    console.error(error.response.data.message);
    toast.error(error.response.data.message);
  }
};

export const rejectCategorySuggestion = (id) => async (dispatch) => {
  dispatch(adminCategorySuggestionSlice.actions.requestRejectSuggestion());
  try {
    const response = await axios.put(
      `http://localhost:5000/api/v1/superadmin/category/suggestions/reject/${id}`,
      {},
      { withCredentials: true }
    );
    dispatch(adminCategorySuggestionSlice.actions.successRejectSuggestion());
    toast.success(response.data.message);
    dispatch(getCategorySuggestions());
  } catch (error) {
    dispatch(adminCategorySuggestionSlice.actions.failureRejectSuggestion());
    console.error(error.response.data.message);
    toast.error(error.response.data.message);
  }
};

export default adminCategorySuggestionSlice.reducer;
