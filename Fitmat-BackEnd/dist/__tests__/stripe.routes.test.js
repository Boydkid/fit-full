"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_routes_1 = __importDefault(require("../routes/stripe.routes"));
describe('Stripe Routes', () => {
    it('should export router', () => {
        expect(stripe_routes_1.default).toBeDefined();
    });
    it('should be an express router', () => {
        const app = (0, express_1.default)();
        app.use('/api/stripe', stripe_routes_1.default);
        expect(app).toBeDefined();
    });
});
