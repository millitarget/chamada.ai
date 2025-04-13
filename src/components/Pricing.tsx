'use client';

import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import React from 'react';

const Pricing: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold">Planos simples</h2>
        <p className="text-xl text-gray-400 mt-4">Escolha o melhor plano para o seu negócio</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: index * 0.2 }}
            className={`rounded-xl overflow-hidden border ${
              plan.popular 
                ? 'border-neon-blue' 
                : 'border-gray-800'
            }`}
          >
            {plan.popular && (
              <div className="bg-neon-blue text-white py-2 text-center font-medium">
                Mais popular
              </div>
            )}
            <div className="bg-gray-900/40 backdrop-blur-sm p-8">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400 ml-2">/mês</span>
                {plan.firstMonth && (
                  <p className="text-neon-blue text-sm mt-1">{plan.firstMonth}</p>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-md font-medium transition-all ${
                  plan.popular 
                    ? 'bg-neon-blue text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {plan.buttonText}
              </motion.button>
              
              <div className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <FaCheck className="text-neon-blue mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const plans = [
  {
    name: "Starter",
    description: "Para pequenos negócios",
    price: "19€",
    firstMonth: "Apenas 1€ no primeiro mês",
    buttonText: "Começar por 1€",
    popular: true,
    features: [
      "1 número de telefone",
      "Até 100 minutos/mês",
      "Atendimento automático",
      "Marcação de reservas",
      "Relatórios mensais",
    ],
  },
  {
    name: "Pro",
    description: "Para empresas em crescimento",
    price: "49€",
    buttonText: "Escolher Pro",
    popular: false,
    features: [
      "3 números de telefone",
      "Até 500 minutos/mês",
      "Atendimento personalizado",
      "Integração com CRM",
      "Relatórios semanais",
      "Suporte prioritário",
    ],
  },
  {
    name: "Business",
    description: "Para empresas estabelecidas",
    price: "99€",
    buttonText: "Contactar vendas",
    popular: false,
    features: [
      "10 números de telefone",
      "Minutos ilimitados",
      "Assistente totalmente personalizado",
      "API para integrações",
      "Relatórios em tempo real",
      "Suporte 24/7",
      "Gestor de conta dedicado",
    ],
  },
];

export default Pricing; 