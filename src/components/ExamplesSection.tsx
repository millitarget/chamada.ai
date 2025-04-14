'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTooth, FaCut, FaUtensils, FaShoppingCart } from 'react-icons/fa';

type Industry = {
  id: string;
  title: string;
  icon: React.ReactNode;
};

const ExamplesSection: React.FC = () => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const playAudio = (industryId: string) => {
    // Stop currently playing audio if any
    if (playingAudio) {
      const currentAudio = document.getElementById(`audio-${playingAudio}`) as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Play the selected audio
    const audioElement = document.getElementById(`audio-${industryId}`) as HTMLAudioElement;
    if (audioElement) {
      audioElement.play();
      setPlayingAudio(industryId);

      // Reset once audio is done
      audioElement.onended = () => setPlayingAudio(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section id="examples-section" className="w-full py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Exemplos de chamadas por setor
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Ouça exemplos reais de diálogos e atendimentos em diversos setores
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {industries.map((industry) => (
            <motion.div
              key={industry.id}
              variants={cardVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 flex flex-col items-center cursor-pointer relative overflow-hidden"
            >
              {/* Audio element (hidden) */}
              <audio
                id={`audio-${industry.id}`}
                src={`/audio/${industry.id}.mp3`}
                className="hidden"
              />
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                {industry.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-6 text-center">
                {industry.title}
              </h3>
              
              {/* Waveform Visualization */}
              <div className="w-full h-12 flex justify-between items-center mb-6">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-blue-500/50 rounded-full"
                    initial={{ height: Math.random() * 20 + 5 }}
                    animate={{
                      height: playingAudio === industry.id
                        ? [Math.random() * 20 + 5, Math.random() * 25 + 10, Math.random() * 30 + 5]
                        : Math.random() * 20 + 5
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: playingAudio === industry.id ? Infinity : 0,
                      repeatType: "reverse"
                    }}
                  />
                ))}
              </div>
              
              {/* Play Button */}
              <motion.button
                onClick={() => playAudio(industry.id)}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  playingAudio === industry.id ? 'bg-green-500' : 'bg-blue-500'
                }`}
              >
                {playingAudio === industry.id ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <a 
            href="#more-examples" 
            className="text-blue-400 inline-flex items-center group"
          >
            <span>Ver mais exemplos</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// Industry definitions with icons
const industries: Industry[] = [
  {
    id: 'restaurant',
    title: 'Restaurante',
    icon: <FaUtensils className="text-blue-500 w-8 h-8" />
  },
  {
    id: 'dental',
    title: 'Clínica dentária',
    icon: <FaTooth className="text-blue-500 w-8 h-8" />
  },
  {
    id: 'salon',
    title: 'Cabeleireiro',
    icon: <FaCut className="text-blue-500 w-8 h-8" />
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    icon: <FaShoppingCart className="text-blue-500 w-8 h-8" />
  },
];

export default ExamplesSection; 