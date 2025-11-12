"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = exports.attachAuthIfPresent = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const extractToken = (req) => {
    const header = (req.headers["authorization"] || req.headers["Authorization"]);
    if (!header)
        return undefined;
    if (header.startsWith("Bearer "))
        return header.slice("Bearer ".length);
    return undefined;
};
const attachAuthIfPresent = (req, _res, next) => {
    const token = extractToken(req);
    if (!token)
        return next();
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
    }
    catch (_e) {
        // ignore invalid token in attachment step; enforced by requireAuth/requireAdmin
    }
    return next();
};
exports.attachAuthIfPresent = attachAuthIfPresent;
const requireAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Missing authorization token." });
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
        return next();
    }
    catch (_e) {
        return res.status(401).json({ message: "Invalid token." });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Missing authorization token." });
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload?.role !== client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Only admins can perform this action." });
        }
        req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
        return next();
    }
    catch (_e) {
        return res.status(401).json({ message: "Invalid token." });
    }
};
exports.requireAdmin = requireAdmin;
