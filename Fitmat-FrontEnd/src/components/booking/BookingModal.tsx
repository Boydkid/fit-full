import React, { useState } from 'react';
import { Modal, Button, Input } from '../common';
import Swal from "sweetalert2";   // ⭐ เพิ่มมาใหม่

// =====================
// Booking Data Interface
// =====================
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: {
    id: number;
    email: string;
    username?: string | null;
    role: string;
  };
  onSubmit?: (bookingData: BookingData) => void;   // ⭐ แก้ให้ optional
  loading?: boolean;
}

interface BookingData {
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

// =====================
// Component
// =====================
export default function BookingModal({
  isOpen,
  onClose,
  trainer,
  onSubmit,
  loading = false,
}: BookingModalProps) {
  
  // ---------------------
  // ฟอร์ม state
  // ---------------------
  const [formData, setFormData] = useState<BookingData>({
    date: '',
    time: '',
    duration: 60,
    notes: '',
  });

  // ---------------------
  // ⭐ ฟังก์ชันจองคิวจริง ส่งไป Backend
  // ---------------------
  const handleBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("กรุณาเข้าสู่ระบบก่อน", "", "warning");
        return;
      }

      const rawBase = process.env.NEXT_PUBLIC_API_URL || "https://fit-full-production.up.railway.app";
      const apiBase = rawBase.replace(/\/$/, "");

      const res = await fetch(`${apiBase}/api/trainers/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trainerId: trainer.id,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          note: formData.notes,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        Swal.fire("จองสำเร็จ!", "ระบบได้บันทึกคิวของคุณแล้ว", "success");
        handleClose();
      } else {
        Swal.fire("ผิดพลาด", json.message || "จองไม่สำเร็จ", "error");
      }

    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถทำรายการได้", "error");
    }
  };

  // ---------------------
  // Handle submit form
  // ---------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      // ถ้าหน้าแม่ส่ง onSubmit มา → ใช้ onSubmit
      onSubmit(formData);
    } else {
      // ถ้าไม่มี onSubmit → เรียก handleBooking ภายใน modal
      handleBooking();
    }
  };

  // ---------------------
  // ปิด Modal
  // ---------------------
  const handleClose = () => {
    setFormData({
      date: '',
      time: '',
      duration: 60,
      notes: '',
    });
    onClose();
  };

  // ---------------------
  // UI
  // ---------------------
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="จองคิวเทรนเนอร์" size="md">
      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
        <h3 className="font-bold text-gray-800 mb-1">{trainer.username || trainer.email}</h3>
        <p className="text-sm text-gray-600">{trainer.role}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="วันที่"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          
          <Input
            label="เวลา"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ระยะเวลา (นาที)
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            className="w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            required
          >
            <option value={30}>30 นาที</option>
            <option value={60}>1 ชั่วโมง</option>
            <option value={90}>1.5 ชั่วโมง</option>
            <option value={120}>2 ชั่วโมง</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full bg-slate-100 text-slate-700 font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder="ระบุเป้าหมายหรือความต้องการพิเศษ..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            {loading ? 'กำลังจอง...' : 'จองเลย'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
