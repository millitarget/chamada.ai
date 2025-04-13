'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import * as THREE from 'three';

// Add floating animation keyframes
const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 6,
    ease: "easeInOut",
    repeat: Infinity,
  }
};

export default function HeroSection() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && typeof window !== 'undefined') {
      // Dynamically import Vanta to avoid SSR issues
      import('vanta/dist/vanta.net.min').then((VANTA_NET) => {
        setVantaEffect(
          VANTA_NET.default({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x3b82f6,
            backgroundColor: 0x000000,
            points: 16.00,
            maxDistance: 25.00,
            spacing: 18.00,
            showDots: true
          })
        );
      }).catch(err => console.error("Failed to load Vanta effect:", err));
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Vanta.js Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-700/10 via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Dark overlay with reduced opacity */}
      <div className="absolute inset-0 bg-black/30 z-10" />
      
      {/* Content Container */}
      <div className="container mx-auto px-6 z-20 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto">
          {/* Left column - Text */}
          <div className="lg:w-1/2 mb-16 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-white font-extrabold text-5xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-center sm:text-left max-w-2xl">
                Chamada.ai
              </h1>
              
              <p className="mt-6 text-zinc-300 text-lg sm:text-xl max-w-2xl text-center sm:text-left">
                Crie um agente de voz alimentado por IA para a sua empresa — atenda chamadas com uma voz natural e sem falhas.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center sm:justify-start">
                <motion.button
                  className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl text-white font-semibold transition transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Experimente grátis
                </motion.button>
                
                <motion.button
                  className="px-7 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Saiba mais
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Right column - Humanoid Image with enhanced styling */}
          <div className="lg:w-1/2 relative h-96 lg:h-[70vh]">
            <motion.div 
              className="absolute bottom-0 right-0 transform lg:translate-x-0 w-full h-full"
              animate={floatingAnimation}
            >
              <Image
                src="/images/humanoid.png"
                alt="Humanoid AI"
                fill
                className="object-contain opacity-70 mix-blend-lighten drop-shadow-[0_0_60px_rgba(59,130,246,0.5)]"
                priority
              />
            </motion.div>
            
            {/* Decorative elements - tech circles */}
            <div className="absolute -left-10 top-1/4 w-20 h-20 rounded-full border border-blue-500/30 animate-pulse"></div>
            <div className="absolute right-1/4 bottom-1/3 w-12 h-12 rounded-full border border-blue-300/20 animate-pulse delay-700"></div>
            
            {/* Tech grid lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              <div className="absolute right-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"></div>
            </div>
          </div>
        </div>
        
        {/* Tech indicator at bottom */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full text-white text-sm border border-white/10 flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Alimentado por tecnologia de ponta em IA
        </motion.div>
      </div>
    </section>
  );
} 