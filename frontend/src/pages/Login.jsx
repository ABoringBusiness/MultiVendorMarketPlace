import { login } from "@/store/slices/userSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [password, setPassword] = useState(localStorage.getItem("password") || "");
  const [rememberMe, setRememberMe] = useState(false);

  const { loading, isAuthenticated } = useSelector((state) => state.user);

  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem("email", email);
      localStorage.setItem("password", password);
    } else {
      localStorage.removeItem("email");
      localStorage.removeItem("password");
    }
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    dispatch(login(formData));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo("/");
    }
  }, [isAuthenticated, navigateTo]);

  return (
    <>
      <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8 justify-center">
        <div className="bg-white mx-auto w-full max-w-lg h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
          <h1 className="text-[#d6482b] text-4xl font-bold mb-4">Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-[16px] text-stone-500">Remember me</label>
              </div>
              <Link to="/forgot-password" className="text-[#d6482b] text-[14px] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <button
              className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging In..." : "Login"}
            </button>
          </form>
          <p className="text-stone-500 text-[16px] mt-4">
            Don&apos;t have an account? <Link to="/sign-up" className="text-[#d6482b] font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </section>
    </>
  );
};

export default Login;
