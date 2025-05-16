'use client';

import { motion } from 'framer-motion';
import { FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black border-t border-gray-800 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="mb-6 sm:mb-8"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Chamada.ai
            </h3>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">A sua assistente de IA para chamadas inteligentes.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "circOut" }}
            className="flex items-center space-x-6"
          >
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
              <FaInstagram size={22} />
            </a>
            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
              <FaTwitter size={22} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
              <FaLinkedin size={22} />
            </a>
          </motion.div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 sm:pt-10 mt-8 sm:mt-10 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Chamada.ai — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 