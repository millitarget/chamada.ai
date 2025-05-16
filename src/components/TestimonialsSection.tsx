'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Testimonials data
const testimonials = [
  {
    quote: "Este assistente telefónico transformou completamente o meu negócio. Nunca mais perdemos uma chamada e os clientes ficam impressionados com a qualidade do atendimento.",
    name: "Ana Silva",
    role: "Proprietária, Clínica Dental Smile",
    image: "/images/avatar-1.jpg" // Add these images to your public folder
  },
  {
    quote: "Reduzimos os custos de pessoal em 40% e melhoramos a satisfação do cliente. O ROI foi impressionante logo no primeiro mês.",
    name: "Ricardo Oliveira",
    role: "CEO, Tech Solutions",
    image: "/images/avatar-2.jpg"
  },
  {
    quote: "Os nossos clientes nem percebem que estão a falar com uma IA. A voz é incrivelmente natural e as respostas são precisas e úteis.",
    name: "Marta Santos",
    role: "Diretora de Marketing, Retail Connect",
    image: "/images/avatar-3.jpg"
  }
];

const TestimonialsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const testimonialRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Create a callback function for refs
  const setTestimonialRef = (el: HTMLDivElement | null, index: number) => {
    testimonialRefs.current[index] = el;
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
    
    // Testimonials animation with stagger
    testimonialRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }
      gsap.fromTo(
        card,
        { opacity: 0, y: 50, scale: 0.9, rotationX: -10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 1.0,
          ease: "back.out(1.4)",
          delay: 0.1 + (index * 0.15),
          scrollTrigger: {
            trigger: card,
            start: 'top bottom-=80',
            toggleActions: 'play none none none'
          }
        }
      );
    });
    
    // Cleanup function
    const cleanup = () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
    return cleanup;

  }, []);

  return (
    <section 
      ref={sectionRef}
      className="w-full py-24 bg-gradient-to-b from-gray-900 to-black"
      id="testimonials"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pb-12 text-center">
          <h2 
            ref={headingRef}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            O que dizem os nossos clientes
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Empresas de todos os tamanhos estão a transformar o seu atendimento telefónico.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute left-0 top-1/3 w-40 h-40 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute right-0 bottom-1/3 w-60 h-60 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        
        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.name}
              ref={(el) => setTestimonialRef(el, index)}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 relative overflow-hidden"
            >
              {/* Quote mark */}
              <svg 
                className="absolute top-6 right-6 w-16 h-16 text-blue-500/10"
                viewBox="0 0 32 32" 
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z"/>
              </svg>
              
              {/* Content */}
              <div className="relative">
                <p className="italic text-gray-300 mb-6">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full mr-4 overflow-hidden relative bg-gray-700 flex-shrink-0">
                    {testimonial.image && (
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative glow */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent"></div>
            </div>
          ))}
        </div>
        
        {/* Brands trust us section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-gray-400 mb-8">Empresas que confiam em nós</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 sm:gap-x-12 md:gap-x-16 opacity-70">
            {/* Replace with actual logos - increased gap and base opacity */}
            {[1, 2, 3, 4, 5].map((item) => ( // Added a 5th logo for better row fill on some screens
              <motion.div 
                key={item}
                className="w-32 h-12 bg-gray-800/70 rounded-lg flex items-center justify-center text-gray-500 filter grayscale hover:grayscale-0 transition-all duration-300 ease-in-out hover:shadow-lg hover:bg-gray-700/80 cursor-pointer"
                whileHover={{ scale: 1.08, filter: 'grayscale(0%)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                Logo {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 