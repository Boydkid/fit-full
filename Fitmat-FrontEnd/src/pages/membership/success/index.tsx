"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

/**
 * Success page after Stripe Checkout
 * - File: app/membership/success/page.tsx
 * - Reads ?session_id=... from URL
 * - (Optional) Verifies with your backend: GET /api/stripe/verify?session_id=...
 *   Expecting JSON like:
 *   {
 *     ok: true,
 *     sessionId: string,
 *     purchase: { id: string; status: "PENDING"|"PAID"|"FAILED"|"CANCELED"; targetRole?: string },
 *     user?: { id: number; role: string }
 *   }
 *
 * .env.local:
 *   NEXT_PUBLIC_API_BASE=${process.env.NEXT_PUBLIC_API_URL}
 */

export default function SuccessPage() {
  const router = useRouter();
  const { session_id = "" } = (router.query || {}) as {
    session_id?: string | string[];
  };
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id;
  const rawBase =
  process.env.NEXT_PUBLIC_API_URL || 
  "https://fit-full-production.up.railway.app";

const apiBase = rawBase.replace(/\/$/, "");

  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "verified"; data: any }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const shortId = useMemo(() => {
    if (!sessionId) return "";
    return sessionId.length > 16
      ? `${sessionId.slice(0, 10)}…${sessionId.slice(-6)}`
      : sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (!apiBase) return; // allow page to work without backend verify

    let isActive = true;
    (async () => {
      try {
        setState({ kind: "loading" });
        const res = await fetch(`${apiBase}/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Verify failed (${res.status})`);
        if (!isActive) return;
        setState({ kind: "verified", data });
      } catch (e: any) {
        if (!isActive) return;
        setState({ kind: "error", message: e?.message || "ไม่สามารถตรวจสอบคำสั่งซื้อได้" });
      }
    })();

    return () => {
      isActive = false;
    };
  }, [sessionId, apiBase]);

  // Persist new role locally to improve UX across pages that read localStorage
  useEffect(() => {
    if (state.kind === "verified" && state.data?.user?.role) {
      try {
        localStorage.setItem("role", String(state.data.user.role));
      } catch (_) {}
    }
  }, [state]);

  const handleReissue = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) return;
      const res = await fetch(`${apiBase}/api/auth/reissue-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        throw new Error(data?.message || "Reissue failed");
      }
      localStorage.setItem("token", data.token);
      if (data.user?.role) {
        localStorage.setItem("role", String(data.user.role));
      }
      // simple UX: reload to reflect new role everywhere
      window.location.reload();
    } catch (e) {
      // ignore errors; page still shows verified state
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-white to-slate-50">
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">ชำระเงินสำเร็จ 🎉</h1>
          <p className="mt-2 text-slate-600">
            ขอบคุณสำหรับการสนับสนุน ระบบกำลังยืนยันสิทธิ์สมาชิกของคุณ
          </p>
          {sessionId ? (
            <p className="mt-2 text-xs text-slate-500">
              Session: <code className="bg-slate-100 px-1 rounded">{shortId}</code>
            </p>
          ) : (
            <p className="mt-2 text-sm text-red-600">ไม่พบ session_id ใน URL</p>
          )}
        </div>

        {/* Status card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {state.kind === "idle" && (
            <p className="text-slate-600">กำลังเตรียมตรวจสอบคำสั่งซื้อ…</p>
          )}
          {state.kind === "loading" && (
            <p className="animate-pulse text-slate-600">กำลังตรวจสอบสถานะการชำระเงิน…</p>
          )}
          {state.kind === "error" && (
            <div className="text-red-700">
              <p className="font-medium">ไม่สามารถตรวจสอบคำสั่งซื้อได้</p>
              <p className="text-sm mt-1">{state.message}</p>
              <p className="text-xs text-slate-500 mt-2">
                คุณยังสามารถใช้งานได้ตามปกติ หากระบบ Webhook อัปเดตสิทธิ์สำเร็จในภายหลัง
              </p>
            </div>
          )}
          {state.kind === "verified" && (
            <div>
              <p className="text-emerald-700 font-medium">ตรวจสอบสำเร็จ</p>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Session</span>
                  <span className="font-mono">{state.data?.sessionId || sessionId}</span>
                </div>
                {state.data?.purchase && (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Purchase</span>
                      <span className="font-mono">{state.data.purchase.id}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">สถานะ</span>
                      <span className="font-medium">{state.data.purchase.status}</span>
                    </div>
                    {state.data.purchase.targetRole && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Target role</span>
                        <span className="font-medium">{state.data.purchase.targetRole}</span>
                      </div>
                    )}
                  </>
                )}
                {state.data?.user && (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">User ID</span>
                      <span className="font-mono">{state.data.user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role ปัจจุบัน</span>
                      <span className="font-medium">{state.data.user.role}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
                >
                  กลับหน้าแรก
                </a>
                <a
                  href="/membership"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 transition"
                >
                  เลือกแพ็กเกจอื่น
                </a>
                <button
                  onClick={handleReissue}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition"
                >
                  รับสิทธิ์ทันที (ออก Token ใหม่)
                </button>
              </div>
            </div>
          )}

          {/* No backend verify available: friendly message */}
          {state.kind !== "verified" && !apiBase && (
            <p className="text-xs text-slate-500 mt-4">
              * ไม่ได้ตั้งค่า <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_API_BASE</code> จึงข้ามขั้นตอนตรวจสอบอัตโนมัติ
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          ถ้าสิทธิ์ยังไม่อัปเดตทันที ให้รอสักครู่ ระบบ Webhook จะปรับ Role ให้อัตโนมัติ
        </p>
      </section>
    </main>
  );
}
