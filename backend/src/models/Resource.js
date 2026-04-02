import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 6,
    },
    type: {
      type: String,
      enum: ["notes", "suggestion", "pyq", "solution"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    fileURL: {
      type: String,
      required: true,
    },
    imagekitFileId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    previewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

resourceSchema.index({ semester: 1, subject: 1, type: 1, status: 1 });
resourceSchema.index({ subjectId: 1, semester: 1, type: 1, status: 1 });
resourceSchema.index({ title: "text", description: "text" });

export default mongoose.model("Resource", resourceSchema);
