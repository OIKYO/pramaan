import { Capabilities } from "@/components/landing/Capabilities";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { SetupSection } from "@/components/landing/SetupSection";

export function LandingPage() {
  return (
    <div className="flex flex-col">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Capabilities />
      <SetupSection />
      <LandingFooter />
    </div>
  );
}
