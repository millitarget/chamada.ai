'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { HiPlay, HiPhone } from 'react-icons/hi';

const HeroSection = () => {
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Handle component mount for client-side only code
  useEffect(() => {
    setMounted(true);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // Handle window resize for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToExamples = () => {
    const examplesSection = document.getElementById('examples-section');
    if (examplesSection) {
      examplesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlay = () => {
    const audio = document.getElementById('preview-audio') as HTMLAudioElement;
    if (audio) {
      audio.play();
      setPlaying(true);
      audio.onended = () => setPlaying(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*$/.test(value) || value === '') {
      setPhoneNumber(value);
      setError(null);
    }
  };

  const handleCallDemo = () => {
    if (showPhoneInput) {
      initiateCall();
    } else {
      setShowPhoneInput(true);
    }
  };

  const initiateCall = async () => {
    // Reset previous states
    setError(null);
    
    // Basic validation
    if (phoneNumber.length < 9) {
      setError('O número deve ter pelo menos 9 dígitos');
      return;
    }
    
    // Phone number is valid
    setIsLoading(true);
    console.log('Initiating call to number:', phoneNumber);
    
    try {
      // Call API route that handles the outbound call
      console.log('Sending request to /api/outbound-call');
      const response = await fetch('/api/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(Array.from(response.headers)));
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.error('Raw response text:', text);
        throw new Error('Erro na resposta do servidor');
      }
      
      if (!response.ok || !data.success) {
        console.error('API error:', data);
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryMinutes = data.retryAfter || 60;
          throw new Error(`Limite de chamadas excedido. Por favor, tente novamente em ${retryMinutes} minutos.`);
        }
        throw new Error(data?.error || 'Ocorreu um erro ao iniciar a chamada');
      }
      
      // Call was successful
      console.log('Call initiated successfully');
      setCallSent(true);
      setPhoneNumber(''); // Clear input
      
      // Reset states after some time
      setTimeout(() => {
        setCallSent(false);
        setShowPhoneInput(false);
      }, 5000);
      
    } catch (err) {
      console.error('Call request failed:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao iniciar a chamada');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-col items-start justify-center px-8 py-16 bg-black">
      {/* Company logo */}
      <div className="w-full max-w-6xl mx-auto">
        <h2 className="text-white font-bold text-4xl mb-16">Chamada.ai</h2>
        
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Left side: Text and buttons section */}
          <motion.div
            className="z-10 w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-white font-bold text-4xl sm:text-5xl md:text-6xl leading-tight">
              O seu novo assistente <br/>telefónico, disponível 24/7.
            </h1>
            <p className="mt-6 text-white text-lg md:text-xl max-w-xl">
              Crie um agente de voz alimentado por IA para sua empresa —
            </p>

            <p className="mt-12 text-white text-base">
              Receba uma chamada de demonstração agora:
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex w-full sm:w-auto">
                <input
                  type="tel"
                  placeholder="Insira o seu número"
                  className="bg-black/50 border border-zinc-800 py-3 px-4 w-full sm:w-80 rounded-l-full focus:outline-none focus:border-blue-500 text-white"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLoading || callSent}
                  maxLength={12}
                />
                <motion.button
                  onClick={handleCallDemo}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-r-full transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || callSent}
                >
                  Experimente gratis
                </motion.button>
              </div>
            </div>
            
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-red-500 text-sm"
              >
                {error}
              </motion.p>
            )}
            
            {callSent && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-green-500 text-sm"
              >
                Chamada iniciada com sucesso! Atenda o seu telefone em breve.
              </motion.p>
            )}
            
            <motion.button 
              onClick={scrollToExamples}
              className="mt-10 flex items-center justify-center gap-2 bg-transparent border border-zinc-800 text-white font-medium py-3 px-8 rounded-full hover:bg-white/5 transition w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-blue-500 rotate-90">→</span>
              Ouça agora
            </motion.button>
            
            <p className="mt-14 text-zinc-500 text-sm">
              Alimentado por tecnologia de ponta em IA
            </p>
          </motion.div>

          {/* Right side: AI head visualization */}
          <motion.div
            className="z-10 relative flex justify-center items-center mt-12 lg:mt-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* AI head with animated glow */}
            <div className="relative w-[250px] sm:w-[280px] md:w-[300px] h-[300px] sm:h-[350px] md:h-[400px]">
              {/* Halo effect */}
              <motion.div 
                className="absolute top-12 left-1/2 w-16 h-3 bg-white rounded-full blur-[2px] transform -translate-x-1/2"
                animate={{ 
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              {/* Animated glow behind the head */}
              <motion.div 
                className="absolute top-1/2 left-1/2 w-[200px] h-[200px] rounded-full bg-blue-900/20 filter blur-[60px]"
                style={{ x: "-50%", y: "-50%" }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.4, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              {/* Concentric blue circles */}
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[280px] md:w-[320px] h-[250px] sm:h-[280px] md:h-[320px] rounded-full border border-blue-900/30"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] sm:w-[220px] md:w-[250px] h-[200px] sm:h-[220px] md:h-[250px] rounded-full border border-blue-900/40"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
              />
              
              {/* AI head image */}
              <motion.div 
                className="relative w-full h-full flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              >
                <img 
                  src="/images/humanoid.png" 
                  alt="AI Assistant" 
                  className="object-contain w-full h-full max-w-[200px] sm:max-w-[250px] md:max-w-full drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <audio id="preview-audio" src="/audio/dental.mp3" />
    </section>
  );
};

export default HeroSection; 