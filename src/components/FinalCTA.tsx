'use client';

import { motion } from 'framer-motion';
import React from 'react';

const FinalCTA: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="rounded-xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 p-12 md:p-16 text-center relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-10 right-0 w-64 h-64 bg-neon-blue/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-blue/10 rounded-full filter blur-3xl"></div>
        
        {/* Content */}
        <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">
          Pronto para automatizar o atendimento da sua empresa?
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto relative z-10">
          Comece a nunca mais perder chamadas. Experimente o chamada.ai agora com nosso plano inicial por apenas 1€ no primeiro mês.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neon-blue text-white px-10 py-5 rounded-md text-xl font-semibold relative z-10 glow"
        >
          Criar o meu agente
        </motion.button>
        
        <div className="mt-8 text-gray-400 text-sm relative z-10">
          Sem compromisso. Cancele a qualquer momento.
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCTA; 