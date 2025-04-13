import React from 'react';
import { motion } from 'framer-motion';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Add declaration for framer-motion
declare module 'framer-motion' {
  export const motion: {
    [key: string]: any;
  };
}

// Add declaration for react-icons
declare module 'react-icons/fa' {
  export const FaVolumeUp: React.FC;
  export const FaCheck: React.FC;
  export const FaUtensils: React.FC;
  export const FaHospital: React.FC;
  export const FaBox: React.FC;
  export const FaHeadset: React.FC;
  export const FaInstagram: React.FC<{ size?: number }>;
  export const FaTwitter: React.FC<{ size?: number }>;
  export const FaLinkedin: React.FC<{ size?: number }>;
}

declare module 'vanta/dist/vanta.net.min' {
  interface VantaNetOptions {
    el: HTMLElement | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  }

  export default function NET(options: VantaNetOptions): {
    destroy: () => void;
  };
} 