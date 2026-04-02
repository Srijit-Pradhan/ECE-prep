import api from "./api";

export const getResources = async (params = {}) => {
  const { data } = await api.get("/resources", { params });
  return data;
};

export const getSubjectResources = async (semester, subject, params = {}) => {
  const { data } = await api.get(
    `/resources/subject/${encodeURIComponent(String(semester))}/${encodeURIComponent(subject)}`,
    { params },
  );
  return data;
};

export const getAvailableSemesters = async () => {
  const { data } = await api.get("/resources/semesters");
  return data;
};

export const getAvailableSubjects = async (params = {}) => {
  const { data } = await api.get("/resources/subjects", { params });
  return data;
};

export const checkSubjectSemesterConflict = async (subject, semester) => {
  const { data } = await api.get("/resources/subjects/check-conflict", {
    params: { subjectName: subject, semester },
  });
  return data;
};

export const uploadResource = async (formData) => {
  // Do not set multipart content-type manually.
  // Browser adds proper boundary automatically.
  const { data } = await api.post("/resources/upload", formData);
  return data;
};

export const upvoteResource = async (resourceId) => {
  const { data } = await api.post("/resources/upvote", { resourceId });
  return data;
};

export const markDownload = async (resourceId) => {
  const { data } = await api.post(`/resources/${resourceId}/download`);
  return data;
};

export const markPreview = async (resourceId) => {
  const { data } = await api.post(`/resources/${resourceId}/preview`);
  return data;
};

export const downloadResourceFile = async (resourceId, title) => {
  const response = await api.get(`/resources/${resourceId}/download-file`, {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  const safeTitle = (title || "resource").replace(/[^a-zA-Z0-9\s-_]/g, "").trim().replace(/\s+/g, "_");

  link.href = blobUrl;
  link.download = `${safeTitle || "resource"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const getContributorLeaderboard = async () => {
  const { data } = await api.get("/resources/leaderboard");
  return data;
};


