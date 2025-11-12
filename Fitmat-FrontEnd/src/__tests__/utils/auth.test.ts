/**
 * @jest-environment jsdom
 */

import {
  parseJwt,
  isTokenValid,
  getCurrentUser,
  clearAuth,
  setAuth,
  isAuthenticated,
  hasRole,
  isAdmin,
  logout,
  login,
  register,
} from '../../utils/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('parseJwt', () => {
    it('should parse a valid JWT token', () => {
      // Create a simple mock JWT token
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: Math.floor(Date.now() / 1000) + 3600 };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const signature = 'signature';
      const token = `${header}.${body}.${signature}`;

      const result = parseJwt(token);
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe(payload.id);
      expect(result?.email).toBe(payload.email);
      expect(result?.role).toBe(payload.role);
    });

    it('should return null for invalid token', () => {
      const result = parseJwt('invalid.token');
      expect(result).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      const result = isTokenValid(token);
      expect(result).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: pastExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      const result = isTokenValid(token);
      expect(result).toBe(false);
    });

    it('should return false for token without exp', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'USER' };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      const result = isTokenValid(token);
      expect(result).toBe(false);
    });
  });

  describe('setAuth and clearAuth', () => {
    it('should set auth data in localStorage', () => {
      setAuth('test-token', 'USER');
      
      expect(localStorageMock.getItem('token')).toBe('test-token');
      expect(localStorageMock.getItem('role')).toBe('USER');
    });

    it('should clear auth data from localStorage', () => {
      setAuth('test-token', 'USER');
      clearAuth();

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(localStorageMock.getItem('role')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null if no token exists', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null for invalid token', () => {
      localStorageMock.setItem('token', 'invalid.token');
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const user = getCurrentUser();

      expect(user).toBeTruthy();
      expect(user?.id).toBe(1);
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe('USER');
    });

    it('should clear invalid token automatically', () => {
      localStorageMock.setItem('token', 'invalid.token');
      getCurrentUser();

      expect(localStorageMock.getItem('token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if no token exists', () => {
      const result = isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: pastExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'test@example.com', role: 'ADMIN', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = hasRole('ADMIN');

      expect(result).toBe(true);
    });

    it('should return false if user does not have the specified role', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'test@example.com', role: 'USER', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = hasRole('ADMIN');

      expect(result).toBe(false);
    });

    it('should return false if user is not authenticated', () => {
      const result = hasRole('ADMIN');
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is admin', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'admin@example.com', role: 'ADMIN', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = isAdmin();

      expect(result).toBe(true);
    });

    it('should return false if user is not admin', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { id: 1, email: 'user@example.com', role: 'USER', exp: futureExp };
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const token = `${header}.${body}.signature`;

      localStorageMock.setItem('token', token);
      const result = isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should call logout API and clear auth data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      setAuth('test-token', 'USER');
      await logout();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout',
        }),
      });

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(localStorageMock.getItem('role')).toBeNull();
    });

    it('should clear auth data even if API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      setAuth('test-token', 'USER');
      await logout();

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(localStorageMock.getItem('role')).toBeNull();
    });

    it('should clear auth data even if API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      setAuth('test-token', 'USER');
      await logout();

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(localStorageMock.getItem('role')).toBeNull();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should successfully login and return auth response', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'USER',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await login('test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          payload: { email: 'test@example.com', password: 'password123' },
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if login fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw default error message if no message provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Login failed'
      );
    });
  });

  describe('register', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should successfully register and return auth response', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: 1,
          email: 'newuser@example.com',
          role: 'USER',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await register('newuser@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          payload: { email: 'newuser@example.com', password: 'password123' },
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if registration fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Email already exists' }),
      });

      await expect(register('existing@example.com', 'password123')).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should throw default error message if no message provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      await expect(register('test@example.com', 'password123')).rejects.toThrow(
        'Registration failed'
      );
    });
  });
});

