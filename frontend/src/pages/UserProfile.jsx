import Spinner from "@/custom-components/Spinner";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { updateUserProfile, logout } from "@/store/slices/userSlice";
import { toast } from "react-toastify";
import DeleteAccountButton from "@/custom-components/DeleteAccountButton";

const UserProfile = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    userName: user?.userName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    paymentMethods: user?.paymentMethods || {
      bankTransfer: {
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: "",
      },
      easypaisa: {
        easypaisaAccountNumber: "",
      },
      paypal: {
        paypalEmail: "",
      },
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigateTo("/");
    } else if (user) {
      setFormData({
        userName: user.userName,
        phone: user.phone,
        address: user.address,
        paymentMethods: user.paymentMethods,
      });
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      paymentMethods: {
        ...prevData.paymentMethods,
        bankTransfer: {
          ...prevData.paymentMethods.bankTransfer,
          [name]: value,
        },
        easypaisa: {
          ...prevData.paymentMethods.easypaisa,
          [name]: value,
        },
        paypal: {
          ...prevData.paymentMethods.paypal,
          [name]: value,
        },
      },
    }));
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveChanges = () => {
    dispatch(updateUserProfile(formData))
      .then(() => {
        setEditMode(false);
      })
      .catch(() => {
        toast.error("Failed to update profile");
      });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      userName: user.userName,
      phone: user.phone,
      address: user.address,
      paymentMethods: user.paymentMethods,
    });
  };

  const handleChangePassword = () => {
    navigateTo("/change-password");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigateTo("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <section className="flex w-full min-h-screen my-20">
      {/* Sidebar */}
      <aside className="w-1/5 bg-gray-100 p-5 mt-10">
        <nav className="flex flex-col gap-4">
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("/me") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={() => navigateTo("/me")}
          >
            My Profile
          </button>
          <button
            className={`text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 ${
              isActive("/change-password") ? "text-[#D6482B] underline" : "hover:text-[#D6482B]"
            }`}
            onClick={handleChangePassword}
          >
            Change Password
          </button>
          {user.role !== "Super Admin" && (
            <DeleteAccountButton className="text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 hover:text-[#D6482B]" />
          )}
          <button
            className="text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 text-red-500 hover:text-red-700"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Profile Section */}
      <main className="flex-grow p-10">
        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white p-8 shadow-lg rounded-md w-full mx-auto">
            <div className="flex flex-col items-center mb-6">
              {/* User profile image */}
              <img
                src={user.profileImage?.url}
                alt="/imageHolder.jpg"
                className="w-36 h-36 rounded-full shadow-md mb-4"
              />
              <h3 className="text-3xl font-semibold text-gray-800">
                {editMode ? "Edit Profile" : "My Profile"}
              </h3>
            </div>

            {/* Personal details section */}
            <div className="mb-6 w-full">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    className={`w-full mt-1 p-3 border ${
                      editMode ? "border-blue-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="text"
                    defaultValue={user.email}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full mt-1 p-3 border ${
                      editMode ? "border-blue-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full mt-1 p-3 border ${
                      editMode ? "border-blue-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </div>

            {/* Payment details section for Auctioneer role */}
            {user.role === "Auctioneer" && (
              <div className="mb-6 w-full">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.paymentMethods.bankTransfer.bankName}
                      onChange={handlePaymentChange}
                      className={`w-full mt-1 p-3 border ${
                        editMode ? "border-blue-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Account (IBAN)
                    </label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.paymentMethods.bankTransfer.bankAccountNumber}
                      onChange={handlePaymentChange}
                      className={`w-full mt-1 p-3 border ${
                        editMode ? "border-blue-500" : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* More details section */}
            <div className="mb-6 w-full">
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">More Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.role === "Auctioneer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unpaid Commission
                    </label>
                    <input
                      type="text"
                      defaultValue={user.unpaidCommission || 0}
                      className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>
                )}
                {user.role === "Bidder" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Auctions Won
                      </label>
                      <input
                        type="text"
                        defaultValue={user.auctionsWon || 0}
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Money Spent
                      </label>
                      <input
                        type="text"
                        defaultValue={`Rs. ${user.moneySpent || 0}`}
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Buttons for saving or canceling edit */}
            <div className="flex gap-4 mt-6 justify-start w-full">
              {editMode && (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-all duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </>
              )}
              {!editMode && user.role !== "Super Admin" && (
                <button
                  onClick={handleEditClick}
                  className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-all duration-300"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default UserProfile;
