
import { RiAuctionFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const EndingSoonAuctions = () => {
  const { allAuctions } = useSelector((state) => state.auction);

  const now = new Date();


  const auctionsEndingSoon = allAuctions.filter((item) => {
    const auctionEndDate = new Date(item.endTime);
    const timeDifference = auctionEndDate - now;
    return timeDifference > 0 && timeDifference <= 24 * 60 * 60 * 1000;
  });

  return (
    <>
      <section className="my-12">
        <h3 className="text-[#111] text-3xl font-bold mb-8 text-left">
          Auctions Ending Soon
        </h3>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          <div className="bg-gradient-to-br from-red-600 to-red-400 p-8 rounded-2xl flex flex-col justify-between items-center text-center shadow-2xl transform transition-transform hover:scale-105">
            <span className="rounded-full bg-white text-black p-8 mb-6 text-5xl">
              <RiAuctionFill />
            </span>
            <div>
              <h3 className="text-white text-2xl font-bold mb-4">Don't Miss Out!</h3>
              <p className="text-white text-lg">These auctions are ending soon. Act fast!</p>
            </div>
          </div>
          {auctionsEndingSoon.length === 0 ? (
            <p className="text-center text-2xl text-gray-500 col-span-full">
              No auctions are ending soon.
            </p>
          ) : (
            auctionsEndingSoon.slice(0, 6).map((element) => {
              return (
                <Link
                  to={`/auction/item/${element._id}`}
                  key={element._id}
                  className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 hover:shadow-2xl transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={element.image?.url}
                      alt={element.title}
                      className="w-36 h-36 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex flex-col justify-start w-full">
                      <p className="text-lg font-bold text-[#111] mb-1 truncate">{element.title}</p>
                      <p className="text-stone-600 font-medium mb-2">Category: {element.category}</p>
                      <p className="text-stone-600 font-semibold">Current Top Bid: <span className="text-[#fd7b5f] font-bold text-lg">Rs. {element.currentBid}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-col mt-4">
                    <p className="text-stone-600 font-semibold">Ending Time:</p>
                    <p className="text-black text-md font-medium">{new Date(element.endTime).toLocaleString()}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};

export default EndingSoonAuctions;
