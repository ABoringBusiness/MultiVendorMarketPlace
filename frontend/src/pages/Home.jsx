import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import FeaturedAuctions from "./home-sub-components/FeaturedAuctions";
import UpcomingAuctions from "./home-sub-components/UpcomingAuctions";
import EndingSoonAuctions from "./home-sub-components/EndingSoonAuctions";
import Leaderboard from "./home-sub-components/Leaderboard";

const Home = () => {
  const howItWorks = [
    { title: "Post Items", description: "Auctioneer posts items for bidding." },
    { title: "Place Bids", description: "Bidders place bids on listed items." },
    {
      title: "Win Notification",
      description: "Highest bidder receives a winning email.",
    },
    {
      title: "Payment & Fees",
      description: "Bidder pays; auctioneer pays 1% fee.",
    },
  ];

  const { isAuthenticated } = useSelector((state) => state.user);
  return (
    <>
      <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-4 justify-center bg-[url('/path/to/your/background-image.jpg')] bg-cover bg-center">
        <div>
          <p className="text-[#DECCBE] font-bold text-xl mb-8">
            Transparency Leads to Your Victory
          </p>
          <h1
            className={`text-[#111] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
          >
            Transparent Auctions
          </h1>
          <h1
            className={`text-[#d6482b] text-2xl font-bold mb-4 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
          >
            Be The Winner
          </h1>
          <div className="flex gap-4 my-8">
            {!isAuthenticated && (
              <>
                <Link
                  to="/sign-up"
                  className="bg-[#d6482b] font-semibold hover:bg-[#b8381e] rounded-md px-8 flex items-center py-2 text-white  transition-all duration-300"
                >
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  className="text-[#d6482b] bg-transparent border-2 border-[#d6482b] hover:bg-[#d6482b] hover:text-white font-bold text-xl rounded-md px-8 flex items-center py-2 transition-all duration-300"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">How it works</h3>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap w-full">
            {howItWorks.map((element) => {
              return (
                <div
                  key={element.title}
                  className="bg-white flex flex-col gap-2 p-2 rounded-md h-[96px] justify-center md:w-[48%] lg:w-[47%] 2xl:w-[24%] hover:shadow-md transition-all duration-300"
                >
                  <h5 className="font-bold">{element.title}</h5>
                  <p>{element.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        <FeaturedAuctions />
        <UpcomingAuctions />
        <EndingSoonAuctions />
        <Leaderboard />
      </section>
    </>
  );
};

export default Home;
