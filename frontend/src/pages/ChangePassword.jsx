import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, logout, clearUserState } from "@/store/slices/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const location = useLocation();
  const { loading, success, user } = useSelector((state) => state.user);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    dispatch(changePassword({ oldPassword, newPassword }));
  };

  useEffect(() => {
    if (success) {
      toast.success("Password changed successfully! Please login again.");
      dispatch(logout());
      dispatch(clearUserState());
      setTimeout(() => {
        navigateTo("/login");
      }, 1000);
    }
  }, [success, dispatch, navigateTo]);

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
            onClick={() => navigateTo("/change-password")}
          >
            Change Password
          </button>
          {user.role !== "Super Admin" && (
            <button
              className="text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 hover:text-[#D6482B]"
              onClick={() => navigateTo("/delete-account")}
            >
              Delete Account
            </button>
          )}
          <button
            className="text-md font-medium py-2 px-4 rounded-md text-left transition-all duration-300 text-red-500 hover:text-red-700"
            onClick={() => {
              dispatch(logout());
              navigateTo("/");
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Change Password Section */}
      <main className="flex-grow p-10">
        <div className="bg-white mx-auto w-full max-w-2xl h-auto px-6 py-8 flex flex-col gap-6 items-center justify-center rounded-md shadow-md">
          <h1 className="text-[#d6482b] text-3xl font-bold mb-4">Change Password</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-500">Old Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-500">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-500">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
              disabled={loading}
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </main>
    </section>
  );
};

export default ChangePassword;
