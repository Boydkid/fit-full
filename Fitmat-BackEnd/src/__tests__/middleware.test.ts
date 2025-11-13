import { Request, Response, NextFunction } from 'express';
import { attachAuthIfPresent, requireAuth, requireAdmin } from '../middleware/auth';
import { generateToken, verifyToken } from '../utils/jwt';
import { Role } from '@prisma/client';

// Mock request
const createMockRequest = (headers: any = {}) => ({
  headers,
  authUser: undefined,
} as unknown as Request);

const createMockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn() as NextFunction;

describe('Auth Middleware', () => {
  describe('attachAuthIfPresent', () => {
    it('should attach user to request if valid token is present', () => {
      const token = generateToken({ id: 1, email: 'test@example.com', role: 'USER' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = createMockNext();

      attachAuthIfPresent(req, res, next);

      expect(req.authUser).toBeDefined();
      expect(req.authUser?.id).toBe(1);
      expect(req.authUser?.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should not attach user if no token is present', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      attachAuthIfPresent(req, res, next);

      expect(req.authUser).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should not attach user if token is invalid', () => {
      const req = createMockRequest({ authorization: 'Bearer invalid-token' });
      const res = createMockResponse();
      const next = createMockNext();

      attachAuthIfPresent(req, res, next);

      expect(req.authUser).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should not attach user if header does not start with Bearer', () => {
      const req = createMockRequest({ authorization: 'Invalid token-format' });
      const res = createMockResponse();
      const next = createMockNext();

      attachAuthIfPresent(req, res, next);

      expect(req.authUser).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should handle Authorization header (case insensitive)', () => {
      const token = generateToken({ id: 1, email: 'test@example.com', role: 'USER' });
      const req = createMockRequest({ Authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = createMockNext();

      attachAuthIfPresent(req, res, next);

      expect(req.authUser).toBeDefined();
      expect(req.authUser?.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should call next if valid token is present', () => {
      const token = generateToken({ id: 1, email: 'test@example.com', role: 'USER' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = createMockNext();

      requireAuth(req, res, next);

      expect(req.authUser).toBeDefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token is present', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      const req = createMockRequest({ authorization: 'Bearer invalid-token' });
      const res = createMockResponse();
      const next = createMockNext();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next if valid admin token is present', () => {
      const token = generateToken({ id: 1, email: 'admin@example.com', role: Role.ADMIN });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(req.authUser).toBeDefined();
      expect(req.authUser?.role).toBe(Role.ADMIN);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
      const token = generateToken({ id: 1, email: 'user@example.com', role: 'USER' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can perform this action.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if no token is present', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      const req = createMockRequest({ authorization: 'Bearer invalid-token' });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});


