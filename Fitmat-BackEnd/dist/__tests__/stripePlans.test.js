"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripePlans_1 = require("../constants/stripePlans");
const client_1 = require("@prisma/client");
describe('Stripe Plans Constants', () => {
    it('should export STRIPE_PRICE_TO_PLAN', () => {
        expect(stripePlans_1.STRIPE_PRICE_TO_PLAN).toBeDefined();
        expect(typeof stripePlans_1.STRIPE_PRICE_TO_PLAN).toBe('object');
    });
    it('should have valid price IDs', () => {
        const priceIds = Object.keys(stripePlans_1.STRIPE_PRICE_TO_PLAN);
        expect(priceIds.length).toBeGreaterThan(0);
        priceIds.forEach(priceId => {
            expect(typeof priceId).toBe('string');
            expect(priceId.length).toBeGreaterThan(0);
        });
    });
    it('should have valid plan configurations for each price', () => {
        Object.entries(stripePlans_1.STRIPE_PRICE_TO_PLAN).forEach(([priceId, plan]) => {
            expect(plan).toBeDefined();
            expect(plan).toHaveProperty('role');
            expect(plan).toHaveProperty('amount');
            expect(plan).toHaveProperty('currency');
            expect(plan).toHaveProperty('label');
            expect(Object.values(client_1.Role)).toContain(plan.role);
            expect(typeof plan.amount).toBe('number');
            expect(plan.amount).toBeGreaterThan(0);
            expect(typeof plan.currency).toBe('string');
            expect(typeof plan.label).toBe('string');
        });
    });
    it('should have Bronze plan configuration', () => {
        const bronzePlan = Object.values(stripePlans_1.STRIPE_PRICE_TO_PLAN).find(p => p.role === client_1.Role.USER_BRONZE);
        expect(bronzePlan).toBeDefined();
        if (bronzePlan) {
            expect(bronzePlan.amount).toBe(49900);
            expect(bronzePlan.currency).toBe('THB');
            expect(bronzePlan.label).toBe('Bronze 499');
        }
    });
    it('should have Gold plan configuration', () => {
        const goldPlan = Object.values(stripePlans_1.STRIPE_PRICE_TO_PLAN).find(p => p.role === client_1.Role.USER_GOLD);
        expect(goldPlan).toBeDefined();
        if (goldPlan) {
            expect(goldPlan.amount).toBe(129900);
            expect(goldPlan.currency).toBe('THB');
            expect(goldPlan.label).toBe('Gold 1299');
        }
    });
    it('should have Platinum plan configuration', () => {
        const platinumPlan = Object.values(stripePlans_1.STRIPE_PRICE_TO_PLAN).find(p => p.role === client_1.Role.USER_PLATINUM);
        expect(platinumPlan).toBeDefined();
        if (platinumPlan) {
            expect(platinumPlan.amount).toBe(299900);
            expect(platinumPlan.currency).toBe('THB');
            expect(platinumPlan.label).toBe('Platinum 2999');
        }
    });
});
