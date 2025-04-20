'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

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
    <section id="phone-section" className="w-full py-24 bg-gradient-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Experimente Agora</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Receba uma chamada de demonstração diretamente no seu telemóvel
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="relative w-full">
            <div className="flex items-center bg-black/50 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors duration-300">
              <div className="bg-zinc-800 p-3 text-zinc-400 font-medium">+351</div>
              <input
                type="tel"
                placeholder="Insira o seu número"
                className="w-full p-3 bg-transparent border-0 text-white focus:outline-none focus:ring-0"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading || sent}
                maxLength={9}
              />
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading || sent || phone.length < 9}
                className={`px-6 py-3 font-medium flex items-center justify-center min-w-[180px] ${
                  sent ? 'bg-green-600' : isLoading ? 'bg-zinc-700' : phone.length < 9 ? 'bg-zinc-700 opacity-70' : 'bg-blue-600'
                } text-white relative overflow-hidden`}
              >
                {sent ? (
                  <span className="flex items-center">
                    <FaCheck className="h-5 w-5 inline mr-2" />
                    Enviado!
                  </span>
                ) : isLoading ? (
                  <span>A ligar...</span>
                ) : (
                  <span>Experimente gratis</span>
                )}
              </motion.button>
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
            
            {successMessage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-green-500 text-sm"
              >
                {successMessage}
              </motion.p>
            )}
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-yellow-300 text-xs mt-1 text-center"
          >
            Atenção: Vai receber uma chamada real no número indicado.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default PhoneInputSection; 