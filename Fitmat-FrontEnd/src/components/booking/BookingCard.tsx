import React from "react";
import { Card } from "../common";

type EnrollmentStatus = "UPCOMING" | "ONGOING" | "ENDED";

export type EnrollmentDisplay = {
  enrollmentId: number;
  status: EnrollmentStatus;
  startsAt: string;
  endsAt: string | null;
  classTitle: string;
  trainer: {
    id: number;
    email: string;
    username?: string | null;
    role: string;
    profileImage?: string | null;
  };
};

interface BookingCardProps {
  enrollment: EnrollmentDisplay;
  onCancel?: (enrollmentId: number) => void;
  onViewDetails?: (enrollmentId: number) => void;
  showActions?: boolean;
  canCancel?: boolean;
}

const statusColorMap: Record<EnrollmentStatus, string> = {
  UPCOMING: "bg-yellow-100 text-yellow-800",
  ONGOING: "bg-green-100 text-green-800",
  ENDED: "bg-gray-200 text-gray-600",
};

const statusTextMap: Record<EnrollmentStatus, string> = {
  UPCOMING: "กำลังจะเริ่ม",
  ONGOING: "กำลังจัดขึ้น",
  ENDED: "เสร็จสิ้นแล้ว",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BookingCard({
  enrollment,
  onCancel,
  onViewDetails,
  showActions = true,
  canCancel = false,
}: BookingCardProps) {
  const statusColor = statusColorMap[enrollment.status] ?? "bg-gray-100 text-gray-800";
  const statusText = statusTextMap[enrollment.status] ?? enrollment.status;

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 border border-gray-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{enrollment.classTitle}</h3>
          <p className="text-sm text-gray-600">Trainer: {enrollment.trainer.username || enrollment.trainer.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          Starts: {formatDateTime(enrollment.startsAt)}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          Ends: {formatDateTime(enrollment.endsAt)}
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(enrollment.enrollmentId)}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              View details
            </button>
          )}
          {onCancel && canCancel && (
            <button
              onClick={() => onCancel(enrollment.enrollmentId)}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Cancel booking
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

