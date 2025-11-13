import request from 'supertest';
import express from 'express';
import classRoutes from '../routes/class.routes';
import { generateToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/api/classes', classRoutes);

describe('Class API', () => {
  let adminToken: string;
  let adminId: number;
  let trainerToken: string;
  let trainerId: number;
  let userToken: string;
  let userId: number;
  let categoryId: number;
  let classId: number;

  beforeAll(async () => {
    adminId = 999993;
    trainerId = 999992;
    userId = 999991;
    
    adminToken = generateToken({ id: adminId, email: 'admin@class.test.com', role: Role.ADMIN });
    trainerToken = generateToken({ id: trainerId, email: 'trainer@class.test.com', role: Role.TRAINER });
    userToken = generateToken({ id: userId, email: 'user@class.test.com', role: Role.USER });
    
    // Create admin
    await prisma.user.upsert({
      where: { id: adminId },
      update: {},
      create: {
        id: adminId,
        email: 'admin@class.test.com',
        passwordHash: 'hash',
        role: Role.ADMIN,
      },
    });
    
    // Create trainer
    await prisma.user.upsert({
      where: { id: trainerId },
      update: {},
      create: {
        id: trainerId,
        email: 'trainer@class.test.com',
        passwordHash: 'hash',
        role: Role.TRAINER,
      },
    });
    
    // Create user
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'user@class.test.com',
        passwordHash: 'hash',
        role: Role.USER,
      },
    });
    
    // Create category
    const category = await prisma.classCategory.create({
      data: {
        name: 'Test Class Category',
        description: 'Test category',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    // Delete in correct order to avoid foreign key constraints
    if (classId) {
      await prisma.classEnrollment.deleteMany({ where: { classId } });
      await prisma.class.deleteMany({ where: { id: classId } });
    }
    await prisma.classCategory.delete({ where: { id: categoryId } }).catch(() => {});
    // Delete all classes created by these users first
    await prisma.classEnrollment.deleteMany({ where: { userId: { in: [adminId, trainerId, userId] } } }).catch(() => {});
    await prisma.class.deleteMany({ where: { OR: [{ createdById: { in: [adminId, trainerId, userId] } }, { trainerId: { in: [adminId, trainerId, userId] } }] } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, trainerId, userId] } } }).catch(() => {});
  });

  describe('POST /api/classes', () => {
    it('should return 401 if no token', async () => {
      const response = await request(app)
        .post('/api/classes')
        .send({
          trainerId,
          title: 'Test Class',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
        })
        .expect(401);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          trainerId,
          title: 'Test Class',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
        })
        .expect(403);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId,
          // missing title, startTime, endTime
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });

    it('should return 400 if trainerId does not reference a trainer', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId: userId, // user is not a trainer
          title: 'Test Class',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
        })
        .expect(400);

      expect(response.body.message).toContain('trainer');
    });

    it('should return 400 if endTime is before or equal to startTime', async () => {
      const startTime = new Date(Date.now() + 86400000);
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId,
          title: 'Test Class',
          startTime: startTime.toISOString(),
          endTime: startTime.toISOString(), // same as startTime
        })
        .expect(400);

      expect(response.body.message).toContain('after startTime');
    });

    it('should return 400 if capacity is invalid', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId,
          title: 'Test Class',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          capacity: -1, // invalid
        })
        .expect(400);

      expect(response.body.message).toContain('greater than zero');
    });

    it('should return 400 if requiredRole is invalid', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId,
          title: 'Test Class',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          requiredRole: Role.ADMIN, // invalid role
        })
        .expect(400);

      expect(response.body.message).toContain('must be one of');
    });

    it('should create class successfully', async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(Date.now() + 90000000);
      
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainerId,
          categoryId,
          title: 'Test Class Created',
          description: 'Test description',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          capacity: 20,
          requiredRole: Role.USER_BRONZE,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Class Created');
      expect(response.body.trainer).toBeDefined();
      expect(response.body.category).toBeDefined();
      classId = response.body.id;
    });
  });

  describe('GET /api/classes', () => {
    it('should return list of classes', async () => {
      const response = await request(app)
        .get('/api/classes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('enrollmentCount');
        expect(response.body[0]).toHaveProperty('availableSpots');
      }
    });
  });

  describe('GET /api/classes/listclassupcoming', () => {
    it('should return list of upcoming classes', async () => {
      const response = await request(app)
        .get('/api/classes/listclassupcoming')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        const clazz = response.body[0];
        expect(new Date(clazz.startTime).getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe('GET /api/classes/:classId', () => {
    it('should return 400 if classId is invalid', async () => {
      const response = await request(app)
        .get('/api/classes/invalid')
        .expect(400);

      expect(response.body.message).toContain('valid number');
    });

    it('should return 404 if class not found', async () => {
      const response = await request(app)
        .get('/api/classes/999999')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return class by id', async () => {
      if (classId) {
        const response = await request(app)
          .get(`/api/classes/${classId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('enrollments');
        expect(Array.isArray(response.body.enrollments)).toBe(true);
      }
    });
  });

  describe('POST /api/classes/:classId/enroll', () => {
    it('should return 401 if no token', async () => {
      const response = await request(app)
        .post(`/api/classes/${classId}/enroll`)
        .expect(401);

      expect(response.body.message).toContain('Missing authorization token');
    });

    it('should return 400 if classId is missing', async () => {
      const response = await request(app)
        .post('/api/classes//enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 if class not found', async () => {
      const response = await request(app)
        .post('/api/classes/999999/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 if class has started', async () => {
      // Create a past class
      const pastStartTime = new Date(Date.now() - 86400000);
      const pastEndTime = new Date(Date.now() - 86000000);
      
      const pastClass = await prisma.class.create({
        data: {
          title: 'Past Class',
          startTime: pastStartTime,
          endTime: pastEndTime,
          createdById: adminId,
          trainerId,
        },
      });

      const response = await request(app)
        .post(`/api/classes/${pastClass.id}/enroll`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.message).toContain('started or finished');
      
      await prisma.class.delete({ where: { id: pastClass.id } });
    });

    it('should return 400 if class is full', async () => {
      if (classId) {
        // Create a class with capacity 1
        const limitedClass = await prisma.class.create({
          data: {
            title: 'Limited Class',
            startTime: new Date(Date.now() + 86400000),
            endTime: new Date(Date.now() + 90000000),
            capacity: 1,
            createdById: adminId,
            trainerId,
          },
        });

        // Enroll first user
        await prisma.classEnrollment.create({
          data: {
            classId: limitedClass.id,
            userId,
          },
        });

        // Try to enroll another user
        const otherUser = await prisma.user.create({
          data: {
            email: `otheruser${Date.now()}@test.com`,
            passwordHash: 'hash',
            role: Role.USER,
          },
        });

        const otherToken = generateToken({ id: otherUser.id, email: otherUser.email, role: Role.USER });

        const response = await request(app)
          .post(`/api/classes/${limitedClass.id}/enroll`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(400);

        expect(response.body.message).toContain('already full');
        
        await prisma.classEnrollment.deleteMany({ where: { classId: limitedClass.id } });
        await prisma.class.delete({ where: { id: limitedClass.id } });
        await prisma.user.delete({ where: { id: otherUser.id } });
      }
    });

    it('should return 403 if user role does not meet requiredRole', async () => {
      if (classId) {
        // Create a class requiring USER_GOLD
        const restrictedClass = await prisma.class.create({
          data: {
            title: 'Restricted Class',
            startTime: new Date(Date.now() + 86400000),
            endTime: new Date(Date.now() + 90000000),
            requiredRole: Role.USER_GOLD,
            createdById: adminId,
            trainerId,
          },
        });

        // User has Role.USER, not USER_GOLD
        const response = await request(app)
          .post(`/api/classes/${restrictedClass.id}/enroll`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.message).toContain('only available');
        
        await prisma.class.delete({ where: { id: restrictedClass.id } });
      }
    });

    it('should enroll user successfully', async () => {
      if (classId) {
        // Create a class without restrictions
        const openClass = await prisma.class.create({
          data: {
            title: 'Open Class',
            startTime: new Date(Date.now() + 86400000),
            endTime: new Date(Date.now() + 90000000),
            createdById: adminId,
            trainerId,
          },
        });

        const response = await request(app)
          .post(`/api/classes/${openClass.id}/enroll`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('classId');
        expect(response.body).toHaveProperty('userId');
        
        await prisma.classEnrollment.deleteMany({ where: { classId: openClass.id } });
        await prisma.class.delete({ where: { id: openClass.id } });
      }
    });

    it('should return 409 if user already enrolled', async () => {
      if (classId) {
        const openClass = await prisma.class.create({
          data: {
            title: 'Open Class 2',
            startTime: new Date(Date.now() + 86400000),
            endTime: new Date(Date.now() + 90000000),
            createdById: adminId,
            trainerId,
          },
        });

        // Enroll first time
        await request(app)
          .post(`/api/classes/${openClass.id}/enroll`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);

        // Try to enroll again
        const response = await request(app)
          .post(`/api/classes/${openClass.id}/enroll`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(409);

        expect(response.body.message).toContain('already enrolled');
        
        await prisma.classEnrollment.deleteMany({ where: { classId: openClass.id } });
        await prisma.class.delete({ where: { id: openClass.id } });
      }
    });
  });

  describe('GET /api/classes/:classId/enrollments', () => {
    it('should return 400 if classId is missing', async () => {
      const response = await request(app)
        .get('/api/classes//enrollments')
        .expect(404);
    });

    it('should return 404 if class not found', async () => {
      const response = await request(app)
        .get('/api/classes/999999/enrollments')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return class enrollments', async () => {
      if (classId) {
        const response = await request(app)
          .get(`/api/classes/${classId}/enrollments`)
          .expect(200);

        expect(response.body).toHaveProperty('class');
        expect(response.body).toHaveProperty('enrollments');
        expect(Array.isArray(response.body.enrollments)).toBe(true);
      }
    });
  });

  describe('GET /api/classes/trainer/:trainerId', () => {
    it('should return 400 if trainerId is invalid', async () => {
      const response = await request(app)
        .get('/api/classes/trainer/invalid')
        .expect(400);

      expect(response.body.message).toContain('valid number');
    });

    it('should return 404 if trainer not found', async () => {
      const response = await request(app)
        .get('/api/classes/trainer/999999')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 403 if trainer tries to view another trainer\'s classes', async () => {
      const otherTrainer = await prisma.user.create({
        data: {
          email: `othertrainer${Date.now()}@test.com`,
          passwordHash: 'hash',
          role: Role.TRAINER,
        },
      });

      const otherToken = generateToken({ id: otherTrainer.id, email: otherTrainer.email, role: Role.TRAINER });

      const response = await request(app)
        .get(`/api/classes/trainer/${trainerId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toContain('your own classes');
      
      await prisma.user.delete({ where: { id: otherTrainer.id } });
    });

    it('should return trainer classes', async () => {
      const response = await request(app)
        .get(`/api/classes/trainer/${trainerId}`)
        .expect(200);

      expect(response.body).toHaveProperty('trainer');
      expect(response.body).toHaveProperty('classes');
      expect(Array.isArray(response.body.classes)).toBe(true);
    });
  });

  describe('GET /api/classes/my-classes', () => {
    it('should return 401 if no token', async () => {
      const response = await request(app)
        .get('/api/classes/my-classes')
        .expect(401);
    });

    it('should return 403 if user is not a trainer', async () => {
      const response = await request(app)
        .get('/api/classes/my-classes')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only trainers');
    });

    it('should return trainer\'s own classes', async () => {
      const response = await request(app)
        .get('/api/classes/my-classes')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('trainer');
      expect(response.body).toHaveProperty('classes');
      expect(Array.isArray(response.body.classes)).toBe(true);
    });
  });

  describe('PUT /api/classes/:classId', () => {
    let updateClassId: number;

    beforeEach(async () => {
      const clazz = await prisma.class.create({
        data: {
          title: 'Update Test Class',
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 90000000),
          createdById: adminId,
          trainerId,
        },
      });
      updateClassId = clazz.id;
    });

    afterEach(async () => {
      if (updateClassId) {
        await prisma.classEnrollment.deleteMany({ where: { classId: updateClassId } });
        await prisma.class.delete({ where: { id: updateClassId } });
      }
    });

    it('should return 401 if no token', async () => {
      const response = await request(app)
        .put(`/api/classes/${updateClassId}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .put(`/api/classes/${updateClassId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);
    });

    it('should return 404 if class not found', async () => {
      const response = await request(app)
        .put('/api/classes/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });

    it('should update class successfully', async () => {
      const response = await request(app)
        .put(`/api/classes/${updateClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Class Title',
          description: 'Updated description',
          capacity: 30,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Class Title');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.capacity).toBe(30);
    });

    it('should return 400 if capacity is invalid', async () => {
      const response = await request(app)
        .put(`/api/classes/${updateClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: -1 })
        .expect(400);

      expect(response.body.message).toContain('greater than zero');
    });

    it('should return 400 if endTime is before startTime', async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(Date.now() + 86000000); // before startTime
      
      const response = await request(app)
        .put(`/api/classes/${updateClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })
        .expect(400);

      expect(response.body.message).toContain('after startTime');
    });
  });

  describe('DELETE /api/classes/:classId', () => {
    let deleteClassId: number;

    beforeEach(async () => {
      const clazz = await prisma.class.create({
        data: {
          title: 'Delete Test Class',
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 90000000),
          createdById: adminId,
          trainerId,
        },
      });
      deleteClassId = clazz.id;
    });

    it('should return 401 if no token', async () => {
      const response = await request(app)
        .delete(`/api/classes/${deleteClassId}`)
        .expect(401);
    });

    it('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .delete(`/api/classes/${deleteClassId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 if class not found', async () => {
      const response = await request(app)
        .delete('/api/classes/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should delete class successfully', async () => {
      const response = await request(app)
        .delete(`/api/classes/${deleteClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');
    });

    it('should delete class with enrollments', async () => {
      const clazzWithEnrollments = await prisma.class.create({
        data: {
          title: 'Class With Enrollments',
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 90000000),
          createdById: adminId,
          trainerId,
        },
      });

      // Create enrollment
      await prisma.classEnrollment.create({
        data: {
          classId: clazzWithEnrollments.id,
          userId,
        },
      });

      const response = await request(app)
        .delete(`/api/classes/${clazzWithEnrollments.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');
    });
  });
});

