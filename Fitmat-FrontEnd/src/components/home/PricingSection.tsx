import React from 'react';
import { Button, FadeIn } from '../common';
import { useRouter } from 'next/router';
interface PricingPlan {
  name: string;
  title: string;
  badge: string;
  price: string;
  period: string;
  features: Array<{
    text: string;
    included: boolean;
  }>;
  buttonText: string;
}

export default function PricingSection() {
  const router = useRouter();

  const plans: PricingPlan[] = [
    {
      name: 'bronze',
      title: 'Bronze',
      badge: 'STARTER',
      price: '499',
      period: '/ สัปดาห์',
      features: [
        { text: 'เทรนเนอร์ออนไลน์สัปดาห์ละ 1 ครั้ง', included: true },
        { text: 'วิดีโอท่าออกกำลังกายเฉพาะบุคคล', included: true },
        { text: 'ปรึกษาโภชนาการ', included: false },
        { text: 'ติดตามพัฒนาการรายเดือน', included: false },
      ],
      buttonText: 'เลือกแพ็กเกจนี้',
    },
    {
      name: 'gold',
      title: 'Gold',
      badge: 'POPULAR',
      price: '1,299',
      period: '/ สัปดาห์',
      features: [
        { text: 'เทรนเนอร์ออนไลน์ 3 ครั้ง/สัปดาห์', included: true },
        { text: 'วิดีโอท่าออกกำลังกายเฉพาะบุคคล', included: true },
        { text: 'ปรึกษาโภชนาการ 1 ครั้ง/สัปดาห์', included: true },
        { text: 'ติดตามพัฒนาการรายเดือน', included: false },
      ],
      buttonText: 'เลือกแพ็กเกจยอดนิยม',
    },
    {
      name: 'platinum',
      title: 'Platinum',
      badge: 'ENTERPRISE',
      price: '2,999',
      period: '/ เดือน',
      features: [
        { text: 'เทรนเนอร์ตัวต่อตัว/ออนไลน์ไม่จำกัดครั้ง', included: true },
        { text: 'วิดีโอ/แผนการฝึกเฉพาะบุคคล', included: true },
        { text: 'ปรึกษาโภชนาการทุกสัปดาห์', included: true },
        { text: 'รายงานพัฒนาการทุกสัปดาห์', included: true },
      ],
      buttonText: 'เลือกแพ็กเกจพรีเมียม',
    },
  ];
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-red-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-100 rounded-full opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-200 rounded-full opacity-15"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-red-50 rounded-full opacity-10"></div>
      </div>
      <div className="relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-bold text-base mb-6 shadow-lg">
              แพ็คเกจราคา
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              เลือกแพ็คเกจที่
              <span className="block text-red-600">เหมาะกับคุณ</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              ราคาที่คุ้มค่า พร้อมบริการครบครัน เพื่อสุขภาพที่ดีของคุณ
            </p>
          </div>
        </FadeIn>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          {plans.map((plan, index) => (
          <FadeIn key={plan.name} direction="up" delay={200 + index * 200}>
            <div
              className={`bg-white rounded-3xl shadow-xl p-8 text-center relative group transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                plan.name === 'gold' ? 'ring-4 ring-red-200 ring-opacity-50 scale-105' : ''
              }`}
            >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className={`text-white px-6 py-3 rounded-full text-sm font-bold group-hover:ring-2 group-hover:ring-offset-2 transition-all duration-200 shadow-lg ${
                plan.name === 'gold' 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 group-hover:ring-yellow-400' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 group-hover:ring-red-500'
              }`}>
                {plan.badge}
              </span>
            </div>
            <h3 className={`text-2xl font-bold mt-6 mb-6 ${
              plan.name === 'gold' ? 'text-red-600' : 'text-gray-800'
            }`}>
              {plan.title}
            </h3>
            <ul className="space-y-3 mb-8 text-left">
              {plan.features.map((feature, index) => (
                <li
                  key={index}
                  className={`flex items-center ${
                    feature.included ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  <span className="mr-2">
                    {feature.included ? '✓' : '✗'}
                  </span>
                  {feature.text}
                </li>
              ))}
            </ul>
            <div className={`text-4xl font-bold mb-2 ${
              plan.name === 'gold' ? 'text-red-600' : 'text-gray-900'
            }`}>
              {plan.price} <span className="text-lg text-gray-600">{plan.period}</span>
            </div>
            <Button
              variant={plan.name === 'gold' ? 'primary' : 'danger'}
              size="lg"
              className={`w-full mb-4 shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.name === 'gold' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                  : ''
              }`}
              type="button"
            onClick={() => router.push(`/membership?plan=${plan.name}`)}
            >
              {plan.buttonText}
            </Button>
            {/* Enhanced hover effects */}
            <div className={`pointer-events-none absolute inset-0 rounded-3xl border-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
              plan.name === 'gold' ? 'border-yellow-400' : 'border-red-500'
            }`}></div>
            {/* Glow effect for popular plan */}
            {plan.name === 'gold' && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-200/20 to-red-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            )}
          </div>
          </FadeIn>
          ))}
        </div>
      </div>

      {/* PromptPay modal removed per requirement; routing to membership instead */}
    </section>
  );
}



