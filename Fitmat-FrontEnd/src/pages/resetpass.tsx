import { useState } from "react";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [resetToken, setResetToken] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleVerifyToken(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    const trimmedToken = resetToken.trim();
    if (!trimmedToken) {
      setErr("กรุณากรอกโทเคน");
      return;
    }

    setLoading(true);
    try {
      const rawBase =
  process.env.NEXT_PUBLIC_API_URL || 
  "https://fit-full-production.up.railway.app";

const apiBase = rawBase.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/verify-reset-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: trimmedToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "โทเคนไม่ถูกต้องหรือหมดอายุ");
      setOk("โทเคนถูกต้อง คุณสามารถตั้งรหัสผ่านใหม่ได้แล้ว");
      setVerifiedEmail(data.email || "");
      setTimeout(() => {
        setStep("reset");
        setOk(null);
      }, 1500);
    } catch (e: any) {
      setErr(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    // Validate password match
    if (newPassword !== confirmPassword) {
      setErr("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setErr("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const rawBase =
  process.env.NEXT_PUBLIC_API_URL || 
  "https://fit-full-production.up.railway.app";

const apiBase = rawBase.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ");
      setOk("เปลี่ยนรหัสผ่านสำเร็จแล้ว คุณสามารถเข้าสู่ระบบได้");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
      setErr(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-red-100">
      <div className="w-full max-w-md bg-white/90 p-10 rounded-3xl shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* วงกลมตกแต่ง */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-100 rounded-full blur-2xl opacity-60 z-0" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-200 rounded-full blur-3xl opacity-50 z-0" />
        {/* โลโก้และหัวข้อ */}
        <div className="flex flex-col items-center z-10">
          <div className="mb-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-extrabold text-red-600 drop-shadow">F</span>
              <span className="text-4xl font-extrabold text-gray-700 drop-shadow">ITMATE</span>
            </div>
            <div className="text-gray-400 font-bold text-lg text-center tracking-widest mt-1">
              {step === "verify" ? "ยืนยันโทเคน" : "ตั้งรหัสผ่านใหม่"}
            </div>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className={`w-8 h-1 rounded ${step === "verify" ? "bg-red-600" : "bg-green-500"}`} />
              <div className={`w-8 h-1 rounded ${step === "reset" ? "bg-red-600" : "bg-gray-300"}`} />
            </div>
          </div>
        </div>

        {step === "verify" ? (
          <form onSubmit={handleVerifyToken} className="w-full space-y-5 z-10">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 ml-1" htmlFor="token">
                โทเคนจากอีเมล
              </label>
              <input
                id="token"
                type="text"
                placeholder="ใส่โทเคนที่ได้รับจากอีเมล"
                className="w-full bg-gray-100 text-gray-700 font-medium text-lg rounded-lg px-5 py-3 mb-1 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                โปรดตรวจสอบอีเมลของคุณเพื่อหาโทเคนรีเซ็ตรหัสผ่าน
              </p>
            </div>

            {ok && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-2 text-sm text-center">
                {ok}
              </div>
            )}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-2 text-sm text-center animate-shake">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-red-600 to-red-400 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:from-red-700 hover:to-red-500 active:scale-95 transition-all duration-150 tracking-wider ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              style={{ letterSpacing: 1 }}
            >
              {loading ? "กำลังยืนยัน..." : "ยืนยันโทเคน"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full space-y-5 z-10">
            {verifiedEmail && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-md px-4 py-2 text-sm text-center">
                กำลังรีเซ็ตรหัสผ่านสำหรับ: {verifiedEmail}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-1 ml-1" htmlFor="newPassword">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="ใส่รหัสผ่านใหม่"
                  className="w-full bg-gray-100 text-gray-700 font-medium text-lg rounded-lg px-5 py-3 mb-1 focus:outline-none focus:ring-2 focus:ring-red-400 transition pr-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 ml-1" htmlFor="confirmPassword">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="w-full bg-gray-100 text-gray-700 font-medium text-lg rounded-lg px-5 py-3 mb-1 focus:outline-none focus:ring-2 focus:ring-red-400 transition pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {ok && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-2 text-sm text-center">
                {ok}
              </div>
            )}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-2 text-sm text-center animate-shake">
                {err}
              </div>
            )}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-red-600 to-red-400 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:from-red-700 hover:to-red-500 active:scale-95 transition-all duration-150 tracking-wider ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                style={{ letterSpacing: 1 }}
              >
                {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("verify");
                  setErr(null);
                  setOk(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
              >
                ← กลับไปกรอกโทเคนใหม่
              </button>
            </div>
          </form>
        )}

        <div className="w-full flex flex-col sm:flex-row justify-between items-center mt-6 text-xs z-10 gap-2">
          <a
            href="/login"
            className="text-blue-800 font-bold hover:underline hover:text-blue-600 transition"
          >
            เข้าสู่ระบบ
          </a>
          <span className="hidden sm:inline-block text-gray-300">|</span>
          <a
            href="/forgotpass"
            className="text-blue-800 font-bold hover:underline hover:text-blue-600 transition"
          >
            ขอรีเซ็ตรหัสผ่านใหม่
          </a>
        </div>
      </div>
      <style jsx>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s;
        }
      `}</style>
    </main>
  );
}
