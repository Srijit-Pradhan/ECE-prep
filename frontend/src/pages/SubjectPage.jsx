import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ResourceCard from "../components/ResourceCard";
import EmptyState from "../components/EmptyState";
import FormattedAiResponse from "../components/FormattedAiResponse";
import { downloadResourceFile, getSubjectResources, markPreview, upvoteResource } from "../services/resourceService";
import { generatePracticeQuestionsWithAi } from "../services/aiService";

const DEFAULT_PAGINATION = {
  page: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const RESOURCE_TYPES = [
  { label: "All", value: "all" },
  { label: "Notes", value: "notes" },
  { label: "Suggestion", value: "suggestion" },
  { label: "PYQ", value: "pyq" },
  { label: "Solutions", value: "solution" },
];

const getEmptyContent = (selectedType) => {
  if (selectedType === "suggestion") {
    return {
      title: "No suggestions uploaded yet 😭",
      description: "Looks like no one has uploaded suggestions for",
    };
  }

  if (selectedType === "pyq") {
    return {
      title: "No PYQ uploaded yet 😭",
      description: "Looks like no one has uploaded PYQ for",
    };
  }

  if (selectedType === "notes") {
    return {
      title: "No notes uploaded yet 😭",
      description: "Looks like no one has uploaded notes for",
    };
  }

  if (selectedType === "solution") {
    return {
      title: "No solutions uploaded yet 😭",
      description: "Looks like no one has uploaded solutions for",
    };
  }

  return {
    title: "No resources uploaded yet 😭",
    description: "Looks like everyone forgot to upload resources for",
  };
};

const filterByType = (items, selectedType) => {
  if (selectedType === "all") {
    return items;
  }

  return items.filter((item) => (item.type || "").toLowerCase() === selectedType);
};

const filterBySearch = (items, searchText) => {
  const query = searchText.trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const description = (item.description || "").toLowerCase();
    return title.includes(query) || description.includes(query);
  });
};

const SubjectPage = () => {
  const { semester: semesterParam, subjectName } = useParams();
  // Decode subject from URL so spaces/special characters appear properly.
  const subject = decodeURIComponent(subjectName || "");
  const semester = Number(semesterParam) || 6;
  const [resources, setResources] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [pageInfo, setPageInfo] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [practiceQuestions, setPracticeQuestions] = useState("");
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [questionMarks, setQuestionMarks] = useState("2,3,5,6");
  const [questionCount, setQuestionCount] = useState("5");
  const [questionRequest, setQuestionRequest] = useState("");
  const [includeSolutions, setIncludeSolutions] = useState(true);

  // Load resources for a subject page.
  const fetchSubjectResources = async (pageNumber = pageInfo.page) => {
    try {
      setLoading(true);
      const data = await getSubjectResources(semester, subject, { page: pageNumber, limit: 10 });
      setResources(data.items || []);
      setPageInfo(data.pagination || DEFAULT_PAGINATION);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to load subject resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "ExamPrep";
  }, []);

  useEffect(() => {
    if (subject) {
      fetchSubjectResources(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, semester]);

  // Apply filters in 2 simple steps: type filter, then search filter.
  const filteredByType = filterByType(resources, selectedType);
  const visibleResources = filterBySearch(filteredByType, searchText);
  const emptyContent = getEmptyContent(selectedType);

  const handleTypeSelect = (typeValue) => setSelectedType(typeValue);

  const handleUpvote = async (resourceId) => {
    try {
      await upvoteResource(resourceId);
      fetchSubjectResources(pageInfo.page);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Upvote failed");
    }
  };

  const handleDownload = async (resource) => {
    try {
      await downloadResourceFile(resource._id, resource.title);
      fetchSubjectResources(pageInfo.page);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Download failed");
    }
  };

  const handlePreview = async (resource) => {
    try {
      await markPreview(resource._id);
      window.open(resource.fileURL, "_blank", "noopener,noreferrer");
      fetchSubjectResources(pageInfo.page);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Preview failed");
    }
  };

  const handleNextPage = () => {
    if (pageInfo.hasNextPage) {
      fetchSubjectResources(pageInfo.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageInfo.hasPrevPage) {
      fetchSubjectResources(pageInfo.page - 1);
    }
  };

  const handleGeneratePracticeQuestions = async () => {
    try {
      setPracticeLoading(true);
      setPracticeError("");
      const data = await generatePracticeQuestionsWithAi({
        subject,
        semester,
        marks: questionMarks,
        count: Number(questionCount) || 5,
        request: questionRequest,
        includeSolutions,
      });
      setPracticeQuestions(data?.questions || "No questions generated.");
    } catch (error) {
      setPracticeError(error?.response?.data?.message || "Failed to generate practice questions");
    } finally {
      setPracticeLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen pb-10">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-800">
                Semester {semester}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{subject}</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Notes, suggestions, solutions, and previous year papers for this subject.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">Visible</p>
                <p className="mt-1 font-semibold text-slate-900">{visibleResources.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
                <p className="mt-1 font-semibold text-slate-900">{filteredByType.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">Type</p>
                <p className="mt-1 font-semibold text-slate-900 capitalize">{selectedType}</p>
              </div>
            </div>
          </div>
        </section>

        {message && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}

        <section className="mt-6 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Practice Question Generator</p>
                <p className="text-xs text-slate-600">Generate questions from uploaded Notes/PYQ of this subject.</p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePracticeQuestions}
                disabled={practiceLoading}
                className="btn-primary rounded-xl px-4 py-2 text-sm"
              >
                {practiceLoading ? "Generating..." : "Generate Practice Questions"}
              </button>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <label className="text-xs text-slate-600">
                Marks (comma separated)
                <input
                  type="text"
                  value={questionMarks}
                  onChange={(event) => setQuestionMarks(event.target.value)}
                  placeholder="2,3,5,6"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring"
                />
              </label>

              <label className="text-xs text-slate-600">
                Number of questions
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring"
                />
              </label>
            </div>

            <label className="mt-2 block text-xs text-slate-600">
              Custom request (optional)
              <textarea
                rows={2}
                value={questionRequest}
                onChange={(event) => setQuestionRequest(event.target.value)}
                placeholder="Example: Give more numerical and theory-mix questions"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring"
              />
            </label>

            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={includeSolutions}
                onChange={(event) => setIncludeSolutions(event.target.checked)}
              />
              Include short solutions with answers
            </label>

            {practiceError && <p className="mt-3 text-sm text-rose-700">{practiceError}</p>}
            {practiceQuestions && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <FormattedAiResponse text={practiceQuestions} />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
                  <p className="mt-1 text-sm text-slate-600">Choose a content type or search within this subject.</p>
                </div>
                <p className="hidden text-sm text-slate-500 md:block">Latest uploads first</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`btn-chip rounded-full px-4 py-2 text-sm ${
                      selectedType === type.value ? "btn-chip-active shadow-sm" : ""
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search title or description"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-teal-600 transition focus:ring"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{visibleResources.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{filteredByType.length}</span>
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Semester {semester}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 capitalize">{selectedType}</span>
            </div>
          </div>

          <div className="grid gap-4">
            {loading && (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                Loading resources...
              </p>
            )}

            {!loading &&
              visibleResources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  onUpvote={handleUpvote}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                />
              ))}

            {!loading && visibleResources.length === 0 && (
              <EmptyState
                subjectName={subject}
                emptyTitle={emptyContent.title}
                emptyDescription={emptyContent.description}
              />
            )}

            {!loading && visibleResources.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm text-slate-600">
                  Page {pageInfo.page} of {pageInfo.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={!pageInfo.hasPrevPage || loading}
                    className="btn-secondary rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={!pageInfo.hasNextPage || loading}
                    className="btn-secondary rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SubjectPage;


