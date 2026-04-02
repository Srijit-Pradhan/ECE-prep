import { RESOURCE_TYPES } from "../constants/subjects";
import useSubjects from "../hooks/useSubjects";

const SearchFilters = ({ filters, setFilters }) => {
  const subjects = useSubjects();

  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
      <input
        value={filters.search}
        onChange={(event) =>
          setFilters((prev) => ({
            ...prev,
            search: event.target.value,
          }))
        }
        placeholder="Search notes, suggestions, papers..."
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
      />

      <select
        value={filters.subject}
        onChange={(event) =>
          setFilters((prev) => ({
            ...prev,
            subject: event.target.value,
          }))
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
      >
        <option value="">All subjects</option>
        {subjects.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(event) =>
          setFilters((prev) => ({
            ...prev,
            type: event.target.value,
          }))
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
      >
        <option value="">All resource types</option>
        {RESOURCE_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(event) =>
          setFilters((prev) => ({
            ...prev,
            sort: event.target.value,
          }))
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
      >
        <option value="latest">Latest</option>
        <option value="top">Most upvoted</option>
      </select>

      <button
        type="button"
        onClick={() =>
          setFilters({ search: "", subject: "", type: "", sort: "latest" })
        }
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Clear filters
      </button>
    </section>
  );
};

export default SearchFilters;


