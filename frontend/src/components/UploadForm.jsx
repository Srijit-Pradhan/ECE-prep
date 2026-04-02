import { useEffect, useState } from "react";
import {
  checkSubjectSemesterConflict,
  getAvailableSemesters,
  getAvailableSubjects,
  uploadResource,
} from "../services/resourceService";

const UPLOAD_RESOURCE_TYPES = [
  { label: "Notes", value: "notes" },
  { label: "Suggestions", value: "suggestion" },
  { label: "PYQ", value: "pyq" },
];

const createInitialForm = () => ({
  title: "",
  semester: 6,
  subject: "",
  type: "notes",
  description: "",
  file: null,
});

const UploadForm = ({ onUploaded }) => {
  const [allSubjects, setAllSubjects] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [semesters, setSemesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  // Form state stores all user inputs.
  const [form, setForm] = useState(createInitialForm());
  const [subjectConflict, setSubjectConflict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await getAvailableSemesters();
        if (Array.isArray(data?.items) && data.items.length) {
          setSemesters(data.items);
        }
      } catch {
        setSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
      }
    };

    fetchSemesters();
  }, []);

  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const data = await getAvailableSubjects();
        setAllSubjects(Array.isArray(data?.records) ? data.records : []);
      } catch {
        setAllSubjects([]);
      }
    };

    fetchAllSubjects();
  }, []);

  useEffect(() => {
    const normalized = form.subject.trim().toLowerCase();
    if (!normalized) {
      setSuggestions([]);
      return;
    }

    const nextSuggestions = allSubjects
      .filter((item) => (item.name || "").toLowerCase().includes(normalized))
      .slice(0, 6);
    setSuggestions(nextSuggestions);
  }, [allSubjects, form.subject]);

  useEffect(() => {
    const trimmedSubject = form.subject.trim();
    if (trimmedSubject.length < 3) {
      setSubjectConflict(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const data = await checkSubjectSemesterConflict(trimmedSubject, form.semester);
        setSubjectConflict(data?.hasConflict ? data : null);
      } catch {
        setSubjectConflict(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [form.semester, form.subject]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("info");

    // Step 1: Simple validation checks.
    if (!form.file) {
      setMessageType("error");
      setMessage("Please select a PDF file.");
      return;
    }

    if (form.file.type !== "application/pdf") {
      setMessageType("error");
      setMessage("Only PDF files are allowed.");
      return;
    }

    if (form.file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("File size should be 5MB or less.");
      return;
    }
    if (!form.title || !form.description || !form.subject.trim()) {
      setMessageType("error");
      setMessage("Please fill all required fields.");
      return;
    }

    if (form.subject.trim().length < 3) {
      setMessageType("error");
      setMessage("Subject name should have at least 3 characters.");
      return;
    }

    if (subjectConflict?.hasConflict) {
      setMessageType("error");
      setMessage(
        `This subject already exists in Semester ${subjectConflict.existingSemester}. Upload canceled to avoid duplicate subject across semesters.`,
      );
      return;
    }

    try {
      // Step 2: Build form-data payload for backend.
      setLoading(true);
      const payload = new FormData();
      const subjectToUpload = form.subject.trim();

      payload.append("title", form.title);
      payload.append("semester", String(form.semester));
      payload.append("subject", subjectToUpload);
      payload.append("type", form.type);
      payload.append("description", form.description);
      payload.append("file", form.file);

      // Step 3: Upload resource.
      const response = await uploadResource(payload);

      setMessageType("success");
      setMessage(response.message || "Uploaded successfully.");
      setSubjectConflict(null);
      setSuggestions([]);
      setForm(createInitialForm());

      if (onUploaded) {
        onUploaded();
      }
    } catch (error) {
      setMessageType("error");
      if (error?.response?.data?.warningCode === "SUBJECT_EXISTS_OTHER_SEMESTER") {
        setMessage(
          error?.response?.data?.message || "This subject already exists in another semester. Upload canceled.",
        );
        return;
      }

      setMessage(error?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Upload Resource</h2>
      <p className="mt-1 text-sm text-slate-600">PDF only, max size 5MB. Uploads are reviewed by admins.</p>

      <form className="mt-4 grid min-w-0 gap-3" onSubmit={handleSubmit}>
        <input
          required
          value={form.title}
          onChange={(event) => {
            setMessage("");
            setForm((prev) => ({ ...prev, title: event.target.value }));
          }}
          placeholder="Resource title"
          className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
        />

        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <select
            value={form.semester}
            onChange={(event) => {
              const semester = Number(event.target.value) || 6;
              setMessage("");
              setForm((prev) => ({ ...prev, semester, subject: "" }));
            }}
            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
          >
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>

          <input
            required
            value={form.subject}
            onChange={(event) => {
              setMessage("");
              setForm((prev) => ({ ...prev, subject: event.target.value }));
            }}
            placeholder="Enter subject name"
            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
          />

          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
          >
            {UPLOAD_RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Please enter the correct subject name carefully. This helps keep resources organized for all students.
        </p>

        {subjectConflict?.hasConflict && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            This subject already exists in Semester {subjectConflict.existingSemester}. Please confirm that you are uploading it to the correct semester.
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Similar subjects</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={`${item.semester}-${item.name}`}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, subject: item.name, semester: item.semester }));
                    setMessage("");
                  }}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.name} (Semester {item.semester})
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(event) => {
            setMessage("");
            setForm((prev) => ({ ...prev, description: event.target.value }));
          }}
          placeholder="Short description"
          className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
        />

        <input
          required
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            setMessage("");
            setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }));
          }}
          className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />

        {form.file && (
          <p className="text-xs text-slate-500">
            Selected file: {form.file.name} ({(form.file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              messageType === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Submit for approval"}
        </button>
      </form>
    </section>
  );
};

export default UploadForm;
