// src/controllers/stripe.controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { PrismaClient, Role } from "@prisma/client";

// Define PaymentStatus enum manually
enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID"
}
import { STRIPE_PRICE_TO_PLAN } from "../constants/stripePlans";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });

const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  USER_BRONZE: 1,
  USER_GOLD: 2,
  USER_PLATINUM: 3,
  TRAINER: 99, // กันพลาดไม่ให้ผู้ใช้ซื้อแล้วกลายเป็น TRAINER/ADMIN
  ADMIN: 100,
};

// POST /api/stripe/checkout
// body: { userId: number, priceId: string, successPath?: string, cancelPath?: string }
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { userId, priceId, successPath = "/success", cancelPath = "/cancel" } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!priceId) return res.status(400).json({ error: "priceId required" });

    const plan = STRIPE_PRICE_TO_PLAN[priceId];
    if (!plan) return res.status(400).json({ error: "invalid priceId" });

    // ตรวจ user + ป้องกัน downgrade
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: "user not found" });
    if (ROLE_RANK[plan.role] <= ROLE_RANK[user.role]) {
      return res.status(409).json({ error: "already has equal or higher role" });
    }

    // สร้างบันทึกการซื้อ (PENDING)
    const purchase = await prisma.membershipPurchase.create({
      data: {
        userId: user.id,
        targetRole: plan.role,
        status: PaymentStatus.PENDING,
        amount: plan.amount,
        currency: plan.currency,
        gateway: "stripe",
      },
    });

    const origin = process.env.CLIENT_URL || "http://127.0.0.1:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: {
        purchaseId: purchase.id,
        userId: String(user.id),
        targetRole: plan.role,
      },
    });

    // ผูก externalId ไว้
    await prisma.membershipPurchase.update({
      where: { id: purchase.id },
      data: { externalId: session.id },
    });

    return res.json({ url: session.url, sessionId: session.id, purchaseId: purchase.id });
  } catch (e: any) {
    console.error("[stripe][checkout] error:", e);
    return res.status(500).json({ error: e.message });
  }
}

// POST /api/stripe/webhook (ต้อง raw body)
export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err: any) {
    console.error("[stripe][webhook] verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const purchaseId = session.metadata?.purchaseId;
      const targetRole = session.metadata?.targetRole as Role | undefined;
      if (!purchaseId || !targetRole) {
        console.warn("[stripe][webhook] missing purchaseId/targetRole");
        return res.json({ received: true });
      }

      // หา mapping ตาม externalId/purchaseId
      const purchase = await prisma.membershipPurchase.findUnique({ where: { id: purchaseId } });
      if (!purchase) return res.json({ received: true }); // ไม่เจอ—ข้าม
      if (purchase.status === PaymentStatus.PAID) return res.json({ received: true }); // idempotent

      // cross-check จำนวนเงิน/สกุลเงินกับแผนที่กำหนด
      const plan = Object.values(STRIPE_PRICE_TO_PLAN).find(p => p.role === targetRole);
      if (plan) {
        if (session.amount_total != null && session.amount_total !== plan.amount) {
          console.warn("[stripe][webhook] amount mismatch", { got: session.amount_total, expect: plan.amount });
        }
        if (session.currency && session.currency.toUpperCase() !== plan.currency.toUpperCase()) {
          console.warn("[stripe][webhook] currency mismatch", { got: session.currency, expect: plan.currency });
        }
      }

      // อัปเดต purchase -> PAID
      await prisma.membershipPurchase.update({
        where: { id: purchase.id },
        data: {
          status: PaymentStatus.PAID,
          amount: session.amount_total ?? purchase.amount ?? undefined,
          currency: (session.currency || purchase.currency || "THB").toUpperCase(),
          externalId: session.id,
        },
      });

      // อัปเกรด role ของผู้ใช้ (เฉพาะถ้าสูงขึ้น)
      const user = await prisma.user.findUnique({ where: { id: purchase.userId } });
      if (user && ROLE_RANK[targetRole] > ROLE_RANK[user.role]) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole },
        });
        console.log(`✅ Upgraded user#${user.id} → ${targetRole}`);
      } else {
        console.log("ℹ️ Skip role update (equal/higher already)");
      }
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error("[stripe][webhook] handler error:", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

export async function verifySession(req: Request, res: Response) {
  try {
    const sessionId = String(req.query.session_id || "");
    if (!sessionId) return res.status(400).json({ error: "session_id required" });

    // 1️⃣ ดึงข้อมูล session จาก Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2️⃣ ถ้าชำระแล้ว (ตาม Stripe)
    const isPaid =
      session.payment_status === "paid" ||
      session.status === "complete" 

    // 3️⃣ หา purchase ในระบบ (ใช้ externalId หรือ metadata.purchaseId)
    let purchase =
      (await prisma.membershipPurchase.findFirst({
        where: { externalId: session.id },
      })) ||
      (session.metadata?.purchaseId
        ? await prisma.membershipPurchase.findUnique({
            where: { id: session.metadata.purchaseId },
          })
        : null);

    let user = purchase
      ? await prisma.user.findUnique({ where: { id: purchase.userId } })
      : null;

    // 4️⃣ ถ้าเจอ user + ชำระแล้ว → update purchase และ role ทันที
    let didMarkPaid = false;
    let didUpgrade = false;
    let upgradedTo: Role | null = null;

    if (purchase && user && isPaid) {
      // ป้องกันรันซ้ำ
      if (purchase.status !== PaymentStatus.PAID) {
        purchase = await prisma.membershipPurchase.update({
          where: { id: purchase.id },
          data: {
            status: PaymentStatus.PAID,
            amount: session.amount_total ?? purchase.amount ?? undefined,
            currency: (session.currency || purchase.currency || "THB").toUpperCase(),
            externalId: session.id,
            gateway: "stripe",
          },
        });
        didMarkPaid = true;
      }

      // อัปเกรด role ถ้า target สูงกว่า role ปัจจุบัน
      if (ROLE_RANK[purchase.targetRole] > ROLE_RANK[user.role]) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: purchase.targetRole },
        });
        didUpgrade = true;
        upgradedTo = purchase.targetRole;
      }
    }

    // 5️⃣ ดึงข้อมูล user ใหม่ (หลังอัปเดต)
    user = purchase
      ? await prisma.user.findUnique({
          where: { id: purchase.userId },
        })
      : null;

    // 6️⃣ ส่งกลับให้ frontend
    return res.json({
      ok: true,
      sessionId: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency?.toUpperCase(),
      purchase: purchase
        ? {
            id: purchase.id,
            status: purchase.status,
            targetRole: purchase.targetRole,
          }
        : null,
      user,
      effects: {
        didMarkPaid,
        didUpgrade,
        upgradedTo,
      },
    });
  } catch (e: any) {
    console.error("[verifySession] error:", e);
    return res.status(500).json({ error: e.message || "verify failed" });
  }
}
