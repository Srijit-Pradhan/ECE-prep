import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
  },
  { timestamps: true },
);

voteSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
