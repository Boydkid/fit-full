import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Layout } from "../components/Layout";
import { BookingCard, EnrollmentDisplay } from "../components/booking";
import { Button } from "../components/common";

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

  // ⭐ Trainer Booking State
  const [trainerBookings, setTrainerBookings] = useState<any[]>([]);

  // 🌟 Load JWT user ID
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
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

  // 🌟 Load All Bookings
  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // ⭐ Load class enrollments
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/classes`
        );
        if (!res.ok) throw new Error("Unable to load class bookings.");
        const data: UserEnrollmentResponse = await res.json();
        setRawEnrollments(data.enrollments ?? []);
        setBookings((data.enrollments ?? []).map(transformEnrollment));

        // ⭐ Load trainer bookings
        const token = localStorage.getItem("token");
        const trainerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/trainers/my-bookings`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        if (trainerRes.ok) {
          const trainerData = await trainerRes.json();
          setTrainerBookings(trainerData);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((booking) => booking.status === filter);
  }, [bookings, filter]);

  const statusCounts = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc.all += 1;
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      { all: 0, UPCOMING: 0, ONGOING: 0, ENDED: 0 }
    );
  }, [bookings]);

  const getFilterButtonClass = (filterType: FilterOption) => {
    const baseClass =
      "px-4 py-2 rounded-lg font-semibold transition-all duration-200";
    const isActive = filter === filterType;

    return isActive
      ? `${baseClass} bg-red-500 text-white shadow-lg`
      : `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  const handleCancel = async (enrollmentId: number) => {
    if (!userId) return;

    const enrollment = rawEnrollments.find(
      (item) => item.enrollmentId === enrollmentId
    );
    if (!enrollment) return;

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

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/classes/${enrollment.class.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Unable to cancel booking.");
      }

      setRawEnrollments((prev) =>
        prev.filter((item) => item.enrollmentId !== enrollmentId)
      );
      setBookings((prev) =>
        prev.filter((item) => item.enrollmentId !== enrollmentId)
      );

      await Swal.fire({
        icon: "success",
        title: "Booking cancelled",
        confirmButtonColor: "#ef4444",
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Cancel failed",
        text: error?.message || "Something went wrong.",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const handleViewDetails = (enrollmentId: number) => {
    const enrollment = rawEnrollments.find(
      (item) => item.enrollmentId === enrollmentId
    );
    if (!enrollment) return;
    router.push(`/fitmateclass/${enrollment.class.id}`);
  };

  const emptyTitle =
    filter === "all"
      ? "No bookings found"
      : `No classes for "${statusLabels[filter as Exclude<FilterOption, "all">]}"`;

  const emptyDescription =
    filter === "all"
      ? "Start exploring our classes and enrol today."
      : "Try browsing other classes.";

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* ⭐ Trainer Bookings */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Trainer Bookings
            </h2>

            {trainerBookings.length === 0 ? (
              <p className="text-gray-600">You have no trainer bookings.</p>
            ) : (
              <div className="space-y-4">
                {trainerBookings.map((b) => (
                  <div
                    key={b.id}
                    className="border p-4 rounded-xl bg-gray-50 shadow-sm"
                  >
                    <p className="text-lg font-semibold text-gray-800">
                      Trainer: {b.trainer.username || b.trainer.email}
                    </p>
                    <p>Date: {b.date}</p>
                    <p>Time: {b.time}</p>
                    <p>Duration: {b.duration} mins</p>
                    <p className="text-gray-600 mt-2">
                      {b.note || "No notes"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ⭐ Class Bookings Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your Class Bookings
            </h1>
            <p className="text-gray-600 text-lg">
              Keep track of all classes you have enrolled in.
            </p>
          </div>

          {/* FILTER */}
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
                  {label} (
                  {statusCounts[key as Exclude<FilterOption, "all">]})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-gray-500 mt-4">Loading...</p>
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
                  Ready for more?
                </h3>
                <Button href="/fitmateclass" variant="primary" size="lg">
                  Explore More Classes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
