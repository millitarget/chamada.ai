declare module 'vanta/dist/vanta.net.min' {
  interface VantaNetOptions {
    el: HTMLElement | string | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number | string;
    backgroundColor?: number | string;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  }

  export default function NET(options: VantaNetOptions): {
    destroy: () => void;
  };
}

declare module 'vanta/dist/vanta.halo.min' {
  interface VantaHaloOptions {
    el: HTMLElement | string | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number | string;
    baseColor?: number | string;
    amplitudeFactor?: number;
    size?: number;
    xOffset?: number;
    yOffset?: number;
  }

  export default function HALO(options: VantaHaloOptions): {
    destroy: () => void;
  };
}

declare module 'vanta/dist/vanta.dots.min' {
  interface VantaDotsOptions {
    el: HTMLElement | string | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number | string;        // Main color of dots
    color2?: number | string;       // Secondary color of dots
    backgroundColor?: number | string;
    size?: number;                  // Size of the dots
    spacing?: number;               // Spacing between dots
    showLines?: boolean;            // Whether to show lines connecting dots
    // Add any other specific DOTS options if known from Vanta.js documentation
  }

  export default function DOTS(options: VantaDotsOptions): {
    destroy: () => void;
    // Add other methods if DOTS effect object has them
  };
}