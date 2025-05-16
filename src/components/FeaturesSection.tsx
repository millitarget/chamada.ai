'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { FaRobot, FaHeadset, FaClock, FaPhone, FaComments, FaChartLine } from 'react-icons/fa';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Features data
const features = [
  {
    icon: <FaRobot size={24} className="text-blue-400" />,
    title: 'Assistente IA Avançado',
    description: 'Assistente de voz potenciado por IA para responder a chamadas 24/7, com voz humana natural.'
  },
  {
    icon: <FaHeadset size={24} className="text-blue-400" />,
    title: 'Atendimento Automático',
    description: 'Atende a todas as chamadas de forma rápida e eficiente, sem filas de espera ou tempos de inatividade.'
  },
  {
    icon: <FaClock size={24} className="text-blue-400" />,
    title: 'Disponível 24/7',
    description: 'Disponível a qualquer hora, todos os dias da semana, garantindo que nunca perca uma chamada importante.'
  },
  {
    icon: <FaPhone size={24} className="text-blue-400" />,
    title: 'Transferência Inteligente',
    description: 'Encaminha as chamadas para a pessoa certa com base no assunto e na urgência da chamada.'
  },
  {
    icon: <FaComments size={24} className="text-blue-400" />,
    title: 'Comunicação Natural',
    description: 'Conversa de forma natural e fluida, adaptando-se ao contexto e às necessidades do cliente.'
  },
  {
    icon: <FaChartLine size={24} className="text-blue-400" />,
    title: 'Análise de Chamadas',
    description: 'Analisa e fornece insights sobre as chamadas, ajudando a melhorar o atendimento ao cliente.'
  }
];

const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Create a callback function for refs
  const setFeatureRef = (el: HTMLDivElement | null, index: number) => {
    featureRefs.current[index] = el;
  };

  useEffect(() => {
    // Main heading animation
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top bottom-=100',
          toggleActions: 'play none none none'
        }
      }
    );
    
    // Features animation
    featureRefs.current.forEach((feature, index) => {
      if (!feature) return;
      gsap.fromTo(
        feature,
        { opacity: 0, y: 40, scale: 0.9, rotationX: -10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 1.0,
          ease: 'expo.out',
          delay: 0.15 + (index * 0.15),
          scrollTrigger: {
            trigger: feature,
            start: 'top bottom-=80',
            toggleActions: 'play none none none'
          }
        }
      );
    });
    
    return () => {
      // Clean up ScrollTrigger instances
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="w-full py-24 bg-gradient-to-b from-black to-gray-900"
      id="features"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center pb-12 md:pb-16">
          <h2 
            ref={headingRef}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Recursos Poderosos
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Um assistente telefónico impulsionado por IA que responde, esclarece dúvidas e agenda — tal como um humano.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              ref={el => setFeatureRef(el, index)}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center mb-5 group-hover:bg-blue-900/50 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Call to action */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-blue-600/30 transition-all duration-300"
          >
            Experimente Grátis
          </motion.button>
          <p className="mt-4 text-gray-500 text-sm">Sem compromisso. Cancele a qualquer momento.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection; 