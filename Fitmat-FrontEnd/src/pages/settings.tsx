import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import { Button, Input, Card } from "../components/common";

interface User {
  id: number;
  email: string;
  username?: string;
  profileImage?: string;
  role: string;
}

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageDirty, setProfileImageDirty] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate profile image based on email (deterministic)
  const getProfileImage = (email: string) => {
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const avatarIndex = Math.abs(hash) % 6 + 1;
    return `/images/review${avatarIndex}.jpg`;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Parse JWT to get user info (simplified)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setUsername(userData.username || "");
          setProfileImage(userData.profileImage ?? "");
          setProfileImageDirty(false);
        } else {
          // Fallback: create user object from token
          setUser({
            id: payload.id,
            email: payload.email,
            username: payload.username,
            profileImage: payload.profileImage,
            role: payload.role
          });
          setUsername(payload.username || "");
          setProfileImage(payload.profileImage ?? "");
          setProfileImageDirty(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    const file = event.target.files[0];

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setError("Profile image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Unable to read file content."));
          }
        };
        reader.onerror = () => reject(new Error("Unable to read file content."));
        reader.readAsDataURL(file);
      });

      setProfileImage(base64);
      setProfileImageDirty(true);
    } catch (readError) {
      console.error("Failed to read profile image:", readError);
      setError("Failed to read profile image.");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImage("");
    setProfileImageDirty(true);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const requestBody: {
        username: string | null;
        profileImage?: string | null;
      } = {
        username: username || null,
      };

      if (profileImageDirty) {
        requestBody.profileImage = profileImage || null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update profile.");
        return;
      }

      const responseData: User = await response.json();
      setUser(responseData);
      setUsername(responseData.username || "");
      setProfileImage(responseData.profileImage ?? "");
      setProfileImageDirty(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSuccess("Profile updated successfully.");
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        setSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to change password.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Failed to change password.");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <p className="text-gray-500 mt-4">กำลังโหลด...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <p className="text-red-500 text-lg">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold text-red-600 text-center mb-10">
          ตั้งค่าบัญชี
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ข้อมูลโปรไฟล์</h2>
            
            <div className="text-center mb-6">
              <img
                src={profileImage || getProfileImage(user.email)}
                alt={user.username || user.email}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-red-100 shadow-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getProfileImage(user.email);
                }}
              />
              <p className="text-sm text-gray-500">รูปโปรไฟล์ปัจจุบัน</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="อีเมล"
                type="email"
                value={user.email}
                onChange={() => {}}
                disabled
                className="bg-gray-100"
              />

              <Input
                label="ชื่อผู้ใช้ (Username)"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ใส่ชื่อผู้ใช้ที่ต้องการ"
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Profile Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                />
                <p className="text-xs text-gray-500">
                  Upload a JPG, PNG, GIF, or WEBP image up to 1MB.
                </p>
                {profileImage && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    <span>Profile image selected</span>
                    <button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="w-full"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
            </form>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ความปลอดภัย</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="รหัสผ่านปัจจุบัน"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="ใส่รหัสผ่านปัจจุบัน"
              />

              <Input
                label="รหัสผ่านใหม่"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="ใส่รหัสผ่านใหม่"
                minLength={6}
              />

              <Input
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="ยืนยันรหัสผ่านใหม่"
              />

              <Button
                type="submit"
                variant="danger"
                disabled={saving}
                className="w-full"
              >
                {saving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ข้อมูลบัญชี</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">สถานะ:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {user.role}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">วันที่สมัคร:</span>
              <span className="ml-2 text-gray-600">
                {new Date().toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
