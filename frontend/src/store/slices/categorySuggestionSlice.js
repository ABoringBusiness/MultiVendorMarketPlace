import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const categorySuggestionSlice = createSlice({
  name: "categorySuggestion",
  initialState: {
    loading: false,
  },
  reducers: {
    suggestCategoryRequest(state) {
      state.loading = true;
    },
    suggestCategorySuccess(state) {
      state.loading = false;
    },
    suggestCategoryFailed(state) {
      state.loading = false;
    },
  },
});

export const suggestCategory = (data) => async (dispatch) => {
  dispatch(categorySuggestionSlice.actions.suggestCategoryRequest());
  try {
    const response = await axios.post(
      `http://localhost:5000/api/v1/category/suggest-category`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(categorySuggestionSlice.actions.suggestCategorySuccess());
    toast.success(response.data.message);
  } catch (error) {
    dispatch(categorySuggestionSlice.actions.suggestCategoryFailed());
    toast.error(error.response?.data?.message || "Failed to submit suggestion");
  }
};

export default categorySuggestionSlice.reducer;
