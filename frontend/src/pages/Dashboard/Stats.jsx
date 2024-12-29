import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMonthlyRevenue,
  getAllUsers,
  clearAllSuperAdminSliceErrors,
} from "@/store/slices/superAdminSlice";
import Spinner from "@/custom-components/Spinner";
import PaymentGraph from "./sub-components/PaymentGraph";
import { FaUsers, FaGavel, FaMoneyBillWave, FaUserTie } from "react-icons/fa";

const AdminStats = () => {
  const dispatch = useDispatch();
  const {
    loading,
    monthlyRevenue,
    users,
  } = useSelector((state) => state.superAdmin);

  const { user, isAuthenticated } = useSelector((state) => state.user);

  // Calculate stats 
  const totalBiddersCount = users?.biddersArray?.reduce((sum, count) => sum + count, 0) || 0;
  const totalAuctioneersCount =
    users?.auctioneersArray?.reduce((sum, count) => sum + count, 0) || 0;
  const totalMonthlyRevenue = monthlyRevenue?.[0] || 0;

  useEffect(() => {
    dispatch(getMonthlyRevenue());
    dispatch(getAllUsers());
    dispatch(clearAllSuperAdminSliceErrors());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || user.role !== "Super Admin") {
      window.location.href = "/";
    }
  }, [isAuthenticated, user]);


  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-10 px-4 pt-[60px] w-full h-fit">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-6">
              <FaUsers className="text-[#d6482b] text-6xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
                <p className="text-2xl font-bold">
                  {totalBiddersCount + totalAuctioneersCount}
                </p>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-6">
              <FaUserTie className="text-[#d6482b] text-6xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Bidders</h2>
                <p className="text-2xl font-bold">{totalBiddersCount}</p>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-6">
              <FaGavel className="text-[#d6482b] text-6xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Auctioneers</h2>
                <p className="text-2xl font-bold">{totalAuctioneersCount}</p>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-6">
              <FaMoneyBillWave className="text-[#d6482b] text-6xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Monthly Commissions
                </h2>
                <p className="text-2xl font-bold">${totalMonthlyRevenue}</p>
              </div>
            </div>
          </div>

          {/* Graphs */}
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-[#111] text-lg font-semibold mb-4 md:text-xl lg:text-2xl">
                Monthly Total Payments Received
              </h3>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <PaymentGraph />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminStats;
