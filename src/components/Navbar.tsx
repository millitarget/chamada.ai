'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-black/50 backdrop-blur-md py-4 fixed top-0 left-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-neon-blue">
          chamada.ai
        </Link>
        
        <ul className="flex space-x-8">
          <li>
            <Link 
              href="/outbound-call" 
              className="text-white hover:text-neon-blue transition-colors"
            >
              Outbound Call Demo
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 