// Auth utility functions

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ✔ โหลด ENV ให้ชัดเจน
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ✔ กันกรณี ENV ไม่มีค่า หรือต่อ URL ซ้ำ //
if (!API_BASE) {
  console.warn("❗ NEXT_PUBLIC_API_URL is NOT defined. Check your Vercel Env.");
}

function apiUrl(path: string): string {
  // กัน path ซ้ำ /api/api
  return `${API_BASE}${path}`;
}

// ----------------------
// JWT Utils
// ----------------------
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function setAuth(token: string, role: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function getCurrentUser(): User | null {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    clearAuth();
    return null;
  }

  const payload = parseJwt(token);
  if (!payload) return null;

  return {
    id: payload.id ?? 0,
    email: payload.email ?? "",
    role: payload.role ?? "USER",
  };
}

export function isAuthenticated() {
  const token = localStorage.getItem("token");
  return token ? isTokenValid(token) : false;
}

export function isAdmin() {
  return getCurrentUser()?.role === "ADMIN";
}

// ----------------------
// 🔥 LOGIN
// ----------------------
export async function login(email: string, password: string) {
  const url = apiUrl("/api/login");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "Login failed");
  }

  return data;
}

// ----------------------
// 🔥 REGISTER
// ----------------------
export async function register(email: string, password: string) {
  const url = apiUrl("/api/register");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "Registration failed");
  }

  return data;
}

// ----------------------
// 🔥 LOGOUT
// ----------------------
export function logout() {
  clearAuth();
}
