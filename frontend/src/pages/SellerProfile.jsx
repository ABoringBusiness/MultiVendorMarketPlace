import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerProfile } from '../store/slices/userSlice';
import { toast } from 'react-toastify';

function SellerProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { sellerProfile: seller, loading } = useSelector((state) => state.user);

  useEffect(() => {
    if (id) {
      dispatch(fetchSellerProfile(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!seller) {
    return <p className="text-center text-lg text-red-600">Error loading seller profile.</p>;
  }

  return (
    <section className="w-full px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8">
      <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        {/* Seller profile image */}
        <img
          src={seller.seller.profileImage?.url || "https://via.placeholder.com/150"}
          alt={seller.seller.userName}
          className="w-36 h-36 rounded-full shadow-md mb-4"
        />

        {/* Personal details section */}
        <div className="w-full">
          <h3 className="text-3xl font-semibold mb-6 text-gray-800">Seller Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={seller.seller.userName}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={seller.seller.email}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                value={seller.seller.phone}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={seller.seller.address}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joined On</label>
              <input
                type="text"
                value={seller.seller.createdAt?.substring(0, 10)}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Auctions by Seller */}
      <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg mt-10">
        <h2 className="text-3xl font-bold mb-5 text-gray-800">Current Auctions by {seller.seller.userName}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {seller.auctions && seller.auctions.length > 0 ? (
            seller.auctions.map((auction) => (
              <div key={auction._id} className="bg-white shadow-lg rounded-lg p-5">
                <Link to={`/auction/item/${auction._id}`}>
                  <img
                    src={auction.image?.url || "https://via.placeholder.com/345x140"}
                    alt={auction.title}
                    className="w-full h-40 object-cover rounded-t-md"
                  />
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{auction.title}</h3>
                    <p className="text-gray-600 mb-1">Starting Bid: ${auction.startingBid}</p>
                    <p className="text-gray-600 mb-1">Current Bid: ${auction.currentBid}</p>
                    <p className="text-gray-600">Ends On: {auction.endTime.substring(0, 10)}</p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No current auctions by this seller.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default SellerProfile;
