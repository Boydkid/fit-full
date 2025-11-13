import React from 'react';
import { Button, FadeIn } from '../common';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
        <img
          src="/images/hero-trainer.jpg"
          alt="Personal training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="h-full flex flex-col justify-center">
            <FadeIn direction="up" delay={200}>
              <h1 className="max-w-4xl text-white font-extrabold leading-tight text-4xl sm:text-6xl lg:text-7xl drop-shadow-2xl">
                &ldquo;เริ่มต้นสุขภาพดีวันนี้กับ
                <br className="hidden sm:block" />
                <span className="text-red-400">เทรนเนอร์มืออาชีพ&rdquo;</span>
              </h1>
            </FadeIn>
            <FadeIn direction="up" delay={400}>
                      <p className="mt-8 text-white/90 text-lg sm:text-2xl max-w-3xl leading-relaxed">
                        &ldquo;ค้นหาเทรนเนอร์ที่ใช่สำหรับคุณ พร้อมจองคิวง่ายในไม่กี่คลิก
                        <br className="hidden sm:block" />
                        เริ่มต้นการเดินทางสู่สุขภาพที่ดีตั้งแต่วันนี้&rdquo;
                      </p>
            </FadeIn>
            <FadeIn direction="up" delay={600}>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => (window.location.href = "/trainer")}
                  variant="primary"
                  size="lg"
                  className="shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
                >
                  ค้นหาเทรนเนอร์
                </Button>
                <Button
                  onClick={() => (window.location.href = "/fitmateclass")}
                  variant="primary"
                  size="lg"
                  className="shadow-2xl transition-all duration-300"
                >
                  ดูคลาสทั้งหมด
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
