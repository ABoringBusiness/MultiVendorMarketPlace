import CardTwo from "@/custom-components/CardTwo";
import Spinner from "@/custom-components/Spinner";
import { getMyAuctionItems, deleteAuction } from "@/store/slices/auctionSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

const ViewMyAuctions = () => {
  const { myAuctions, loading } = useSelector((state) => state.auction);
  const { user, isAuthenticated } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user.role !== "Auctioneer") {
      navigateTo("/");
    }
    dispatch(getMyAuctionItems());
  }, [dispatch, isAuthenticated, user.role, navigateTo]);

  const handleDeleteAuction = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this auction?"
    );
    if (confirmDelete) {
      dispatch(deleteAuction(id));
    }
  };

  return (
    <section className="w-full px-5 pt-[150px] lg:px-[40px] flex flex-col min-h-screen pb-[50px] bg-gray-50">
      <div className="bg-white mx-auto w-full max-w-6xl h-auto px-8 py-10 flex flex-col gap-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[#D6482B] text-3xl font-bold min-[480px]:text-4xl md:text-5xl xl:text-6xl">
            Manage My Auctions
          </h1>
          <Link
            to="/create-auction"
            className="bg-[#D6482B] text-white text-xl rounded-full p-3 shadow-md transition-all duration-300 hover:bg-[#b8381e]"
          >
            + Create Auction
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-10">
            {myAuctions.length > 0 ? (
              myAuctions.map((element) => {
                return (
                  <div key={element._id} className="w-full">
                    <CardTwo
                      title={element.title}
                      startingBid={element.startingBid}
                      endTime={element.endTime}
                      startTime={element.startTime}
                      imgSrc={element.image?.url}
                      id={element._id}
                      handleDelete={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this auction?"
                          )
                        ) {
                          handleDeleteAuction(element._id);
                        }
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center mt-20 py-40">
              <h3 className="text-[#666] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl mt-5">
                You have not posted any auctions yet.
              </h3>
            </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ViewMyAuctions;
