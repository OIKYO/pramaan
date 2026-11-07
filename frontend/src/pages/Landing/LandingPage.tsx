import { Branches } from "@/components/landing/Branches";
import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { Hero } from "@/components/landing/Hero";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { StartSection } from "@/components/landing/StartSection";
import { WhyPramaan } from "@/components/landing/WhyPramaan";

export function LandingPage() {
  return (
    <PublicLayout>
      <Hero />
      <FeatureStrip />
      <WhyPramaan />
      <Branches />
      <StartSection />
    </PublicLayout>
  );
}
