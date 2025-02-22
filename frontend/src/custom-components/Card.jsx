import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "@/store/slices/userSlice";
import { toast } from "react-toastify";
import { FaHeart, FaUser } from "react-icons/fa";
import PropTypes from 'prop-types';

const Card = ({ imgSrc, title, startingBid, startTime, endTime, id, bids = [] }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const startDifference = new Date(startTime) - now;
    const endDifference = new Date(endTime) - now;
    let timeLeft = {};

    if (startDifference > 0) {
      timeLeft = {
        type: "Starts In:",
        days: Math.floor(startDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((startDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((startDifference / 1000 / 60) % 60),
        seconds: Math.floor((startDifference / 1000) % 60),
      };
    } else if (endDifference > 0) {
      timeLeft = {
        type: "Ends In:",
        days: Math.floor(endDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((endDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((endDifference / 1000 / 60) % 60),
        seconds: Math.floor((endDifference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  }, [calculateTimeLeft]);

  const formatTimeLeft = ({ days, hours, minutes, seconds }) => {
    const pad = (num) => String(num).padStart(2, "0");
    return `(${days} Days) ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleAddToWishlist = () => {
    dispatch(addToWishlist(user._id, id))
      .catch(() => {
        toast.error("Failed to add to wishlist");
      });
  };

  return (
    <div className="flex-grow basis-full bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl sm:basis-56 lg:basis-60 2xl:basis-80">
      <Link to={`/auction/item/${id}`} className="block">
        <div className="relative">
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        </div>
        <div className="px-4 py-3">
          <h5 className="font-semibold text-xl text-gray-800 group-hover:text-orange-600 mb-2">
            {title}
          </h5>
          <p className="text-gray-600 font-bold">
            {timeLeft.type}
            {Object.keys(timeLeft).length > 1 ? (
              <span className="text-green-500 font-bold ml-2">
                {formatTimeLeft(timeLeft)}
              </span>
            ) : (
              <span className="text-red-500 font-bold ml-1">Time's up!</span>
            )}
          </p>
          {startingBid && (
            <p className="text-gray-600 font-bold mt-2">
              Starting Bid: <span className="text-orange-500 font-bold">Rs {startingBid}</span>
            </p>
          )}
        </div>
      </Link>
      <div className="px-4 py-3 flex space-x-4">
        <button
          onClick={handleAddToWishlist}
          className="w-50 bg-pink-500 text-white py-2 rounded-md font-bold transition duration-300 hover:bg-orange-600 flex items-center justify-center"
        >
          <FaHeart className="mx-2" />
        </button>
        <button className="w-50 bg-blue-500 text-white py-2 rounded-md font-bold transition duration-300 hover:bg-blue-600 flex items-center justify-center px-2" title="total bids on this auction"
        >
          <FaUser className="mx-1" />
          {bids.length} Bids
        </button>
      </div>
    </div>
  );
};

Card.propTypes = {
  imgSrc: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  startingBid: PropTypes.number.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  bids: PropTypes.arrayOf(PropTypes.object)
};

export default Card;
