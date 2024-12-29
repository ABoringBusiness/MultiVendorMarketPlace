import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "@/store/slices/userSlice";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

const WishlistCard = ({ imgSrc, title, startingBid, endTime, id }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const handleRemoveClick = async (e) => {
    e.preventDefault(); 

    try {
      if (user && user._id) {
        await dispatch(removeFromWishlist(user._id, id)).then(() => {
        }).catch((error) => {
          console.error("Error removing from wishlist: ", error);
          toast.error("An error occurred while removing the item from the wishlist. Please try again later.");
        });
      } else {
        toast.error("User not found. Please log in.");
      }
      
      
    } catch (error) {
      console.error("Error removing from wishlist: ", error);
      toast.error("An error occurred while removing the item from the wishlist. Please try again later.");
    }
  };

  return (
    <div className="flex-grow basis-full bg-white rounded-lg shadow-lg overflow-hidden sm:basis-56 lg:basis-60 2xl:basis-80 relative">
      <button
        onClick={handleRemoveClick}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition-colors duration-300 z-10"
      >
        <FaTimes size={24} className={"text-black-500"} />
      </button>
      <div>
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="px-4 py-3">
          <h5 className="font-semibold text-xl text-gray-800 group-hover:text-orange-600 mb-2">
            {title}
          </h5>
          <p className="text-gray-600 font-bold">
            Ends In:
            <span className="text-green-500 font-bold ml-2">
              {new Date(endTime).toLocaleString()}
            </span>
          </p>
          {startingBid && (
            <p className="text-gray-600 font-bold mt-2">
              Starting Bid: <span className="text-orange-500 font-bold">Rs {startingBid}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
