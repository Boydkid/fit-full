"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import { Button, Card } from "../../components/common";

type Class = {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  requiredRole: string | null;
  availableSpots: number | null;
  enrollmentCount: number;
  trainer: { id: number; email: string; username?: string | null; role: string } | null;
  category: { id: number; name: string | null } | null;
};

type ClassCategory = {
  id: number;
  name: string;
  description: string | null;
};

export default function ClassListPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  const router = useRouter();
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "${process.env.NEXT_PUBLIC_API_URL}").replace(/\/$/, "");

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/classes/listclassupcoming`);
        if (!res.ok) throw new Error("โหลดข้อมูลคลาสไม่สำเร็จ");
        const data = await res.json();
        setClasses(data);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch(`${apiBase}/api/class-categories`);
        if (!res.ok) throw new Error("โหลดหมวดหมู่ไม่สำเร็จ");
        const data = await res.json();
        setCategories(data);
      } catch (err: any) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter classes
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((clazz) => clazz.category?.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (clazz) =>
          clazz.title.toLowerCase().includes(query) ||
          clazz.description?.toLowerCase().includes(query) ||
          clazz.category?.name?.toLowerCase().includes(query) ||
          clazz.trainer?.email.toLowerCase().includes(query) ||
          (clazz.trainer?.username && clazz.trainer.username.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [classes, selectedCategory, searchQuery]);

  // Calculate status for each class
  const getClassStatus = (clazz: Class) => {
    const now = new Date();
    const start = new Date(clazz.startTime);
    const end = new Date(clazz.endTime);
    if (start > now) return "UPCOMING";
    if (end < now) return "ENDED";
    return "ONGOING";
  };

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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-red-100 py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
              <span className="text-red-600">Fitmate</span> Classes
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 sm:px-0">
              ค้นหาคลาสที่เหมาะกับคุณ และเริ่มต้นการเดินทางสู่สุขภาพที่ดี
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                  ค้นหาคลาส
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาตามชื่อคลาส..."
                    className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  หมวดหมู่
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
                  disabled={loadingCategories}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="all">ทั้งหมด</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchQuery || selectedCategory !== "all") && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">
                  พบ {filteredClasses.length} คลาส
                  {searchQuery && ` จากคำค้นหา "${searchQuery}"`}
                  {selectedCategory !== "all" &&
                    ` ในหมวดหมู่ "${categories.find((c) => c.id === selectedCategory)?.name || ""}"`}
                </span>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold underline"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            )}
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
                  {classes.length === 0 ? "ยังไม่มีคลาส" : "ไม่พบคลาสที่ค้นหา"}
                </h3>
                <p className="text-gray-500">
                  {classes.length === 0
                    ? "โปรดตรวจสอบอีกครั้งในภายหลัง"
                    : "ลองปรับเงื่อนไขการค้นหาหรือตัวกรอง"}
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
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
                            {new Date(clazz.startTime).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(clazz.startTime).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs">{clazz.trainer?.username || clazz.trainer?.email || "ยังไม่มีเทรนเนอร์"}</span>
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
                            <span className="text-xs text-gray-500">ไม่จำกัดจำนวนผู้เข้าร่วม</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 pb-6">
                      <Button
                        onClick={() => router.push(`/fitmateclass/${clazz.id}`)}
                        variant="primary"
                        className="w-full"
                        disabled={status === "ENDED"}
                      >
                        {status === "ENDED" ? "คลาสจบแล้ว" : "ดูรายละเอียด"}
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
