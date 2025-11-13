import React from 'react';
import { useRouter } from 'next/router';
import Button from '../common/Button';

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-10 bg-[#f3f4f6] relative overflow-hidden">
      {/* ของตกแต่ง: วงกลม/สี่เหลี่ยมโปร่งแสงแบบกลมกลืน */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-yellow-100 rounded-full opacity-40 z-0"></div>
      <div className="absolute top-10 left-1/4 w-24 h-24 bg-blue-100 rounded-full opacity-30 z-0"></div>
      <div className="absolute -bottom-16 right-1/4 w-32 h-32 bg-red-100 rounded-full opacity-30 z-0"></div>
      <div className="absolute top-1/2 right-0 w-20 h-20 bg-yellow-200 rounded-lg opacity-30 z-0"></div>
      <div className="absolute top-0 right-10 w-24 h-24 bg-pink-100 rounded-lg opacity-20 z-0"></div>
      
      <div className="max-w-3xl mx-auto px-2 relative z-10">
        <div className="bg-white/90 text-gray-900 p-5 sm:p-7 rounded-xl flex flex-col sm:flex-row items-center justify-between relative overflow-hidden shadow-md gap-4 sm:gap-0">
          {/* รูป NEED HELP? ด้านซ้าย */}
          <div className="flex items-center z-10 min-w-[120px]">
            <div className="relative mr-3">
              {/* กระดาษสีต่างๆ */}
              <div className="absolute -rotate-12 w-14 h-10 bg-yellow-400 rounded-lg"></div>
              <div className="absolute rotate-6 w-14 h-10 bg-pink-400 rounded-lg"></div>
              <div className="w-14 h-10 bg-blue-400 rounded-lg flex items-center justify-center relative z-10">
                <span className="text-black font-bold text-xs leading-tight">
                  NEED
                  <br />
                  HELP?
                </span>
              </div>
            </div>
          </div>
          
          {/* ข้อความ */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-1">
              &ldquo;อยากเริ่มต้นแปลี่ยนตัวเองใช่ไหม?&rdquo;
            </h3>
            <p className="text-gray-700 text-xs sm:text-sm">
              สมัครรับคำแนะนำฟรีจาก เทรนเนอร์และผู้เชี่ยวชาญ พิเศษก่อนใคร
            </p>
          </div>
          
          {/* Silhouette ด้านขวา */}
          <div className="absolute right-4 bottom-2 z-0">
            <div className="w-14 h-16 bg-yellow-200 opacity-30 rounded-lg rotate-12"></div>
          </div>
          
          <Button
            onClick={() => router.push("/membership")}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 z-10 shadow text-sm sm:text-base"
          >
            สมัครเลย
          </Button>
        </div>
      </div>
    </section>
  );
}
