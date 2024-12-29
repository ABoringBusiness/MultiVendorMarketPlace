import {
  getCategorySuggestions,
  approveCategorySuggestion,
  rejectCategorySuggestion,
} from "@/store/slices/adminCategorySuggestionSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "@/custom-components/Spinner";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { format } from "date-fns";

const AdminSugCategories = () => {
  const dispatch = useDispatch();
  const { loading, suggestions } = useSelector(
    (state) => state.adminCategorySuggestions
  );

  useEffect(() => {
    dispatch(getCategorySuggestions());
  }, [dispatch]);

  const handleApprove = (id) => {
    dispatch(approveCategorySuggestion(id));
  };

  const handleReject = (id) => {
    dispatch(rejectCategorySuggestion(id));
  };

  return (
    <section className="w-full p-8 bg-gray-50 min-h-screen flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Category Suggestions</h1>
        </div>
        {loading ? (
          <Spinner />
        ) : suggestions.length > 0 ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Suggested Category</th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Requested By</th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Request Date</th>
                <th className="py-4 px-6 bg-gray-200 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {[...suggestions].reverse().map((suggestion) => (
                <tr key={suggestion._id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 text-gray-800">{suggestion.suggestedCategory}</td>
                  <td className="py-4 px-6 text-gray-800">{suggestion.suggestedBy?.userName || suggestion.suggestedBy?.email || suggestion.suggestedBy?.name || "Unknown"}</td>
                  <td className="py-4 px-6 text-gray-800">
                    {suggestion.createdAt ? format(new Date(suggestion.createdAt), "PPP p") : "N/A"}
                  </td>
                  <td className="py-4 px-6 text-center flex justify-center items-center gap-4">
                    {suggestion.status.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(suggestion._id)}
                          className="bg-green-500 text-white flex items-center gap-2 px-3 py-2 rounded-md hover:bg-green-700 transition-all duration-300"
                        >
                          <FaCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(suggestion._id)}
                          className="bg-red-500 text-white flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-700 transition-all duration-300"
                        >
                          <FaTimesCircle /> Reject
                        </button>
                      </>
                    )}
                    {suggestion.status.toLowerCase() === "approved" && (
                      <span className="text-green-600 font-semibold">Approved</span>
                    )}
                    {suggestion.status.toLowerCase() === "rejected" && (
                      <span className="text-red-600 font-semibold">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-xl text-sky-600 py-3">No category suggestions available.</p>
        )}
      </div>
    </section>
  );
};

export default AdminSugCategories;
