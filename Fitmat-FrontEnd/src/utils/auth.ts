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

export interface TokenPayload {
  exp?: number;
  role?: string;
  id?: number;
  email?: string;
}

// Parse JWT token
export function parseJwt(token: string): TokenPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT:", error);
    return null;
  }
}

// Check if token is valid
export function isTokenValid(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  
  return payload.exp * 1000 > Date.now();
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    // Clear invalid token
    clearAuth();
    return null;
  }

  const payload = parseJwt(token);
  if (!payload) return null;

  return {
    id: payload.id || 0,
    email: payload.email || "",
    role: payload.role || "USER",
  };
}

// Clear authentication data
export function clearAuth(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

// Set authentication data
export function setAuth(token: string, role: string): void {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = localStorage.getItem("token");
  return token ? isTokenValid(token) : false;
}

// Check if user has specific role
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Check if user is admin
export function isAdmin(): boolean {
  return hasRole("ADMIN");
}

// Get API base URL - ใช้ API routes ถ้าไม่ได้ใช้ static export, ไม่งั้นเรียก backend โดยตรง
const getApiBaseUrl = (): string => {
  // ถ้าใช้ static export หรือไม่ได้อยู่ใน production Next.js
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true') {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '${process.env.NEXT_PUBLIC_API_URL}/api';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  // ใช้ Next.js API routes ถ้าไม่ได้ใช้ static export
  return '/api/auth';
};

// Helper function สำหรับเรียก backend โดยตรง
const callBackendDirectly = async (endpoint: string, payload: any): Promise<AuthResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '${process.env.NEXT_PUBLIC_API_URL}/api';
  const apiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// Logout function
export async function logout(): Promise<void> {
  try {
    // ถ้าใช้ static export ให้ข้าม API call (ไม่มี server-side)
    if (process.env.NEXT_PUBLIC_USE_STATIC_EXPORT !== 'true') {
      await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "logout",
        }),
      });
    }
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // Always clear local auth data
    clearAuth();
  }
}

// Login function
export async function login(email: string, password: string): Promise<AuthResponse> {
  // ถ้าใช้ static export ให้เรียก backend โดยตรง
  if (process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true') {
    return callBackendDirectly("/login", { email, password });
  }

  // ใช้ Next.js API routes
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "login",
      payload: { email, password },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

// Register function
export async function register(email: string, password: string): Promise<AuthResponse> {
  // ถ้าใช้ static export ให้เรียก backend โดยตรง
  if (process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true') {
    return callBackendDirectly("/register", { email, password });
  }

  // ใช้ Next.js API routes
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "register",
      payload: { email, password },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}
