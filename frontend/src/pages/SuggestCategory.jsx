import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { suggestCategory } from "../store/slices/categorySuggestionSlice";
import { toast } from "react-toastify";

const SuggestCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.categorySuggestion);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (categoryName.trim() && description.trim()) {
      dispatch(suggestCategory({ suggestedCategory: categoryName, description }))
        .then(() => {
          setCategoryName("");
          setDescription("");
          toast.success("Category suggested successfully.");
        })
        .catch((error) => {
          toast.error(error.message || "Failed to suggest category.");
        });
    } else {
      toast.error("Please enter a category name and description.");
    }
  };

  return (
    <section className="w-full h-fit px-5 pt-[150px] lg:px-[30px] flex flex-col min-h-screen py-8 justify-center">
      <div className="bg-white mx-auto w-full max-w-lg h-auto px-8 py-10 flex flex-col gap-6 items-center justify-center rounded-lg shadow-lg">
        <h1 className="text-[#d6482b] text-4xl font-bold mb-4">Suggest a New Category</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              required
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[16px] text-stone-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description"
              rows={5}
              required
              className="text-[16px] py-3 px-4 bg-transparent border border-stone-300 rounded-md focus:outline-none focus:border-[#d6482b]"
            />
          </div>
          <button
            className="bg-[#d6482b] w-full font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-4 rounded-md text-white my-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Category Suggestion"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SuggestCategoryPage;
