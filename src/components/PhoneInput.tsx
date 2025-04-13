'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaCheck } from 'react-icons/fa';

const PhoneInput: React.FC = () => {
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
    // Allow only numbers and basic formatting
    if (/^[0-9 +()-]*$/.test(value) || value === '') {
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
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 9) {
      setIsValid(false);
      setError('O número deve ter pelo menos 9 dígitos');
      return;
    }
    
    // Phone number is valid
    setIsLoading(true);
    
    try {
      // Call our API route that handles the ElevenLabs request
      const response = await fetch('/api/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: cleanNumber })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Erro na resposta do servidor. Por favor, tente novamente.');
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
    <motion.div 
      className="mt-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center relative">
        <div className={`relative w-full sm:w-auto flex-1 ${!isValid ? 'animate-shake' : ''}`}>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FaPhone />
          </div>
          
          <motion.input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Insira o seu número"
            disabled={isLoading || sent}
            className={`w-full p-3 pl-10 pr-4 rounded-md bg-gray-900 border ${
              !isValid ? 'border-red-500' : isFocused ? 'border-neon-blue' : 'border-gray-700'
            } input-glow text-white focus:outline-none transition-all duration-300`}
          />
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            className="text-yellow-300 text-xs mt-1"
          >
            Atenção: Vai receber uma chamada real no número indicado.
          </motion.p>
          
          <AnimatePresence>
            {!isValid && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm mt-1 absolute"
              >
                {error || 'Número inválido'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          onClick={handleSend}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={isLoading || sent || phone.length === 0}
          className={`px-6 py-3 rounded-md font-medium flex items-center justify-center min-w-[160px] transition-all duration-300 ${
            sent ? 'bg-green-600' : isLoading ? 'bg-gray-600' : phone.length === 0 ? 'bg-gray-700 opacity-70' : 'bg-neon-blue'
          } text-white relative overflow-hidden`}
        >
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <FaCheck className="mr-2" />
                <span>Enviado!</span>
              </motion.div>
            ) : isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                A processar...
              </motion.span>
            ) : (
              <motion.span
                key="send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Receber chamada agora
              </motion.span>
            )}
          </AnimatePresence>
          
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={sent ? { opacity: 0.2 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>
      
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-md"
          >
            <p className="text-green-400 text-sm">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-gray-400 text-sm mt-2"
      >
        Experimente o serviço gratuitamente por 7 dias
      </motion.p>
    </motion.div>
  );
};

export default PhoneInput; 