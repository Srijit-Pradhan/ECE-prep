import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
	approveAllPendingResources,
	approveResource,
	deleteResource,
	deleteSubject,
	getAdminSubjects,
	moveSubjectToSemester,
	getPendingResources,
	getUsers,
	setUserBanStatus,
} from "../services/adminService";

const AdminPage = () => {
	const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
	const [pending, setPending] = useState([]);
	const [users, setUsers] = useState([]);
	const [groupedSubjects, setGroupedSubjects] = useState({});
	const [approvingAll, setApprovingAll] = useState(false);
	const [message, setMessage] = useState("");

	const fetchAdminData = async () => {
		try {
			const [pendingData, userData, subjectData] = await Promise.all([
				getPendingResources(),
				getUsers(),
				getAdminSubjects(),
			]);

			setPending(pendingData);
			setUsers(userData);
			setGroupedSubjects(subjectData?.grouped || {});
		} catch (error) {
			setMessage(error?.response?.data?.message || "Unable to fetch admin data");
		}
	};

	useEffect(() => {
		document.title = "ExamPrep";

		const timerId = setTimeout(() => {
			fetchAdminData();
		}, 0);

		return () => clearTimeout(timerId);
	}, []);

	const handleAction = async (resourceId, action) => {
		try {
			await approveResource(resourceId, action);
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "Action failed");
		}
	};

	const handleApproveAllPending = async () => {
		if (pending.length === 0) {
			setMessage("No pending resources to approve.");
			return;
		}

		try {
			setApprovingAll(true);
			const data = await approveAllPendingResources();
			setMessage(data?.message || "All pending resources approved successfully.");
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "Bulk approval failed");
		} finally {
			setApprovingAll(false);
		}
	};

	const handleDelete = async (id) => {
		try {
			await deleteResource(id);
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "Delete failed");
		}
	};

	const handleDeleteSubject = async (subjectId, subjectName) => {
		try {
			await deleteSubject(subjectId);
			setMessage(`Subject '${subjectName}' removed with its resources`);
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "Subject delete failed");
		}
	};

	const handleMoveSubject = async (subjectId, subjectName, targetSemester) => {
		try {
			await moveSubjectToSemester(subjectId, targetSemester);
			setMessage(`Subject '${subjectName}' moved to semester ${targetSemester}`);
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "Move subject failed");
		}
	};

	const handleBanToggle = async (userId, isBanned) => {
		try {
			await setUserBanStatus(userId, isBanned);
			fetchAdminData();
		} catch (error) {
			setMessage(error?.response?.data?.message || "User status update failed");
		}
	};

	return (
		<div className="page-enter min-h-screen pb-10">
			<Navbar />

			<main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 md:px-6 md:py-8">
				<section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
					<h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Admin Dashboard</h1>
					<p className="mt-2 text-sm text-slate-600 sm:text-base">
						Approve/reject uploads, remove inappropriate content, and manage users.
					</p>
				</section>

				{message && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}

				<section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-2xl font-semibold text-slate-900">Pending Resources</h2>
						<button
							type="button"
							onClick={handleApproveAllPending}
							disabled={approvingAll || pending.length === 0}
							className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
						>
							{approvingAll ? "Approving..." : `Approve All (${pending.length})`}
						</button>
					</div>

					<div className="mt-4 space-y-3">
						{pending.map((resource) => (
							<article key={resource._id} className="rounded-xl border border-slate-200 p-4">
								<h3 className="font-semibold text-slate-900">{resource.title}</h3>
								<p className="mt-1 text-sm text-slate-600">{resource.description}</p>
								<p className="mt-2 text-xs text-slate-500">
									{resource.subject} | {resource.type} | Uploaded by {resource.uploadedBy?.name}
								</p>

								<div className="mt-3 flex flex-wrap gap-2">
									<button
										type="button"
										onClick={() => window.open(resource.fileURL, "_blank", "noopener,noreferrer")}
										className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700"
									>
										View PDF
									</button>
									<button
										type="button"
										onClick={() => handleAction(resource._id, "approved")}
										className="rounded-lg bg-emerald-700 px-3 py-1 text-sm font-semibold text-white"
									>
										Approve
									</button>
									<button
										type="button"
										onClick={() => handleAction(resource._id, "rejected")}
										className="rounded-lg bg-amber-600 px-3 py-1 text-sm font-semibold text-white"
									>
										Reject
									</button>
									<button
										type="button"
										onClick={() => handleDelete(resource._id)}
										className="rounded-lg bg-rose-700 px-3 py-1 text-sm font-semibold text-white"
									>
										Delete
									</button>
								</div>
							</article>
						))}

						{pending.length === 0 && <p className="text-sm text-slate-600">No pending resources.</p>}
					</div>
				</section>

				<section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
					<h2 className="text-2xl font-semibold text-slate-900">Subjects</h2>
					<p className="mt-1 text-sm text-slate-600">Manage semester-wise subjects: move or delete incorrect entries.</p>

					<div className="mt-4 space-y-4">
						{semesters.map((semester) => {
							const semesterSubjects = groupedSubjects?.[String(semester)] || [];
							return (
								<div key={semester} className="rounded-xl border border-slate-200 p-3">
									<h3 className="text-sm font-semibold text-slate-900">Semester {semester}</h3>
									<div className="mt-2 space-y-2">
										{semesterSubjects.map((subject) => (
											<div
												key={subject.id}
												className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 lg:flex-row lg:items-center"
											>
												<p className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">
													{subject.name}
													<span className="ml-2 text-xs font-normal text-slate-500">({subject.resourceCount} resources)</span>
												</p>
												<div className="flex flex-wrap gap-2">
													<select
														defaultValue={semester}
														onChange={(event) => handleMoveSubject(subject.id, subject.name, Number(event.target.value) || semester)}
														className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
													>
														{semesters.map((sem) => (
															<option key={`${subject.id}-${sem}`} value={sem}>
																Move to Sem {sem}
															</option>
														))}
													</select>
													<button
														type="button"
														onClick={() => handleDeleteSubject(subject.id, subject.name)}
														className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white"
													>
														Delete
													</button>
												</div>
											</div>
										))}
										{semesterSubjects.length === 0 && <p className="text-sm text-slate-600">No subjects in this semester.</p>}
									</div>
								</div>
							);
						})}
					</div>
				</section>

				<section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
					<h2 className="text-2xl font-semibold text-slate-900">Users</h2>
					<div className="mt-3 overflow-x-auto">
						<table className="w-full min-w-[680px] text-left text-sm">
							<thead>
								<tr className="border-b border-slate-200 text-slate-500">
									<th className="py-2">Name</th>
									<th className="py-2">Email</th>
									<th className="py-2">Role</th>
									<th className="py-2">Status</th>
									<th className="py-2">Action</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user._id} className="border-b border-slate-100">
										<td className="py-2">{user.name}</td>
										<td className="py-2">{user.email}</td>
										<td className="py-2 capitalize">{user.role}</td>
										<td className="py-2">
											<span
												className={`rounded-full px-2 py-1 text-xs font-semibold ${
													user.isBanned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
												}`}
											>
												{user.isBanned ? "Banned" : "Active"}
											</span>
										</td>
										<td className="py-2">
											{user.role === "admin" ? (
												<span className="text-xs text-slate-500">Admin protected</span>
											) : (
												<button
													type="button"
													onClick={() => handleBanToggle(user._id, !user.isBanned)}
													className={`rounded-lg px-3 py-1 text-xs font-semibold text-white ${
														user.isBanned ? "bg-emerald-700" : "bg-rose-700"
													}`}
												>
													{user.isBanned ? "Unban" : "Ban"}
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</main>
		</div>
	);
};

export default AdminPage;
