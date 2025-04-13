'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PhoneInputSection: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[0-9]*$/.test(value) || value === '') {
      setPhone(value);
      setIsValid(true);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    // Reset previous states
    setError(null);
    setSuccessMessage(null);
    
    // Basic validation
    if (phone.length < 9) {
      setIsValid(false);
      setError('O número deve ter pelo menos 9 dígitos');
      return;
    }
    
    // Phone number is valid
    setIsLoading(true);
    
    try {
      // Call API route that handles the outbound call
      const response = await fetch('/api/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Erro na resposta do servidor');
      }
      
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Ocorreu um erro ao iniciar a chamada');
      }
      
      // Call was successful
      setSent(true);
      setSuccessMessage('Chamada iniciada com sucesso! Atenda o seu telefone em breve.');
      setPhone(''); // Clear input on success
      
      // Reset sent state after animation
      setTimeout(() => setSent(false), 2000);
      
    } catch (err) {
      console.error('Call request failed:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao iniciar a chamada');
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Quer ver como funciona?
          </h2>
          <p className="text-gray-300">
            Receba já uma chamada gratis do nosso agente.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors duration-300">
              <div className="bg-zinc-800 p-3 text-zinc-400 font-medium">+351</div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Insira o seu número"
                disabled={isLoading || sent}
                className={`w-full p-3 bg-transparent border-0 text-white text-center text-lg font-medium focus:outline-none focus:ring-0 ${
                  !isValid ? 'text-red-500' : ''
                }`}
                maxLength={9}
              />
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-sm mt-1 absolute"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          
          <motion.button
            onClick={handleSend}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading || sent || phone.length < 9}
            className={`px-6 py-4 rounded-xl font-medium flex items-center justify-center min-w-[180px] ${
              sent ? 'bg-green-600' : isLoading ? 'bg-zinc-700' : phone.length < 9 ? 'bg-zinc-700 opacity-70' : 'bg-blue-500'
            } text-white relative overflow-hidden`}
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Enviado!
                </motion.span>
              ) : isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  A ligar...
                </motion.span>
              ) : (
                <motion.span
                  key="call"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Receber chamada demo
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
        
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center"
            >
              <p className="text-green-400">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default PhoneInputSection; 