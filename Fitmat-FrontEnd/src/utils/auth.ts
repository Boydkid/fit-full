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

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
// 👉 ตัวอย่าง: https://fit-full-production.up.railway.app

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

// Parse JWT token
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
  const res = await fetch(apiUrl(`/api/login`), {
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
  const res = await fetch(apiUrl(`/api/register`), {
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
