// ... existing code ...
import { useEffect, useMemo, useState } from "react";

type RoleName = string;

type ReviewUser = {
  id: number;
  email: string;
  username?: string | null;
  role: RoleName;
};

type TrainerReview = {
  id: number;
  comment: string;
  rating: number | null;
  createdAt: string;
  reviewer: ReviewUser;
  trainer: ReviewUser;
};

type ReviewSummary = {
  totalReviews: number;
  averageRating: number | null;
  ratingCounts: Record<number, number>;
};

type TrainerWithRating = {
  trainer: ReviewUser;
  totalReviews: number;
  averageRating: number | null;
  reviews: TrainerReview[];
};

type ReviewControlProps = {
  userId: number;
  className?: string;
  token?: string | null;
};

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  "${process.env.NEXT_PUBLIC_API_URL}/api";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export default function ReviewControl({ userId, className, token }: ReviewControlProps) {
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [trainers, setTrainers] = useState<ReviewUser[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<TrainerReview | null>(null);
  const [trainerStats, setTrainerStats] = useState<TrainerWithRating | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [loadingTrainerStats, setLoadingTrainerStats] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [trainersError, setTrainersError] = useState<string | null>(null);
  const [trainerStatsError, setTrainerStatsError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canAct = useMemo(() => Number.isFinite(userId) && Number(userId) > 0, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReviews() {
      setLoadingReviews(true);
      setReviewsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        const data = (await response.json()) as TrainerReview[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch reviews.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setReviews(data as TrainerReview[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching reviews.";
        setReviewsError(message);
      } finally {
        if (isMounted) {
          setLoadingReviews(false);
        }
      }
    }

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      setLoadingSummary(true);
      setSummaryError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/reviews/summary`);
        const data = (await response.json()) as ReviewSummary | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch review summary.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setSummary(data as ReviewSummary);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching review summary.";
        setSummaryError(message);
      } finally {
        if (isMounted) {
          setLoadingSummary(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  useEffect(() => {
    if (!canAct) {
      setTrainersError("Invalid admin user id provided.");
      return;
    }

    setTrainersError(null);

    let isMounted = true;

    async function fetchTrainers() {
      setLoadingTrainers(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/users?role=TRAINER`,
          {
            headers: {
              "Authorization": typeof window !== "undefined" && localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
            },
          }
        );
        const data = (await response.json()) as ReviewUser[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch trainers.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setTrainers(data as ReviewUser[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching trainers.";
        setTrainersError(message);
      } finally {
        if (isMounted) {
          setLoadingTrainers(false);
        }
      }
    }

    fetchTrainers();

    return () => {
      isMounted = false;
    };
  }, [userId, canAct]);

  useEffect(() => {
    if (!selectedTrainerId) {
      setTrainerStats(null);
      setTrainerStatsError(null);
      return;
    }

    let isMounted = true;

    async function fetchTrainerDetails(trainerId: string) {
      setLoadingTrainerStats(true);
      setTrainerStatsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/reviews/trainer/${trainerId}`);
        const data = (await response.json()) as TrainerWithRating | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch trainer review details.";
          throw new Error(message);
        }
        if (!isMounted) return;
        setTrainerStats(data as TrainerWithRating);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching trainer review details.";
        setTrainerStatsError(message);
      } finally {
        if (isMounted) {
          setLoadingTrainerStats(false);
        }
      }
    }

    fetchTrainerDetails(selectedTrainerId);

    return () => {
      isMounted = false;
    };
  }, [selectedTrainerId]);

  const handleRefresh = () => {
    setRefreshIndex((value) => value + 1);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!token) {
      setReviewsError("Authorization token is required.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this review?");
    if (!confirmed) {
      return;
    }

    setDeleting(reviewId);
    setReviewsError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        const message = data?.message ?? "Failed to delete review.";
        throw new Error(message);
      }

      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      handleRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error deleting review.";
      setReviewsError(message);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const formatAverage = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return "-";
    }
    return value.toFixed(2);
  };

  const ratingDistribution = useMemo(() => {
    if (!summary) return [] as Array<[string, number]>;
    const entries = Object.entries(summary.ratingCounts).sort((a, b) => Number(b[0]) - Number(a[0]));
    return entries as Array<[string, number]>;
  }, [summary]);

  return (
    <>
    <section className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm ${className ?? ""}`}>
      <header className="flex flex-col gap-2 px-6 py-5 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Trainer Reviews</h2>
          <p className="text-sm text-slate-500">Monitor feedback and ratings across trainers.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedTrainerId}
            onChange={(event) => setSelectedTrainerId(event.target.value)}
            disabled={loadingTrainers || trainers.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">All trainers</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>{trainer.username || trainer.email}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingReviews || loadingSummary}
            className={`px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition ${
              loadingReviews || loadingSummary ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            Refresh
          </button>
        </div>
      </header>

      {(reviewsError || summaryError || trainersError || trainerStatsError) && (
        <div className="px-6 pt-4 space-y-2">
          {reviewsError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{reviewsError}</div>
          )}
          {summaryError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{summaryError}</div>
          )}
          {trainersError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{trainersError}</div>
          )}
          {trainerStatsError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{trainerStatsError}</div>
          )}
        </div>
      )}

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-3">
      </div>
        <div className="lg:col-span-1 border border-slate-200 rounded-xl p-5 bg-slate-50/60">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Overview</h3>
          {loadingSummary ? (
            <p className="text-sm text-slate-500">Loading summary...</p>
          ) : summary ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Total reviews</span>
                <span className="font-semibold text-slate-800">{summary.totalReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average rating</span>
                <span className="font-semibold text-slate-800">{formatAverage(summary.averageRating)}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Rating distribution</span>
                {ratingDistribution.length === 0 ? (
                  <p className="text-xs text-slate-500">No ratings yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {ratingDistribution.map(([rating, count]) => (
                      <li key={rating} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{rating} star{Number(rating) === 1 ? "" : "s"}</span>
                        <span className="font-semibold text-slate-800">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No summary data available.</p>
          )}
        </div>

        <div className="lg:col-span-2 border border-slate-200 rounded-xl">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trainer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loadingReviews ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-500">
                    No reviews available.
                  </td>
                </tr>
              ) : (
                reviews
                  .filter((review) => !selectedTrainerId || String(review.trainer.id) === selectedTrainerId)
                  .map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-800">
                        <div className="font-semibold text-slate-800">{review.trainer.username || review.trainer.email}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <div>{review.reviewer.email}</div>
                        <div className="text-xs text-slate-500">{review.reviewer.role}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {review.rating ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(review.createdAt)}</td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            disabled={deleting === review.id}
                            className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deleting === review.id}
                            className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
                          >
                            {deleting === review.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTrainerId && (
        <div className="px-6 pb-6">
          <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Trainer insights</h3>
                <p className="text-xs text-slate-500">Detailed performance for the selected trainer.</p>
              </div>
              {loadingTrainerStats && <span className="text-xs text-slate-500">Loading...</span>}
            </div>
            {trainerStats ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total reviews</span>
                  <span className="font-semibold text-slate-800">{trainerStats.totalReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average rating</span>
                  <span className="font-semibold text-slate-800">{formatAverage(trainerStats.averageRating)}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Recent comments
                  </span>
                  {trainerStats.reviews.length === 0 ? (
                    <p className="text-xs text-slate-500">No reviews yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {trainerStats.reviews.slice(0, 3).map((review) => (
                        <li key={review.id} className="border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/70">
                          <div className="text-xs text-slate-500 mb-1">{formatDate(review.createdAt)}</div>
                          <p className="text-sm text-slate-700 line-clamp-3">{review.comment}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : trainerStatsError ? (
              <p className="mt-4 text-sm text-red-600">{trainerStatsError}</p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Select a trainer to see insights.</p>
            )}
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Review Details</h3>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm">
              <div>
                <span className="uppercase text-xs font-semibold tracking-wide text-slate-500">Trainer</span>
                <div className="text-slate-800">{selectedReview.trainer.username || selectedReview.trainer.email}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-semibold tracking-wide text-slate-500">Reviewer</span>
                <div className="text-slate-800">{selectedReview.reviewer.email}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-semibold tracking-wide text-slate-500">Rating</span>
                <div className="text-slate-800">{selectedReview.rating ?? "-"}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-semibold tracking-wide text-slate-500">Submitted</span>
                <div className="text-slate-800">{formatDate(selectedReview.createdAt)}</div>
              </div>
              <div>
                <span className="uppercase text-xs font-semibold tracking-wide text-slate-500">Comment</span>
                <div className="mt-1 whitespace-pre-wrap text-slate-700">{selectedReview.comment}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  </>
  );
}



