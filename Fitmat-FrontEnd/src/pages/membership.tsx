"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import { Button, Card } from "../components/common";
import { parseJwt } from "../utils/auth";

type TokenPayload = {
  id?: number;
  role?: string;
  exp?: number; // epoch (seconds)
  email?: string;
};

/**
 * Membership Checkout Page (Stripe Checkout)
 * - Backend endpoint: POST /api/stripe/checkout
 *   body: { userId: number, priceId: string, successPath?: string, cancelPath?: string }
 * - .env.local: NEXT_PUBLIC_API_BASE=${process.env.NEXT_PUBLIC_API_URL}
 */

// THB plans (display only; backend is the source of truth)
const PLANS = [
  {
    key: "bronze",
    title: "Bronze",
    desc: "เริ่มต้นลองใช้ฟีเจอร์หลัก",
    priceText: "฿499 ครั้งเดียว",
    priceId: "price_1SHi6U3JFtC2WMSKhAQeq9c8",
    perks: ["ดูคอนเทนต์พิเศษบางส่วน", "ซัพพอร์ตพื้นฐาน", "ตรา Bronze"],
  },
  {
    key: "gold",
    title: "Gold",
    desc: "คุ้มค่าสำหรับผู้ใช้ทั่วไป",
    priceText: "฿1,299 ครั้งเดียว",
    priceId: "price_1SHi5X3JFtC2WMSKqqCbjHoV",
    perks: ["ปลดล็อคคอนเทนต์ส่วนใหญ่", "ซัพพอร์ตเร็วขึ้น", "ตรา Gold"],
    badge: "แนะนำ",
  },
  {
    key: "platinum",
    title: "Platinum",
    desc: "ครบสุดสำหรับสายจริงจัง",
    priceText: "฿2,999 ครั้งเดียว",
    priceId: "price_1SHi7b3JFtC2WMSKRkKDIGL0",
    perks: ["เข้าถึงทุกฟีเจอร์", "Priority Support", "ตรา Platinum"],
  },
] as const;

 

export default function MembershipPage() {
  const router = useRouter();
  const autoCheckoutOnce = useRef(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const apiBase = useMemo(() => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://fit-full-production.up.railway.app";

  return rawBase.replace(/\/$/, "");
}, []);

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!storedToken) return;
    const payload = parseJwt(storedToken);
    // verify exp (ms vs s)
    const valid = payload && (!payload.exp || payload.exp * 1000 > Date.now());
    if (valid) {
      setUser(payload!);
      setToken(storedToken);
    } else {
      // token expired → clean up
      localStorage.removeItem("token");
    }
  }, []);

  // Deep-link: /membership?plan=gold -> select and auto checkout
  useEffect(() => {
    const q = router.query?.plan as string | string[] | undefined;
    const planKey = Array.isArray(q) ? q[0] : q;
    if (!planKey) return;
    setSelectedKey(planKey);

    // scroll to selected card
    const el = document.getElementById(`plan-${planKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

    // auto checkout once if logged in
    const target = PLANS.find((p) => p.key === planKey);
    if (target && user?.id && !autoCheckoutOnce.current) {
      autoCheckoutOnce.current = true;
      handleCheckout(target.priceId);
    }
  }, [router.query?.plan, user?.id]);

  async function handleCheckout(priceId: string) {
    setError("");

    if (!user?.id) {
      setError("ไม่พบผู้ใช้ที่ล็อกอินอยู่ — โปรดล็อกอินก่อนชำระเงิน");
      return;
    }

    try {
      setLoadingKey(priceId);
      const res = await fetch(`${apiBase}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: Number(user.id),
          priceId,
          successPath: "/membership/success",
          cancelPath: "/membership/cancel",
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || `Checkout failed (${res.status})`);
      if (!data?.url) throw new Error("Missing checkout URL");

      window.location.href = data.url as string; // redirect to Stripe Checkout
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              อัปเกรด<span className="text-red-600">สมาชิก</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              เลือกแพ็กเกจที่ใช่ แล้วชำระผ่าน Stripe — ระบบจะอัปเกรด Role ให้คุณอัตโนมัติเมื่อชำระสำเร็จ
            </p>
          </div>

          {/* Back button */}
          <div className="mb-6 flex justify-start">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
            >
              ← กลับไปหน้าหลัก
            </Button>
          </div>

          {/* Current user info */}
          <Card className="max-w-xl mx-auto mb-8 p-5">
            {user?.id ? (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-medium">User ID</span>
                  <span className="font-mono font-semibold text-gray-900">{user.id}</span>
                </div>
                {user.role && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Role</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                      user.role === "USER_PLATINUM" ? "bg-gray-100 text-gray-800" :
                      user.role === "USER_GOLD" ? "bg-yellow-100 text-yellow-800" :
                      user.role === "USER_BRONZE" ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-600">
                  ยังไม่พบการล็อกอิน — โปรดล็อกอินก่อนชำระเงิน
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  variant="primary"
                  size="sm"
                  className="mt-3"
                >
                  เข้าสู่ระบบ
                </Button>
              </div>
            )}
          </Card>

          {error && (
            <div className="max-w-xl mx-auto mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Pricing grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {PLANS.map((p) => (
              <div
                id={`plan-${p.key}`}
                key={p.key}
                className={`relative ${
                  selectedKey === p.key ? "ring-4 ring-red-400 scale-105" : ""
                }`}
              >
                <Card
                  hover
                  shadow
                  className="relative overflow-hidden transition-all duration-300 h-full"
                >
                {"badge" in p && (p as any).badge ? (
                  <div className="absolute top-4 right-4 text-xs bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-full font-bold shadow-lg z-10">
                    {(p as any).badge}
                  </div>
                ) : null}

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.title}</h3>
                    <p className="text-gray-600 text-sm">{p.desc}</p>
                  </div>

                  <div className="mb-6">
                    <div className="text-4xl font-extrabold text-red-600 mb-1">{p.priceText}</div>
                    <p className="text-xs text-gray-500">ชำระครั้งเดียว</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {p.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-700">{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleCheckout(p.priceId)}
                    disabled={!user?.id || loadingKey === p.priceId}
                    variant="primary"
                    className="w-full"
                    loading={loadingKey === p.priceId}
                  >
                    {!user?.id
                      ? "โปรดล็อกอินก่อน"
                      : loadingKey === p.priceId
                      ? "กำลังไปที่ Stripe…"
                      : "อัปเกรดตอนนี้"}
                  </Button>
                </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Help text */}
          <div className="max-w-3xl mx-auto text-center">
            <Card className="p-4">
              <p className="text-sm text-gray-600">
                หากกดแล้วไม่ไปหน้า Checkout: ตรวจสอบว่า{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">NEXT_PUBLIC_API_BASE</code>{" "}
                ถูกต้อง และ backend เปิดใช้งาน endpoint{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">/api/stripe/checkout</code>{" "}
                อยู่
              </p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
