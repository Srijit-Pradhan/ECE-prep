import { Router } from "express";
import { askAiDoubt, generatePracticeQuestions, summarizeNotes } from "../controllers/aiController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student", "admin"));

router.post("/summarize", summarizeNotes);
router.post("/generate-questions", generatePracticeQuestions);
router.post("/ask", askAiDoubt);

export default router;
