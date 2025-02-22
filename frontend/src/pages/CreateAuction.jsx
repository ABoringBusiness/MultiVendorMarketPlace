import { createAuction } from "@/store/slices/auctionSlice";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";

const CreateAuction = () => {
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const auctionCategories = [
    "Electronics",
    "Furniture",
    "Art & Antiques",
    "Jewelry & Watches",
    "Automobiles",
    "Real Estate",
    "Collectibles",
    "Fashion & Accessories",
    "Sports Items",
    "Books & Manuscripts",
  ];

  const imageHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImage(file);
      setImagePreview(reader.result);
    };
  };

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auction);

  const handleCreateAuction = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("condition", condition);
    formData.append("startingBid", startingBid);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    dispatch(createAuction(formData));
  };

  const { isAuthenticated, user } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  useEffect(() => {
    if (!isAuthenticated || user.role !== "Auctioneer") {
      navigateTo("/");
    }
  }, [isAuthenticated, navigateTo, user.role]);

  return (
    <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8 justify-center">
      <div className="bg-white mx-auto w-full max-w-4xl h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-6">Create Auction</h1>
        <form onSubmit={handleCreateAuction} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-[16px] text-stone-500">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[16px] text-stone-500">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              >
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[16px] text-stone-500">Category</label>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              >
                <option value="" >Select Category</option>
                {auctionCategories.map((element) => (
                  <option key={element} value={element}>
                    {element}
                  </option>
                ))}
              </select>
              <a
                href="/suggest-category"
                className="text-[#d6482b] text-sm hover:underline whitespace-nowrap"
              >
                Suggest a category
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-[16px] text-stone-500">Starting Bid ($)</label>
              <input
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
              rows={4}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-[16px] text-stone-500 mr-1">Auction Start Time</label>
              <DatePicker
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h:mm aa"}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[16px] text-stone-500 mr-1">Auction End Time</label>
              <DatePicker
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h:mm aa"}
                className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b] w-full"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <label className="font-semibold text-xl md:text-2xl">Auction Item Image</label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {imagePreview ? (
                    <img src={imagePreview} alt={title} className="w-44 h-auto" />
                  ) : (
                    <>
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </>
                  )}
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={imageHandler} />
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-2xl py-4 rounded-md text-white my-4"
            disabled={loading}
          >
            {loading ? "Creating Auction..." : "Create Auction"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateAuction;
