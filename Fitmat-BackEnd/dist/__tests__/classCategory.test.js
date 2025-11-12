"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const classCategory_routes_1 = __importDefault(require("../routes/classCategory.routes"));
const jwt_1 = require("../utils/jwt");
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/categories', classCategory_routes_1.default);
describe('Class Category API', () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;
    let categoryId;
    beforeAll(async () => {
        // Create admin user
        adminId = 999999;
        adminToken = (0, jwt_1.generateToken)({ id: adminId, email: 'admin@test.com', role: client_1.Role.ADMIN });
        // Create regular user
        userId = 999998;
        userToken = (0, jwt_1.generateToken)({ id: userId, email: 'user@test.com', role: client_1.Role.USER });
        // Create admin in database
        const admin = await prisma_1.default.user.upsert({
            where: { id: adminId },
            update: {},
            create: {
                id: adminId,
                email: 'admin@test.com',
                passwordHash: 'hash',
                role: client_1.Role.ADMIN,
            },
        });
        // Create user in database
        await prisma_1.default.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: 'user@test.com',
                passwordHash: 'hash',
                role: client_1.Role.USER,
            },
        });
    });
    afterAll(async () => {
        // Clean up - delete in correct order to avoid foreign key constraints
        await prisma_1.default.classEnrollment.deleteMany({ where: { class: { category: { name: { startsWith: 'Test Category' } } } } }).catch(() => { });
        await prisma_1.default.class.deleteMany({ where: { category: { name: { startsWith: 'Test Category' } } } }).catch(() => { });
        await prisma_1.default.classCategory.deleteMany({ where: { name: { startsWith: 'Test Category' } } }).catch(() => { });
        // Delete users last
        await prisma_1.default.classEnrollment.deleteMany({ where: { userId: { in: [adminId, userId] } } }).catch(() => { });
        await prisma_1.default.class.deleteMany({ where: { OR: [{ createdById: { in: [adminId, userId] } }, { trainerId: { in: [adminId, userId] } }] } }).catch(() => { });
        await prisma_1.default.user.deleteMany({ where: { id: { in: [adminId, userId] } } }).catch(() => { });
    });
    describe('POST /api/categories', () => {
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .send({ name: 'Test Category' })
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 403 if user is not admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Test Category' })
                .expect(403);
            expect(response.body.message).toContain('Only admins');
        });
        it('should return 400 if name is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should create category successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'Test Category Create',
                description: 'Test description',
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('Test Category Create');
            expect(response.body.description).toBe('Test description');
            categoryId = response.body.id;
        });
        it('should return 409 if category name already exists', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Category Duplicate' })
                .expect(201);
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Category Duplicate' })
                .expect(409);
            expect(response.body.message).toContain('already exists');
        });
    });
    describe('GET /api/categories', () => {
        it('should return list of categories', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/categories')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('id');
                expect(response.body[0]).toHaveProperty('name');
            }
        });
    });
    describe('PUT /api/categories/:id', () => {
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/categories/1')
                .send({ name: 'Updated Name' })
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 403 if user is not admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/categories/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Updated Name' })
                .expect(403);
            expect(response.body.message).toContain('Only admins');
        });
        it('should return 400 if category id is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/categories/')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })
                .expect(404);
        });
        it('should return 400 if category id is invalid', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/categories/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })
                .expect(400);
            expect(response.body.message).toContain('valid number');
        });
        it('should return 404 if category not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/categories/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' })
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should return 400 if no fields to update', async () => {
            if (categoryId) {
                const response = await (0, supertest_1.default)(app)
                    .put(`/api/categories/${categoryId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({})
                    .expect(400);
                expect(response.body.message).toContain('No fields');
            }
        });
        it('should update category successfully', async () => {
            if (categoryId) {
                // Use unique name to avoid conflicts
                const uniqueName = `Updated Test Category ${Date.now()}`;
                const response = await (0, supertest_1.default)(app)
                    .put(`/api/categories/${categoryId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                    name: uniqueName,
                    description: 'Updated description',
                })
                    .expect(200);
                expect(response.body.name).toBe(uniqueName);
                expect(response.body.description).toBe('Updated description');
            }
        });
        it('should return 409 if updated name conflicts', async () => {
            const cat1 = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Category Conflict 1' })
                .expect(201);
            const cat2 = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Category Conflict 2' })
                .expect(201);
            const response = await (0, supertest_1.default)(app)
                .put(`/api/categories/${cat2.body.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Category Conflict 1' })
                .expect(409);
            expect(response.body.message).toContain('already exists');
        });
    });
    describe('DELETE /api/categories/:id', () => {
        let deleteCategoryId;
        beforeEach(async () => {
            // Use unique name to avoid conflicts
            const uniqueName = `Test Category Delete ${Date.now()}`;
            const response = await (0, supertest_1.default)(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: uniqueName })
                .expect(201);
            deleteCategoryId = response.body.id;
        });
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/categories/1')
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 403 if user is not admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/categories/1')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
            expect(response.body.message).toContain('Only admins');
        });
        it('should return 400 if category id is invalid', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/categories/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
            expect(response.body.message).toContain('valid number');
        });
        it('should return 404 if category not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/categories/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should delete category successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/categories/${deleteCategoryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.message).toContain('deleted successfully');
        });
    });
});
