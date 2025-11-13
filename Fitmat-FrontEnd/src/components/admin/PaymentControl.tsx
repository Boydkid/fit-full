import { useEffect, useMemo, useState } from "react";

type RoleName = string;

type PaymentUser = {
  id: number | null;
  email: string | null;
  role: RoleName | null;
};

type PaymentRecord = {
  id: number;
  userId: number | null;
  amount: number | null;
  note: string | null;
  filename: string | null;
  mimeType: string | null;
  createdAt: string;
  user: PaymentUser | null;
};

type UserSummary = {
  id: number;
  email: string;
  role: RoleName;
};

type PaymentControlProps = {
  userId: number;
  className?: string;
  token?: string | null;
};

type ImagePreview = {
  id: number;
  src: string;
  filename: string | null;
};

const RAW_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
  "${process.env.NEXT_PUBLIC_API_URL}/api"
);

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export default function PaymentControl({ userId, className, token }: PaymentControlProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canAct = useMemo(() => Number.isFinite(userId) && Number(userId) > 0, [userId]);

  useEffect(() => {
    if (!canAct) {
      setUsersError("Invalid admin user id provided.");
      return;
    }

    setUsersError(null);

    let isMounted = true;

    async function fetchUsers() {
      setLoadingUsers(true);

      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = (await response.json()) as UserSummary[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch users.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setUsers(data as UserSummary[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching users.";
        setUsersError(message);
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    }

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [userId, canAct]);

  useEffect(() => {
    if (!canAct) {
      setPaymentsError("Invalid admin user id provided.");
      return;
    }

    setPaymentsError(null);

    let isMounted = true;

    async function fetchPayments() {
      setLoadingPayments(true);

      const params = new URLSearchParams();
      if (filterUserId) params.append("userId", filterUserId);

      try {
        const response = await fetch(`${API_BASE_URL}/payments?${params.toString()}`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = (await response.json()) as PaymentRecord[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch payment proofs.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setPayments(data as PaymentRecord[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching payments.";
        setPaymentsError(message);
      } finally {
        if (isMounted) {
          setLoadingPayments(false);
        }
      }
    }

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, [filterUserId, userId, canAct, refreshIndex]);

  const handleRefresh = () => {
    setRefreshIndex((value) => value + 1);
  };

  const handlePreviewImage = async (paymentId: number, filename: string | null) => {
    if (!canAct) {
      setImageError("Invalid admin session.");
      return;
    }

    setImageLoading(true);
    setImageError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/image`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "Failed to fetch payment proof image.";
        throw new Error(message);
      }

      const blob = await response.blob();
      const src = URL.createObjectURL(blob);
      setImagePreview({ id: paymentId, src, filename });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error loading image.";
      setImageError(message);
    } finally {
      setImageLoading(false);
    }
  };

  const clearPreview = () => {
    if (imagePreview?.src) {
      URL.revokeObjectURL(imagePreview.src);
    }
    setImagePreview(null);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const formatAmount = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return "-";
    }
    return value.toLocaleString(undefined, { style: "currency", currency: "THB" });
  };

  return (
    <section className={`w-full h-full bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col ${className ?? ""}`}>
      <header className="flex flex-col gap-3 px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Proofs</h2>
          <p className="text-base text-slate-600">Review submissions and verify payment confirmations.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterUserId}
            onChange={(event) => setFilterUserId(event.target.value)}
            disabled={loadingUsers || users.length === 0}
            className="rounded-lg border-2 border-slate-300 px-4 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingPayments}
            className={`px-5 py-3 text-base font-semibold rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
              loadingPayments ? "" : "hover:scale-105"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          </button>
        </div>
      </header>

      {(paymentsError || usersError || imageError) && (
        <div className="px-6 pt-4 space-y-3">
          {paymentsError && (
            <div className="px-5 py-4 text-base text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{paymentsError}</span>
              </div>
            </div>
          )}
          {usersError && (
            <div className="px-5 py-4 text-base text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{usersError}</span>
              </div>
            </div>
          )}
          {imageError && (
            <div className="px-5 py-4 text-base text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{imageError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!canAct && (
        <div className="px-6 py-4 text-sm text-slate-600">
          Provide a valid admin user id to review payment submissions.
        </div>
      )}

      <div className="overflow-x-auto flex-1 min-h-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Note</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Uploaded</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loadingPayments ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-base text-slate-500">
                  Loading payment proofs...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-base text-slate-500">
                  No payment proofs submitted yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 border-b border-slate-100">
                  <td className="px-6 py-5 text-base text-slate-800">
                    <div className="font-bold text-slate-900 text-lg">
                      {payment.user?.email ?? `User #${payment.userId ?? "unknown"}`}
                    </div>
                    {payment.userId && (
                      <div className="text-sm text-slate-600 mt-1">ID: {payment.userId}</div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-base text-slate-700 font-semibold">{formatAmount(payment.amount)}</td>
                  <td className="px-6 py-5 text-base text-slate-700">
                    <div className="font-medium">{payment.note ?? "-"}</div>
                  </td>
                  <td className="px-6 py-5 text-base text-slate-600 whitespace-nowrap font-medium">{formatDate(payment.createdAt)}</td>
                  <td className="px-6 py-5 text-base">
                    <button
                      type="button"
                      onClick={() => handlePreviewImage(payment.id, payment.filename)}
                      disabled={imageLoading}
                      className={`px-5 py-2.5 text-base font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${
                        imageLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      View proof
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Payment Proof</h3>
                <p className="text-base text-slate-600 mt-1">
                  {imagePreview.filename ?? `Proof #${imagePreview.id}`}
                </p>
              </div>
              <button
                type="button"
                onClick={clearPreview}
                className="px-6 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto bg-slate-100 flex items-center justify-center p-4">
              <img
                src={imagePreview.src}
                alt={imagePreview.filename ?? "Payment proof"}
                className="max-w-full h-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
