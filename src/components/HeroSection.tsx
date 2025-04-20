'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { HiPlay, HiPhone } from 'react-icons/hi';
import { FaCheck } from 'react-icons/fa';

const HeroSection = () => {
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isFocused, setIsFocused] = useState(false);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      initiateCall();
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
      }, 5000);
      
    } catch (err) {
      console.error('Call request failed:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao iniciar a chamada');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-col items-start justify-center px-4 sm:px-8 py-16 bg-black">
      {/* Company logo */}
      <div className="w-full max-w-6xl mx-auto">
        <h2 className="text-white font-bold text-3xl sm:text-4xl mb-8 sm:mb-16">Chamada.ai</h2>
        
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Left side: Text and buttons section */}
          <motion.div
            className="z-10 w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-white font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              O seu novo assistente <br/>telefónico, disponível 24/7.
            </h1>
            <p className="mt-4 sm:mt-6 text-white text-base sm:text-lg md:text-xl max-w-xl">
              Crie um agente de voz alimentado por IA para sua empresa —
            </p>

            <motion.p
              className="mt-8 sm:mt-12 text-white text-base sm:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Receba uma chamada de demonstração:
            </motion.p>

            <div className="mt-4 sm:mt-6 w-full">
              <motion.div 
                className="relative w-full max-w-full sm:max-w-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="bg-[#121c3b] rounded-full w-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.25)] flex items-stretch">
                  <div className="px-4 py-3.5 text-blue-300 font-medium border-r border-blue-900/60 flex items-center justify-center">
                    +351
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="Insira o seu número"
                    className="w-full py-3.5 px-4 bg-transparent border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || callSent}
                    maxLength={9}
                  />
                  
                  <motion.button
                    onClick={initiateCall}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isLoading || callSent || phoneNumber.length < 9}
                    className={`px-6 py-3.5 font-medium text-white text-sm sm:text-base whitespace-nowrap flex items-center justify-center ${
                      callSent ? 'bg-green-600' : isLoading ? 'bg-blue-800' : phoneNumber.length < 9 ? 'bg-blue-900 text-gray-300' : 'bg-blue-700 hover:bg-blue-600'
                    } rounded-full transition-all duration-300`}
                  >
                    {callSent ? (
                      <span className="flex items-center">
                        <FaCheck className="h-4 w-4 mr-2" />
                        Enviado!
                      </span>
                    ) : isLoading ? (
                      <span>A ligar...</span>
                    ) : (
                      <span>Experimente gratis</span>
                    )}
                  </motion.button>
                </div>
                
                <div className="h-5 mt-2">
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm"
                    >
                      {error}
                    </motion.p>
                  )}
                  
                  {callSent && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm"
                    >
                      Chamada iniciada com sucesso! Atenda o seu telefone em breve.
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </div>
            
            <p className="mt-10 sm:mt-14 text-zinc-500 text-xs sm:text-sm">
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
            <div className="relative w-[220px] sm:w-[250px] md:w-[280px] h-[280px] sm:h-[300px] md:h-[350px]">
              {/* Halo effect */}
              <motion.div 
                className="absolute top-12 left-1/2 w-14 h-3 bg-white rounded-full blur-[2px] transform -translate-x-1/2"
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
                className="absolute top-1/2 left-1/2 w-[180px] h-[180px] rounded-full bg-blue-900/20 filter blur-[60px]"
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
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[230px] sm:w-[250px] md:w-[300px] h-[230px] sm:h-[250px] md:h-[300px] rounded-full border border-blue-900/30"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[180px] sm:w-[200px] md:w-[240px] h-[180px] sm:h-[200px] md:h-[240px] rounded-full border border-blue-900/40"
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
                  className="object-contain w-full h-full max-w-[180px] sm:max-w-[200px] md:max-w-full drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
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