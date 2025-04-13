'use client';

import { motion } from 'framer-motion';
import React from 'react';

const Testimonials: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold">O que dizem os clientes</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-8"
          >
            <div className="mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-neon-blue">★</span>
              ))}
            </div>
            <p className="text-lg mb-6 text-gray-300">"{testimonial.quote}"</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue font-bold">
                {testimonial.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="font-medium">{testimonial.name}</p>
                <p className="text-sm text-gray-400">{testimonial.business}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const testimonials = [
  {
    name: "João Silva",
    business: "Restaurante Sabores",
    quote: "O chamada.ai revolucionou o nosso atendimento. Agora conseguimos gerir todas as reservas sem perder uma única chamada.",
  },
  {
    name: "Ana Costa",
    business: "Clínica Bem-Estar",
    quote: "Os nossos pacientes ficam impressionados com a naturalidade do assistente. A agenda está sempre otimizada.",
  },
  {
    name: "Miguel Santos",
    business: "Entregas Rápidas",
    quote: "Economizamos contratando o chamada.ai. O retorno foi imediato e o atendimento melhorou muito.",
  },
];

export default Testimonials; 