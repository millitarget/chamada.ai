'use client';

/// <reference path="../vanta.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
// Import THREE and NET only on client side
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';

const VantaBackground: React.FC = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE,
          color: 0x3b82f6, // Simple blue color matching the image
          backgroundColor: 0x000000, // Pure black background
          points: 8.00, // Moderate number of points
          maxDistance: 20.00, // Standard distance
          spacing: 20.00,
          showDots: false, // Clean look without dots
          mouseControls: false, // No mouse interactions for minimalistic feel
          touchControls: false,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div className="absolute inset-0 -z-10">
      <div ref={vantaRef} className="absolute w-full h-full" />
      
      {/* Simple dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
};

export default VantaBackground; 