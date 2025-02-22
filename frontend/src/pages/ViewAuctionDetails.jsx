import Spinner from "@/custom-components/Spinner";
import { getAuctionDetail } from "@/store/slices/auctionSlice";
import { useEffect } from "react";
import { FaGreaterThan } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import Countdown from "react-countdown";

const ViewAuctionDetails = () => {
  const { id } = useParams();
  const { loading, auctionDetail, auctionBidders } = useSelector(
    (state) => state.auction
  );
  const { isAuthenticated, user } = useSelector((state) => state.user);

  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated || user.role === "Bidder") {
      navigateTo("/");
    }
    if (id) {
      dispatch(getAuctionDetail(id));
    }
  }, [isAuthenticated, user, id, dispatch, navigateTo]);

  return (
    <section className="w-full px-5 pt-[150px] lg:px-[40px] flex flex-col min-h-screen py-8 bg-gray-50">
      <div className="bg-white mx-auto w-full max-w-6xl h-auto px-8 py-10 flex flex-col gap-8 rounded-lg shadow-lg">
        <div className="text-lg flex flex-wrap gap-3 items-center mb-6">
          <Link
            to="/"
            className="font-semibold transition-all duration-300 hover:text-[#D6482B] text-base"
          >
            Home
          </Link>
          <FaGreaterThan className="text-stone-400" />
          <Link
            to={"/view-my-auctions"}
            className="font-semibold transition-all duration-300 hover:text-[#D6482B] text-base"
          >
            My Auctions
          </Link>
          <FaGreaterThan className="text-stone-400" />
          <p className="text-stone-600 text-base font-medium">
            {auctionDetail.title}
          </p>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Auction Image Section */}
            <div className="flex-1">
              <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                <div className="w-full h-[400px] flex justify-center items-center bg-gray-200 rounded-md overflow-hidden">
                  <img
                    src={auctionDetail.image?.url}
                    alt={auctionDetail.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            {/* Auction Details Section */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-[#111] text-3xl font-bold mb-4">
                  {auctionDetail.title}
                </h3>
                <div className="text-lg font-medium mb-4">
                  <p className="mb-2">
                    Condition: <span className="text-[#D6482B] font-semibold">{auctionDetail.condition}</span>
                  </p>
                  <p className="mb-2">
                    Starting Bid: <span className="text-[#D6482B] font-semibold">Rs.{auctionDetail.startingBid}</span>
                  </p>
                  <p className="mb-2">
                    Time Remaining: <span className="text-green-600 text-xl"><Countdown date={new Date(auctionDetail.endTime).getTime()} /></span>
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-4">Auction Item Description</h3>
                <hr className="my-4 border-t-[1px] border-stone-300" />
                <p className="text-lg text-stone-700">
                  {auctionDetail.description}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Bids Section */}
        <div className="bg-white px-6 py-8 rounded-lg shadow-md mt-10">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">Bidding History</h2>
          <div className="min-h-[200px]">
            {auctionBidders && auctionBidders.length > 0 && new Date(auctionDetail.startTime) < Date.now() && new Date(auctionDetail.endTime) > Date.now() ? (
              <div className="w-full grid grid-cols-4 gap-4 pb-4 border-b border-stone-200 mb-4">
                <p className="text-lg font-semibold text-gray-600">Profile Picture</p>
                <p className="text-lg font-semibold text-center text-gray-600">Name</p>
                <p className="text-lg font-semibold text-center text-gray-600">Bid Amount</p>
                <p className="text-lg font-semibold text-end text-gray-600">Position</p>
              </div>
              ) : null}
              {auctionBidders && auctionBidders.length > 0 && new Date(auctionDetail.startTime) < Date.now() && new Date(auctionDetail.endTime) > Date.now() ? (
              auctionBidders.map((element, index) => (
                <div
                  key={index}
                  className="py-4 grid grid-cols-4 gap-4 items-center border-b border-stone-200 last:border-none"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={element.profileImage || "/default-avatar.png"}
                      alt={element.userName}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <p className="text-lg font-semibold text-center">{element.userName}</p>
                  <p className="text-lg font-medium text-center">Rs.{element.amount}</p>
                  <p className={`text-lg font-semibold text-end ${index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : index === 2 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`}
                  </p>
                </div>
              ))
            ) : Date.now() < new Date(auctionDetail.startTime) ? (
              <div className="flex justify-center items-center h-full">
                <img
                  src="/notStarted.png"
                  alt="not-started"
                  className="w-full max-h-[350px] object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <img
                  src="/auctionEnded.png"
                  alt="ended"
                  className="w-full max-h-[350px] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ViewAuctionDetails;
