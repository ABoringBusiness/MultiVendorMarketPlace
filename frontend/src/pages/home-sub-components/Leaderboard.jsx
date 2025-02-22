
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Leaderboard = () => {
  const { leaderboard } = useSelector((state) => state.user);
  return (
    <>
      <section className="my-12 lg:px-5">
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
          <h3 className="text-[#D6482B] text-2xl font-bold min-[480px]:text-3xl md:text-4xl">
            <span className='text-black'>Top 10</span> Bidders Leaderboard
          </h3>
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
              {leaderboard.slice(0, 10).map((element, index) => {
                return (
                  <tr key={element._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6 font-semibold text-gray-800">{index + 1}</td>
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

        <Link
          to={"/leaderboard"}
          className="border-2 border-gray-300 font-bold text-lg w-full py-3 flex justify-center rounded-md mt-8 hover:border-gray-500 transition-all duration-300"
        >
          Go to Leaderboard
        </Link>
      </section>
    </>
  );
};

export default Leaderboard;
