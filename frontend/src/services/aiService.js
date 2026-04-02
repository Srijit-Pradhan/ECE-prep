import api from "./api";

export const summarizeNotesWithAi = async (payload) => {
  const { data } = await api.post("/ai/summarize", payload);
  return data;
};

export const generatePracticeQuestionsWithAi = async (payload) => {
  const { data } = await api.post("/ai/generate-questions", payload);
  return data;
};

export const askAiDoubt = async (payload) => {
  const { data } = await api.post("/ai/ask", payload);
  return data;
};
