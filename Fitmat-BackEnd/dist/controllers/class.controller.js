"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClass = exports.updateClass = exports.getClassById = exports.getMyClasses = exports.listTrainerClasses = exports.listClassEnrollments = exports.enrollInClass = exports.listUpcomingClasses = exports.listClasses = exports.createClass = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../utils/prisma"));
const USER_MEMBERSHIP_ROLES = new Set([
    client_1.Role.USER,
    client_1.Role.USER_BRONZE,
    client_1.Role.USER_GOLD,
    client_1.Role.USER_PLATINUM,
]);
const isUserMembershipRole = (role) => USER_MEMBERSHIP_ROLES.has(role);
const formatClass = (clazz) => {
    const enrollmentCount = clazz._count?.enrollments ?? 0;
    const availableSpots = clazz.capacity !== null && clazz.capacity !== undefined
        ? Math.max(clazz.capacity - enrollmentCount, 0)
        : null;
    return {
        id: clazz.id,
        title: clazz.title,
        description: clazz.description,
        startTime: clazz.startTime,
        endTime: clazz.endTime,
        capacity: clazz.capacity,
        createdAt: clazz.createdAt,
        updatedAt: clazz.updatedAt,
        createdBy: clazz.createdBy,
        trainer: clazz.trainer,
        category: clazz.category,
        requiredRole: clazz.requiredRole,
        enrollmentCount,
        availableSpots,
    };
};
const createClass = async (req, res) => {
    const { trainerId, categoryId, requiredRole, title, description, startTime, endTime, capacity, } = req.body;
    const authAdminId = req.authUser?.id;
    const hasAdmin = Boolean(authAdminId);
    if ((!hasAdmin) && (!trainerId || !title || !startTime || !endTime)) {
        return res.status(400).json({
            message: "admin authentication, trainerId, title, startTime, and endTime are required.",
        });
    }
    if (!trainerId || !title || !startTime || !endTime) {
        return res.status(400).json({
            message: "trainerId, title, startTime, and endTime are required.",
        });
    }
    if (requiredRole && !USER_MEMBERSHIP_ROLES.has(requiredRole)) {
        return res.status(400).json({
            message: "requiredRole must be one of USER, USER_BRONZE, USER_GOLD, USER_PLATINUM if provided.",
        });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: "startTime and endTime must be valid dates." });
    }
    if (end <= start) {
        return res.status(400).json({ message: "endTime must be after startTime." });
    }
    if (capacity !== undefined && capacity !== null && capacity <= 0) {
        return res
            .status(400)
            .json({ message: "capacity must be greater than zero if provided." });
    }
    try {
        const [admin, trainer, category] = await Promise.all([
            authAdminId ? prisma_1.default.user.findUnique({ where: { id: Number(authAdminId) } }) : Promise.resolve(null),
            prisma_1.default.user.findUnique({ where: { id: Number(trainerId) } }),
            categoryId !== undefined && categoryId !== null
                ? prisma_1.default.classCategory.findUnique({ where: { id: Number(categoryId) } })
                : Promise.resolve(null),
        ]);
        if (!admin || admin.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Only admins can create classes." });
        }
        if (!trainer || trainer.role !== client_1.Role.TRAINER) {
            return res.status(400).json({ message: "trainerId must reference a trainer user." });
        }
        if (categoryId && !category) {
            return res.status(400).json({ message: "categoryId must reference an existing category." });
        }
        const createdClass = await prisma_1.default.class.create({
            data: {
                title,
                description,
                startTime: start,
                endTime: end,
                capacity,
                createdById: admin.id,
                trainerId: trainer.id,
                categoryId: category ? category.id : null,
                requiredRole: requiredRole ?? null,
            },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
            },
        });
        return res.status(201).json(createdClass);
    }
    catch (error) {
        console.error("Failed to create class", error);
        return res.status(500).json({ message: "Failed to create class." });
    }
};
exports.createClass = createClass;
const listClasses = async (_req, res) => {
    try {
        const classes = await prisma_1.default.class.findMany({
            orderBy: { startTime: "asc" },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
                _count: { select: { enrollments: true } },
            },
        });
        const formatted = classes.map(formatClass);
        return res.json(formatted);
    }
    catch (error) {
        console.error("Failed to fetch classes", error);
        return res.status(500).json({ message: "Failed to fetch classes." });
    }
};
exports.listClasses = listClasses;
const listUpcomingClasses = async (req, res) => {
    try {
        // ใช้เวลาปัจจุบัน (UTC) เปรียบเทียบกับ startTime ที่เก็บใน DB
        const now = new Date();
        const classes = await prisma_1.default.class.findMany({
            where: {
                startTime: { gt: now },
                // ถ้ามีสถานะยกเลิก/ปิดรับ สามารถกรองเพิ่มได้ เช่น:
                // status: "ACTIVE",
            },
            orderBy: { startTime: "asc" },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
                _count: { select: { enrollments: true } },
            },
        });
        const formatted = classes.map(formatClass);
        return res.json(formatted);
    }
    catch (error) {
        console.error("Failed to fetch upcoming classes", error);
        return res.status(500).json({ message: "Failed to fetch upcoming classes." });
    }
};
exports.listUpcomingClasses = listUpcomingClasses;
const enrollInClass = async (req, res) => {
    const { classId } = req.params;
    // Use userId from authenticated token for security
    const authUser = req.authUser;
    const userId = authUser?.id;
    if (!classId) {
        return res.status(400).json({ message: "classId is required." });
    }
    if (!userId) {
        return res.status(401).json({ message: "Authentication required. Please log in to enroll." });
    }
    try {
        const clazz = await prisma_1.default.class.findUnique({
            where: { id: Number(classId) },
            include: {
                _count: { select: { enrollments: true } },
            },
        });
        if (!clazz) {
            return res.status(404).json({ message: "Class not found." });
        }
        if (clazz.startTime <= new Date()) {
            return res
                .status(400)
                .json({ message: "Cannot enroll in a class that has started or finished." });
        }
        if (clazz.capacity !== null &&
            clazz.capacity !== undefined &&
            clazz._count.enrollments >= clazz.capacity) {
            return res.status(400).json({ message: "Class is already full." });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: Number(userId) } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (clazz.requiredRole &&
            !isUserMembershipRole(user.role) &&
            user.role !== client_1.Role.ADMIN &&
            user.role !== client_1.Role.TRAINER) {
            return res.status(403).json({
                message: "This class is restricted to membership users.",
            });
        }
        if (clazz.requiredRole &&
            isUserMembershipRole(user.role) &&
            user.role !== clazz.requiredRole) {
            return res.status(403).json({
                message: `This class is only available to users with role ${clazz.requiredRole}.`,
            });
        }
        try {
            const enrollment = await prisma_1.default.classEnrollment.create({
                data: {
                    classId: clazz.id,
                    userId: user.id,
                },
            });
            return res.status(201).json(enrollment);
        }
        catch (error) {
            if (error instanceof Error && "code" in error && error.code === "P2002") {
                return res.status(409).json({ message: "User already enrolled in this class." });
            }
            throw error;
        }
    }
    catch (error) {
        console.error("Failed to enroll in class", error);
        return res.status(500).json({ message: "Failed to enroll in class." });
    }
};
exports.enrollInClass = enrollInClass;
const listClassEnrollments = async (req, res) => {
    const { classId } = req.params;
    if (!classId) {
        return res.status(400).json({ message: "classId parameter is required." });
    }
    try {
        const clazz = await prisma_1.default.class.findUnique({
            where: { id: Number(classId) },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
            },
        });
        if (!clazz) {
            return res.status(404).json({ message: "Class not found." });
        }
        const enrollments = await prisma_1.default.classEnrollment.findMany({
            where: { classId: Number(classId) },
            include: {
                user: { select: { id: true, email: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
        });
        return res.json({
            class: {
                id: clazz.id,
                title: clazz.title,
                description: clazz.description,
                startTime: clazz.startTime,
                endTime: clazz.endTime,
                capacity: clazz.capacity,
                createdBy: clazz.createdBy,
                trainer: clazz.trainer,
                category: clazz.category,
                requiredRole: clazz.requiredRole,
            },
            enrollments: enrollments.map((enrollment) => ({
                id: enrollment.id,
                createdAt: enrollment.createdAt,
                user: enrollment.user,
            })),
        });
    }
    catch (error) {
        console.error("Failed to fetch class enrollments", error);
        return res.status(500).json({ message: "Failed to fetch class enrollments." });
    }
};
exports.listClassEnrollments = listClassEnrollments;
const listTrainerClasses = async (req, res) => {
    const trainerId = Number(req.params.trainerId);
    const authUser = req.authUser;
    if (Number.isNaN(trainerId)) {
        return res.status(400).json({ message: "trainerId parameter must be a valid number." });
    }
    try {
        const trainer = await prisma_1.default.user.findUnique({ where: { id: trainerId } });
        if (!trainer || trainer.role !== client_1.Role.TRAINER) {
            return res.status(404).json({ message: "Trainer not found." });
        }
        // ถ้าเป็น trainer เอง ตรวจสอบว่าต้องเป็นคลาสของตัวเอง
        if (authUser?.id && authUser.role === client_1.Role.TRAINER && Number(authUser.id) !== trainerId) {
            return res.status(403).json({ message: "You can only view your own classes." });
        }
        const classes = await prisma_1.default.class.findMany({
            where: { trainerId },
            orderBy: { startTime: "asc" },
            include: {
                category: true,
                _count: { select: { enrollments: true } },
            },
        });
        const formatted = classes.map(formatClass);
        return res.json({ trainer: { id: trainer.id, email: trainer.email, username: trainer.username }, classes: formatted });
    }
    catch (error) {
        console.error("Failed to fetch trainer classes", error);
        return res.status(500).json({ message: "Failed to fetch trainer classes." });
    }
};
exports.listTrainerClasses = listTrainerClasses;
const getMyClasses = async (req, res) => {
    const authUser = req.authUser;
    const trainerId = authUser?.id;
    if (!trainerId) {
        return res.status(401).json({ message: "Authentication required." });
    }
    try {
        const trainer = await prisma_1.default.user.findUnique({ where: { id: Number(trainerId) } });
        if (!trainer || trainer.role !== client_1.Role.TRAINER) {
            return res.status(403).json({ message: "Only trainers can view their classes." });
        }
        const classes = await prisma_1.default.class.findMany({
            where: { trainerId: Number(trainerId) },
            orderBy: { startTime: "asc" },
            include: {
                category: true,
                _count: { select: { enrollments: true } },
            },
        });
        const formatted = classes.map(formatClass);
        return res.json({ trainer: { id: trainer.id, email: trainer.email, username: trainer.username }, classes: formatted });
    }
    catch (error) {
        console.error("Failed to fetch my classes", error);
        return res.status(500).json({ message: "Failed to fetch my classes." });
    }
};
exports.getMyClasses = getMyClasses;
const getClassById = async (req, res) => {
    const classId = Number(req.params.classId);
    if (Number.isNaN(classId)) {
        return res.status(400).json({ message: "classId must be a valid number." });
    }
    try {
        const clazz = await prisma_1.default.class.findUnique({
            where: { id: classId },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
                _count: { select: { enrollments: true } },
                enrollments: {
                    include: {
                        user: { select: { id: true, email: true, role: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!clazz) {
            return res.status(404).json({ message: "Class not found." });
        }
        const formatted = formatClass(clazz);
        return res.json({
            ...formatted,
            enrollments: clazz.enrollments.map((enrollment) => ({
                id: enrollment.id,
                createdAt: enrollment.createdAt,
                user: enrollment.user,
            })),
        });
    }
    catch (error) {
        console.error("Failed to fetch class", error);
        return res.status(500).json({ message: "Failed to fetch class." });
    }
};
exports.getClassById = getClassById;
const updateClass = async (req, res) => {
    const { classId } = req.params;
    const { trainerId, categoryId, requiredRole, title, description, startTime, endTime, capacity, } = req.body;
    const authAdminId = req.authUser?.id;
    if (!classId) {
        return res.status(400).json({ message: "classId is required." });
    }
    if (!authAdminId) {
        return res.status(401).json({ message: "Authentication required." });
    }
    const classIdNum = Number(classId);
    if (Number.isNaN(classIdNum)) {
        return res.status(400).json({ message: "classId must be a valid number." });
    }
    try {
        const admin = await prisma_1.default.user.findUnique({ where: { id: Number(authAdminId) } });
        if (!admin || admin.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Only admins can update classes." });
        }
        const existingClass = await prisma_1.default.class.findUnique({
            where: { id: classIdNum },
        });
        if (!existingClass) {
            return res.status(404).json({ message: "Class not found." });
        }
        if (requiredRole && !USER_MEMBERSHIP_ROLES.has(requiredRole)) {
            return res.status(400).json({
                message: "requiredRole must be one of USER, USER_BRONZE, USER_GOLD, USER_PLATINUM if provided.",
            });
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (capacity !== undefined) {
            if (capacity === null) {
                updateData.capacity = null;
            }
            else if (capacity <= 0) {
                return res.status(400).json({ message: "capacity must be greater than zero if provided." });
            }
            else {
                updateData.capacity = capacity;
            }
        }
        if (requiredRole !== undefined) {
            updateData.requiredRole = requiredRole || null;
        }
        if (startTime !== undefined || endTime !== undefined) {
            const start = startTime ? new Date(startTime) : new Date(existingClass.startTime);
            const end = endTime ? new Date(endTime) : new Date(existingClass.endTime);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return res.status(400).json({ message: "startTime and endTime must be valid dates." });
            }
            if (end <= start) {
                return res.status(400).json({ message: "endTime must be after startTime." });
            }
            updateData.startTime = start;
            updateData.endTime = end;
        }
        if (trainerId !== undefined) {
            const trainer = await prisma_1.default.user.findUnique({ where: { id: Number(trainerId) } });
            if (!trainer || trainer.role !== client_1.Role.TRAINER) {
                return res.status(400).json({ message: "trainerId must reference a trainer user." });
            }
            updateData.trainerId = trainer.id;
        }
        if (categoryId !== undefined) {
            if (categoryId === null) {
                updateData.categoryId = null;
            }
            else {
                const category = await prisma_1.default.classCategory.findUnique({
                    where: { id: Number(categoryId) },
                });
                if (!category) {
                    return res.status(400).json({ message: "categoryId must reference an existing category." });
                }
                updateData.categoryId = category.id;
            }
        }
        const updatedClass = await prisma_1.default.class.update({
            where: { id: classIdNum },
            data: updateData,
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                trainer: { select: { id: true, email: true, username: true, role: true } },
                category: true,
                _count: { select: { enrollments: true } },
            },
        });
        const formatted = formatClass(updatedClass);
        return res.json(formatted);
    }
    catch (error) {
        console.error("Failed to update class", error);
        return res.status(500).json({ message: "Failed to update class." });
    }
};
exports.updateClass = updateClass;
const deleteClass = async (req, res) => {
    const { classId } = req.params;
    const authAdminId = req.authUser?.id;
    if (!classId) {
        return res.status(400).json({ message: "classId is required." });
    }
    if (!authAdminId) {
        return res.status(401).json({ message: "Authentication required." });
    }
    const classIdNum = Number(classId);
    if (Number.isNaN(classIdNum)) {
        return res.status(400).json({ message: "classId must be a valid number." });
    }
    try {
        const admin = await prisma_1.default.user.findUnique({ where: { id: Number(authAdminId) } });
        if (!admin || admin.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Only admins can delete classes." });
        }
        const existingClass = await prisma_1.default.class.findUnique({
            where: { id: classIdNum },
            include: {
                _count: { select: { enrollments: true } },
            },
        });
        if (!existingClass) {
            return res.status(404).json({ message: "Class not found." });
        }
        // ลบ enrollments ก่อน (cascade delete)
        await prisma_1.default.classEnrollment.deleteMany({
            where: { classId: classIdNum },
        });
        // แล้วค่อยลบ class
        await prisma_1.default.class.delete({
            where: { id: classIdNum },
        });
        return res.json({ message: "Class deleted successfully." });
    }
    catch (error) {
        console.error("Failed to delete class", error);
        return res.status(500).json({ message: "Failed to delete class." });
    }
};
exports.deleteClass = deleteClass;
