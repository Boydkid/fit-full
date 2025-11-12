"use client";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { Layout } from "../../../components/Layout";
import { Button, Card } from "../../../components/common";
import { parseJwt } from "../../utils/auth";

type User = {
  id: number;
  email: string;
  role: string;
};

type Enrollment = {
  id: number;
  createdAt: string;
  user: User;
};

type ClassDetail = {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  createdBy: User | null;
  trainer: User | null;
  category: { id: number; name: string | null } | null;
  requiredRole: string | null;
  availableSpots?: number | null;
};

type TokenPayload = {
  id?: number;
  role?: string;
  exp?: number;
  email?: string;
};

export default function ClassDetailPage() {
  const router = useRouter();
  const { slug } = router.query; // ✅ ได้ค่าจาก URL /fitmateclass/[slug]
  const [user, setUser] = useState<TokenPayload | null>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;

    const payload = parseJwt(storedToken);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      setUser(payload);
    }
  }, []);

  // แปลง slug -> classId แบบปลอดภัย
  const classId = useMemo<number | null>(() => {
    if (!slug) return null;
    const s = Array.isArray(slug) ? slug[0] : slug;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  }, [slug]);

  const [clazz, setClazz] = useState<ClassDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // โหลดข้อมูล class + ผู้สมัคร
  useEffect(() => {
    if (classId == null) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${apiBase}/api/classes/${classId}/enrollments`
        );
        if (!res.ok) throw new Error("ไม่พบข้อมูลคลาส");
        const data = await res.json();
        setClazz(data.class);
        setEnrollments(data.enrollments);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  // ตรวจสอบว่าผู้ใช้สมัครแล้วหรือยัง (แยก useEffect เพื่อรอให้ user ถูก set ก่อน)
  useEffect(() => {
    if (!user?.id || !enrollments || !Array.isArray(enrollments) || !enrollments.length) {
      setIsEnrolled(false);
      return;
    }
    const enrolled = enrollments.some(
      (enroll: Enrollment) => enroll.user.id === user.id
    );
    setIsEnrolled(enrolled);
  }, [user?.id, enrollments]);

  // เช็กสถานะเริ่ม-จบ
  const status = useMemo<"UPCOMING" | "ONGOING" | "ENDED" | null>(() => {
    if (!clazz) return null;
    const now = new Date();
    const start = new Date(clazz.startTime);
    const end = new Date(clazz.endTime);
    if (start > now) return "UPCOMING";
    if (end < now) return "ENDED";
    return "ONGOING";
  }, [clazz]);

  // สมัครคลาส - ใช้ userId จาก token
  const handleEnroll = async () => {
    if (classId == null) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบข้อมูลคลาส",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (!user?.id) {
      await Swal.fire({
        icon: "warning",
        title: "ต้องเข้าสู่ระบบ",
        text: "กรุณาเข้าสู่ระบบก่อนสมัครคลาส",
        confirmButtonColor: "#ef4444",
      });
      router.push("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "ต้องเข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนสมัครคลาส",
          confirmButtonColor: "#ef4444",
        });
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${apiBase}/api/classes/${classId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // ไม่ต้องส่ง userId ใน body แล้ว เพราะ backend จะใช้จาก token
        }
      );

      if (!res.ok) {
        const err = await res.json();
        await Swal.fire({
          icon: "error",
          title: "สมัครไม่สำเร็จ",
          text: err?.message || "ไม่สามารถสมัครคลาสได้ กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "สมัครสำเร็จ",
        text: "สมัครคลาสสำเร็จแล้ว",
        confirmButtonColor: "#ef4444",
      });

      // ✅ โหลดรายชื่อผู้สมัครของคลาสนี้ใหม่
      const updated = await fetch(
        `${apiBase}/api/classes/${classId}/enrollments`
      );
      const data = await updated.json();
      setEnrollments(data.enrollments);
      setIsEnrolled(true);
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสมัครคลาสได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // ยกเลิกการสมัครคลาส
  const handleUnenroll = async () => {
    if (classId == null || !user?.id) return;

    const result = await Swal.fire({
      title: "ยกเลิกการสมัคร?",
      text: "คุณต้องการยกเลิกการสมัครคลาสนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "ต้องเข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อน",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const res = await fetch(
        `${apiBase}/api/users/${user.id}/classes/${classId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "ไม่สามารถยกเลิกการสมัครได้");
      }

      await Swal.fire({
        icon: "success",
        title: "ยกเลิกสำเร็จ",
        text: "ยกเลิกการสมัครคลาสเรียบร้อยแล้ว",
        confirmButtonColor: "#ef4444",
      });

      // โหลดข้อมูลใหม่
      const updated = await fetch(
        `${apiBase}/api/classes/${classId}/enrollments`
      );
      const data = await updated.json();
      setEnrollments(data.enrollments);
      setIsEnrolled(false);
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err?.message || "ไม่สามารถยกเลิกการสมัครได้",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-gray-500 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                ❌ {error}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!clazz) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          {/* Header Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-semibold">
                      {clazz.category?.name || "ไม่ระบุหมวดหมู่"}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{clazz.title}</h1>
                </div>
                {status && (
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                      status === "UPCOMING"
                        ? "bg-yellow-400 text-black"
                        : status === "ONGOING"
                        ? "bg-green-500 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {status === "UPCOMING"
                      ? "⏰ กำลังจะเริ่ม"
                      : status === "ONGOING"
                      ? "✅ กำลังเรียน"
                      : "🔒 จบแล้ว"}
                  </span>
                )}
              </div>
            </div>

            {/* Detail Section */}
            <div className="p-6 space-y-6">
              {clazz.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">คำอธิบาย</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {clazz.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Info
                  label="เริ่ม"
                  value={new Date(clazz.startTime).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  icon="📅"
                />
                <Info
                  label="สิ้นสุด"
                  value={new Date(clazz.endTime).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  icon="🕐"
                />
                <Info 
                  label="Trainer" 
                  value={clazz.trainer?.email ?? "ยังไม่กำหนด"} 
                  icon="👨‍🏫"
                />
                <Info 
                  label="ที่นั่ง" 
                  value={clazz.capacity ? `${clazz.capacity} ที่นั่ง` : "ไม่จำกัด"} 
                  icon="👥"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                {isEnrolled ? (
                  <>
                    <Button
                      onClick={handleUnenroll}
                      disabled={status === "ENDED"}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                    >
                      {status === "ENDED" ? "คลาสนี้จบแล้ว" : "ยกเลิกการสมัคร"}
                    </Button>
                    <div className="flex-1 flex items-center justify-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-green-700 font-semibold text-sm">
                        ✓ สมัครแล้ว
                      </span>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={handleEnroll}
                    disabled={status === "ENDED" || !user}
                    variant="primary"
                    className="flex-1"
                  >
                    {!user
                      ? "กรุณาเข้าสู่ระบบก่อน"
                      : status === "ENDED"
                      ? "คลาสนี้จบแล้ว"
                      : "สมัครเข้าคลาส"}
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/fitmateclass")}
                  variant="outline"
                  className="flex-1"
                >
                  ← กลับไปยังรายการคลาส
                </Button>
              </div>
            </div>
          </Card>

          {/* Enrollments Section */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">รายชื่อผู้สมัคร</h2>
            {enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">อีเมล</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">บทบาท</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">สมัครเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {enrollments.map((enroll, idx) => (
                      <tr key={enroll.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{enroll.user.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {enroll.user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(enroll.createdAt).toLocaleString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-gray-500">ยังไม่มีผู้สมัคร</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Info({ label, value, icon }: { label: string; value: any; icon?: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
