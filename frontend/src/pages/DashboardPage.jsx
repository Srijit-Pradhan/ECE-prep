import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import SubjectCard from "../components/SubjectCard";
import UploadPanel from "../components/UploadPanel";
import { useAuth } from "../hooks/useAuth";
import { getAvailableSemesters, getAvailableSubjects } from "../services/resourceService";

const DashboardPage = () => {
	const location = useLocation();
	const { user } = useAuth();
	const [semesters, setSemesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
	const [selectedSemester, setSelectedSemester] = useState(6);
	const [subjects, setSubjects] = useState([]);
	const [message, setMessage] = useState("");

	useEffect(() => {
		document.title = "ExamPrep";
	}, []);

	useEffect(() => {
		if (location.hash === "#browse-subjects-section") {
			const section = document.getElementById("browse-subjects-section");
			if (section) {
				section.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}
	}, [location.hash]);

	useEffect(() => {
		const fetchSemesters = async () => {
			try {
				const data = await getAvailableSemesters();
				if (Array.isArray(data?.items) && data.items.length) {
					setSemesters(data.items);
					if (!data.items.includes(selectedSemester)) {
						setSelectedSemester(data.items[0]);
					}
				}
			} catch {
				setSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
			}
		};

		fetchSemesters();
	}, [selectedSemester]);

	useEffect(() => {
		const fetchSubjects = async () => {
			try {
				setMessage("");
				const data = await getAvailableSubjects({ semester: selectedSemester });
				setSubjects(Array.isArray(data?.items) ? data.items : []);
			} catch (error) {
				setSubjects([]);
				setMessage(error?.response?.data?.message || "Unable to load subjects");
			}
		};

		fetchSubjects();
	}, [selectedSemester]);

	return (
		<div className="page-enter min-h-screen pb-10">
			<Navbar />

			<main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 md:px-6 md:py-8">
				<section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<p className="mb-2 text-sm font-semibold text-teal-700">Welcome, {user?.name || "Student"}</p>
					<h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Student Dashboard</h1>
					<p className="mt-2 text-sm text-slate-600 sm:text-base">Browse your subjects and upload helpful resources.</p>
				</section>

				<section id="browse-subjects-section" className="mt-8">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-2xl font-semibold text-slate-900">Browse Subjects</h2>
							<p className="mt-1 text-sm text-slate-600">Choose a semester to view its subjects.</p>
						</div>
						<select
							value={selectedSemester}
							onChange={(event) => setSelectedSemester(Number(event.target.value) || 6)}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none ring-teal-600 transition focus:ring sm:w-48"
						>
							{semesters.map((semester) => (
								<option key={semester} value={semester}>
									Semester {semester}
								</option>
							))}
						</select>
					</div>
					{message && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
					<div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{subjects.map((subject) => (
							<SubjectCard key={`${selectedSemester}-${subject}`} subject={subject} semester={selectedSemester} />
						))}
					</div>
					{subjects.length === 0 && !message && (
						<p className="mt-3 text-sm text-slate-600">No subjects found for this semester yet.</p>
					)}
				</section>

				<section className="mt-10">
					<h2 className="text-2xl font-semibold text-slate-900">Upload Features</h2>
					<div className="mt-4">
						<UploadPanel />
					</div>
				</section>
			</main>
		</div>
	);
};

export default DashboardPage;
