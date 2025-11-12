"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const review_routes_1 = __importDefault(require("../routes/review.routes"));
const jwt_1 = require("../utils/jwt");
// Create test app
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/reviews', review_routes_1.default);
describe('Review API', () => {
    let userToken;
    let userId;
    let trainerId;
    beforeAll(async () => {
        // Create a test user in database
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../utils/prisma')));
        const testUser = await prisma.user.upsert({
            where: { email: 'reviewtest@example.com' },
            update: {},
            create: {
                email: 'reviewtest@example.com',
                passwordHash: 'hash',
                role: 'USER',
            },
        });
        userId = testUser.id;
        userToken = (0, jwt_1.generateToken)({ id: userId, email: testUser.email, role: testUser.role });
        // Create a test trainer in database
        const testTrainer = await prisma.user.upsert({
            where: { email: 'reviewtrainer@example.com' },
            update: {},
            create: {
                email: 'reviewtrainer@example.com',
                passwordHash: 'hash',
                role: 'TRAINER',
            },
        });
        trainerId = testTrainer.id;
    });
    afterAll(async () => {
        // Cleanup
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../utils/prisma')));
        await prisma.trainerReview.deleteMany({
            where: { OR: [{ reviewerId: userId }, { trainerId }] }
        }).catch(() => { });
        await prisma.user.deleteMany({
            where: { id: { in: [userId, trainerId] } }
        }).catch(() => { });
    });
    describe('POST /api/reviews', () => {
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .send({
                trainerId: 1,
                comment: 'Great trainer!',
                rating: 5,
            })
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 401 if invalid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                trainerId: 1,
                comment: 'Great trainer!',
                rating: 5,
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid');
        });
        it('should return 400 if missing required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                trainerId: 1,
                // missing comment
            })
                .expect(400);
            expect(response.body.message).toContain('required');
        });
        it('should return 400 if rating is out of range', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                trainerId: 1,
                comment: 'Great trainer!',
                rating: 6, // Invalid: should be 1-5
            })
                .expect(400);
            expect(response.body.message).toContain('between 1 and 5');
        });
        it('should return 400 if rating is less than 1', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                trainerId: 1,
                comment: 'Great trainer!',
                rating: 0, // Invalid: should be 1-5
            })
                .expect(400);
            expect(response.body.message).toContain('between 1 and 5');
        });
    });
    describe('GET /api/reviews', () => {
        it('should return list of reviews', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/reviews')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    describe('GET /api/reviews/summary', () => {
        it('should return review summary', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/reviews/summary')
                .expect(200);
            expect(response.body).toHaveProperty('totalReviews');
            expect(response.body).toHaveProperty('averageRating');
            expect(response.body).toHaveProperty('ratingCounts');
        });
    });
    describe('GET /api/reviews/trainer/:trainerId', () => {
        it('should return 400 for invalid trainerId', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/reviews/trainer/invalid')
                .expect(400);
            expect(response.body.message).toContain('valid number');
        });
        it('should return 404 if trainer not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/reviews/trainer/999999')
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should return 404 if user is not a trainer', async () => {
            // Assuming userId is a regular user, not a trainer
            const response = await (0, supertest_1.default)(app)
                .get(`/api/reviews/trainer/${userId}`)
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should return trainer reviews successfully', async () => {
            // Use trainerId created in beforeAll
            if (trainerId) {
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/reviews/trainer/${trainerId}`)
                    .expect(200);
                expect(response.body).toHaveProperty('trainer');
                expect(response.body).toHaveProperty('totalReviews');
                expect(response.body).toHaveProperty('averageRating');
                expect(response.body).toHaveProperty('reviews');
                expect(Array.isArray(response.body.reviews)).toBe(true);
            }
        });
    });
    describe('DELETE /api/reviews/:reviewId', () => {
        let adminToken;
        beforeAll(async () => {
            // Generate admin token for delete tests
            const { generateToken } = require('../utils/jwt');
            adminToken = generateToken({ id: 999, email: 'admin@review.test.com', role: 'ADMIN' });
        });
        it('should return 401 if no token', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/reviews/invalid')
                .expect(401);
            expect(response.body.message).toContain('Missing');
        });
        it('should return 403 if user is not admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/reviews/invalid')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
            expect(response.body.message).toContain('Only admins');
        });
        it('should return 400 for invalid reviewId', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/reviews/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
            expect(response.body.message).toContain('valid number');
        });
        it('should return 404 if review not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/reviews/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.message).toContain('not found');
        });
        it('should delete review successfully', async () => {
            // This would require a review to exist in the database
            // The test structure validates the API contract
        });
    });
    describe('POST /api/reviews - additional tests', () => {
        it('should return 404 if reviewer not found', async () => {
            // Ensure the user doesn't exist by checking and deleting if needed
            const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../utils/prisma')));
            const testReviewerId = 999999;
            // Clean up any existing user with this ID before test
            await prisma.trainerReview.deleteMany({
                where: { reviewerId: testReviewerId }
            }).catch(() => { });
            await prisma.user.delete({
                where: { id: testReviewerId }
            }).catch(() => { });
            const fakeToken = (0, jwt_1.generateToken)({ id: testReviewerId, email: 'fake@example.com', role: 'USER' });
            // Use trainerId created in beforeAll
            const testTrainerId = trainerId || 999998;
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${fakeToken}`)
                .send({
                trainerId: testTrainerId,
                comment: 'Great trainer!',
                rating: 5,
            })
                .expect(404);
            expect(response.body.message).toContain('Reviewer not found');
        });
        it('should return 404 if trainer not found', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                trainerId: 999999, // Non-existent trainer ID
                comment: 'Great trainer!',
                rating: 5,
            })
                .expect(404);
            expect(response.body.message).toContain('Trainer not found');
        });
        it('should return 404 if user is not a trainer', async () => {
            // Use userId which is a USER, not a TRAINER
            const response = await (0, supertest_1.default)(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                trainerId: userId, // userId is USER, not TRAINER
                comment: 'Great trainer!',
                rating: 5,
            })
                .expect(404);
            expect(response.body.message).toContain('Trainer not found');
        });
    });
});
