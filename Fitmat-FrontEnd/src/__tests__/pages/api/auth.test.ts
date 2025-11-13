/**
 * @jest-environment node
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/auth';

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/auth', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'POST',
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('Method validation', () => {
    it('should return 405 for non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Method Not Allowed' });
    });
  });

  describe('Action validation', () => {
    it('should return 400 if action is missing', async () => {
      mockReq.body = {};

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing auth action.' });
    });
  });

  describe('Login action', () => {
    it('should return 400 if email is missing', async () => {
      mockReq.body = {
        action: 'login',
        payload: { password: 'password123' },
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email and password are required.' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com' },
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email and password are required.' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should forward login request to backend', async () => {
      const mockBackendResponse = {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com', role: 'USER' },
      };

      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'password123' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBackendResponse,
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockBackendResponse);
    });

    it('should handle backend errors', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'wrongpassword' },
      };

      // Mock fetch to throw error (simulating network or backend error)
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('Register action', () => {
    it('should return 400 if email is missing', async () => {
      mockReq.body = {
        action: 'register',
        payload: { password: 'password123' },
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email and password are required.' });
    });

    it('should forward register request to backend', async () => {
      const mockBackendResponse = {
        token: 'test-token',
        user: { id: 1, email: 'newuser@example.com', role: 'USER' },
      };

      mockReq.body = {
        action: 'register',
        payload: { email: 'newuser@example.com', password: 'password123' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockBackendResponse,
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'newuser@example.com', password: 'password123' }),
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockBackendResponse);
    });

    it('should handle registration errors', async () => {
      mockReq.body = {
        action: 'register',
        payload: { email: 'existing@example.com', password: 'password123' },
      };

      // Mock fetch to throw error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Email already exists')
      );

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });
  });

  describe('Logout action', () => {
    it('should return success for logout', async () => {
      mockReq.body = {
        action: 'logout',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Unsupported action', () => {
    it('should return 400 for unsupported action', async () => {
      mockReq.body = {
        action: 'invalid',
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unsupported auth action.' });
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'password123' },
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Network error' });
    });

    it('should handle non-Error exceptions', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'password123' },
      };

      // Mock fetch to reject with non-Error value
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unexpected server error.' });
    });

    it('should handle backend response errors', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'password123' },
      };

      // Mock fetch to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should handle JSON parse errors in fetch', async () => {
      mockReq.body = {
        action: 'login',
        payload: { email: 'test@example.com', password: 'password123' },
      };

      // Mock fetch to return response that fails to parse JSON
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      // Should handle the error and return generic message
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});

