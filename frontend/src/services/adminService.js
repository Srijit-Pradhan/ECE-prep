import api from "./api";

export const getPendingResources = async () => {
  const { data } = await api.get("/admin/pending");
  return data;
};

export const approveResource = async (resourceId, action) => {
  const { data } = await api.post("/admin/approve", { resourceId, action });
  return data;
};

export const approveAllPendingResources = async () => {
  const { data } = await api.post("/admin/approve-all");
  return data;
};

export const deleteResource = async (id) => {
  const { data } = await api.delete(`/admin/resource/${id}`);
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const setUserBanStatus = async (userId, isBanned) => {
  const { data } = await api.patch(`/admin/user/${userId}/ban`, { isBanned });
  return data;
};

export const getAdminSubjects = async (semester) => {
  const { data } = await api.get("/admin/subjects", {
    params: semester ? { semester } : {},
  });
  return data;
};

export const deleteSubject = async (subjectIdentifier) => {
  const { data } = await api.delete(`/admin/subject/${encodeURIComponent(subjectIdentifier)}`);
  return data;
};

export const moveSubjectToSemester = async (subjectId, targetSemester) => {
  const { data } = await api.patch("/admin/subject/move", {
    subjectId,
    targetSemester,
  });
  return data;
};


