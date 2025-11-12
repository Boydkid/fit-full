import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Layout } from "../../../components/Layout";
import { TrainerCard, TrainerSearch } from "../../../components/trainer";

type Trainer = {
  id: number;
  email: string;
  username?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
  profileImage?: string | null;
};

export default function Trainer() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeProfileImage = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/api/trainers`);
        if (!res.ok) {
          throw new Error("Failed to fetch trainers");
        }
        const data: Trainer[] = await res.json();
        const normalized = data.map((trainer) => ({
          ...trainer,
          profileImage: normalizeProfileImage(trainer.profileImage),
        }));
        
        setTrainers(normalized);
        setFilteredTrainers(normalized);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = trainers.filter(trainer =>
      trainer.email.toLowerCase().includes(query.toLowerCase()) ||
      trainer.role.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTrainers(filtered);
  };

  const handleFilterChange = (filters: any) => {
    let filtered = trainers;

    if (searchQuery) {
      filtered = filtered.filter(trainer =>
        trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(trainer => 
        trainer.averageRating && trainer.averageRating >= filters.rating
      );
    }

    // Sort by selected option
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'experience':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'reviews':
          return b.totalReviews - a.totalReviews;
        default:
          return 0;
      }
    });

    setFilteredTrainers(filtered);
  };

    const handleBook = async (trainerId: number, bookingData: any) => {
    try {
      // Here you would typically send the booking data to your backend
      await Swal.fire({
        icon: 'success',
        title: 'จองสำเร็จ',
        text: 'ระบบจะติดต่อกลับในภายหลัง',
        confirmButtonColor: '#ef4444',
      });
    } catch (error) {
      console.error('Booking failed:', error);
      await Swal.fire({
        icon: 'error',
        title: 'จองไม่สำเร็จ',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  return (
    <Layout>
      <div className="w-full text-gray-800 bg-gray-100">
        {/* ===== Hero Section ===== */}
        <section className="relative overflow-hidden">
          <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
            <img
              src="/images/hero-trainer.jpg"
              alt="Personal training"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
            <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
              <div className="text-center">
                <h1 className="text-white font-extrabold leading-tight text-3xl sm:text-5xl lg:text-6xl mb-6 drop-shadow-2xl">
                  พบกับเทรนเนอร์
                  <span className="block text-red-400">มืออาชีพ</span>
                </h1>
                <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
                  ค้นหาเทรนเนอร์ที่เหมาะกับคุณ และเริ่มต้นการเดินทางสู่สุขภาพที่ดี
                </p>
                <button
                  onClick={() => document.getElementById('trainer-search')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-red-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  เริ่มค้นหา
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* ===== จุดเด่นของทีมเทรนเนอร์ ===== */}
        <section className="bg-white py-8 sm:py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base mb-4 sm:mb-6 shadow-lg">
                จุดเด่นของทีมเทรนเนอร์
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 sm:mb-6 leading-tight">
                เทรนเนอร์มืออาชีพของเรา
                <span className="block text-red-600">พร้อมช่วยคุณบรรลุเป้าหมาย</span>
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4 sm:px-0">
                ด้วยประสบการณ์และความเข้าใจในแต่ละเป้าหมายของลูกค้าอย่างแท้จริง
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <div className="group flex flex-col items-center bg-gradient-to-br from-red-50 via-white to-red-100 rounded-3xl shadow-xl py-8 px-6 hover:scale-105 transition-all duration-300 border border-red-100 hover:shadow-2xl">
                <div className="bg-white rounded-full p-4 mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src="/images/icon1.png" alt="icon1" className="w-12 h-12" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-lg text-center">
                  พร้อมให้คำปรึกษาฟรีก่อนเริ่มทุกคอร์ส
                </h3>
                <p className="text-gray-500 text-sm text-center">
                  สอบถามได้ทุกเรื่องสุขภาพ
                </p>
              </div>
              
              <div className="group flex flex-col items-center bg-gradient-to-br from-red-50 via-white to-red-100 rounded-3xl shadow-xl py-8 px-6 hover:scale-105 transition-all duration-300 border border-red-100 hover:shadow-2xl">
                <div className="bg-white rounded-full p-4 mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src="/images/icon2.png" alt="icon2" className="w-12 h-12" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-lg text-center">
                  เชี่ยวชาญกับงานเทรนนิ่งและการดีไซน์
                </h3>
                <p className="text-gray-500 text-sm text-center">
                  ออกแบบโปรแกรมเฉพาะบุคคล
                </p>
              </div>
              
              <div className="group flex flex-col items-center bg-gradient-to-br from-red-50 via-white to-red-100 rounded-3xl shadow-xl py-8 px-6 hover:scale-105 transition-all duration-300 border border-red-100 hover:shadow-2xl">
                <div className="bg-white rounded-full p-4 mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src="/images/icon3.png" alt="icon3" className="w-12 h-12" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-lg text-center">
                  เทรนเนอร์ได้รับการรับรองจากสถาบันชั้นนำ
                </h3>
                <p className="text-gray-500 text-sm text-center">
                  มั่นใจในมาตรฐาน
                </p>
              </div>
              
              <div className="group flex flex-col items-center bg-gradient-to-br from-red-50 via-white to-red-100 rounded-3xl shadow-xl py-8 px-6 hover:scale-105 transition-all duration-300 border border-red-100 hover:shadow-2xl">
                <div className="bg-white rounded-full p-4 mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src="/images/icon4.png" alt="icon4" className="w-12 h-12" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-lg text-center">
                  รีวิวจากลูกค้ากว่า 500+ คน
                </h3>
                <p className="text-gray-500 text-sm text-center">
                  ความประทับใจจริงจากผู้ใช้บริการ
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Search Section ===== */}
        <section id="trainer-search" className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <TrainerSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          </div>
        </section>

        {/* ===== ทีมเทรนเนอร์ของเรา ===== */}
        <section className="py-8 sm:py-12 md:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-3 sm:mb-4">
                ทีมเทรนเนอร์ของเรา
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                {filteredTrainers.length} เทรนเนอร์พร้อมให้บริการ
              </p>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                <p className="text-gray-500 mt-4">กำลังโหลด...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                  ❌ {error}
                </div>
              </div>
            )}
            
            {!loading && !error && filteredTrainers.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                  {searchQuery ? 'ไม่พบเทรนเนอร์ที่ค้นหา' : 'ยังไม่มีเทรนเนอร์'}
                </div>
              </div>
            )}

            {!loading && !error && filteredTrainers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {filteredTrainers.map((trainer) => (
                  <TrainerCard
                    key={trainer.id}
                    trainer={trainer}
                    onBook={handleBook}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
