import React from "react";
import Layout from "../../components/Layout/Layout";
import {
  HeroSection,
  ExpertSection,
  ReviewsSection,
  PricingSection,
  CTASection,
} from "../../components/home";
import { FadeIn } from "../../components/common";

export default function Home() {

  return (
    <Layout>
      <div className="w-full text-gray-800">
        <FadeIn>
          <HeroSection />
        </FadeIn>
        <FadeIn delay={200}>
          <ExpertSection />
        </FadeIn>
        <FadeIn delay={400}>
          <ReviewsSection />
        </FadeIn>
        <FadeIn delay={600}>
          <PricingSection />
        </FadeIn>
        <FadeIn delay={800}>
          <CTASection />
        </FadeIn>
      </div>
    </Layout>
  );
}
