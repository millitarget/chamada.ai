'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';
import ExamplesSection from '../components/ExamplesSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-black via-zinc-900 to-zinc-950">
      <HeroSection />
      <ExamplesSection />
      <Footer />
    </main>
  );
} 