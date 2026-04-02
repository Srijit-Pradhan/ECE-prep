import { useState } from "react";
import { ArrowBigUp, Download, Eye, FileText, Sparkles } from "lucide-react";
import { askAiDoubt, summarizeNotesWithAi } from "../services/aiService";
import FormattedAiResponse from "./FormattedAiResponse";

const ResourceCard = ({ resource, onUpvote, onDownload, onPreview }) => {
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [doubtInput, setDoubtInput] = useState("");
  const [doubtAnswer, setDoubtAnswer] = useState("");
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtError, setDoubtError] = useState("");
  const [doubtDetailed, setDoubtDetailed] = useState(true);

  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError("");
      const data = await summarizeNotesWithAi({
        fileURL: resource.fileURL,
        title: resource.title,
        subject: resource.subject,
      });
      setSummary(data?.summary || "No summary returned.");
    } catch (error) {
      setSummaryError(error?.response?.data?.message || "Failed to generate AI summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAskAi = async () => {
    const question = doubtInput.trim();
    if (!question) {
      setDoubtError("Please enter a question.");
      return;
    }

    try {
      setDoubtLoading(true);
      setDoubtError("");
      const data = await askAiDoubt({
        question,
        subject: resource.subject,
        detailLevel: doubtDetailed ? "detailed" : "short",
      });
      setDoubtAnswer(data?.answer || "No answer returned.");
    } catch (error) {
      setDoubtError(error?.response?.data?.message || "Failed to get AI answer");
    } finally {
      setDoubtLoading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
            {resource.type}
          </p>
          <p className="shrink-0 text-xs text-slate-500">{new Date(resource.createdAt).toLocaleDateString()}</p>
        </div>

        <h3 className="mt-3 text-xl font-semibold leading-tight text-slate-900">{resource.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            Uploaded by <span className="font-semibold text-slate-700">{resource.uploadedBy?.name || "Unknown"}</span>
          </span>
          {resource.semester && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Semester {resource.semester}</span>
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPreview?.(resource)}
            disabled={!resource?.fileURL}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye size={16} />
            Preview PDF
          </button>

          <button
            type="button"
            onClick={() => onDownload(resource)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onUpvote(resource._id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <ArrowBigUp size={16} />
            {resource.upvotes || 0}
          </button>

          <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <FileText size={16} />
            {resource.downloadCount || 0}
            <span className="hidden sm:inline">downloads</span>
          </span>

          <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <Eye size={16} />
            {resource.previewCount || 0}
            <span className="hidden sm:inline">views</span>
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={16} />
              AI Notes Summarizer
            </p>
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {summaryLoading ? "Generating..." : "AI Summary"}
            </button>
          </div>

          {summaryError && <p className="mt-2 text-xs text-rose-700">{summaryError}</p>}
          {summary && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
              <FormattedAiResponse text={summary} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Sparkles size={16} />
            Ask AI Doubt Solver
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={doubtInput}
              onChange={(event) => {
                setDoubtInput(event.target.value);
                setDoubtError("");
              }}
              placeholder="Ask your doubt in simple words"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring"
            />
            <button
              type="button"
              onClick={handleAskAi}
              disabled={doubtLoading}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {doubtLoading ? "Asking..." : "Ask AI"}
            </button>
          </div>

          <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={doubtDetailed}
              onChange={(event) => setDoubtDetailed(event.target.checked)}
            />
            Detailed answer mode
          </label>

          {doubtError && <p className="mt-2 text-xs text-rose-700">{doubtError}</p>}
          {doubtAnswer && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <FormattedAiResponse text={doubtAnswer} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ResourceCard;


