import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const reportSlice = createSlice({
  name: "report",
  initialState: {
    loading: false,
  },
  reducers: {
    resetReportState(state) {
      state.loading = false;
    },
    createReportRequest(state) {
      state.loading = true;
    },
    createReportSuccess(state) {
      state.loading = false;
    },
    createReportFailed(state) {
      state.loading = false;
    },
    updateReportStatusRequest(state) {
      state.loading = true;
    },
    updateReportStatusSuccess(state) {
      state.loading = false;
    },
    updateReportStatusFailed(state) {
      state.loading = false;
    },
  },
});

export const { resetReportState } = reportSlice.actions;

// Thunk to create a report
export const createReport = (data) => async (dispatch) => {
  dispatch(reportSlice.actions.createReportRequest());
  try {
    const response = await axios.post(
      `http://localhost:5000/api/v1/report/report-auction`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(reportSlice.actions.createReportSuccess());
    toast.success(response.data.message);
  } catch (error) {
    dispatch(reportSlice.actions.createReportFailed());
    toast.error(error.response?.data?.message || "Failed to create report");
  }
};

export const updateReportStatus = (reportId, status) => async (dispatch) => {
  dispatch(reportSlice.actions.updateReportStatusRequest());
  try {
    const response = await axios.put(
      `http://localhost:5000/api/v1/superadmin/reports/${reportId}/status`,
      { status },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    dispatch(reportSlice.actions.updateReportStatusSuccess());
    toast.success(response.data.message);
  } catch (error) {
    dispatch(reportSlice.actions.updateReportStatusFailed());
    toast.error(error.response?.data?.message || "Failed to update report status");
  }
};

export default reportSlice.reducer;
