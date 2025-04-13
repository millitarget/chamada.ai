'use client';

import { motion } from 'framer-motion';
import React from 'react';

const ProblemSection: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Perder chamadas custa dinheiro.
          <br />
          <span className="text-neon-blue">O chamada.ai</span> resolve isso.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center mb-6">
              {problem.icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
            <p className="text-gray-400 text-center">{problem.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const problems = [
  {
    title: "Chamadas perdidas",
    description: "Cada chamada não atendida é um cliente potencial perdido, o que significa menos receita para o seu negócio.",
    icon: (
      <svg className="w-8 h-8 text-neon-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" />
      </svg>
    ),
  },
  {
    title: "Custos elevados",
    description: "Contratar recepcionistas a tempo inteiro é caro, especialmente para pequenas empresas com orçamentos limitados.",
    icon: (
      <svg className="w-8 h-8 text-neon-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Tempo desperdiçado",
    description: "Lidar com chamadas repetitivas tira tempo que poderia ser investido em tarefas mais estratégicas para o negócio.",
    icon: (
      <svg className="w-8 h-8 text-neon-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default ProblemSection; 