import { useState } from "react";
import { useSelector } from "react-redux";
import Card from "@/custom-components/Card";
import Spinner from "@/custom-components/Spinner";

const Auctions = () => {
  const { allAuctions, loading } = useSelector((state) => state.auction);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState("default");
  const [filters, setFilters] = useState({ minBid: '', maxBid: '', status: 'all', condition: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAuctions = allAuctions.filter((auction) => {
    const matchesTitle = auction.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinBid = filters.minBid === '' || auction.startingBid >= Number(filters.minBid);
    const matchesMaxBid = filters.maxBid === '' || auction.startingBid <= Number(filters.maxBid);
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'ongoing' && new Date() < new Date(auction.endTime)) ||
      (filters.status === 'ended' && new Date() >= new Date(auction.endTime));
    const matchesCondition =
      filters.condition === 'all' ||
      (filters.condition === 'new' && auction.condition?.toLowerCase() === 'new') ||
      (filters.condition === 'used' && auction.condition?.toLowerCase() === 'used');

    return matchesTitle && matchesMinBid && matchesMaxBid && matchesStatus && matchesCondition;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    if (sortCriteria === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortCriteria === "startTime") {
      return new Date(a.startTime) - new Date(b.startTime);
    } else if (sortCriteria === "endTime") {
      return new Date(a.endTime) - new Date(b.endTime);
    } else if (sortCriteria === "startingBid") {
      return a.startingBid - b.startingBid;
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAuctions = sortedAuctions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAuctions.length / itemsPerPage);

  const handleClearFilters = () => {
    setFilters({ minBid: '', maxBid: '', status: 'all', condition: 'all' });
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <section className="w-full h-fit px-5 pt-[100px] flex flex-col">
          <div
            className="relative w-full h-auto bg-cover bg-center py-20 px-8 text-white mb-10"
            style={{
              backgroundImage: 'url(banner-1.webp)',
              backgroundColor: 'rgba(214, 72, 43, 0.7)',
              backgroundBlendMode: 'overlay',
            }}
          >
            <h1 className={`text-[#fff] text-2xl font-bold mb-8 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}>All Auctions</h1>
            <div className="flex mb-8">
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow p-3 border border-gray-300 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-3 p-3 px-5 bg-orange-500 text-white rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 border bg-[#d6482b] text-white hover:bg-[#b8381e] transition-all"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="sort" className="text-lg font-semibold text-gray-700">
                Sort By
              </label>
              <select
                id="sort"
                value={sortCriteria}
                onChange={(e) => setSortCriteria(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="default">Default</option>
                <option value="title">Title</option>
                <option value="startTime">Start Time</option>
                <option value="endTime">End Time</option>
                <option value="startingBid">Starting Bid</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="minBid" className="text-lg font-semibold text-gray-700">
                  Min Price
                </label>
                <input
                  id="minBid"
                  type="number"
                  value={filters.minBid}
                  onChange={(e) => setFilters({ ...filters, minBid: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="maxBid" className="text-lg font-semibold text-gray-700">
                  Max Price
                </label>
                <input
                  id="maxBid"
                  type="number"
                  value={filters.maxBid}
                  onChange={(e) => setFilters({ ...filters, maxBid: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="status" className="text-lg font-semibold text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="condition" className="text-lg font-semibold text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <button
                onClick={handleClearFilters}
                className="m-2 p-1 bg-gray-800 text-white rounded-md text-sm font-semibold hover:bg-gray-900 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-6 px-30">
            {currentAuctions.length > 0 ? (
              currentAuctions.map((element) => (
                <Card
                  title={element.title}
                  startTime={element.startTime}
                  endTime={element.endTime}
                  imgSrc={element.image?.url}
                  startingBid={element.startingBid}
                  id={element._id}
                  key={element._id}
                  bids={element.bids}
                />
              ))
            ) : (
              <p>No auctions found.</p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center my-8 gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  currentPage === pageNumber
                    ? "bg-[#d6482b] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default Auctions;
