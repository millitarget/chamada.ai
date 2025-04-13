'use client';

import { motion } from 'framer-motion';
import React from 'react';
import PhoneInput from './PhoneInput';

const ConversionForm: React.FC = () => {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-gray-800 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-neon-blue/5 rounded-full blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-gradient">
            Experimente o atendimento chamada.ai
          </h3>
          <p className="text-gray-400 mb-4">
            Receba uma chamada de demonstração do nosso assistente AI
          </p>
        </motion.div>
        
        <PhoneInput />
      </motion.div>
    </section>
  );
};

export default ConversionForm; 