import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWishlist } from "@/store/slices/userSlice";
import WishlistCard from "@/custom-components/WishListCard";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const wishlist = user?.wishlist || [];

  useEffect(() => {
    if (!isAuthenticated || user.role !== "Bidder") {
      navigateTo("/");
    } else if (user && user._id) {
      dispatch(getWishlist(user._id));
    }
  }, [dispatch, isAuthenticated, user, navigateTo]);

  return (
    <div className="w-full px-5 pt-[120px] lg:px-[60px] flex flex-col min-h-screen py-8 bg-gray-50">
      <div className="bg-white mx-auto w-full max-w-6xl h-auto px-8 py-10 flex flex-col gap-8 items-center justify-center rounded-lg shadow-md">
        <div className="flex items-center justify-between w-full mb-8">
          <h1 className="text-[#d6482b] text-5xl font-bold">My Wishlist</h1>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full`}>
          {wishlist.length > 0 ? (
            wishlist.map((auction) => (
              <a
                key={auction._id}
                href={`/auction/item/${auction._id}`}
                className="block w-full bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300"
              >
                <WishlistCard
                  id={auction._id}
                  imgSrc={auction.image?.url}
                  title={auction.title}
                  startingBid={auction.startingBid}
                  startTime={auction.startTime}
                  endTime={auction.endTime}
                />
              </a>
            ))
          ) : (
            <h3 className="text-gray-500 text-2xl font-medium text-center w-full mt-16">
              Your wishlist is empty. Start exploring auctions to add your favorite items here!
            </h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
