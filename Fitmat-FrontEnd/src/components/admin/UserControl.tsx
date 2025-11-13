import { useEffect, useMemo, useState } from "react";

type RoleName = string;

type ManagedUser = {
  id: number;
  email: string;
  username?: string | null;
  role: RoleName;
  createdAt: string;
  updatedAt: string;
};

type UpdateUserResponse = {
  id: number;
  email: string;
  role: RoleName;
  updatedAt: string;
};

type UserControlProps = {
  userId: number;
  className?: string;
  token?: string | null;
};

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL + "/api";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

export default function UserControl({ userId, className, token }: UserControlProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, RoleName>>({});
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canFetch = useMemo(() => Number.isFinite(userId), [userId]);

  useEffect(() => {
    if (!canFetch) {
      setError("Invalid admin ID provided.");
      return;
    }

    let isMounted = true;

    async function fetchUsers() {
      setLoadingUsers(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });

        const data = (await response.json()) as ManagedUser[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch users.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setUsers(data as ManagedUser[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching users.";
        setError(message);
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
  }, [userId, refreshIndex, canFetch]);

  useEffect(() => {
    let isMounted = true;

    async function fetchRoles() {
      setLoadingRoles(true);

      try {
        const response = await fetch(`${API_BASE_URL}/users/roles`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = (await response.json()) as RoleName[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch roles.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setRoles(data as RoleName[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching roles.";
        setError((prev) => prev ?? message);
      } finally {
        if (isMounted) {
          setLoadingRoles(false);
        }
      }
    }

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeRole = (id: number, nextRole: RoleName) => {
    setDraftRoles((prev) => ({
      ...prev,
      [id]: nextRole,
    }));
  };

  const handleRefresh = () => {
    setRefreshIndex((value) => value + 1);
    setSearchTerm("");
    setSelectedRoleFilter("all");
    setCurrentPage(1);
  };

  // Filter users based on search term and role filter
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (selectedRoleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRoleFilter);
    }

    // Filter by search term (username or email)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((user) => {
        const username = (user.username || "").toLowerCase();
        const email = user.email.toLowerCase();
        return username.includes(term) || email.includes(term);
      });
    }

    return filtered;
  }, [users, searchTerm, selectedRoleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleUpdateRole(targetUserId: number) {
    const pendingRole = draftRoles[targetUserId];
    const currentUser = users.find((user) => user.id === targetUserId);

    if (!currentUser) {
      setError("User not found in current list.");
      return;
    }

    const nextRole = pendingRole ?? currentUser.role;

    setUpdatingUserId(targetUserId);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${targetUserId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = (await response.json()) as UpdateUserResponse | { message?: string };

      if (!response.ok) {
        const message = "message" in data && data.message
          ? data.message
          : "Failed to update user role.";
        throw new Error(message);
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === targetUserId
            ? {
                ...user,
                role: (data as UpdateUserResponse).role,
                updatedAt: (data as UpdateUserResponse).updatedAt,
              }
            : user
        )
      );

      setDraftRoles(({ [targetUserId]: _discard, ...rest }) => rest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error updating role.";
      setError(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  return (
    <section className={`w-full bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${className ?? ""}`}>
      <header className="flex flex-col gap-2 px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">User Management</h2>
            <p className="text-sm text-slate-600">Manage user roles and access permissions.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingUsers}
            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
              loadingUsers ? "" : "hover:scale-105"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 mb-2 px-4 py-3 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-md shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!canFetch && (
        <div className="px-6 py-4 text-sm text-slate-600">
          Provide a valid admin user ID to load user data.
        </div>
      )}

      {canFetch && (
        <>
          {/* Search and Filter Section */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => {
                    setSelectedRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
            {(searchTerm || selectedRoleFilter !== "all") && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <span>Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
                {(searchTerm || selectedRoleFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRoleFilter("all");
                      setCurrentPage(1);
                    }}
                    className="text-red-600 hover:text-red-700 font-medium underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {canFetch && (
        <div className="overflow-x-hidden">
          <table className="w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="px-6 py-5 text-center text-sm text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-5 text-center text-sm text-slate-500">
                    {searchTerm || selectedRoleFilter !== "all" ? "No users found matching your filters." : "No users found."}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const selectedRole = draftRoles[user.id] ?? user.role;

                  return (
                    <tr key={user.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 border-b border-slate-100">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                            {(user.username || user.email).charAt(0).toUpperCase()}
                          </div>
                          <span>{user.username || user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <select
                          value={selectedRole}
                          onChange={(event) => handleChangeRole(user.id, event.target.value)}
                          disabled={updatingUserId === user.id || loadingRoles}
                          className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
                        >
                          {(roles.length > 0 ? roles : [user.role]).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.updatedAt)}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handleUpdateRole(user.id)}
                          disabled={updatingUserId === user.id || loadingRoles}
                          className={`w-full max-w-[120px] px-4 py-2 text-sm font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 ${
                            updatingUserId === user.id || loadingRoles ? "opacity-60 cursor-not-allowed" : "hover:scale-105"
                          }`}
                        >
                          {updatingUserId === user.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {canFetch && !loadingUsers && filteredUsers.length > 0 && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                        page === currentPage
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-md"
                          : "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
