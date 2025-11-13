import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/common";  // <-- แก้ path


interface Review {
  id: number;
  comment: string;
  rating: number | null;
  createdAt: string;
  reviewer: {
    id: number;
    email: string;
    role: string;
    profileImage: string | null;
  };
  trainer: {
    id: number;
    email: string;
    role: string;
    profileImage: string | null;
  };
}

export default function ReviewsSection() {
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log("👉 API URL:", API_URL);

        const response = await fetch(`${API_URL}/api/reviews`);

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = (await response.json()) as Review[];

        const normalized = data.map((review) => ({
          ...review,
          reviewer: {
            ...review.reviewer,
            profileImage: review.reviewer?.profileImage ?? null,
          },
          trainer: {
            ...review.trainer,
            profileImage: review.trainer?.profileImage ?? null,
          },
        }));

        setReviews(normalized);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Unable to load reviews right now.");

        const now = new Date().toISOString();
        setReviews([
          {
            id: 1,
            comment: "Great trainer support and personalized guidance.",
            rating: 5,
            createdAt: now,
            reviewer: {
              id: 1,
              email: "customer1@example.com",
              role: "USER",
              profileImage: null,
            },
            trainer: {
              id: 2,
              email: "trainer@example.com",
              role: "TRAINER",
              profileImage: null,
            },
          },
          {
            id: 2,
            comment: "Fun class environment that keeps me motivated.",
            rating: 5,
            createdAt: now,
            reviewer: {
              id: 3,
              email: "customer2@example.com",
              role: "USER",
              profileImage: null,
            },
            trainer: {
              id: 2,
              email: "trainer@example.com",
              role: "TRAINER",
              profileImage: null,
            },
          },
          {
            id: 3,
            comment: "Saw clear results within weeks—highly recommended.",
            rating: 5,
            createdAt: now,
            reviewer: {
              id: 4,
              email: "customer3@example.com",
              role: "USER",
              profileImage: null,
            },
            trainer: {
              id: 2,
              email: "trainer@example.com",
              role: "TRAINER",
              profileImage: null,
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Generate profile images based on reviewer email
  const getProfileImage = (reviewer: Review["reviewer"]) => {
    if (reviewer.profileImage) {
      return reviewer.profileImage;
    }

    const { email } = reviewer;
    const hash = email.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const avatarIndex = Math.abs(hash) % 6 + 1;
    return `/images/review${avatarIndex}.jpg`;
  };

  const showReviews =
    reviews.length > 0
      ? [
          reviews[reviewIndex % reviews.length],
          reviews[(reviewIndex + 1) % reviews.length],
          reviews[(reviewIndex + 2) % reviews.length],
        ].filter(Boolean)
      : [];

  const handlePrev = () => {
    setReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  if (loading) {
    return (
      <section className="relative py-16 sm:py-20 bg-gray-100 overflow-hidden">
        <div className="relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow-lg mb-12 tracking-wide">
            รีวิวจากลูกค้า
          </h2>
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <section className="relative py-16 sm:py-20 bg-gray-100 overflow-hidden">
        <div className="relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow-lg mb-12 tracking-wide">
            รีวิวจากลูกค้า
          </h2>
          <p className="text-gray-600 text-lg">{error || "ยังไม่มีรีวิวจากลูกค้า"}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 sm:py-20 bg-gray-100 overflow-hidden">
      {/* Background Circles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%">
          <circle cx="10%" cy="20%" r="60" fill="#fbbf24" fillOpacity="0.08" />
          <circle cx="90%" cy="80%" r="80" fill="#f87171" fillOpacity="0.07" />
          <circle cx="50%" cy="10%" r="40" fill="#f87171" fillOpacity="0.06" />
          <circle cx="80%" cy="30%" r="30" fill="#fbbf24" fillOpacity="0.06" />
        </svg>
      </div>

      <h2 className="relative z-10 text-center text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow-lg mb-12 tracking-wide">
        รีวิวจากลูกค้า
      </h2>

      <div className="relative z-10 max-w-5xl mx-auto flex items-center gap-4 px-6">
        {/* Prev button */}
        <button
          onClick={handlePrev}
          className="hidden md:inline-flex w-14 h-14 rounded-full bg-white shadow-xl hover:bg-yellow-100 text-red-500 font-bold text-3xl items-center justify-center transition-all duration-200 border-2 border-red-200 hover:scale-110"
        >
          &lt;
        </button>

        {/* Review Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-10">
          {showReviews.map((review, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-3xl shadow-2xl p-8 text-center border border-yellow-100 hover:border-yellow-400 transition-all duration-300 group hover:scale-105"
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="w-8 h-4 bg-yellow-400 rounded-b-xl shadow-md"></div>
              </div>

              {/* Quote Icon */}
              <svg
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-300 opacity-80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 17c-2.21 0-4-1.79-4-4V7c0-2.21 1.79-4 4-4h10c2.21 0 4 1.79 4 4v6c0 2.21-1.79 4-4 4h-4l-4 4v-4H7z" />
              </svg>

              {/* Profile */}
              <img
                src={getProfileImage(review.reviewer)}
                alt={review.reviewer.email}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-yellow-300 shadow-lg group-hover:border-yellow-500 transition-all duration-300 bg-gray-100"
              />

              <div className="text-gray-800 font-bold mb-1">
                {review.reviewer.email.split("@")[0]}
              </div>

              {/* Rating */}
              <div className="flex gap-1 text-yellow-400 justify-center mb-2">
                {Array.from({ length: review.rating || 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                    <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                  </svg>
                ))}
              </div>

              {/* Comment */}
              <p className="mt-4 text-gray-600 text-base min-h-[72px] font-medium">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="mt-4 text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("th-TH")}
              </div>
            </div>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={handleNext}
          className="hidden md:inline-flex w-14 h-14 rounded-full bg-white shadow-xl hover:bg-yellow-100 text-red-500 font-bold text-3xl items-center justify-center transition-all duration-200 border-2 border-red-200 hover:scale-110"
        >
          &gt;
        </button>
      </div>

      {/* Indicators */}
      <div className="relative z-10 flex justify-center gap-2 mt-10">
        {reviews.map((_, idx) => (
          <span
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-300 border-2 border-yellow-300 ${
              idx === reviewIndex % reviews.length
                ? "bg-yellow-400 shadow-lg scale-125"
                : "bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Mobile Buttons */}
      <div className="relative z-10 flex justify-center gap-4 mt-6 md:hidden">
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full bg-white shadow-lg hover:bg-yellow-100 text-red-500 font-bold text-2xl flex items-center justify-center border-2 border-red-200"
        >
          &lt;
        </button>
        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full bg-white shadow-lg hover:bg-yellow-100 text-red-500 font-bold text-2xl flex items-center justify-center border-2 border-red-200"
        >
          &gt;
        </button>
      </div>
    </section>
  );
}
