import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      trim: true,
      default: "ECE",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    nameLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

subjectSchema.pre("validate", function setDerivedSubjectKeys(next) {
  const normalized = (this.nameLower || this.nameKey || this.name || "").trim().toLowerCase();
  this.nameLower = normalized;
  this.nameKey = normalized;
  if (!this.department) {
    this.department = "ECE";
  }
  next();
});

subjectSchema.index({ semester: 1, nameLower: 1 }, { unique: true });
subjectSchema.index({ department: 1, semester: 1, nameKey: 1 }, { unique: true });

export default mongoose.model("Subject", subjectSchema);
