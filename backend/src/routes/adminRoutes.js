import { Router } from "express";
import {
  approveAllPendingResources,
  approveResource,
  banUser,
  deleteResource,
  deleteSubject,
  getSubjects,
  moveSubjectToSemester,
  getPendingResources,
  getUsers,
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/pending", getPendingResources);
router.post("/approve", approveResource);
router.post("/approve-all", approveAllPendingResources);
router.delete("/resource/:id", deleteResource);
router.get("/users", getUsers);
router.patch("/user/:id/ban", banUser);
router.get("/subjects", getSubjects);
router.delete("/subject/:subjectName", deleteSubject);
router.patch("/subject/move", moveSubjectToSemester);

export default router;
