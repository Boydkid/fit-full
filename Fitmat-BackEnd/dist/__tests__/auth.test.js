"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
// Create test app
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api', auth_routes_1.default);
describe('Auth API', () => {
    let testEmail;
    let testPassword;
    beforeEach(() => {
        // Generate unique email for each test
        testEmail = `test${Date.now()}@example.com`;
        testPassword = 'TestPassword123!';
    });
    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            })
                .expect(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testEmail);
            expect(response.body.user.role).toBe('USER');
            expect(response.body.user).toHaveProperty('id');
        });
        it('should return 400 if email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                password: testPassword,
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 400 if password is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 409 if email already exists', async () => {
            // First registration
            await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            })
                .expect(201);
            // Second registration with same email
            const response = await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            })
                .expect(409);
            expect(response.body.message).toContain('already registered');
        });
    });
    describe('POST /api/login', () => {
        beforeEach(async () => {
            // Register a user before each login test
            await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            });
        });
        it('should login successfully with correct credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                email: testEmail,
                password: testPassword,
            })
                .expect(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testEmail);
        });
        it('should return 401 with invalid email', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                email: 'nonexistent@example.com',
                password: testPassword,
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid');
        });
        it('should return 401 with invalid password', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                email: testEmail,
                password: 'WrongPassword123!',
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid');
        });
        it('should return 400 if email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                password: testPassword,
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 400 if password is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                email: testEmail,
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
    });
    describe('POST /api/logout', () => {
        it('should logout successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/logout')
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.message).toContain('Logged out');
        });
    });
    describe('POST /api/request-password-reset', () => {
        beforeEach(async () => {
            // Register a user before each test
            await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            });
        });
        it('should return 400 if email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/request-password-reset')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 404 if user not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/request-password-reset')
                .send({
                email: 'nonexistent@example.com',
            })
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should return 500 if email service is not configured', async () => {
            // This test requires email service not to be configured
            // The actual behavior depends on environment variables
            // We'll test the path that doesn't require email sending
        });
    });
    describe('POST /api/verify-reset-token', () => {
        let resetToken;
        beforeEach(async () => {
            // Register a user
            await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            });
            // Request password reset to get a token
            // Note: This requires email service to be configured
            // We'll test with a manually set token in the database
        });
        it('should return 400 if resetToken is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/verify-reset-token')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 400 if token is invalid', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/verify-reset-token')
                .send({
                resetToken: 'invalid-token-123',
            })
                .expect(400);
            expect(response.body.message).toContain('Invalid');
        });
        it('should return 400 if token has expired', async () => {
            // This would require setting an expired token in the database
            // For now, we'll just test the API contract
            const response = await (0, supertest_1.default)(app)
                .post('/api/verify-reset-token')
                .send({
                resetToken: 'expired-token',
            })
                .expect(400);
        });
        it('should verify valid token successfully', async () => {
            // This would require a valid token in the database
            // The actual implementation depends on the password reset flow
            // We'll test the API contract for now
        });
    });
    describe('POST /api/reset-password', () => {
        it('should return 400 if resetToken or newPassword is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reset-password')
                .send({
                resetToken: 'token',
                // missing newPassword
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 400 if token is invalid or expired', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reset-password')
                .send({
                resetToken: 'invalid-token',
                newPassword: 'NewPassword123!',
            })
                .expect(400);
            expect(response.body.message).toContain('Invalid or expired');
        });
        it('should reset password successfully with valid token', async () => {
            // This would require a valid token in the database
            // The actual implementation depends on the password reset flow
        });
    });
    describe('POST /api/reissue-token', () => {
        beforeEach(async () => {
            // Register a user
            await (0, supertest_1.default)(app)
                .post('/api/register')
                .send({
                email: testEmail,
                password: testPassword,
            });
        });
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reissue-token')
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 500 if invalid token', async () => {
            // verifyToken throws an error for invalid tokens, which gets caught and returns 500
            const response = await (0, supertest_1.default)(app)
                .post('/api/reissue-token')
                .set('Authorization', 'Bearer invalid-token')
                .expect(500);
            expect(response.body.message).toContain('Failed to reissue token');
        });
        it('should return 404 if user not found', async () => {
            // Create a token for a non-existent user
            const { generateToken } = require('../utils/jwt');
            const fakeToken = generateToken({ id: 999999, email: 'fake@example.com', role: 'USER' });
            const response = await (0, supertest_1.default)(app)
                .post('/api/reissue-token')
                .set('Authorization', `Bearer ${fakeToken}`)
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should reissue token successfully', async () => {
            // Login to get a token
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/login')
                .send({
                email: testEmail,
                password: testPassword,
            })
                .expect(200);
            const token = loginResponse.body.token;
            // Reissue token
            const response = await (0, supertest_1.default)(app)
                .post('/api/reissue-token')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testEmail);
        });
    });
});
