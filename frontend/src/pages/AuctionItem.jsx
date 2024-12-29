import Spinner from "@/custom-components/Spinner";
import { getAuctionDetail } from "@/store/slices/auctionSlice";
import { placeBid } from "@/store/slices/bidSlice";
import { addToWishlist } from "@/store/slices/userSlice";
import React, { useEffect, useState } from "react";
import { FaGreaterThan } from "react-icons/fa";
import { RiAuctionFill, RiHeartLine, RiHeartFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import Countdown from "react-countdown";
import ReportAuctionButton from "@/custom-components/ReportAuctionButton";
import { toast } from "react-toastify";

const AuctionItem = () => {
  const { id } = useParams();
  const { loading, auctionDetail, auctionBidders } = useSelector((state) => state.auction);
  const { user } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();
  const [amount, setAmount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false); 

  const handleBid = () => {
    const formData = new FormData();
    formData.append("amount", amount);
    dispatch(placeBid(id, formData));
    dispatch(getAuctionDetail(id));
  };

  const handleWishlist = () => {
    if (user && user.role === "Bidder") {
      dispatch(addToWishlist(user._id, id))
        .then(() => {
          setIsWishlisted(true);
        })
        .catch(() => {
          toast.error("Failed to add to wishlist");
        });
    } else {
      toast.error("Please log in as a Bidder to add items to your wishlist");
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(getAuctionDetail(id));
    }
  }, [id, dispatch]);

  const renderTimeLeft = () => {
    const currentTime = Date.now();
    const startTime = new Date(auctionDetail.startTime).getTime();
    const endTime = new Date(auctionDetail.endTime).getTime();

    if (currentTime < startTime) {
      return <span className="text-yellow-600">Auction has not started yet</span>;
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return (
        <span className="text-green-600">
          <Countdown date={endTime} />
        </span>
      );
    } else {
      return <span className="text-red-600">Times Up</span>;
    }
  };

  return (
    <section className="w-full px-5 pt-40 lg:px-[50px] flex flex-col mb-20 min-h-screen bg-gray-50">
      <div className="text-[16px] flex gap-2 items-center mb-6">
        <Link
          to="/"
          className="font-semibold text-[#D6482B] transition-all duration-300 hover:bg-[#D6482B] hover:text-white px-3 py-1 rounded-md"
        >
          Home
        </Link>
        <FaGreaterThan className="text-stone-400" />
        <Link
          to="/auctions"
          className="font-semibold text-[#D6482B] transition-all duration-300 hover:bg-[#D6482B] hover:text-white px-3 py-1 rounded-md"
        >
          Auctions
        </Link>
        <FaGreaterThan className="text-stone-400" />
        <p className="text-stone-600">{auctionDetail.title}</p>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Section: Image and Description */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <div className="w-full p-5 shadow-lg rounded-md bg-white">
                <img
                  src={auctionDetail.image?.url}
                  alt={auctionDetail.title}
                  className="object-contain max-h-[500px] w-full rounded-md"
                />
              </div>
              <div className="bg-white p-6 shadow-lg rounded-md">
                <h3 className="text-[#111] text-3xl font-semibold mb-4">
                  {auctionDetail.title}
                </h3>
                <p className="text-lg font-bold mb-4">Auction Item Description</p>
                <hr className="my-2 border-t-[1px] border-t-stone-700" />
                {auctionDetail.description &&
                  auctionDetail.description.split(". ").map((element, index) => (
                    <li key={index} className="text-[16px] my-2 list-disc list-inside">
                      {element}
                    </li>
                  ))}
              </div>
            </div>

            {/* Right Section: Auction Details and Bidding */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              <div className="bg-white p-6 shadow-lg rounded-md">
                <h3 className="text-[#111] text-3xl font-semibold mb-4">{auctionDetail.title}</h3>
                <p className="text-xl font-semibold mb-4">
                  Condition: <span className="text-[#D6482B]">{auctionDetail.condition}</span>
                </p>
                <p className="text-xl font-semibold mb-4">
                  Minimum Bid: <span className="text-[#D6482B]">Rs. {auctionDetail.startingBid}</span>
                </p>
                <div className="bg-stone-200 py-4 text-[20px] font-semibold text-center rounded-md mb-4">
                  Time Left: {renderTimeLeft()}
                </div>
                {user?.role === "Bidder" && (
                  <button
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-md font-semibold transition-all duration-300 ${
                      isWishlisted ? "bg-red-500 text-white" : "bg-gray-300 text-black"
                    }`}
                    onClick={handleWishlist}
                  >
                    {isWishlisted ? <RiHeartFill /> : <RiHeartLine />}
                    {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  </button>
                )}
              </div>
              <div className="bg-[#D6482B] p-6 shadow-lg rounded-md">
                {Date.now() >= new Date(auctionDetail.startTime) &&
                Date.now() <= new Date(auctionDetail.endTime) ? (
                  <>
                    <div className="flex gap-3 items-center mb-4">
                      <p className="text-lg font-semibold text-white">Place Your Bid:</p>
                      <input
                        type="number"
                        className="w-36 focus:outline-none text-lg p-2 border border-gray-300 rounded-md"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <button
                        className="ml-4 p-4 text-white bg-black rounded-full transition-all duration-300 hover:bg-[#222]"
                        onClick={handleBid}
                      >
                        <RiAuctionFill />
                      </button>
                    </div>
                  </>
                ) : new Date(auctionDetail.startTime) > Date.now() ? (
                  <p className="text-center text-white font-semibold">
                    Auction has not started yet!
                  </p>
                ) : (
                  <p className="text-center text-gray-200 font-semibold">
                    Auction has ended!
                  </p>
                )}
              </div>
              <div className="bg-white p-6 shadow-lg rounded-md">
                <header className="bg-stone-200 py-4 text-[20px] font-semibold px-4 rounded-md mb-4">
                  Bids
                </header>
                {auctionBidders && Date.now() > new Date(auctionDetail.startTime) ? (
                  auctionBidders.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto pl-4">
                      {auctionBidders.map((element, index) => (
                        <div
                          key={index}
                          className="py-4 flex items-center justify-between border-b border-gray-200"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={element.profileImage}
                              alt={element.userName}
                              className="w-12 h-12 rounded-full my-2"
                            />
                            <p className="text-[16px] font-semibold">{element.userName}</p>
                            <p className="text-[16px] font-semibold ml-8">Rs. {element.amount}</p>
                          </div>
                          <p
                            className={`text-[18px] font-semibold ${
                              index === 0
                                ? "text-green-600"
                                : index === 1
                                ? "text-blue-600"
                                : index === 2
                                ? "text-brown-600"
                                : "text-black"
                            }`}
                          >
                            {index + 1}
                            {index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No bids for this auction</p>
                  )
                ) : (
                  <img
                    src={
                      Date.now() < new Date(auctionDetail.startTime)
                        ? "/notStarted.png"
                        : "/auctionEnded.png"
                    }
                    alt="Auction Status"
                    className="w-full max-h-[400px] rounded-md"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Seller Information Section */}
          <div className="bg-white p-6 shadow-lg rounded-md flex flex-col lg:flex-row justify-between items-center mt-10 gap-8">
            <div className="flex items-center gap-6">
              <img
                src={auctionDetail.createdBy?.profileImage?.url || "https://via.placeholder.com/150"}
                alt={auctionDetail.createdBy?.userName}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <p className="text-lg font-semibold mb-2">
                  Seller Name:{" "}
                  <span className="text-[#D6482B]">{auctionDetail.createdBy?.userName}</span>
                </p>
                <p className="text-lg font-semibold">
                  Address: <span className="text-[#D6482B]">{auctionDetail.createdBy?.address}</span>
                </p>
              </div>
            </div>
            <button
              className="px-6 py-2 bg-[#D6482B] text-white font-semibold rounded-md transition-all duration-300 hover:bg-[#b03622]"
              onClick={() => navigateTo(`/seller/${auctionDetail.createdBy._id}`)}
            >
              View Seller Profile
            </button>
          </div>

          {/* Report Auction Button */}
          <div className="mt-8">
            <ReportAuctionButton auctionId={id} />
          </div>
        </>
      )}
    </section>
  );
};

export default AuctionItem;
