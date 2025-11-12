import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Layout } from "../../components/Layout";
import { BookingCard, EnrollmentDisplay } from "../../components/booking";
import { Button } from "../../components/common";

type EnrolledClassResponse = {
  enrollmentId: number;
  enrolledAt: string;
  class: {
    id: number;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    capacity: number | null;
    requiredRole: string | null;
    enrollmentCount: number;
    availableSpots: number | null;
    trainer: { id: number; email: string; role: string; profileImage?: string | null } | null;
    createdBy: { id: number; email: string; role: string } | null;
    category: { id: number; name: string | null } | null;
  };
  hasStarted: boolean;
  status: "UPCOMING" | "ONGOING" | "ENDED";
  startsAt: string;
  endsAt: string | null;
  msUntilStart: number;
  msUntilEnd: number | null;
};

type UserEnrollmentResponse = {
  user: {
    id: number;
    email: string;
    role: string;
  };
  enrollments: EnrolledClassResponse[];
};

type FilterOption = "all" | "UPCOMING" | "ONGOING" | "ENDED";

type TokenPayload = {
  id?: number;
  email?: string;
  role?: string;
  exp?: number;
};

const parseJwt = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(payload);
  } catch (_error) {
    return null;
  }
};

const statusLabels: Record<Exclude<FilterOption, "all">, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  ENDED: "Ended",
};

const transformEnrollment = (enrollment: EnrolledClassResponse): EnrollmentDisplay => ({
  enrollmentId: enrollment.enrollmentId,
  status: enrollment.status,
  startsAt: enrollment.startsAt,
  endsAt: enrollment.endsAt,
  classTitle: enrollment.class.title,
  trainer: {
    id: enrollment.class.trainer?.id ?? 0,
    email: enrollment.class.trainer?.email ?? "-",
    role: enrollment.class.trainer?.role ?? "-",
    profileImage: enrollment.class.trainer?.profileImage ?? null,
  },
});

export default function BookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<EnrollmentDisplay[]>([]);
  const [rawEnrollments, setRawEnrollments] = useState<EnrolledClassResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Please sign in to see your bookings.");
      return;
    }

    const payload = parseJwt(token);
    if (!payload?.id) {
      setError("User info missing. Please sign in again.");
      return;
    }
    setUserId(payload.id);
  }, []);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!userId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/api/users/${userId}/classes`);
        if (!res.ok) {
          throw new Error("Unable to load bookings.");
        }
        const data: UserEnrollmentResponse = await res.json();
        setRawEnrollments(data.enrollments ?? []);
        setBookings((data.enrollments ?? []).map(transformEnrollment));
      } catch (err: any) {
        setError(err.message || "Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [userId]);

  const filteredBookings = useMemo(() => {
    if (filter === "all") {
      return bookings;
    }
    return bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  const statusCounts = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc.all += 1;
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      {
        all: 0,
        UPCOMING: 0,
        ONGOING: 0,
        ENDED: 0,
      } as Record<"all" | Exclude<FilterOption, "all">, number>
    );
  }, [bookings]);

  const getFilterButtonClass = (filterType: FilterOption) => {
    const baseClass = "px-4 py-2 rounded-lg font-semibold transition-all duration-200";
    const isActive = filter === filterType;

    if (isActive) {
      return `${baseClass} bg-red-500 text-white shadow-lg`;
    }

    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  const handleCancel = async (enrollmentId: number) => {
    if (!userId) return;

    const enrollment = rawEnrollments.find((item) => item.enrollmentId === enrollmentId);
    if (!enrollment) {
      return;
    }

    const result = await Swal.fire({
      title: "Cancel this booking?",
      text: "Are you sure you want to cancel this class booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Back",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/users/${userId}/classes/${enrollment.class.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Unable to cancel booking.");
      }

      setRawEnrollments((prev) => prev.filter((item) => item.enrollmentId !== enrollmentId));
      setBookings((prev) => prev.filter((item) => item.enrollmentId !== enrollmentId));

      await Swal.fire({
        icon: "success",
        title: "Booking cancelled",
        text: "Booking has been cancelled",
        confirmButtonColor: "#ef4444",
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Cancel failed",
        text: error?.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const emptyTitle =
    filter === "all"
      ? "No bookings found"
      : `No classes found for "${statusLabels[filter as Exclude<FilterOption, "all">]}"`;
  const emptyDescription =
    filter === "all"
      ? "Start exploring our classes and enrol today."
      : "Try browsing other available classes.";

  const handleViewDetails = (enrollmentId: number) => {
    const enrollment = rawEnrollments.find((item) => item.enrollmentId === enrollmentId);
    if (!enrollment) return;
    router.push(`/fitmateclass/${enrollment.class.id}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Your Class Bookings</h1>
            <p className="text-gray-600 text-lg">Keep track of every class you have enrolled in, spot what is coming up, and review what has been completed.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setFilter("all")}
                className={getFilterButtonClass("all")}
              >
                All ({statusCounts.all})
              </button>
              {Object.entries(statusLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterOption)}
                  className={getFilterButtonClass(key as FilterOption)}
                >
                  {label} ({statusCounts[key as Exclude<FilterOption, "all">]})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-gray-500 mt-4">Loading data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
                {error}
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-8 rounded-lg max-w-md mx-auto">
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
                <p className="text-gray-500 mb-4">{emptyDescription}</p>
                {filter === "all" && (
                  <Button href="/fitmateclass" variant="primary">
                    Browse classes
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((enrollment) => (
                <BookingCard
                  key={enrollment.enrollmentId}
                  enrollment={enrollment}
                  canCancel={enrollment.status === "UPCOMING"}
                  onCancel={handleCancel}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}

          {bookings.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ready to book another class?
                </h3>
                <Button href="/fitmateclass" variant="primary" size="lg">
                  Find more classes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}



