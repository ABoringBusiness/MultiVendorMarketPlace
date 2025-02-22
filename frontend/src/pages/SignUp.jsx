import { register } from "@/store/slices/userSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SignUp = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [easypaisaAccountNumber, setEasypaisaAccountNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const { loading, isAuthenticated } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const formData = new FormData();
    formData.append("userName", userName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("address", address);
    formData.append("role", role);
    formData.append("profileImage", profileImage);
    role === "Auctioneer" &&
      (formData.append("bankAccountName", bankAccountName),
      formData.append("bankAccountNumber", bankAccountNumber),
      formData.append("bankName", bankName),
      formData.append("easypaisaAccountNumber", easypaisaAccountNumber),
      formData.append("paypalEmail", paypalEmail));
    dispatch(register(formData));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo("/");
    }
  }, [dispatch, loading, isAuthenticated]);

  const imageHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setProfileImagePreview(reader.result);
      setProfileImage(file);
    };
  };

  return (
    <>
      <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8 justify-center">
        <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-2">Create An Account</h1>          
        <p className="text-[16px] text-stone-600">Already have an account? <a href="/login" className="text-[#d6482b] underline">Login here</a></p>
          <form className="flex flex-col gap-6 w-full" onSubmit={handleRegister}>
            <p className="font-semibold text-2xl">Personal Details</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Phone</label>
                <input
                  type="number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                />
              </div>
              <div className="flex flex-col gap-1 w-[calc(50%-12px)]">
                <label className="text-[16px] text-stone-600">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
                >
                  <option value="">Select Role</option>
                  <option value="Auctioneer">Auctioneer</option>
                  <option value="Bidder">Bidder</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[16px] text-stone-600">Profile Image</label>
                <div className="flex items-center gap-4">
                  <img
                    src={profileImagePreview ? profileImagePreview : "/imageHolder.jpg"}
                    alt="profileImagePreview"
                    className="w-16 h-16 rounded-full"
                  />
                  <input
                    type="file"
                    onChange={imageHandler}
                    className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>
            </div>
            {role === "Auctioneer" && (
              <div className="flex flex-col gap-6">
                <label className="font-semibold text-2xl">Payment Method Details</label>
                <div className="flex flex-col gap-1">
                  <label className="text-[16px] text-stone-500">Bank Details</label>
                  <div className="flex flex-wrap gap-4">
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-[calc(50%-12px)]"
                    >
                      <option value="">Select Your Bank</option>
                      <option value="Meezan Bank">Meezan Bank</option>
                      <option value="UBL">UBL</option>
                      <option value="HBL">HBL</option>
                      <option value="Allied Bank">Allied Bank</option>
                    </select>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      placeholder="IBAN / IFSC"
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-[calc(50%-12px)]"
                    />
                    <input
                      type="text"
                      value={bankAccountName}
                      placeholder="Bank Account UserName"
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-[calc(50%-12px)]"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[16px] text-stone-600 font-semibold">Easypaisa And Paypal Details</label>
                  <div className="flex flex-wrap gap-4">
                    <input
                      type="number"
                      value={easypaisaAccountNumber}
                      placeholder="Easypaisa Account Number"
                      onChange={(e) => setEasypaisaAccountNumber(e.target.value)}
                      className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-[calc(50%-12px)]"
                    />
                    <input
                      type="email"
                      value={paypalEmail}
                      placeholder="Paypal Email"
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-[calc(50%-12px)]"
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
              type="submit"
              disabled={loading}
            >
              {loading && "Registering..."}
              {!loading && "Register"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default SignUp;
