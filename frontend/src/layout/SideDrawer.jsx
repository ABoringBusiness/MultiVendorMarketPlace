import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/userSlice";
import { Link, useLocation } from "react-router-dom";

const SideDrawer = () => {
  const [show, setShow] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();

  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Hamburger Menu Icon for Mobile View */}
      <div
        onClick={() => setShow(!show)}
        className="fixed right-5 top-5 bg-[#D6482B] text-white text-3xl p-3 rounded-md hover:bg-[#b8381e] lg:hidden z-50 cursor-pointer"
      >
        {show ? "✖" : "☰"}
      </div>

      <header
        className={`w-full bg-white h-[100px] fixed top-0 left-0 z-40 flex items-center justify-between px-8 lg:px-12 transition-transform duration-300 ${
          scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Logo */}
        <Link to={"/"} className="text-2xl font-semibold">
          Nelami<span className="text-[#D6482b]">Ghar</span>
        </Link>

        {/* Navigation Links */}
        <nav
          className={`${
            show ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row lg:gap-6 absolute lg:static top-[100px] right-0 w-full lg:w-auto bg-white lg:bg-transparent lg:h-auto transition-all duration-300 p-4 lg:p-0 lg:ml-auto`}
        >
          <ul className="flex flex-col lg:flex-row lg:gap-6 mb-4 lg:mb-0">
            {/* Public Links */}
            <li className="mb-4 lg:mb-0">
              <Link
                to={"/"}
                className={`text-md font-medium hover:text-[#D6482b] ${
                  isActive("/") ? "text-[#D6482b] underline" : ""
                }`}
              >
                Home
              </Link>
            </li>
            <li className="mb-4 lg:mb-0">
              <Link
                to={"/auctions"}
                className={`text-md font-medium hover:text-[#D6482b] ${
                  isActive("/auctions") ? "text-[#D6482b] underline" : ""
                }`}
              >
                Auctions
              </Link>
            </li>
            <li className="mb-4 lg:mb-0">
              <Link
                to={"/leaderboard"}
                className={`text-md font-medium hover:text-[#D6482b] ${
                  isActive("/leaderboard") ? "text-[#D6482b] underline" : ""
                }`}
              >
                Leaderboard
              </Link>
            </li>
            {isAuthenticated && user && user.role === "Auctioneer" && (
              <>
                <li className="mb-4 lg:mb-0">
                  <Link
                    to={"/submit-commission"}
                    className={`text-md font-medium hover:text-[#D6482b] ${
                      isActive("/submit-commission")
                        ? "text-[#D6482b] underline"
                        : ""
                    }`}
                  >
                    Submit Commission
                  </Link>
                </li>
                <li className="mb-4 lg:mb-0">
                  <Link
                    to={"/view-my-auctions"}
                    className={`text-md font-medium hover:text-[#D6482b] ${
                      isActive("/view-my-auctions")
                        ? "text-[#D6482b] underline"
                        : ""
                    }`}
                  >
                    Manage Auctions
                  </Link>
                </li>
              </>
            )}
            {isAuthenticated && user && user.role === "Super Admin" && (
              <>
                <li className="mb-4 lg:mb-0">
                  <Link
                    to={"/dashboard"}
                    className={`text-md font-medium mr-4 hover:text-[#D6482b] ${
                      isActive("/dashboard")
                        ? "text-[#D6482b] underline"
                        : ""
                    }`}
                  >
                   Admin Dashboard
                  </Link>
                </li>
              </>
            )}
            {isAuthenticated && user.role === "Bidder" && (
              <li className="mb-4 lg:mb-0">
                <Link
                  to={"/wishlist"}
                  className={`text-md mr-3 font-medium hover:text-[#D6482b] ${
                    isActive("/wishlist") ? "text-[#D6482b] underline" : ""
                  }`}
                >
                  Wishlist
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Profile Icon and Special Actions */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            {user?.role === "Auctioneer" && (
              <Link
                to={"/create-auction"}
                className={`ml-4 bg-[#D6482B] text-white px-4 py-2 rounded-md font-medium hover:bg-[#b8381e] ${
                  isActive("/create-auction") ? "bg-[#b8381e]" : ""
                }`}
              >
                Create Auction
              </Link>
            )}
            <Link
              to={"/me"}
              className="w-[40px] h-[40px] bg-[#D6482B] text-white flex items-center justify-center rounded-full hover:bg-[#b8381e]"
            >
              <span className="text-xl">👤</span>
            </Link>
          </div>
        )}

        {/* Authentication Links */}
        <nav className="flex items-center gap-4 ml-4">
          {!isAuthenticated ? (
            <>
              <Link
                to={"/login"}
                className={`text-md font-medium text-[#D6482B] hover:underline ${
                  isActive("/login") ? "text-[#b8381e]" : ""
                }`}
              >
                🔑 Login
              </Link>
              <Link
                to={"/sign-up"}
                className={`text-md font-medium text-[#D6482B] hover:underline ${
                  isActive("/sign-up") ? "text-[#b8381e]" : ""
                }`}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link
              onClick={handleLogout}
              className="text-md font-medium text-[#D6482B] hover:underline cursor-pointer"
            >
              🚪 Logout
            </Link>
          )}
        </nav>
      </header>
    </>
  );
};

export default SideDrawer;
