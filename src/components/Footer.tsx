'use client';

import { motion } from 'framer-motion';
import { FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-neon-blue">AI Voice Agent</h3>
            <p className="text-gray-400 mt-2">Intelligent voice assistant.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-6 mt-6 md:mt-0"
          >
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              <FaTwitter size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              <FaLinkedin size={20} />
            </a>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-medium mb-4">Produto</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Preços</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Demo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Sobre</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Carreiras</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Contacto</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Documentação</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Termos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Privacidade</a></li>
              <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} AI Voice Agent — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 