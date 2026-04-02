import { Link } from "react-router-dom";

const SubjectCard = ({ subject, semester }) => {
  return (
    <Link
      to={`/subjects/${encodeURIComponent(String(semester || 6))}/${encodeURIComponent(subject)}`}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Semester {semester || 6}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{subject}</h3>
      <p className="mt-3 text-sm text-slate-500">Open resources, notes and previous year papers.</p>
      <span className="mt-4 inline-block text-sm font-semibold text-teal-700 group-hover:text-teal-800">
        Explore subject
      </span>
    </Link>
  );
};

export default SubjectCard;


