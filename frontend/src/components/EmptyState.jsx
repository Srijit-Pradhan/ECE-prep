import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EmptyState = ({
  subjectName = "this subject",
  emptyTitle = "No notes uploaded yet 😭",
  emptyDescription = "Looks like everyone forgot to upload notes for",
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-play when empty state appears.
    // Some browsers may block autoplay; we silently ignore that.
    const audio = new Audio(`/tmpauxfo4ff.mp3?v=${Date.now()}`);
    audio.preload = "auto";
    audio.load();
    audio.currentTime = 0;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <img
        src="/empty-notes-meme.gif"
        alt="Sad meme for empty notes"
        className="mx-auto mb-4 h-36 w-36 rounded-xl object-cover"
      />

      <h2 className="text-2xl font-semibold text-slate-900">{emptyTitle}</h2>
      <p className="mt-2 text-slate-600">{emptyDescription} {subjectName}.</p>
      <p className="mt-1 text-slate-600">Be the first legend to upload and help your juniors.</p>

      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate("/upload")}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Upload Notes
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
