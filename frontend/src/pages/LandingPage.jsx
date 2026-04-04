import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import useSubjects from "../hooks/useSubjects";

const stats = [
  { label: "Resource Types", value: "4" },
  { label: "Active Users", value: "1,234+" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const subjects = useSubjects();

  const statsWithSubjects = [{ label: "Subjects", value: String(subjects.length) }, ...stats];

  const scrollToSection = (sectionId) => {
    // Smoothly move to a section when CTA is clicked.
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBrowseSubjects = () => {
    // Logged-in users go to dashboard section.
    // Guests are redirected to login.
    if (isAuthenticated) {
      navigate("/dashboard#browse-subjects-section");
      return;
    }

    navigate("/login");
  };

  const handleDownloadNotesClick = (subject) => {
    // Open selected subject page directly.
    navigate(`/subjects/6/${encodeURIComponent(subject)}`);
  };

  useEffect(() => {
    // Basic SEO tags for search engines and social previews.
    document.title = "ExamPrep";

    const description =
      "Download free ECE exam notes, suggestions and previous year papers. Prepare for semester exams with community-shared engineering resources.";
    const keywords =
      "ECE notes, ECE exam preparation, semester exam notes, engineering resources, previous year papers, ECE study material";

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", description);

    let keywordsTag = document.querySelector('meta[name="keywords"]');
    if (!keywordsTag) {
      keywordsTag = document.createElement("meta");
      keywordsTag.setAttribute("name", "keywords");
      document.head.appendChild(keywordsTag);
    }
    keywordsTag.setAttribute("content", keywords);
  }, []);

  return (
    <div className="page-enter min-h-screen pb-10">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-500">
                Community Driven ECE Prep
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-bold text-slate-900 md:text-6xl">
                Download Free ECE Exam Notes, Suggestions & Previous Papers
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
                ECE ExamHub helps students discover vetted exam resources by semester and subject, with a
                transparent upvote-based quality signal.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection("download-notes-section")}
                  className="rounded-full border border-slate-300 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Download Notes
                </button>
                <button
                  type="button"
                  onClick={handleBrowseSubjects}
                  className="rounded-full border border-teal-700 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  Browse Subjects
                </button>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">Why students use ECE ExamHub</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Verified PDFs organized by subject and type</li>
                <li>Quick preview before download</li>
                <li>Community uploads with admin moderation</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="download-notes-section" className="mt-10 grid gap-4 md:grid-cols-3">
          {statsWithSubjects.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{item.value}</p>
            </article>
          ))}
        </section>

        <section id="subject-previews-section" className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold text-slate-900">Subject Previews</h2>
            <p className="hidden text-sm text-slate-500 md:block">Pick a subject and jump directly to notes.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={subject}
                className="flex h-[235px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="h-16 overflow-hidden text-lg font-semibold text-slate-900">{subject}</h3>
                <p className="mt-2 h-16 overflow-hidden text-sm text-slate-600">
                  Notes, suggestions and PYQ material curated by your ECE peers.
                </p>
                <button
                  type="button"
                  onClick={() => handleDownloadNotesClick(subject)}
                  className="mt-auto inline-block w-fit rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Download Notes
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;


