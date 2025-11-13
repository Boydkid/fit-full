import request from 'supertest';
import express from 'express';
import contactRoutes from '../routes/contact.routes';
import { generateToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/api/contact', contactRoutes);

describe('Contact API', () => {
  let adminToken: string;
  let adminId: number;

  beforeAll(async () => {
    adminId = 999997;
    adminToken = generateToken({ id: adminId, email: 'admin@contact.test.com', role: Role.ADMIN });
    
    await prisma.user.upsert({
      where: { id: adminId },
      update: {},
      create: {
        id: adminId,
        email: 'admin@contact.test.com',
        passwordHash: 'hash',
        role: Role.ADMIN,
      },
    });
  });

  afterAll(async () => {
    await prisma.contactRequest.deleteMany({ where: { email: { contains: '@test.com' } } }).catch(() => {});
    await prisma.classEnrollment.deleteMany({ where: { userId: adminId } }).catch(() => {});
    await prisma.class.deleteMany({ where: { OR: [{ createdById: adminId }, { trainerId: adminId }] } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: adminId } }).catch(() => {});
  });

  describe('POST /api/contact', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          // missing other fields
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should create contact request successfully', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'testuser@test.com',
          phoneNumber: '1234567890',
          subject: 'Test Subject',
          message: 'Test message content',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('testuser@test.com');
      expect(response.body.phoneNumber).toBe('1234567890');
      expect(response.body.subject).toBe('Test Subject');
      expect(response.body.message).toBe('Test message content');
    }, 20000); // Set timeout to 20 seconds for email operations

    it('should handle missing email configuration gracefully', async () => {
      // Even if email is not configured, the contact should still be saved
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User 2',
          email: 'testuser2@test.com',
          phoneNumber: '1234567891',
          subject: 'Test Subject 2',
          message: 'Test message content 2',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    }, 20000); // Set timeout to 20 seconds for email operations
  });

  describe('GET /api/contact', () => {
    it('should return 401 if no token', async () => {
      const response = await request(app)
        .get('/api/contact')
        .expect(401);

      expect(response.body.message).toContain('Missing');
    });

    it('should return 403 if user is not admin', async () => {
      const userToken = generateToken({ id: 999996, email: 'user@test.com', role: Role.USER });
      const response = await request(app)
        .get('/api/contact')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only admins');
    });

    it('should return list of contacts for admin', async () => {
      const response = await request(app)
        .get('/api/contact')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('email');
        expect(response.body[0]).toHaveProperty('subject');
        expect(response.body[0]).toHaveProperty('message');
      }
    });
  });
});

