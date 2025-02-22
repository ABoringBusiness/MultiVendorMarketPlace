import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllReports } from "@/store/slices/superAdminSlice";
import { updateReportStatus } from "@/store/slices/reportAuctionSlice";
import Spinner from "@/custom-components/Spinner";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaTrashAlt, FaTimes, FaArrowLeft } from "react-icons/fa";

const AdminReportsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, reports } = useSelector((state) => state.superAdmin);

  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    dispatch(getAllReports());
  }, [dispatch]);

  const handleConfirmDelete = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleDeleteAuction = async () => {
    if (selectedReport) {
      try {
        await dispatch(updateReportStatus(selectedReport._id, "Resolved"));
        toast.success("Report resolved, auction marked as deleted.");
        dispatch(getAllReports());
      } catch {
        toast.error("Failed to resolve report.");
      } finally {
        setShowModal(false);
        setSelectedReport(null);
      }
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await dispatch(updateReportStatus(reportId, "Reviewed"));
      toast.info("Report dismissed successfully.");
      dispatch(getAllReports());
    } catch {
      toast.error("Failed to dismiss report.");
    }
  };

  const pendingReports = reports.filter((report) => report.status === "Pending");

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <div className="w-full px-5 pt-[120px] pb-[50px] flex flex-col gap-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-lg "
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1 className="text-[#d6482b] text-4xl font-bold ">Reported Auctions</h1>
          <div className="flex flex-col gap-6">
            {pendingReports.length === 0 ? (
              <div className="text-center mt-10 py-40">
                <p className="text-lg text-gray-600">No pending reports available.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {[...pendingReports].reverse().map((report) => (
                  <div
                    key={report._id}
                    className="border border-gray-300 bg-white shadow-md rounded-lg p-5"
                  >
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {report.auctionId?.title || "Unknown"}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Reported by:{" "}
                          {report.reportedBy?.userName || report.reportedBy?.email || "Unknown"}{" "}
                          | {report.createdAt ? format(new Date(report.createdAt), "PPP p") : "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDismissReport(report._id)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all duration-300"
                          title="Dismiss Report"
                        >
                          <FaTimes />
                        </button>
                        <Link
                          to={`/auction/details/${report.auctionId?._id}`}
                          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-all duration-300"
                          title="View Auction"
                        >
                          <FaEye />
                        </Link>
                        <button
                          onClick={() => handleConfirmDelete(report)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300"
                          title="Delete Auction"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Description:</strong>{" "}
                        {report.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want delete the auction titled{" "}
              <strong>{selectedReport?.auctionId?.title || "Unknown"}</strong>?
            </p>
            <div className="flex justify-around">
              <button
                onClick={handleDeleteAuction}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminReportsPage;
