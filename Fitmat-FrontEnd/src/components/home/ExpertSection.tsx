import React from 'react';
import Button from '../common/Button';

export default function ExpertSection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-2xl p-8">
          {/* รูปภาพ */}
          <div>
            <img
              src="/images/trainer-session.jpg"
              alt="Personal training session"
              className="w-full h-auto object-cover rounded-2xl"
            />
          </div>
          {/* ข้อความ */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              &ldquo;เทรนกับผู้เชี่ยวชาญที่ผ่าน
              <br className="hidden sm:block" />
              การรับรอง&rdquo;
            </h2>
            <p className="mb-8 text-lg text-gray-700 leading-relaxed">
              เทรนเนอร์ของเราผ่านการคัดเลือกอย่างเข้มงวด
              พร้อมคุณสมบัติแบบมืออาชีพเพื่อมอบประสบการณ์ที่ดีที่สุด
            </p>
            <Button
              href="/trainer"
              variant="secondary"
              className="bg-gray-900 hover:bg-gray-800"
            >
              ดูรายชื่อเทรนเนอร์
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
