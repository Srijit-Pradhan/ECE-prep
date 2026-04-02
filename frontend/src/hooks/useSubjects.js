import { useEffect, useState } from "react";
import { SUBJECTS } from "../constants/subjects";
import { getAvailableSubjects } from "../services/resourceService";

const useSubjects = () => {
  // Start with default subjects so UI can render immediately.
  const [subjects, setSubjects] = useState(SUBJECTS);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // Try loading latest subjects from backend.
        const data = await getAvailableSubjects();
        if (Array.isArray(data?.items) && data.items.length) {
          setSubjects(data.items);
        }
      } catch {
        // If request fails, keep default list.
        setSubjects(SUBJECTS);
      }
    };

    fetchSubjects();
  }, []);

  return subjects;
};

export default useSubjects;
