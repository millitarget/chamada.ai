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
    <section className="min-h-screen bg-black relative flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 py-16 overflow-hidden">
      {/* Star background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-70">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-blue-50 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          ></div>
        ))}
      </div>

      {/* Subtle background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle glow spots */}
        <div className="absolute top-1/4 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600/5 rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600/5 rounded-full filter blur-[100px]"></div>
      </div>

      {/* Background glow effect */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

      {/* Left side: Text and buttons section */}
      <motion.div
        className="z-10 w-full max-w-xl text-center lg:text-left mr-0 lg:mr-12 mb-12 lg:mb-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-white font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
          Um agente de voz.<br />
          Que soa a humano.
        </h1>
        <p className="mt-4 sm:mt-6 text-white text-base sm:text-lg md:text-xl max-w-xl mx-auto lg:mx-0">
          O futuro das chamadas já começou.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <motion.button 
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 sm:px-10 rounded-full transition flex items-center justify-center gap-2 w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <HiPlay className="text-white" />
            Ouça agora
          </motion.button>
          
          {!showPhoneInput ? (
            <motion.button 
              onClick={handleCallDemo}
              className="border border-white/20 text-white font-medium py-3 px-4 sm:px-6 rounded-full hover:bg-white/10 transition w-full sm:w-auto text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Receber chamada de demonstração
            </motion.button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto">
                <div className="bg-black text-white border border-zinc-700 py-3 px-3 rounded-l-full text-center flex items-center justify-center">
                  +351
                </div>
                <input
                  type="tel"
                  placeholder="número"
                  className="bg-black border border-l-0 border-zinc-700 py-3 px-4 w-full sm:w-32 focus:outline-none focus:border-blue-500 text-white"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLoading || callSent}
                  maxLength={9}
                />
                <motion.button
                  onClick={handleCallDemo}
                  className={`px-4 py-3 rounded-r-full flex items-center justify-center ${
                    callSent ? 'bg-green-600' : isLoading ? 'bg-zinc-700' : 'bg-blue-600 hover:bg-blue-500'
                  } text-white`}
                  whileHover={!isLoading && !callSent ? { scale: 1.05 } : {}}
                  whileTap={!isLoading && !callSent ? { scale: 0.98 } : {}}
                  disabled={isLoading || callSent}
                >
                  {callSent ? (
                    <span>✓</span>
                  ) : isLoading ? (
                    <span>...</span>
                  ) : (
                    <HiPhone />
                  )}
                </motion.button>
              </div>
            </div>
          )}
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
        
        <audio id="preview-audio" src="/audio/dental.mp3" />
      </motion.div>

      {/* Right side: AI head visualization */}
      <motion.div
        className="z-10 relative flex justify-center items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {/* AI head */}
        <div className="relative w-[250px] sm:w-[280px] md:w-[300px] h-[300px] sm:h-[350px] md:h-[400px]">
          {/* Concentric blue circles */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] sm:w-[250px] md:w-[300px] h-[200px] sm:h-[250px] md:h-[300px] rounded-full border border-blue-500/30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[170px] sm:w-[210px] md:w-[250px] h-[170px] sm:h-[210px] md:h-[250px] rounded-full border border-blue-500/40 animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[140px] sm:w-[170px] md:w-[200px] h-[140px] sm:h-[170px] md:h-[200px] rounded-full border border-blue-500/50 animate-pulse delay-150"></div>
          
          {/* AI head image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src="/images/humanoid.png" 
              alt="AI Assistant" 
              className="object-contain w-full h-full max-w-[200px] sm:max-w-[250px] md:max-w-full"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('ai-head-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            {/* Fallback for the AI head if the image doesn't exist */}
            <div 
              id="ai-head-fallback" 
              className="absolute inset-0 bg-gradient-to-b from-blue-800 to-blue-950 rounded-full hidden"
              style={{ display: 'none' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-32 sm:w-40 h-48 sm:h-60">
                  <div className="absolute w-full h-3/4 bg-blue-700 rounded-t-full"></div>
                  <div className="absolute bottom-0 w-full h-1/4 bg-blue-800 rounded-b-full"></div>
                  <div className="absolute top-1/4 left-1/4 w-1/5 h-1/10 bg-blue-400 rounded-full"></div>
                  <div className="absolute top-1/4 right-1/4 w-1/5 h-1/10 bg-blue-400 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/3 w-1/3 h-1/12 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient glow effect for the AI head on mobile */}
        <div className="absolute inset-0 bg-blue-600/5 filter blur-3xl rounded-full pointer-events-none"></div>
      </motion.div>
    </section>
  );
};

export default HeroSection; 