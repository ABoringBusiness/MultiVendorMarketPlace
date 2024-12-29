import mongoose from "mongoose";

const categorySuggestionSchema = new mongoose.Schema({
  suggestedCategory: {
    type: String,
    required: [true, "Suggested category name is required."],
    minLength: [3, "Suggested category must contain at least 3 characters."],
    maxLength: [100, "Suggested category cannot exceed 100 characters."],
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: [true, "User who suggested the category is required."],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const CategorySuggestion = mongoose.model("CategorySuggestion", categorySuggestionSchema);
