'use client';

import React from 'react';
import HeroNew from '@/components/HeroSection';
import ExamplesSection from '@/components/ExamplesSection';
import FeaturesSection from '@/components/FeaturesSection';
// import TestimonialsSection from '@/components/TestimonialsSection';
// import LiveCallSimulationSection from '@/components/LiveCallSimulationSection'; // Removed
import SectorSpecificAISolutions from "@/components/SectorSpecificAISolutions";
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black overflow-x-hidden">
      <HeroNew />
      <FeaturesSection />
      {/* <TestimonialsSection /> */}
      <SectorSpecificAISolutions />
      {/* <LiveCallSimulationSection /> Removed */}
      <ExamplesSection />
      <Footer />
    </main>
  );
} 