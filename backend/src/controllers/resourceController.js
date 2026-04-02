import { Readable } from "stream";
import imagekit from "../config/imagekit.js";
import Resource from "../models/Resource.js";
import Subject from "../models/Subject.js";
import Vote from "../models/Vote.js";
import { SUBJECTS } from "../utils/subjects.js";

const DEFAULT_PAGINATION = {
	page: 1,
	limit: 10,
};

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const normalizeSort = (sort) => {
	if (sort === "top") {
		return { upvotes: -1, createdAt: -1 };
	}

	return { createdAt: -1 };
};

const normalizeSubjectName = (value) => (value || "").trim();

const normalizeSemester = (value, fallback = 6) => {
	const semesterNumber = Number(value);
	if (!SEMESTERS.includes(semesterNumber)) {
		return fallback;
	}

	return semesterNumber;
};

const toSubjectLabel = (subjectDoc) => ({
	id: subjectDoc._id,
	name: subjectDoc.name,
	semester: subjectDoc.semester,
});

export const getAvailableSemesters = async (_req, res) => {
	res.json({ success: true, items: SEMESTERS });
};

export const getAvailableSubjects = async (req, res) => {
	try {
		const requestedSemester = req?.query?.semester;
		const semester = requestedSemester ? normalizeSemester(requestedSemester, 0) : 0;

		const subjectQuery = {};
		if (semester) {
			subjectQuery.semester = semester;
		}

		const subjectDocs = await Subject.find(subjectQuery).sort({ semester: 1, name: 1 });
		const fallbackDefaults = SUBJECTS.map((name) => ({ name, semester: 6 }));
		const combined = [...fallbackDefaults, ...subjectDocs.map((item) => ({ name: item.name, semester: item.semester }))];

		const seen = new Set();
		const merged = combined.filter((item) => {
			const key = `${item.semester}-${item.name.toLowerCase()}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});

		const grouped = SEMESTERS.reduce((acc, sem) => {
			acc[String(sem)] = merged
				.filter((item) => item.semester === sem)
				.map((item) => item.name)
				.sort((a, b) => a.localeCompare(b));
			return acc;
		}, {});

		const records = merged
			.map((item) => ({ name: item.name, semester: item.semester }))
			.sort((a, b) => {
				if (a.semester !== b.semester) {
					return a.semester - b.semester;
				}
				return a.name.localeCompare(b.name);
			});

		const groupedRecords = SEMESTERS.reduce((acc, sem) => {
			acc[String(sem)] = records.filter((item) => item.semester === sem);
			return acc;
		}, {});

		const items = semester ? grouped[String(semester)] || [] : merged.map((item) => item.name);

		res.json({ success: true, items, grouped, records, groupedRecords, semesters: SEMESTERS });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to fetch subjects" });
	}
};

export const listResources = async (req, res) => {
	try {
		const { subject, subjectId, semester: semesterRaw, type, search, sort = "latest", status } = req.query;
		const page = Number(req.query.page) || DEFAULT_PAGINATION.page;
		const limit = Number(req.query.limit) || DEFAULT_PAGINATION.limit;
		const skip = (page - 1) * limit;

		const query = {};
		const semester = normalizeSemester(semesterRaw, 0);
		if (semester) {
			query.semester = semester;
		}

		if (subject) {
			query.subject = normalizeSubjectName(subject);
		}

		if (subjectId) {
			query.subjectId = subjectId;
		}

		if (type) {
			query.type = type;
		}

		if (req.user?.role !== "admin") {
			query.status = "approved";
		} else if (status) {
			query.status = status;
		}

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		const totalItems = await Resource.countDocuments(query);
		const items = await Resource.find(query)
			.populate("uploadedBy", "name")
			.sort(normalizeSort(sort))
			.skip(skip)
			.limit(limit);

		const totalPages = Math.ceil(totalItems / limit) || 1;

		res.json({
			success: true,
			items,
			pagination: {
				page,
				limit,
				totalItems,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to fetch resources" });
	}
};

export const getSubjectResources = async (req, res) => {
	try {
		const subject = normalizeSubjectName(req.params.subject || req.params.subjectName);
		const semester = normalizeSemester(req.params.semester || req.query.semester, 0);
		const page = Number(req.query.page) || DEFAULT_PAGINATION.page;
		const limit = Number(req.query.limit) || DEFAULT_PAGINATION.limit;
		const skip = (page - 1) * limit;

		const query = { subject, status: "approved" };
		if (semester) {
			query.semester = semester;
		}

		const totalItems = await Resource.countDocuments(query);
		const items = await Resource.find(query)
			.populate("uploadedBy", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const totalPages = Math.ceil(totalItems / limit) || 1;

		res.json({
			success: true,
			items,
			pagination: {
				page,
				limit,
				totalItems,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to fetch subject resources" });
	}
};

export const getResourceById = async (req, res) => {
	try {
		const { id } = req.params;

		const query = { _id: id };
		if (req.user?.role !== "admin") {
			query.status = "approved";
		}

		const item = await Resource.findOne(query).populate("uploadedBy", "name");
		if (!item) {
			return res.status(404).json({ success: false, message: "Resource not found" });
		}

		res.json({ success: true, item });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to fetch resource" });
	}
};

export const uploadResource = async (req, res) => {
	try {
		const { title, type, description } = req.body;
		const semester = normalizeSemester(req.body.semester, 6);
		const subject = normalizeSubjectName(req.body.subjectName || req.body.subject);

		if (!title || !subject || !type || !description) {
			return res.status(400).json({ success: false, message: "All fields are required" });
		}

		if (subject.length < 3 || subject.length > 120) {
			return res.status(400).json({
				success: false,
				message: "Subject should be between 3 and 120 characters",
			});
		}

		if (!["notes", "suggestion", "pyq", "solution"].includes(type)) {
			return res.status(400).json({ success: false, message: "Invalid resource type" });
		}

		if (!req.file) {
			return res.status(400).json({ success: false, message: "PDF file is required" });
		}

		const subjectLower = subject.toLowerCase();
		const existingInOtherSemester = await Subject.findOne({
			$or: [{ nameLower: subjectLower }, { nameKey: subjectLower }],
			semester: { $ne: semester },
		});

		if (existingInOtherSemester) {
			return res.status(409).json({
				success: false,
				message: `This subject already exists in Semester ${existingInOtherSemester.semester}. Upload canceled to avoid duplicate subject across semesters.`,
				warningCode: "SUBJECT_EXISTS_OTHER_SEMESTER",
				existingSemester: existingInOtherSemester.semester,
			});
		}

		let subjectDoc = await Subject.findOne({
			semester,
			$or: [{ nameLower: subjectLower }, { nameKey: subjectLower }],
		});
		if (!subjectDoc) {
			subjectDoc = await Subject.create({
				department: "ECE",
				name: subject,
				nameKey: subjectLower,
				nameLower: subjectLower,
				semester,
				createdBy: req.user?._id,
			});
		}

		const duplicate = await Resource.findOne({
			title: title.trim(),
			subjectId: subjectDoc._id,
		});

		if (duplicate) {
			return res.status(409).json({
				success: false,
				message: "A resource with this title and subject already exists",
			});
		}

		// ImageKit expects base64/url/input file.
		const base64File = req.file.buffer.toString("base64");
		const uploaded = await imagekit.files.upload({
			file: base64File,
			fileName: `${Date.now()}-${req.file.originalname.replace(/\s+/g, "-")}`,
			folder: "/ece-examhub/resources",
			useUniqueFileName: true,
		});

		const resource = await Resource.create({
			title,
			subject,
			subjectId: subjectDoc._id,
			semester,
			type,
			description,
			fileURL: uploaded.url,
			imagekitFileId: uploaded.fileId,
			uploadedBy: req.user._id,
			status: "pending",
		});

		const populated = await resource.populate("uploadedBy", "name");

		res.status(201).json({
			success: true,
			message: "Resource uploaded and pending admin approval",
			resource: populated,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Upload failed" });
	}
};

export const upvoteResource = async (req, res) => {
	try {
		const { resourceId } = req.body;
		if (!resourceId) {
			return res.status(400).json({ success: false, message: "resourceId is required" });
		}

		const resource = await Resource.findById(resourceId);
		if (!resource || resource.status !== "approved") {
			return res.status(404).json({ success: false, message: "Resource not found" });
		}

		const existingVote = await Vote.findOne({
			userId: req.user._id,
			resourceId,
		});

		if (existingVote) {
			await Vote.deleteOne({ _id: existingVote._id });
			resource.upvotes = Math.max((resource.upvotes || 0) - 1, 0);
			await resource.save();

			return res.json({
				success: true,
				message: "Upvote removed",
				upvotes: resource.upvotes,
				voted: false,
			});
		}

		await Vote.create({ userId: req.user._id, resourceId });
		resource.upvotes = (resource.upvotes || 0) + 1;
		await resource.save();

		res.json({
			success: true,
			message: "Upvoted successfully",
			upvotes: resource.upvotes,
			voted: true,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Upvote failed" });
	}
};

export const downloadResourceFile = async (req, res) => {
	try {
		const { id } = req.params;
		const resource = await Resource.findById(id);
		if (!resource || resource.status !== "approved") {
			return res.status(404).json({ success: false, message: "Resource not found" });
		}

		const remote = await fetch(resource.fileURL);
		if (!remote.ok || !remote.body) {
			return res.status(500).json({ success: false, message: "Failed to download file" });
		}

		resource.downloadCount = (resource.downloadCount || 0) + 1;
		await resource.save();

		const safeTitle = (resource.title || "resource")
			.replace(/[^a-zA-Z0-9\s-_]/g, "")
			.trim()
			.replace(/\s+/g, "_");

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename="${safeTitle || "resource"}.pdf"`);

		Readable.fromWeb(remote.body).pipe(res);
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Download failed" });
	}
};

export const recordDownload = async (req, res) => {
	try {
		const { id } = req.params;
		const resource = await Resource.findById(id);
		if (!resource || resource.status !== "approved") {
			return res.status(404).json({ success: false, message: "Resource not found" });
		}

		resource.downloadCount = (resource.downloadCount || 0) + 1;
		await resource.save();

		res.json({ success: true, message: "Download recorded", downloadCount: resource.downloadCount });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to record download" });
	}
};

export const recordPreview = async (req, res) => {
	try {
		const { id } = req.params;
		const resource = await Resource.findById(id);
		if (!resource || resource.status !== "approved") {
			return res.status(404).json({ success: false, message: "Resource not found" });
		}

		resource.previewCount = (resource.previewCount || 0) + 1;
		await resource.save();

		res.json({ success: true, message: "Preview recorded", previewCount: resource.previewCount });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to record preview" });
	}
};

export const getContributorLeaderboard = async (_req, res) => {
	try {
		const items = await Resource.aggregate([
			{
				$group: {
					_id: "$uploadedBy",
					uploadCount: { $sum: 1 },
				},
			},
			{ $sort: { uploadCount: -1 } },
			{ $limit: 10 },
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "_id",
					as: "user",
				},
			},
			{ $unwind: "$user" },
			{
				$project: {
					_id: 0,
					userId: "$user._id",
					name: "$user.name",
					email: "$user.email",
					uploadCount: 1,
				},
			},
		]);

		res.json({ success: true, items });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to fetch leaderboard" });
	}
};

export const checkSubjectSemesterConflict = async (req, res) => {
	try {
		const semester = normalizeSemester(req.query.semester, 6);
		const subjectName = normalizeSubjectName(req.query.subjectName || req.query.subject || "");

		if (!subjectName) {
			return res.status(400).json({ success: false, message: "subjectName is required" });
		}

		const existing = await Subject.findOne({
			$or: [{ nameLower: subjectName.toLowerCase() }, { nameKey: subjectName.toLowerCase() }],
			semester: { $ne: semester },
		});

		if (!existing) {
			return res.json({ success: true, hasConflict: false });
		}

		res.json({
			success: true,
			hasConflict: true,
			existingSemester: existing.semester,
			message: `This subject already exists in Semester ${existing.semester}. Are you sure you want to add it to Semester ${semester}?`,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message || "Failed to check subject conflict" });
	}
};
