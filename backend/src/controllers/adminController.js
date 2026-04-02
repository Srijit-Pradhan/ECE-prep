import imagekit from "../config/imagekit.js";
import Resource from "../models/Resource.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import { SUBJECTS } from "../utils/subjects.js";

const normalizeSubjectName = (value) => (value || "").trim();
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const toSemester = (value, fallback = 6) => {
	const semester = Number(value);
	return SEMESTERS.includes(semester) ? semester : fallback;
};

export const getPendingResources = async (_req, res) => {
	try {
		const pending = await Resource.find({ status: "pending" })
			.populate("uploadedBy", "name email")
			.sort({ createdAt: -1 });

		res.json(pending);
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to fetch pending resources" });
	}
};

export const approveResource = async (req, res) => {
	try {
		const { resourceId, action } = req.body;

		if (!resourceId || !action) {
			return res.status(400).json({ message: "resourceId and action are required" });
		}

		if (!["approved", "rejected"].includes(action)) {
			return res.status(400).json({ message: "Invalid action" });
		}

		const resource = await Resource.findById(resourceId);
		if (!resource) {
			return res.status(404).json({ message: "Resource not found" });
		}

		resource.status = action;
		await resource.save();

		res.json({ message: `Resource ${action}`, resource });
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to update resource status" });
	}
};

export const approveAllPendingResources = async (_req, res) => {
	try {
		const result = await Resource.updateMany(
			{ status: "pending" },
			{ $set: { status: "approved" } },
		);

		res.json({
			message: "All pending resources approved successfully",
			updatedCount: result.modifiedCount || 0,
		});
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to approve all pending resources" });
	}
};

export const deleteResource = async (req, res) => {
	try {
		const { id } = req.params;
		const resource = await Resource.findById(id);

		if (!resource) {
			return res.status(404).json({ message: "Resource not found" });
		}

		try {
			await imagekit.files.delete(resource.imagekitFileId);
		} catch (_error) {
			// Ignore ImageKit cleanup failures so admin deletion still works.
		}

		await Resource.findByIdAndDelete(id);
		res.json({ message: "Resource deleted" });
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to delete resource" });
	}
};

export const getUsers = async (_req, res) => {
	try {
		const users = await User.find()
			.select("name email role isBanned createdAt")
			.sort({ createdAt: -1 });

		res.json(users);
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to fetch users" });
	}
};

export const banUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { isBanned } = req.body;

		if (typeof isBanned !== "boolean") {
			return res.status(400).json({ message: "isBanned boolean is required" });
		}

		if (String(req.user._id) === String(id)) {
			return res.status(400).json({ message: "You cannot ban your own account" });
		}

		const target = await User.findById(id);
		if (!target) {
			return res.status(404).json({ message: "User not found" });
		}

		if (target.role === "admin") {
			return res.status(400).json({ message: "Admin accounts cannot be banned" });
		}

		target.isBanned = isBanned;
		await target.save();

		res.json({
			message: isBanned ? "User banned successfully" : "User unbanned successfully",
			user: {
				id: target._id,
				name: target.name,
				email: target.email,
				role: target.role,
				isBanned: target.isBanned,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to update user status" });
	}
};

export const getSubjects = async (_req, res) => {
	try {
		const semesterFilter = _req.query.semester ? toSemester(_req.query.semester, 0) : 0;
		const query = semesterFilter ? { semester: semesterFilter } : {};

		const subjectDocs = await Subject.find(query).sort({ semester: 1, name: 1 });
		const items = await Promise.all(
			subjectDocs.map(async (subject) => {
				const resources = await Resource.find({ subjectId: subject._id })
					.select("_id title type status semester subject")
					.sort({ createdAt: -1 });

				return {
					id: subject._id,
					name: subject.name,
					semester: subject.semester,
					resourceCount: resources.length,
					resources,
				};
			}),
		);

		const grouped = SEMESTERS.reduce((acc, sem) => {
			acc[String(sem)] = items.filter((item) => item.semester === sem);
			return acc;
		}, {});

		res.json({ success: true, items, grouped, semesters: SEMESTERS, defaults: SUBJECTS });
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to fetch subjects" });
	}
};

export const deleteSubject = async (req, res) => {
	try {
		const subjectIdentifier = normalizeSubjectName(decodeURIComponent(req.params.subjectName || ""));

		if (!subjectIdentifier) {
			return res.status(400).json({ message: "subjectName is required" });
		}

		const byId = await Subject.findById(subjectIdentifier);
		let resources = [];

		if (byId) {
			resources = await Resource.find({ subjectId: byId._id });
		} else {
			resources = await Resource.find({ subject: subjectIdentifier });
		}

		if (!resources.length && byId) {
			await Subject.findByIdAndDelete(byId._id);
			return res.json({
				message: "Subject removed successfully",
				deletedResources: 0,
			});
		}

		if (!resources.length) {
			return res.status(404).json({ message: "No resources found for this subject" });
		}

		await Promise.all(
			resources.map(async (resource) => {
				try {
					await imagekit.files.delete(resource.imagekitFileId);
				} catch (_error) {
					// Ignore ImageKit cleanup errors; proceed with DB cleanup.
				}
			}),
		);

		const deleteQuery = byId ? { subjectId: byId._id } : { subject: subjectIdentifier };
		const result = await Resource.deleteMany(deleteQuery);

		if (byId) {
			await Subject.findByIdAndDelete(byId._id);
		}

		res.json({
			message: "Subject removed successfully",
			deletedResources: result.deletedCount || 0,
		});
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to delete subject" });
	}
};

export const moveSubjectToSemester = async (req, res) => {
	try {
		const { subjectId, targetSemester } = req.body;
		const semester = toSemester(targetSemester, 0);

		if (!subjectId || !semester) {
			return res.status(400).json({ message: "subjectId and valid targetSemester are required" });
		}

		const subject = await Subject.findById(subjectId);
		if (!subject) {
			return res.status(404).json({ message: "Subject not found" });
		}

		const normalizedName = (subject.nameLower || subject.nameKey || subject.name || "").toLowerCase();

		const duplicate = await Subject.findOne({
			$or: [{ nameLower: normalizedName }, { nameKey: normalizedName }],
			semester,
			_id: { $ne: subject._id },
		});

		if (duplicate) {
			return res.status(409).json({
				message: "A same subject already exists in target semester. Delete or rename it first, then move this subject.",
				warningCode: "DUPLICATE_SUBJECT_IN_TARGET_SEMESTER",
				targetSubjectId: duplicate._id,
			});
		}

		subject.semester = semester;
		await subject.save();

		await Resource.updateMany(
			{ subjectId: subject._id },
			{ $set: { semester: semester, subject: subject.name } },
		);

		res.json({ message: "Subject moved successfully" });
	} catch (error) {
		res.status(500).json({ message: error.message || "Failed to move subject" });
	}
};
