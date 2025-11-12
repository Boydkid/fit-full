import { useEffect, useMemo, useState } from "react";

type RoleName = string;

type TrainerStats = {
  id: number;
  email: string;
  username?: string | null;
  role: RoleName;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
};

type UserRecord = {
  id: number;
  email: string;
  role: RoleName;
  createdAt: string;
  updatedAt: string;
};

type TrainerControlProps = {
  userId: number;
  className?: string;
  token?: string | null;
};

type DemoteTarget = {
  trainerId: number;
  email: string;
};

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  "http://localhost:4000/api";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export default function TrainerControl({ userId, className, token }: TrainerControlProps) {
  const [trainers, setTrainers] = useState<TrainerStats[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [promoteUserId, setPromoteUserId] = useState<string>("");
  const [demoteTarget, setDemoteTarget] = useState<DemoteTarget | null>(null);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [trainerError, setTrainerError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canAct = useMemo(() => Number.isFinite(userId) && Number(userId) > 0, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrainers() {
      setLoadingTrainers(true);
      setTrainerError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/trainers`);
        const data = (await response.json()) as TrainerStats[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch trainers.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setTrainers(data as TrainerStats[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching trainers.";
        setTrainerError(message);
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
  }, [refreshIndex]);

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
        const data = (await response.json()) as UserRecord[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch users.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setUsers(data as UserRecord[]);
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
  }, [userId, canAct, refreshIndex]);

  const handleRefresh = () => {
    setRefreshIndex((value) => value + 1);
  };

  const promoteableUsers = useMemo(() => {
    return users.filter((user) => user.role !== "TRAINER");
  }, [users]);

  const filteredTrainers = useMemo(() => {
    if (!searchTerm.trim()) {
      return trainers;
    }

    const term = searchTerm.trim().toLowerCase();
    return trainers.filter((trainer) => trainer.email.toLowerCase().includes(term));
  }, [searchTerm, trainers]);

  const handlePromote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAct) {
      setActionError("Cannot promote without a valid admin user id.");
      return;
    }

    if (!promoteUserId) {
      setActionError("Please select a user to promote.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${promoteUserId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ role: "TRAINER" }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        const message = data?.message ?? "Failed to promote user to trainer.";
        throw new Error(message);
      }

      setActionSuccess("User promoted to trainer successfully.");
      setPromoteUserId("");
      handleRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error promoting user.";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDemote = (trainerId: number, email: string) => {
    setDemoteTarget({ trainerId, email });
    setActionError(null);
    setActionSuccess(null);
  };

  const handleDemote = async () => {
    if (!demoteTarget) return;

    if (!canAct) {
      setActionError("Cannot update without a valid admin user id.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${demoteTarget.trainerId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ role: "USER" }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        const message = data?.message ?? "Failed to update trainer role.";
        throw new Error(message);
      }

      setActionSuccess(`Trainer ${demoteTarget.email} downgraded to USER.`);
      setDemoteTarget(null);
      handleRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error updating trainer.";
      setActionError(message);
    } finally {
      setActionLoading(false);
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

  return (
    <section className={`w-full bg-white border border-slate-200 rounded-xl shadow-sm ${className ?? ""}`}>
      <header className="flex flex-col gap-2 px-6 py-5 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Trainer Management</h2>
          <p className="text-sm text-slate-500">Promote qualified members and review trainer performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search trainers by email"
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingTrainers || loadingUsers}
            className={`px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition ${
              loadingTrainers || loadingUsers ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            Refresh
          </button>
        </div>
      </header>

      {(trainerError || usersError || actionError || actionSuccess) && (
        <div className="px-6 pt-4 space-y-2">
          {trainerError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{trainerError}</div>
          )}
          {usersError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{usersError}</div>
          )}
          {actionError && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{actionError}</div>
          )}
          {actionSuccess && (
            <div className="px-4 py-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">{actionSuccess}</div>
          )}
        </div>
      )}

      {!canAct && (
        <div className="px-6 py-4 text-sm text-slate-600">
          Provide a valid admin user id to manage trainers.
        </div>
      )}

      {canAct && (
        <div className="px-6 py-6 border-b border-slate-200 bg-slate-50/60">
          <form onSubmit={handlePromote} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="sm:flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="trainer-promote">
                Promote user to trainer
              </label>
              <select
                id="trainer-promote"
                value={promoteUserId}
                onChange={(event) => setPromoteUserId(event.target.value)}
                disabled={loadingUsers || promoteableUsers.length === 0 || actionLoading}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Select a user</option>
                {promoteableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={actionLoading || promoteableUsers.length === 0}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 transition ${
                actionLoading || promoteableUsers.length === 0 ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {actionLoading ? "Updating..." : "Promote"}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviews</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Average</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loadingTrainers ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                  Loading trainers...
                </td>
              </tr>
            ) : filteredTrainers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                  No trainers found.
                </td>
              </tr>
            ) : (
              filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800">
                    <div className="font-semibold text-slate-800">{trainer.username || trainer.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{trainer.totalReviews}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{formatAverage(trainer.averageRating)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(trainer.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(trainer.updatedAt)}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => confirmDemote(trainer.id, trainer.email)}
                      disabled={actionLoading}
                      className={`px-4 py-1.5 text-sm font-semibold rounded-lg text-white bg-slate-600 hover:bg-slate-700 transition ${
                        actionLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      Demote to user
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {demoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Confirm Role Update</h3>
              <p className="mt-1 text-sm text-slate-500">
                Demote <span className="font-medium text-slate-700">{demoteTarget.email}</span> to standard user?
              </p>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              This action removes trainer access. Existing classes remain assigned but the user will no longer appear in trainer lists.
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setDemoteTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDemote}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 transition ${
                  actionLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {actionLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
