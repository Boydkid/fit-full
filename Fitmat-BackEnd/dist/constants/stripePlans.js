"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PRICE_TO_PLAN = void 0;
const client_1 = require("@prisma/client");
exports.STRIPE_PRICE_TO_PLAN = {
    "price_1SHi6U3JFtC2WMSKhAQeq9c8": { role: client_1.Role.USER_BRONZE, amount: 49900, currency: "THB", label: "Bronze 499" },
    "price_1SHi5X3JFtC2WMSKqqCbjHoV": { role: client_1.Role.USER_GOLD, amount: 129900, currency: "THB", label: "Gold 1299" },
    "price_1SHi7b3JFtC2WMSKRkKDIGL0": { role: client_1.Role.USER_PLATINUM, amount: 299900, currency: "THB", label: "Platinum 2999" },
};
