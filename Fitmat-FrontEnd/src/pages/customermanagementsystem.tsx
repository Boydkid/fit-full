import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ClassControl from "../components/admin/ClassControl";
import ClassCategory from "../components/admin/ClassCategory";
import ContactControl from "../components/admin/ContactControl";
import ReviewControl from "../components/admin/ReviewControl";
import TrainerControl from "../components/admin/TrainerControl";

type TokenPayload = {
  id?: number;
  role?: string;
  exp?: number;
  email?: string;
};

function parseJwt(token: string): TokenPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as TokenPayload;
  } catch (_error) {
    return null;
  }
}

export default function CustomerManagementSystem() {
  const router = useRouter();
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkedToken, setCheckedToken] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setCheckedToken(true);
      return;
    }

    setToken(storedToken);

    const payload = parseJwt(storedToken);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      setUser(payload);
    }

    setCheckedToken(true);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const adminId = useMemo(() => {
    if (!isAdmin || typeof user?.id !== "number") {
      return Number.NaN;
    }
    return user.id;
  }, [isAdmin, user?.id]);

  const renderStatus = () => {
    if (!checkedToken) {
      return (
        <p className="text-sm text-slate-500">Checking your session…</p>
      );
    }

    if (!token) {
      return (
        <p className="text-sm text-slate-600">
          Please sign in to access the customer management system.
        </p>
      );
    }

    if (!isAdmin) {
      return (
        <p className="text-sm text-red-600">
          You need administrator access to view this dashboard.
        </p>
      );
    }

    return null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 py-6 sm:py-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8 md:gap-10 px-4 sm:px-6 lg:px-8">
        <header className="relative rounded-2xl bg-gradient-to-r from-red-600 to-red-500 px-4 sm:px-6 md:px-8 py-6 sm:py-7 md:py-8 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-5"></div>
          <div className="relative flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Customer Management System</h1>
              </div>
              <p className="mt-2 text-sm sm:text-base text-white/90 drop-shadow-md">
                Centralized controls for users, classes, trainers, reviews, contact requests, and payments.
              </p>
              {renderStatus() && (
                <div className="mt-3">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm text-white">
                    {renderStatus()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {isAdmin && (
          <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <ClassCategory userId={adminId} token={token} className="flex-1" />
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <ClassControl userId={adminId} token={token} className="flex-1" />
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <TrainerControl userId={adminId} token={token} />
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <ReviewControl userId={adminId} token={token} />
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.01]">
              <ContactControl userId={adminId} token={token} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
