"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, logout as authLogout, User } from "../../utils/auth";

const menuItems = [
  { name: "home", href: "/" },
  { name: "trainers", href: "/trainer" },
  { name: "reviews", href: "/review" },
  { name: "contact us", href: "/contactus" },
  { name: "fitmate class", href: "/fitmateclass" },
  { name: "bookings", href: "/bookings", authOnly: true },
  { name: "login", href: "/login", authOnly: false },
  { name: "register", href: "/register", authOnly: false },
];

type HeaderUser = User & {
  username?: string | null;
  profileImage?: string | null;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [user, setUser] = useState<HeaderUser | null>(null);
  const [checkedToken, setCheckedToken] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Generate profile image based on email (deterministic)
  const getProfileImage = (_email: string) => "/user-white.svg";

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      setUser(null);
      setCheckedToken(true);
      return;
    }

    setUser({
      ...currentUser,
      username: currentUser.email ? currentUser.email.split("@")[0] : currentUser.email,
      profileImage: null,
    });
    setCheckedToken(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setCheckedToken(true);
      return;
    }

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ||
                 process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
                 process.env.NEXT_PUBLIC_API_URL
                )?.replace(/\/$/, "");
        const response = await fetch(`${apiBase}/api/users/${currentUser.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const profile = await response.json();

        if (isMounted) {
          setUser({
            ...currentUser,
            username: profile.username ?? currentUser.email.split("@")[0],
            profileImage: profile.profileImage ? profile.profileImage : null,
            role: profile.role ?? currentUser.role,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        if (isMounted) {
          setCheckedToken(true);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown')) {
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authLogout();
      
      // รีเซ็ต state
      setUser(null);
      
      // Redirect ไปหน้า home
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // แม้ว่าจะมี error เราก็ยังรีเซ็ต state
      setUser(null);
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ✅ ถ้ามี user filter ไม่เอา login/register และแสดง bookings
  let filteredMenu = menuItems.filter(
    (item) => {
      if (item.authOnly && !user) return false; // ซ่อน auth-only items ถ้าไม่ได้ login
      if (user && (item.name === "login" || item.name === "register")) return false; // ซ่อน login/register ถ้า login แล้ว
      return true;
    }
  );

  // ✅ ถ้ามี role เป็น ADMIN เพิ่มเมนู Customer Management
  if (user?.role === "ADMIN") {
    filteredMenu = [
      ...filteredMenu,
      { name: "customer management", href: "/customermanagementsystem" },
    ];
  }

  return (
    <header className="w-full bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-20 flex items-center justify-between">
          {/* โลโก้ */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-wide">
              <span className="text-red-500">FIT</span>
              <span className="text-gray-900">MATE</span>
            </span>
          </Link>

          {/* เมนู desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {filteredMenu.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-900 text-lg font-semibold hover:text-red-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 text-gray-900 hover:text-red-600 transition-colors"
                >
                  <img
                    src={user.profileImage || getProfileImage(user.email)}
                    alt={user.username || user.email}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getProfileImage(user.email);
                    }}
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username || user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-700">
                      {user.role}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-900 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profileImage || getProfileImage(user.email)}
                          alt={user.username || user.email}
                          className="w-10 h-10 rounded-full object-cover border-2 border-red-100"
                          onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getProfileImage(user.email);
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.username || user.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ตั้งค่า
                    </Link>
                    
                    <Link
                      href="/bookings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      การจองของฉัน
                    </Link>
                    
                    <hr className="my-2" />
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserDropdownOpen(false);
                      }}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Hamburger icon mobile */}
          <button
            className="md:hidden flex items-center text-gray-900"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-red-600 px-6 py-4 border-t border-red-500">
          <nav className="flex flex-col gap-4">
            {filteredMenu.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white text-lg font-semibold"
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t border-red-500 pt-4 mt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={getProfileImage(user.email)}
                      alt={user.username || user.email}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/user-white.svg";
                      }}
                    />
                    <div>
                      <div className="text-white font-medium">
                        {user.username || user.email.split('@')[0]}
                      </div>
                      <div className="text-white/70 text-sm">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ตั้งค่า
                    </Link>
                    
                    <Link
                      href="/bookings"
                      className="flex items-center gap-3 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      การจองของฉัน
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 text-white text-sm py-2 px-3 rounded-lg hover:bg-red-500/20 transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
