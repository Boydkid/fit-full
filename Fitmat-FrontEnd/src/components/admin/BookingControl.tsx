import { useEffect, useState } from "react";

type Booking = {
  id: number;
  user: {
    id: number;
    email: string;
    username?: string | null;
  };
  trainer: {
    id: number;
    email: string;
    username?: string | null;
  };
  date: string;
  time: string;
  duration: number;
  note?: string | null;
  createdAt: string;
};

type BookingControlProps = {
  userId: number;
  token?: string | null;
};

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL;

const API_BASE = RAW_BASE?.endsWith("/")
  ? RAW_BASE.slice(0, -1)
  : RAW_BASE;

export default function BookingControl({ userId, token }: BookingControlProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAct = Number.isFinite(userId) && userId > 0;

  useEffect(() => {
    if (!canAct) return;

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/trainers/bookings`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");

        setBookings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId, token]);

  const formatDateTime = (date: string, time: string) => {
    try {
      return `${date} เวลา ${time}`;
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-3">Trainer Bookings</h2>
      <p className="text-slate-600 mb-6">
        รายการจองคิวเทรนเนอร์ทั้งหมดของผู้ใช้ในระบบ
      </p>

      {!canAct && (
        <p className="text-slate-500">กรุณาเข้าสู่ระบบแอดมิน</p>
      )}

      {error && (
        <p className="text-red-600 font-semibold mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : bookings.length === 0 ? (
        <p className="text-slate-600">ยังไม่มีการจองในระบบ</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ผู้จอง</th>
                <th className="px-4 py-3 text-left font-bold">เทรนเนอร์</th>
                <th className="px-4 py-3 text-left font-bold">วันเวลา</th>
                <th className="px-4 py-3 text-left font-bold">ระยะเวลา</th>
                <th className="px-4 py-3 text-left font-bold">หมายเหตุ</th>
                <th className="px-4 py-3 text-left font-bold">สร้างเมื่อ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {b.user.username || b.user.email}
                  </td>
                  <td className="px-4 py-3">
                    {b.trainer.username || b.trainer.email}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(b.date, b.time)}
                  </td>
                  <td className="px-4 py-3">{b.duration} นาที</td>
                  <td className="px-4 py-3">{b.note || "-"}</td>
                  <td className="px-4 py-3">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </section>
  );
}
