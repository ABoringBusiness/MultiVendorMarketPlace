import { deleteAuctionItem } from "@/store/slices/superAdminSlice";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaEye, FaTrashAlt } from "react-icons/fa";

const AuctionItemDelete = () => {
  const { allAuctions } = useSelector((state) => state.auction);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);

  const handleAuctionDelete = (id) => {
    setSelectedAuctionId(id);
    setModalVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteAuctionItem(selectedAuctionId));
    setModalVisible(false);
    setSelectedAuctionId(null);
  };

  const cancelDelete = () => {
    setModalVisible(false);
    setSelectedAuctionId(null);
  };

  return (
    <section className="w-full p-8 bg-gray-50 min-h-screen flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Manage Auctions</h1>
        </div>
        {allAuctions.length > 0 ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Image</th>
                <th className="py-4 px-6 bg-gray-200 text-left text-sm font-bold text-gray-700">Title</th>
                <th className="py-4 px-6 bg-gray-200 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {allAuctions.map((element) => (
                <tr key={element._id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <img
                      src={element.image?.url}
                      alt={element.title}
                      className="h-12 w-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-4 px-6">{element.title}</td>
                  <td className="py-4 px-6 text-center flex justify-center items-center gap-4">
                    <Link
                      to={`/auction/details/${element._id}`}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-300"
                      title="View Auction"
                    >
                      <FaEye />
                    </Link>
                    <button
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-300"
                      onClick={() => handleAuctionDelete(element._id)}
                      title="Delete Auction"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-xl text-sky-600 py-3">No Auctions found.</p>
        )}
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this auction?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuctionItemDelete;
