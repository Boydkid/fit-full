"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";

export default function CancelPage() {
  const router = useRouter();
  const { session_id = "", reason: reasonQuery = "" } = (router.query || {}) as {
    session_id?: string | string[];
    reason?: string | string[];
  };
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id;
  const reason = Array.isArray(reasonQuery) ? reasonQuery[0] : reasonQuery; // เผื่อส่งมาจากฝั่งคุณเอง
  const shortId = useMemo(
    () => (sessionId.length > 16 ? `${sessionId.slice(0, 10)}…${sessionId.slice(-6)}` : sessionId),
    [sessionId]
  );

  return (
    <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-white to-slate-50">
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-red-600">การชำระเงินไม่สำเร็จ</h1>
          <p className="mt-2 text-slate-600">
            คุณยกเลิกการชำระเงิน หรือการชำระไม่ผ่าน โปรดลองอีกครั้ง
          </p>
          {!!sessionId && (
            <p className="mt-2 text-xs text-slate-500">
              Session: <code className="bg-slate-100 px-1 rounded">{shortId}</code>
            </p>
          )}
          {!!reason && (
            <p className="mt-2 text-xs text-slate-500">
              เหตุผล: <code className="bg-slate-100 px-1 rounded">{reason}</code>
            </p>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">วิธีแก้ไขที่พบบ่อย</h2>
          <ul className="mt-3 list-disc pl-6 text-sm text-slate-700 space-y-1">
            <li>ลองเปลี่ยนบัตรทดสอบ หรือเปิดใช้งาน 3-D Secure</li>
            <li>ตรวจวันหมดอายุ/CVC ให้ถูกต้อง (ใช้วันใดก็ได้ในอนาคต เช่น 12/25, CVC: 123)</li>
            <li>ถ้ากลับมาทำต่อทีหลัง ให้ไปที่หน้าเลือกแพ็กเกจและเริ่มใหม่</li>
          </ul>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">บัตรทดสอบ Stripe:</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-medium">Visa:</span> <code className="bg-white px-2 py-1 rounded">4242 4242 4242 4242</code>
              </div>
              <div>
                <span className="font-medium">Mastercard:</span> <code className="bg-white px-2 py-1 rounded">5555 5555 5555 4444</code>
              </div>
              <div>
                <span className="font-medium">Mastercard (2-series):</span> <code className="bg-white px-2 py-1 rounded">2223 0031 2200 3222</code>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/membership"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
            >
              กลับไปเลือกแพ็กเกจ
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 transition"
            >
              กลับหน้าแรก
            </a>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            ถ้าคุณชำระเงินสำเร็จจริง แต่หน้านี้ยังขึ้นยกเลิก ลองเช็กที่หน้า{" "}
            <a className="underline" href="/membership/success">
              /membership/success
            </a>{" "}
            พร้อมแนบ <code className="bg-slate-100 px-1 rounded">?session_id=...</code> เพื่อให้ระบบตรวจสอบสิทธิ์ให้อัตโนมัติ
          </p>
        </div>
      </section>
    </main>
  );
}
