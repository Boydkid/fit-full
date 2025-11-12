import { Role } from "@prisma/client";

export const STRIPE_PRICE_TO_PLAN: Record<string, {
  role: Role; amount: number; currency: string; label: string;
}> = {
  "price_1SHi6U3JFtC2WMSKhAQeq9c8": { role: Role.USER_BRONZE,   amount:  49900, currency: "THB", label: "Bronze 499" },
  "price_1SHi5X3JFtC2WMSKqqCbjHoV": { role: Role.USER_GOLD,     amount: 129900, currency: "THB", label: "Gold 1299" },
  "price_1SHi7b3JFtC2WMSKRkKDIGL0": { role: Role.USER_PLATINUM, amount: 299900, currency: "THB", label: "Platinum 2999" },
};
