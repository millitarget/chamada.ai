'use client';

import { motion } from 'framer-motion';
import { FaUtensils, FaHospital, FaBox, FaHeadset } from 'react-icons/fa';
import React from 'react';

const UseCases: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
    },
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gradient">Casos de uso</h2>
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {cases.map((useCase, index) => (
          <motion.div
            key={useCase.title}
            variants={itemVariants}
            whileHover={{ 
              y: -5, 
              scale: 1.03,
              boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.3)' 
            }}
            className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex flex-col items-center cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <motion.div 
              className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center mb-4 group-hover:bg-neon-blue/20 transition-all duration-300 relative z-10"
              whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
            >
              {useCase.icon}
            </motion.div>
            
            <h3 className="text-lg font-semibold text-center relative z-10">{useCase.title}</h3>
            
            <motion.div 
              className="absolute -bottom-2 -right-2 w-24 h-24 bg-neon-blue/5 rounded-full blur-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="mt-16 text-center"
      >
        <motion.div 
          className="inline-block bg-neon-blue/10 backdrop-blur-sm border border-neon-blue/30 rounded-full px-6 py-2 relative overflow-hidden group"
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.2)',
            transition: { duration: 0.3 } 
          }}
        >
          <p className="text-neon-blue relative z-10">
            <strong>+15</strong> tipos de negócios suportados
          </p>
          <motion.div 
            className="absolute inset-0 bg-neon-blue/5"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

const cases = [
  {
    title: "Restaurantes",
    icon: <FaUtensils className="text-neon-blue text-2xl" />,
  },
  {
    title: "Clínicas",
    icon: <FaHospital className="text-neon-blue text-2xl" />,
  },
  {
    title: "Entregas",
    icon: <FaBox className="text-neon-blue text-2xl" />,
  },
  {
    title: "Consultórios",
    icon: <FaHeadset className="text-neon-blue text-2xl" />,
  },
];

export default UseCases; 