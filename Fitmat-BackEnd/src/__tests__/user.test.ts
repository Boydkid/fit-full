import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/user.routes';
import { generateToken } from '../utils/jwt';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User API', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;
  let testEmail: string;

  beforeAll(async () => {
    // Create admin user
    testEmail = `admin${Date.now()}@example.com`;
    // In real scenario, create admin via API or database
    // For now, we'll mock the token
    adminId = 1;
    userId = 2;
    adminToken = generateToken({ id: adminId, email: testEmail, role: 'ADMIN' });
    userToken = generateToken({ id: userId, email: `user${Date.now()}@example.com`, role: 'USER' });
  });

  describe('GET /api/users/roles', () => {
    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .get('/api/users/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only admins');
    });
  });

  describe('GET /api/users', () => {
    it('should return 403 if not admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only admins');
    });

    it('should return 401 if no token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.message).toContain('Missing');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 404 if user not found', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/users/:id/classes', () => {
    it('should return 400 for invalid id', async () => {
      const response = await request(app)
        .get('/api/users/invalid/classes')
        .expect(400);

      expect(response.body.message).toContain('valid number');
    });
  });

  describe('DELETE /api/users/:id/classes/:classId', () => {
    it('should return 400 for invalid ids', async () => {
      const response = await request(app)
        .delete('/api/users/invalid/classes/1')
        .expect(400);

      expect(response.body.message).toContain('valid number');
    });

    it('should return 400 for invalid classId', async () => {
      const response = await request(app)
        .delete('/api/users/1/classes/invalid')
        .expect(400);

      expect(response.body.message).toContain('valid number');
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should return 401 if no token', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .send({
          currentPassword: 'oldpass',
          newPassword: 'newpass',
        })
        .expect(401);

      expect(response.body.message).toContain('Missing');
    });

    it('should return 400 if missing passwords', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if new password too short', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'oldpass',
          newPassword: '12345', // Less than 6
        })
        .expect(400);

      expect(response.body.message).toContain('at least 6');
    });
  });
});

