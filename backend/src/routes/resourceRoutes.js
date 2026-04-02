import { Router } from "express";
import {
  checkSubjectSemesterConflict,
  downloadResourceFile,
  getAvailableSubjects,
  getAvailableSemesters,
  getContributorLeaderboard,
  getResourceById,
  getSubjectResources,
  listResources,
  recordDownload,
  recordPreview,
  uploadResource,
  upvoteResource,
} from "../controllers/resourceController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

router.get("/semesters", getAvailableSemesters);
router.get("/subjects", getAvailableSubjects);
router.get("/subjects/check-conflict", protect, checkSubjectSemesterConflict);
router.get("/", protect, listResources);
router.get("/leaderboard", protect, getContributorLeaderboard);
router.get("/subject/:semester/:subject", protect, getSubjectResources);
router.get("/subject/:subject", protect, getSubjectResources);
router.get("/:id/download-file", protect, downloadResourceFile);
router.get("/:id", protect, getResourceById);
router.post(
  "/upload",
  protect,
  authorize("student", "admin"),
  upload.single("file"),
  uploadResource,
);
router.post("/upvote", protect, authorize("student", "admin"), upvoteResource);
router.post("/:id/download", protect, recordDownload);
router.post("/:id/preview", protect, recordPreview);

export default router;
