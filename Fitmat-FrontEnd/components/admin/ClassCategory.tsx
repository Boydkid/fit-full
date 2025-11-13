import { useEffect, useMemo, useState } from "react";

type ClassCategory = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClassCategoryProps = {
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

const initialFormState = {
  name: "",
  description: "",
};

type CategoryFormState = typeof initialFormState;

export default function ClassCategory({ userId, className, token }: ClassCategoryProps) {
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canAct = useMemo(() => Number.isFinite(userId) && Number(userId) > 0, [userId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/class-categories`);
        const data = (await response.json()) as ClassCategory[] | { message?: string };

        if (!response.ok) {
          const message = "message" in data && data.message
            ? data.message
            : "Failed to fetch categories.";
          throw new Error(message);
        }

        if (!isMounted) return;
        setCategories(data as ClassCategory[]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unexpected error fetching categories.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const handleRefresh = () => setRefreshIndex((value) => value + 1);

  const handleFormChange = (field: keyof CategoryFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingCategoryId(null);
  };

  const handleEditClick = (category: ClassCategory) => {
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
    });
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAct || !editingCategoryId) {
      setError("Cannot update category without a valid admin user id or category id.");
      return;
    }

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };

      if (!token) {
        throw new Error("Authorization token is required for updating categories.");
      }

      const response = await fetch(`${API_BASE_URL}/class-categories/${editingCategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: ClassCategory | { message?: string };
      try {
        data = (await response.json()) as ClassCategory | { message?: string };
      } catch (parseError) {
        throw new Error(`Failed to update category. Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // If response is 404, check if it's actually a routing issue
        if (response.status === 404) {
          throw new Error(`Category not found (ID: ${editingCategoryId}). Please refresh the page and try again.`);
        }
        const message = "message" in data && data.message
          ? data.message
          : `Failed to update category. Server returned ${response.status}.`;
        throw new Error(message);
      }

      setSuccess("Category updated successfully.");
      setCategories((prev) => prev.map((c) => c.id === editingCategoryId ? data as ClassCategory : c));
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error updating category.";
      setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!canAct) {
      setError("Cannot delete category without a valid admin user id.");
      return;
    }

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(categoryId);
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Authorization token is required for deleting categories.");
      setDeleting(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/class-categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      let data: { message?: string };
      try {
        data = (await response.json()) as { message?: string };
      } catch (parseError) {
        throw new Error(`Failed to delete category. Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        // If response is 404, check if it's actually a routing issue
        if (response.status === 404) {
          throw new Error(`Category not found (ID: ${categoryId}). Please refresh the page and try again.`);
        }
        const message = "message" in data && data.message
          ? data.message
          : `Failed to delete category. Server returned ${response.status}.`;
        throw new Error(message);
      }

      setSuccess("Category deleted successfully.");
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      if (editingCategoryId === categoryId) {
        resetForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error deleting category.";
      setError(message);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canAct) {
      setError("Cannot create category without a valid admin user id.");
      return;
    }

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/class-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ClassCategory | { message?: string };

      if (!response.ok) {
        const message = "message" in data && data.message
          ? data.message
          : "Failed to create category.";
        throw new Error(message);
      }

      setSuccess("Category created successfully.");
      setCategories((prev) => [data as ClassCategory, ...prev]);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error creating category.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  return (
    <section className={`w-full h-full bg-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col ${className ?? ""}`}>
      <header className="flex flex-col gap-3 px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Class Categories</h2>
            <p className="text-base text-slate-600">
              {editingCategoryId ? "Edit category details" : "Maintain categories to help members filter schedules."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className={`px-5 py-3 text-base font-semibold rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
            loading ? "" : "hover:scale-105"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </span>
        </button>
      </header>

      {(error || success) && (
        <div className="px-6 pt-4">
          {error && (
            <div className="mb-4 px-5 py-4 text-base text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-4 px-5 py-4 text-base text-emerald-700 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg shadow-md">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!canAct && (
        <div className="px-6 py-4 text-sm text-slate-600">
          Provide a valid admin user id to manage categories.
        </div>
      )}

      {canAct && (
        <div className="px-6 py-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
          <form onSubmit={editingCategoryId ? handleUpdateCategory : handleCreateCategory} className="grid gap-5">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-2" htmlFor="category-name">
                Category name
              </label>
              <input
                id="category-name"
                type="text"
                value={form.name}
                onChange={(event) => handleFormChange("name", event.target.value)}
                placeholder="Strength Training"
                className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2" htmlFor="category-description">
                Description
              </label>
              <textarea
                id="category-description"
                value={form.description}
                onChange={(event) => handleFormChange("description", event.target.value)}
                placeholder="Add a short description"
                rows={4}
                className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all hover:border-slate-400 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={creating || updating}
                  className="px-6 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-60 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={resetForm}
                disabled={creating || updating || editingCategoryId !== null}
                className="px-6 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-60 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={creating || updating}
                className={`px-6 py-3 text-base font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 ${
                  creating || updating ? "opacity-60 cursor-not-allowed" : "hover:scale-105"
                }`}
              >
                {editingCategoryId
                  ? updating
                    ? "Updating..."
                    : "Update category"
                  : creating
                  ? "Creating..."
                  : "Create category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto flex-1 min-h-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-base text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-base text-slate-500">
                  No categories available yet.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 border-b border-slate-100">
                  <td className="px-8 py-6 text-base text-slate-800 min-w-[200px]">
                    <div className="font-bold text-slate-900 text-xl mb-2">{category.name}</div>
                    {category.description && (
                      <div className="text-base text-slate-600 mt-2 leading-relaxed italic">{category.description}</div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-base text-slate-600 whitespace-nowrap font-medium">{formatDate(category.createdAt)}</td>
                  <td className="px-8 py-6 text-base text-slate-600 whitespace-nowrap font-medium">{formatDate(category.updatedAt)}</td>
                  <td className="px-8 py-6 text-base">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleEditClick(category)}
                        disabled={editingCategoryId === category.id || deleting === category.id}
                        className="px-5 py-2.5 text-base font-bold text-blue-700 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deleting === category.id || editingCategoryId === category.id}
                        className="px-5 py-2.5 text-base font-bold text-red-700 bg-red-50 border-2 border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        {deleting === category.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
