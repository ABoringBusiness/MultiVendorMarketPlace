import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { deleteAuction, republishAuction } from "@/store/slices/auctionSlice";
import PropTypes from 'prop-types';

const CardTwo = ({ imgSrc, title, startingBid, startTime, endTime, id }) => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const dispatch = useDispatch();
  const handleDeleteAuction = () => {
    dispatch(deleteAuction(id));
    setShowDeleteModal(false); // Close modal after deletion
  };

  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
      <div className="bg-gray-100 rounded-lg shadow-lg flex flex-row overflow-hidden w-full max-w-full border border-gray-200">
        {/* Image Section */}
        <img
          src={imgSrc}
          alt={title}
          className="w-32 h-32 object-cover flex-shrink-0 p-4"
        />
        {/* Details Section */}
        <div className="flex flex-col justify-between p-4 flex-grow">
          <div>
            <h5 className="font-semibold text-xl text-gray-900 mb-2">{title}</h5>
            {startingBid && (
              <p className="text-gray-700 font-medium text-md mb-1">
                Starting Bid: <span className="text-red-500">Rs {startingBid}</span>
              </p>
            )}
            <p className="text-gray-600 font-light text-md mb-2">
              {timeLeft.type}
              {Object.keys(timeLeft).length > 1 ? (
                <span className="text-red-500 font-bold ml-1">
                  {formatTimeLeft(timeLeft)}
                </span>
              ) : (
                <span className="text-red-500 font-bold ml-1">Time's up!</span>
              )}
            </p>
          </div>
        </div>
        {/* Buttons Section */}
        <div className="flex flex-row justify-center items-center gap-3 p-4">
          <Link
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md text-center transition-all duration-300"
            to={`/auction/details/${id}`}
          >
            View Auction
          </Link>
          <button
            className="bg-green-500 text-white text-sm px-4 py-2 rounded-md transition-all duration-300 disabled:bg-gray-400"
            disabled={new Date(endTime) > Date.now()}
            onClick={() => setOpenDrawer(true)}
          >
            Republish Auction
          </button>
          <button
            className="bg-red-500 text-white text-sm px-4 py-2 rounded-md transition-all duration-300"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Auction
          </button>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this auction?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-400"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md transition-all duration-200 hover:bg-red-700"
                onClick={handleDeleteAuction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <Drawer id={id} openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
    </>
  );
};

CardTwo.propTypes = {
  imgSrc: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  startingBid: PropTypes.number.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};

export default CardTwo;

const Drawer = ({ setOpenDrawer, openDrawer, id }) => {
  const dispatch = useDispatch();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { loading } = useSelector((state) => state.auction);
  const handleRepublishAuction = () => {
    const formData = new FormData();
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    dispatch(republishAuction(id, formData));
  };

  return (
    <section
      className={`fixed ${
        openDrawer && id ? "bottom-0" : "-bottom-full"
      } left-0 w-full transition-all duration-300 h-full bg-black bg-opacity-75 flex items-end`}
    >
      <div className="bg-white w-full sm:max-w-lg mx-auto p-8 rounded-t-2xl shadow-xl">
        <h3 className="text-red-500 text-3xl font-semibold text-center mb-4">
          Republish Auction
        </h3>
        <p className="text-gray-600 mb-6 text-center">
          Set new starting and ending time for your auction.
        </p>
        <form className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-lg text-gray-700">Republish Auction Start Time</label>
            <DatePicker
              selected={startTime}
              onChange={(date) => setStartTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="text-lg py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-lg text-gray-700">Republish Auction End Time</label>
            <DatePicker
              selected={endTime}
              onChange={(date) => setEndTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="text-lg py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            className="bg-blue-600 w-full py-3 rounded-md text-white font-semibold text-xl transition-all duration-300"
            onClick={handleRepublishAuction}
          >
            {loading ? "Republishing..." : "Republish"}
          </button>
          <button
            type="button"
            className="bg-yellow-500 w-full py-3 rounded-md text-white font-semibold text-xl transition-all duration-300"
            onClick={() => setOpenDrawer(false)}
          >
            Cancel
          </button>
        </form>
      </div>
    </section>
  );
};
