import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAllSuperAdminSliceErrors,
  getAllPaymentProofs,
  getAllUsers,
  getMonthlyRevenue,
  getAllReports,
} from "@/store/slices/superAdminSlice";
import AuctionItemDelete from "./sub-components/AuctionItemDelete.jsx";
import PaymentProofs from "./sub-components/PaymentProofs.jsx";
import AllUsersList from "./sub-components/AllUsersList.jsx";
import AdminSugCategories from "./AdminSugCategories.jsx";
import AdminStats from "./Stats.jsx";
import Spinner from "@/custom-components/Spinner";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.superAdmin);

  const [activeSection, setActiveSection] = useState("paymentProofs");

  useEffect(() => {
    dispatch(getMonthlyRevenue());
    dispatch(getAllUsers());
    dispatch(getAllPaymentProofs());
    dispatch(getAllReports());
    dispatch(clearAllSuperAdminSliceErrors());
  }, [dispatch]);

  const { user, isAuthenticated } = useSelector((state) => state.user);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (user.role !== "Super Admin" || !isAuthenticated) {
      navigateTo("/");
    }
  }, [isAuthenticated, user, navigateTo]);

  const handleReportsPage = () => {
    navigateTo("/all-reports");
  };

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    switch (activeSection) {
      case "stats":
        return <AdminStats />;
      case "paymentProofs":
        return <PaymentProofs />;
      case "auctionItems":
        return <AuctionItemDelete />;
      case "allUsers":
        return <AllUsersList />;
      case "categorySuggestions":
        return <AdminSugCategories />;
      default:
        return null;
    }
  };


  const isActive = (section) => activeSection === section;

  return (
    <section className="flex w-full min-h-screen mt-20">
      {/* Sidebar */}
      <aside className="w-1/5 bg-gray-100 px-8 py-12">
        <nav className="flex flex-col gap-4">
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("stats") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => setActiveSection("stats")}
          >
            Platform Stats
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("paymentProofs") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => setActiveSection("paymentProofs")}
          >
            Payment Proofs
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("auctionItems") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => setActiveSection("auctionItems")}
          >
            Manage Auctions
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("allUsers") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => setActiveSection("allUsers")}
          >
            All Users
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("/all-reports") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={handleReportsPage}
          >
            Reported Auctions
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("categorySuggestions") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => setActiveSection("categorySuggestions")}
          >
            Category Suggestions
          </button>
          
        </nav>
      </aside>

      {/* Main Section */}
      <main className="flex-grow p-10">
        <div className="w-full mx-auto">{renderContent()}</div>
      </main>
    </section>
  );
};

export default Dashboard;
