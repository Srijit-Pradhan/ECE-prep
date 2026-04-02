import { PDFParse } from "pdf-parse";
import Resource from "../models/Resource.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const SUMMARY_MODEL = process.env.GROQ_SUMMARY_MODEL || DEFAULT_MODEL;
const QUESTION_MODEL = process.env.GROQ_QUESTION_MODEL || DEFAULT_MODEL;
const DOUBT_MODEL = process.env.GROQ_DOUBT_MODEL || DEFAULT_MODEL;
const SUPPORTED_MARKS = [2, 3, 5, 6];

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();

const normalizeAiOutput = (value = "") => {
  const text = String(value || "").replace(/\r\n/g, "\n");
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
};

const limitText = (value, max = 10000) => {
  const normalized = cleanText(value);
  if (normalized.length <= max) {
    return normalized;
  }

  return normalized.slice(0, max);
};

const callGroq = async ({ prompt, model = DEFAULT_MODEL, temperature = 0.3, maxTokens = 500 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Add it in backend .env for real AI responses.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful exam preparation assistant. Keep responses short, clear, and beginner friendly.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return normalizeAiOutput(data?.choices?.[0]?.message?.content || "");
};

const extractPdfText = async (pdfUrl, maxPages = 3) => {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error("Failed to download PDF for summarization");
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText({ first: maxPages });
    return cleanText(parsed?.text || "");
  } finally {
    await parser.destroy();
  }
};

const getQuestionConfig = (rawMarks, rawCount) => {
  const marks = String(rawMarks || "2,3,5,6")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 5);

  const validMarks = marks.length ? marks : [2, 3, 5, 6];
  const count = Math.max(1, Math.min(Number(rawCount) || 5, 20));

  return { validMarks, count };
};

const extractContextFromUploadedResources = async (subject, semester) => {
  const subjectRegex = new RegExp(`^${escapeRegex(subject)}$`, "i");
  const query = {
    status: "approved",
    subject: subjectRegex,
    type: { $in: ["notes", "pyq"] },
  };

  if (semester) {
    query.semester = Number(semester);
  }

  const resources = await Resource.find(query)
    .select("title type fileURL semester")
    .sort({ createdAt: -1 })
    .limit(5);

  const chunks = [];
  for (const resource of resources) {
    try {
      const text = limitText(await extractPdfText(resource.fileURL, 2), 1800);
      if (!text) {
        continue;
      }

      chunks.push(
        [
          `Source: ${resource.title} (${resource.type.toUpperCase()}) - Semester ${resource.semester || semester || "N/A"}`,
          text,
        ].join("\n"),
      );
    } catch {
      // Skip broken/unreadable PDFs and continue with available resources.
    }
  }

  return {
    resources,
    contextText: limitText(chunks.join("\n\n"), 9000),
  };
};

export const summarizeNotes = async (req, res) => {
  try {
    const { fileURL, title, subject } = req.body;

    if (!fileURL) {
      return res.status(400).json({ success: false, message: "fileURL is required" });
    }

    const extractedText = await extractPdfText(fileURL, 5);
    const textForPrompt = limitText(extractedText, 10000);

    if (!textForPrompt) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in this PDF",
      });
    }

    const prompt = [
      "Create a detailed but exam-friendly study summary in a structured, readable format like ChatGPT.",
      `Subject: ${subject || "Unknown"}`,
      `Title: ${title || "Untitled"}`,
      "",
      "=== MARKDOWN FORMATTING RULES (REQUIRED) ===",
      "1) Use ## for section headings (## Topic Name)",
      "2) Use bullet points (•) for lists under each section",
      "3) Use **bold** for important keywords and terms",
      "4) Keep paragraphs to 2-3 lines maximum",
      "5) Add blank lines between sections for readability",
      "6) Avoid long text blocks - break into scannable bullet points",
      "7) Keep all explanations exam-focused and simple",
      "8) If any data is naturally tabular (comparison, formula mapping, truth table), use a markdown table.",
      "",
      "=== REQUIRED SECTIONS (Use these exact ## headings) ===",
      "## Topic Overview",
      "## Key Concepts",
      "## Important Points for Exams",
      "## Example",
      "## Quick Revision",
      "",
      "=== SECTION GUIDELINES ===",
      "Topic Overview: Short 2-3 line explanation of what this topic covers",
      "Key Concepts: 4-6 bullet points with important concepts and definitions",
      "Important Points for Exams: 5-7 bullet points with formulas, definitions, and exam tips",
      "Example: 1-2 relevant practical examples or problems",
      "Quick Revision: 3-5 bullet point summary for last-minute revision",
      "",
      "Target total: 18-28 bullet points across all sections.",
      "IMPORTANT: Highlight key terms with **bold** formatting.",
      "",
      "Text to summarize:",
      textForPrompt,
    ].join("\n");

    const summaryText = await callGroq({
      prompt,
      model: SUMMARY_MODEL,
      temperature: 0.25,
      maxTokens: 1000,
    });

    res.json({
      success: true,
      summary: summaryText,
      extractedChars: textForPrompt.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate summary" });
  }
};

export const generatePracticeQuestions = async (req, res) => {
  try {
    const { subject, semester, marks, count, request, includeSolutions } = req.body;

    if (!subject) {
      return res.status(400).json({ success: false, message: "subject is required" });
    }

    const { validMarks, count: questionCount } = getQuestionConfig(marks, count);
    const userRequest = cleanText(request || "");

    const { resources, contextText } = await extractContextFromUploadedResources(subject, semester);

    if (!contextText) {
      return res.status(400).json({
        success: false,
        message: "No readable Notes/PYQ found for this subject yet. Upload more materials first.",
      });
    }

    const normalizedMarks = validMarks.map((value) => {
      if (SUPPORTED_MARKS.includes(value)) {
        return value;
      }
      return value;
    });

    const prompt = [
      "Generate exam-style practice questions using ONLY the provided context from uploaded Notes/PYQ.",
      `Subject: ${subject}`,
      `Semester: ${semester || "Unknown"}`,
      `Requested marks: ${normalizedMarks.join(", ")}`,
      `Total questions requested: ${questionCount}`,
      `Include short solutions: ${includeSolutions === false ? "No" : "Yes"}`,
      userRequest ? `Student custom request: ${userRequest}` : "Student custom request: none",
      "",
      "=== MARKDOWN FORMATTING RULES (REQUIRED) ===",
      "1) Use ## for section headings (## 2 Marks Questions, ## 3 Marks Questions, etc.)",
      "2) Under each marks section, number questions (1., 2., 3., etc.)",
      "3) Use **bold** for important concepts and keywords",
      "4) Keep each question to 2-3 lines",
      "5) If solutions included, use bullet points (•) for answer points under each question",
      "6) Add blank lines between questions and sections for readability",
      "7) Avoid long text blocks - keep questions scannable",
      "8) If answer/solution details fit tabular format, use a markdown table.",
      "",
      "=== MARKS GROUPING (Use these exact ## headings) ===",
      "Group questions by marks: 2, 3, 5, 6",
      "If user requested different marks, use: ## X Marks Questions",
      "Generate number of questions proportionally (if total 20, do 5 per marks level)",
      "",
      "=== FINAL SECTION ===",
      "After all questions, add this section:",
      "## Important Topics",
      "List 5 important exam topics from the context in bullet points",
      "",
      "=== INSTRUCTIONS ===",
      "1) Keep questions directly from uploaded materials - do NOT make up questions.",
      "2) If user requested marks don't exist in context, generate equivalent questions.",
      "3) If Include solutions is Yes, add 3-5 bullet point answers under each question.",
      "4) Keep language beginner-friendly and exam-oriented.",
      "5) Format questions in a clean, scannable way like ChatGPT answers.",
      "",
      "Context from uploaded resources:",
      contextText,
    ].join("\n");

    const questionsText = await callGroq({
      prompt,
      model: QUESTION_MODEL,
      temperature: 0.4,
      maxTokens: 1200,
    });

    res.json({
      success: true,
      questions: questionsText,
      sourceCount: resources.length,
      marks: normalizedMarks,
      count: questionCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate questions" });
  }
};

export const askAiDoubt = async (req, res) => {
  try {
    const { question, subject, detailLevel } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "question is required" });
    }

    const isDetailed = String(detailLevel || "short").toLowerCase() === "detailed";

    const prompt = isDetailed
      ? [
          "Answer this student doubt in a detailed and easy-to-understand way, formatted like ChatGPT.",
          `Subject context: ${subject || "General"}`,
          `Question: ${question}`,
          "",
          "=== MARKDOWN FORMATTING RULES (REQUIRED) ===",
          "1) Use ## for section headings (## Concept Explanation, ## Step-by-Step Explanation, etc.)",
          "2) Use numbered lists (1., 2., 3.) for step-by-step explanations",
          "3) Use bullet points (•) for key points and important ideas",
          "4) Use **bold** for important keywords and terms",
          "5) Keep each line/bullet to 2-3 lines maximum",
          "6) Add blank lines between sections for readability",
          "7) Make the answer scannable and easy to read quickly",
          "8) If explanation involves comparison or structured mapping, use a markdown table.",
          "",
          "=== REQUIRED SECTIONS (Use these exact ## headings) ===",
          "## Concept Explanation",
          "## Step-by-Step Explanation",
          "## Key Points to Remember",
          "## Example",
          "",
          "=== SECTION GUIDELINES ===",
          "Concept Explanation: 2-3 lines explaining the core concept simply",
          "Step-by-Step Explanation: 4-6 numbered steps breaking down the topic",
          "Key Points to Remember: 4-5 bullet points with important ideas and exam tips",
          "Example: 1-2 practical, real-world examples relevant to the concept",
          "",
          "Use beginner-friendly wording, but keep technical correctness.",
          "Highlight key terms and concepts with **bold**.",
          "Target total length: around 14-24 lines.",
        ].join("\n")
      : [
          "Answer this student doubt in simple terms, formatted like ChatGPT.",
          `Subject context: ${subject || "General"}`,
          `Question: ${question}`,
          "",
          "=== MARKDOWN FORMATTING RULES (REQUIRED) ===",
          "1) Use ## for main section heading",
          "2) Use **bold** for important keywords",
          "3) Keep answer concise - 5-7 lines total",
          "4) Include one short practical example",
          "5) Include one exam tip",
          "6) Format for quick readability",
          "",
          "Quick answer format:",
          "Write a brief explanation, then add • Example: ... at the end",
          "Then add • Exam Tip: ... to finalize",
          "",
          "Keep language simple and beginner-friendly.",
        ].join("\n");

    const answerText = await callGroq({
      prompt,
      model: DOUBT_MODEL,
      temperature: isDetailed ? 0.35 : 0.45,
      maxTokens: isDetailed ? 950 : 450,
    });

    res.json({ success: true, answer: answerText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to solve doubt" });
  }
};
