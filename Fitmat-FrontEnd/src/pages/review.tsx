import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

type ReviewSummary = {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<string, number>;
};

type Review = {
  id: number;
  comment: string;
  rating: number | null;
  createdAt: string;
  reviewer: {
    id: number;
    email: string;
    role: string;
  };
  trainer: {
    id: number;
    email: string;
    role: string;
  };
};

export default function Review() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate profile image based on email (deterministic)
  const getProfileImage = (email: string) => {
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const avatarIndex = Math.abs(hash) % 6 + 1;
    return `/images/review${avatarIndex}.jpg`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rawBase =
  process.env.NEXT_PUBLIC_API_URL || 
  "https://fit-full-production.up.railway.app";

const apiBase = rawBase.replace(/\/$/, "");
        // Fetch both summary and reviews
        const [summaryRes, reviewsRes] = await Promise.all([
          fetch(`${apiBase}/api/reviews/summary`),
          fetch(`${apiBase}/api/reviews`)
        ]);
        
        if (!summaryRes.ok || !reviewsRes.ok) {
          throw new Error("โหลดข้อมูลไม่สำเร็จ");
        }
        
        const [summaryData, reviewsData] = await Promise.all([
          summaryRes.json(),
          reviewsRes.json()
        ]);
        
        setSummary(summaryData);
        setReviews(reviewsData);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="w-full text-gray-800">
      {/* ===== Header ===== */}
      <Header />

      {/* ===== Hero Section ===== */}
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden">
        <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
          <img
            src="/images/hero-trainer.jpg"
            alt="Personal training"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <h1 className="text-white font-extrabold leading-tight text-2xl sm:text-4xl md:text-5xl mb-4">
              Review
            </h1>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6">
            {loading && <p className="text-gray-500">⏳ กำลังโหลด...</p>}
            {error && <p className="text-red-500">❌ {error}</p>}
            {summary && (
              <>
                {/* ค่าเฉลี่ย */}
                <div className="flex items-center gap-4">
                  <span className="text-red-500 text-5xl font-extrabold">
                    {summary.averageRating}
                  </span>
                  <div>
                    <div className="flex gap-1 text-yellow-400 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          viewBox="0 0 20 20"
                          className={`w-6 h-6 ${
                            i < Math.round(summary.averageRating)
                              ? "fill-current"
                              : "text-gray-300 fill-current"
                          }`}
                        >
                          <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-800 font-bold text-lg">
                      คะแนนเฉลี่ยจาก {summary.totalReviews} รีวิว
                    </span>
                  </div>
                </div>

                {/* breakdown */}
                <div className="space-y-2">
                  {Object.entries(summary.ratingCounts)
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .map(([star, count]) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-12 text-sm text-gray-700 font-semibold">
                          {star} ดาว
                        </span>
                        <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-400 h-3"
                            style={{
                              width: `${(count / summary.totalReviews) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-sm text-gray-500">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Why Us */}
          <div className="flex flex-col gap-6 justify-center">
            <div>
              <span className="inline-block bg-red-500 text-white px-4 py-2 rounded-full font-bold mb-4">
                สิ่งที่ทำให้เราแตกต่าง
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                เราช่วยให้คุณบรรลุเป้าหมายสุขภาพได้อย่างมีประสิทธิภาพ
              </h2>
              <p className="text-gray-700 mb-4">
                ด้วยทีมงานเทรนเนอร์คุณภาพ ที่ผ่านคัดเลือกและมีประสบการณ์จริง
                พร้อมดูแลและให้คำแนะนำอย่างใกล้ชิด
              </p>
              <button className="bg-red-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-600 active:bg-red-700 transition-all duration-200">
                เพราะคุณภาพคือหัวใจของเรา
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== รีวิวจริงจากลูกค้า ===== */}
      <section className="py-16 bg-gray-50 relative">
        <div className="relative max-w-6xl mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-gray-800 mb-12">
            รีวิวจริงจากลูกค้า
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-gray-500 mt-4">กำลังโหลดรีวิว...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">❌ {error}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">ยังไม่มีรีวิวจากลูกค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.slice(0, 6).map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={getProfileImage(review.reviewer.email)}
                      alt={review.reviewer.email}
                      className="w-12 h-12 rounded-full object-cover border-2 border-red-100"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/review1.jpg";
                      }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {review.reviewer.email.split('@')[0]}
                      </h4>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            viewBox="0 0 20 20"
                            className={`w-4 h-4 ${review.rating && i < (review.rating || 0) ? "text-yellow-400" : "text-gray-300"} fill-current`}
                          >
                            <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                          </svg>
                        ))}
                        {review.rating && (
                          <span className="text-sm text-gray-600 ml-1">({review.rating}/5)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-16 bg-white relative">
        {/* ตกแต่งพื้นหลัง */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-16 h-16 bg-red-100 rounded-lg rotate-12 opacity-60"></div>
          <div className="absolute top-0 right-16 w-16 h-16 bg-red-100 rounded-lg -rotate-6 opacity-60"></div>
          <div className="absolute bottom-8 left-1/2 w-16 h-16 bg-red-100 rounded-lg -rotate-12 opacity-60"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-10">
            บริการของเรา
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-red-500">
              <img
                src="/images/111.png"
                alt="วางแผนการออกกำลังกาย"
                className="w-full h-40 object-cover rounded-xl mb-4"
              />
              <h3 className="font-bold text-lg mb-2">วางแผนการออกกำลังกาย</h3>
              <p className="text-gray-600 mb-4">
                ออกแบบโปรแกรมเฉพาะบุคคล
                โดยเทรนเนอร์มืออาชีพตามเป้าหมายที่คุณต้องการ
              </p>
              <button
                onClick={() => router.push("/contactus")}
                className="text-red-500 font-semibold hover:text-red-600 transition-colors cursor-pointer"
              >
                ขอข้อมูลบริการ
              </button>
            </div>
            {/* Service 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-red-500">
              <img
                src="/images/222.png"
                alt="วิเคราะห์พฤติกรรมและไลฟ์สไตล์"
                className="w-full h-40 object-cover rounded-xl mb-4"
              />
              <h3 className="font-bold text-lg mb-2">
                วิเคราะห์พฤติกรรมและไลฟ์สไตล์
              </h3>
              <p className="text-gray-600 mb-4">
                ทีมงานมืออาชีพช่วยวิเคราะห์และให้คำแนะนำเพื่อผลลัพธ์ที่ดีที่สุด
              </p>
              <button
                onClick={() => router.push("/contactus")}
                className="text-red-500 font-semibold hover:text-red-600 transition-colors cursor-pointer"
              >
                ขอข้อมูลบริการ
              </button>
            </div>
            {/* Service 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-red-500">
              <img
                src="/images/333.png"
                alt="ติดตามผลอย่างใกล้ชิด"
                className="w-full h-40 object-cover rounded-xl mb-4"
              />
              <h3 className="font-bold text-lg mb-2">ติดตามผลอย่างใกล้ชิด</h3>
              <p className="text-gray-600 mb-4">
                เทรนเนอร์คอยติดตามและปรับแผนอย่างต่อเนื่อง
                พร้อมรายงานผลลัพธ์ให้คุณทราบ
              </p>
              <button
                onClick={() => router.push("/contactus")}
                className="text-red-500 font-semibold hover:text-red-600 transition-colors cursor-pointer"
              >
                ขอข้อมูลบริการ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
     <Footer/>
    </main>
  );
}
