"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import { Card, Button } from "../components/common";
import { parseJwt } from "../utils/auth";

type Class = {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  requiredRole: string | null;
  enrollmentCount: number;
  availableSpots: number | null;
  category: { id: number; name: string | null } | null;
};

type MyClassesResponse = {
  trainer: {
    id: number;
    email: string;
  };
  classes: Class[];
};

type TokenPayload = {
  id?: number;
  email?: string;
  role?: string;
  exp?: number;
};

export default function MyClassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "UPCOMING" | "ONGOING" | "ENDED">("all");

  const rawBase =
  process.env.NEXT_PUBLIC_API_URL || 
  "https://fit-full-production.up.railway.app";

const apiBase = rawBase.replace(/\/$/, "");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    const payload = parseJwt(storedToken);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      setUser(payload);
    } else {
      setError("กรุณาเข้าสู่ระบบอีกครั้ง");
    }
  }, []);

  useEffect(() => {
    if (!user?.id || user.role !== "TRAINER") {
      if (user && user.role !== "TRAINER") {
        setError("หน้านี้สำหรับเทรนเนอร์เท่านั้น");
      }
      return;
    }

    const fetchMyClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${apiBase}/api/classes/my-classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.message || "ไม่สามารถโหลดข้อมูลคลาสได้");
        }

        const data: MyClassesResponse = await res.json();
        setClasses(data.classes);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, [user?.id, user?.role]);

  const getClassStatus = (clazz: Class) => {
    const now = new Date();
    const start = new Date(clazz.startTime);
    const end = new Date(clazz.endTime);
    if (start > now) return "UPCOMING";
    if (end < now) return "ENDED";
    return "ONGOING";
  };

  const filteredClasses = useMemo(() => {
    if (filter === "all") return classes;
    return classes.filter((clazz) => getClassStatus(clazz) === filter);
  }, [classes, filter]);

  const statusCounts = useMemo(() => {
    return classes.reduce(
      (acc, clazz) => {
        const status = getClassStatus(clazz);
        acc.all += 1;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {
        all: 0,
        UPCOMING: 0,
        ONGOING: 0,
        ENDED: 0,
      } as Record<"all" | "UPCOMING" | "ONGOING" | "ENDED", number>
    );
  }, [classes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-yellow-100 text-yellow-800";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "ENDED":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "กำลังจะเริ่ม";
      case "ONGOING":
        return "กำลังเรียน";
      case "ENDED":
        return "จบแล้ว";
      default:
        return "";
    }
  };

  if (!user || user.role !== "TRAINER") {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                {error || "หน้านี้สำหรับเทรนเนอร์เท่านั้น"}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
              <span className="text-red-600">คลาสของฉัน</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 sm:px-0">
              จัดการและดูคลาสทั้งหมดที่คุณสอน
            </p>
          </div>

          {/* Filter Section */}
          <div className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === "all"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ทั้งหมด ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilter("UPCOMING")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === "UPCOMING"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                กำลังจะเริ่ม ({statusCounts.UPCOMING})
              </button>
              <button
                onClick={() => setFilter("ONGOING")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === "ONGOING"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                กำลังเรียน ({statusCounts.ONGOING})
              </button>
              <button
                onClick={() => setFilter("ENDED")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === "ENDED"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                จบแล้ว ({statusCounts.ENDED})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-gray-500 mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                ❌ {error}
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {classes.length === 0 ? "ยังไม่มีคลาส" : "ไม่พบคลาสในหมวดนี้"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {classes.length === 0
                    ? "ยังไม่มีคลาสที่คุณสอน"
                    : "ลองเลือกหมวดอื่น"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClasses.map((clazz) => {
                const status = getClassStatus(clazz);
                return (
                  <Card key={clazz.id} hover shadow className="overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-3 font-bold text-sm">
                      {clazz.category?.name || "ไม่ระบุหมวดหมู่"}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-xl font-bold text-gray-900 flex-1">
                          {clazz.title}
                        </h2>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadge(status)}`}
                        >
                          {getStatusText(status)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                        {clazz.description || "ไม่มีคำอธิบาย"}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">
                            {new Date(clazz.startTime).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(clazz.startTime).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="mt-auto pt-2">
                          {clazz.availableSpots !== null ? (
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  clazz.availableSpots > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {clazz.availableSpots > 0
                                  ? `เหลือ ${clazz.availableSpots}/${clazz.capacity} ที่นั่ง`
                                  : "เต็มแล้ว"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {clazz.enrollmentCount} คนลงทะเบียน
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {clazz.enrollmentCount} คนลงทะเบียน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6">
                      <Button
                        onClick={() => router.push(`/fitmateclass/${clazz.id}`)}
                        variant="primary"
                        className="w-full"
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

