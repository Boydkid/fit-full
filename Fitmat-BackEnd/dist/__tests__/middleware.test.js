"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
// Mock request
const createMockRequest = (headers = {}) => ({
    headers,
    authUser: undefined,
});
const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const createMockNext = () => jest.fn();
describe('Auth Middleware', () => {
    describe('attachAuthIfPresent', () => {
        it('should attach user to request if valid token is present', () => {
            const token = (0, jwt_1.generateToken)({ id: 1, email: 'test@example.com', role: 'USER' });
            const req = createMockRequest({ authorization: `Bearer ${token}` });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.attachAuthIfPresent)(req, res, next);
            expect(req.authUser).toBeDefined();
            expect(req.authUser?.id).toBe(1);
            expect(req.authUser?.email).toBe('test@example.com');
            expect(next).toHaveBeenCalled();
        });
        it('should not attach user if no token is present', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.attachAuthIfPresent)(req, res, next);
            expect(req.authUser).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
        it('should not attach user if token is invalid', () => {
            const req = createMockRequest({ authorization: 'Bearer invalid-token' });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.attachAuthIfPresent)(req, res, next);
            expect(req.authUser).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
        it('should not attach user if header does not start with Bearer', () => {
            const req = createMockRequest({ authorization: 'Invalid token-format' });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.attachAuthIfPresent)(req, res, next);
            expect(req.authUser).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
        it('should handle Authorization header (case insensitive)', () => {
            const token = (0, jwt_1.generateToken)({ id: 1, email: 'test@example.com', role: 'USER' });
            const req = createMockRequest({ Authorization: `Bearer ${token}` });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.attachAuthIfPresent)(req, res, next);
            expect(req.authUser).toBeDefined();
            expect(req.authUser?.id).toBe(1);
            expect(next).toHaveBeenCalled();
        });
    });
    describe('requireAuth', () => {
        it('should call next if valid token is present', () => {
            const token = (0, jwt_1.generateToken)({ id: 1, email: 'test@example.com', role: 'USER' });
            const req = createMockRequest({ authorization: `Bearer ${token}` });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAuth)(req, res, next);
            expect(req.authUser).toBeDefined();
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should return 401 if no token is present', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAuth)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token.' });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 if token is invalid', () => {
            const req = createMockRequest({ authorization: 'Bearer invalid-token' });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAuth)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('requireAdmin', () => {
        it('should call next if valid admin token is present', () => {
            const token = (0, jwt_1.generateToken)({ id: 1, email: 'admin@example.com', role: client_1.Role.ADMIN });
            const req = createMockRequest({ authorization: `Bearer ${token}` });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAdmin)(req, res, next);
            expect(req.authUser).toBeDefined();
            expect(req.authUser?.role).toBe(client_1.Role.ADMIN);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should return 403 if user is not admin', () => {
            const token = (0, jwt_1.generateToken)({ id: 1, email: 'user@example.com', role: 'USER' });
            const req = createMockRequest({ authorization: `Bearer ${token}` });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAdmin)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can perform this action.' });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 if no token is present', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAdmin)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token.' });
            expect(next).not.toHaveBeenCalled();
        });
        it('should return 401 if token is invalid', () => {
            const req = createMockRequest({ authorization: 'Bearer invalid-token' });
            const res = createMockResponse();
            const next = createMockNext();
            (0, auth_1.requireAdmin)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
