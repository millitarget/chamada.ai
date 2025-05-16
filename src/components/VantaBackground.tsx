'use client';

/// <reference path="../vanta.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
// Import THREE and NET only on client side
import * as THREE from 'three';
// Import DOTS instead of HALO
import DOTS from 'vanta/dist/vanta.dots.min';

const VantaBackground: React.FC = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        DOTS({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false, // Typically not as effective for DOTS
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0x000000, // Black background
          color: 0x3b82f6,      // Main color of dots (electric blue)
          color2: 0x1e40af,     // Secondary color of dots (darker blue for depth)
          size: 2.5,            // Size of the dots
          spacing: 35.00,       // Spacing between dots - higher for fewer dots
          showLines: false,       // No lines connecting dots for a cleaner look
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
      {/* Overlay removed as HALO effect is generally less dense */}
      {/* <div className="absolute inset-0 bg-black/40" /> */}
    </div>
  );
};

export default VantaBackground; 