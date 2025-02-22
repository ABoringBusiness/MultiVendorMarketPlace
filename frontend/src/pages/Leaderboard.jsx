import Spinner from "@/custom-components/Spinner";
import { useSelector } from "react-redux";
import { FaCrown, FaMedal } from "react-icons/fa";

const Leaderboard = () => {
  const { loading, leaderboard } = useSelector((state) => state.user);
  return (
    <>
      <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col mb-12 pb-[50px] bg-gray-50">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
              <h1 className="text-[#D6482B] text-3xl font-bold min-[480px]:text-4xl md:text-5xl xl:text-6xl">
                Bidders Leaderboard
              </h1>
            </div>
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-4 px-6 text-left text-gray-600 font-medium">Rank</th>
                    <th className="py-4 px-6 text-left text-gray-600 font-medium">Profile Pic</th>
                    <th className="py-4 px-6 text-left text-gray-600 font-medium">Username</th>
                    <th className="py-4 px-6 text-left text-gray-600 font-medium">Bid Expenditure</th>
                    <th className="py-4 px-6 text-left text-gray-600 font-medium">Auctions Won</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {leaderboard.slice(0, 100).map((element, index) => {
                    const rankIcon =
                      index === 0 ? (
                        <FaCrown className="text-yellow-500" />
                      ) : index === 1 ? (
                        <FaMedal className="text-gray-400" />
                      ) : index === 2 ? (
                        <FaMedal className="text-orange-400" />
                      ) : null;
                    const rankColor =
                      index === 0
                        ? "text-green-600"
                        : index === 1
                        ? "text-blue-600"
                        : index === 2
                        ? "text-yellow-600"
                        : "text-gray-800";
                    return (
                      <tr key={element._id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className={`py-4 px-6 font-semibold ${rankColor} flex items-center gap-2`}>{rankIcon} {index + 1}</td>
                        <td className="py-4 px-6">
                          <img
                            src={element.profileImage?.url}
                            alt={element.username}
                            className="h-12 w-12 object-cover rounded-full border border-gray-300"
                          />
                        </td>
                        <td className="py-4 px-6 font-medium">{element.userName}</td>
                        <td className="py-4 px-6">Rs {element.moneySpent.toLocaleString()}</td>
                        <td className="py-4 px-6">{element.auctionsWon}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default Leaderboard;
