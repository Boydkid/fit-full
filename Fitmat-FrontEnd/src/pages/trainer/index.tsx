import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Layout } from "../../components/Layout";
import { TrainerCard, TrainerSearch } from "../../components/trainer";

type Trainer = {
  id: number;
  email: string;
  username?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
  profileImage?: string | null;
};

export default function Trainer() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const rawBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://fit-full-production.up.railway.app";

  const apiBase = rawBase.replace(/\/$/, "");

  const normalizeProfileImage = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/trainers`);
        const data: Trainer[] = await res.json();
        const normalized = data.map((t) => ({
          ...t,
          profileImage: normalizeProfileImage(t.profileImage),
        }));
        setTrainers(normalized);
        setFilteredTrainers(normalized);
      } catch (err: any) {
        setError(err.message || "Error fetching trainers");
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = trainers.filter((t) =>
      t.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTrainers(filtered);
  };

  const handleFilterChange = (filters: any) => {
    let filtered = trainers;
    if (filters.rating)
      filtered = filtered.filter(
        (t) => t.averageRating && t.averageRating >= filters.rating
      );
    setFilteredTrainers(filtered);
  };

  // ⭐ ใช้งาน BookingModal ที่ส่งมาจาก TrainerCard
  const handleBook = async (trainerId: number, bookingData: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token)
        return Swal.fire("กรุณาเข้าสู่ระบบก่อน", "", "warning");

      const res = await fetch(`${apiBase}/api/trainers/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trainerId,
          ...bookingData,
          note: bookingData.notes,
        }),
      });

      const json = await res.json();

      if (!res.ok)
        return Swal.fire("ผิดพลาด", json.message, "error");

      Swal.fire("จองสำเร็จ", "ระบบบันทึกเรียบร้อย", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("จองไม่สำเร็จ", "เกิดข้อผิดพลาด", "error");
    }
  };

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto">
        <TrainerSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredTrainers.map((trainer) => (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onBook={handleBook}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
