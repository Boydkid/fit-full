import { generateToken, verifyToken } from '../utils/jwt';

describe('JWT Utilities', () => {
  const testPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken({ ...testPayload, id: 1 });
      const token2 = generateToken({ ...testPayload, id: 2 });
      
      expect(token1).not.toBe(token2);
    });

    it('should accept custom options', () => {
      const token = generateToken(testPayload, { expiresIn: '2h' });
      
      expect(token).toBeDefined();
      const payload = verifyToken<typeof testPayload & { exp?: number }>(token);
      expect(payload).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken<typeof testPayload>(token);
      
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const token = generateToken(testPayload, { expiresIn: '-1h' });
      
      expect(() => {
        verifyToken(token);
      }).toThrow();
    });
  });

  describe('getJwtSecret', () => {
    it('should return JWT_SECRET from environment or fallback', () => {
      const { getJwtSecret } = require('../utils/jwt');
      const secret = getJwtSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      // If JWT_SECRET is not set, it should fallback to "mysecretkey"
      // If it is set, it should use that value
    });

    it('should use fallback JWT_SECRET when env var is not set', () => {
      // Save original env
      const originalSecret = process.env.JWT_SECRET;
      
      // Temporarily remove JWT_SECRET
      delete process.env.JWT_SECRET;
      
      // Reload the module to use fallback
      jest.resetModules();
      const { generateToken, verifyToken, getJwtSecret } = require('../utils/jwt');
      
      const secret = getJwtSecret();
      expect(secret).toBe('mysecretkey');
      
      // Generate and verify token with fallback secret
      const token = generateToken(testPayload);
      const decoded = verifyToken(token) as typeof testPayload;
      expect(decoded.id).toBe(testPayload.id);
      
      // Restore original env
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      }
      
      // Reload module again to restore
      jest.resetModules();
    });
  });
});


