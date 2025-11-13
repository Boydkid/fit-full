import React, { useState } from "react";
import Link from "next/link";
import { Card } from "../common";
import BookingModal from "../booking/BookingModal";

interface TrainerCardProps {
  trainer: {
    id: number;
    email: string;
    username?: string | null;
    role: string;
    createdAt: string;
    totalReviews: number;
    averageRating: number | null;
    profileImage?: string | null;
  };
  onBook?: (trainerId: number, bookingData: any) => void;
  showBookingButton?: boolean;
}

export default function TrainerCard({
  trainer,
  onBook,
  showBookingButton = true,
}: TrainerCardProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBook = (bookingData: any) => {
    if (onBook) {
      onBook(trainer.id, bookingData);
      setShowBookingModal(false);
    }
  };

  const getFallbackImage = () => "/user.svg";

  const resolveImageSrc = (email: string, profileImage?: string | null) => {
    if (profileImage) {
      if (profileImage.startsWith("data:image") || profileImage.startsWith("http")) {
        return profileImage;
      }
      if (profileImage.includes("base64,")) {
        return profileImage.startsWith("data:")
          ? profileImage
          : `data:${profileImage}`;
      }
      return `data:image/jpeg;base64,${profileImage}`;
    }
    return getFallbackImage();
  };

  const StarRating = ({ rating }: { rating: number | null }) => (
    <div className="flex gap-1 text-yellow-400 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`w-5 h-5 ${
            rating && i < Math.round(rating)
              ? "fill-current"
              : "fill-gray-300"
          }`}
        >
          <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
        </svg>
      ))}
    </div>
  );

  return (
    <>
      <Card className="p-6 text-center hover:scale-105 transition-all duration-300 group">
        <div className="relative">
          <img
            src={resolveImageSrc(trainer.email, trainer.profileImage)}
            alt={trainer.email}
            className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-red-100"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = getFallbackImage())}
          />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {new Date(trainer.createdAt).getFullYear()}
          </div>
        </div>

        <h3 className="font-bold text-lg text-gray-900">{trainer.username || trainer.email}</h3>
        <p className="text-sm text-gray-600 mb-2">{trainer.role}</p>

        <StarRating rating={trainer.averageRating} />
        <p className="text-xs text-gray-500 mt-1">{trainer.totalReviews} รีวิว</p>

        <div className="flex flex-col gap-2 mt-4">
          <Link
            href={`/trainer/${trainer.id}`}
            className="bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600"
          >
            ดูรายละเอียด
          </Link>

          {showBookingButton && (
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600"
            >
              จองเลย
            </button>
          )}
        </div>
      </Card>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        trainer={{
          id: trainer.id,
          email: trainer.email,
          username: trainer.username,
          role: trainer.role,
        }}
        onSubmit={handleBook}
      />
    </>
  );
}
