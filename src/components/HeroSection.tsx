'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VantaBackground from './VantaBackground';
import Image from 'next/image';
import { FaCheck, FaUtensils, FaTeeth, FaShoppingBag, FaChevronRight, FaChevronLeft, FaPhone } from 'react-icons/fa'; 
import Flag from 'react-world-flags';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger); 
}

const HeroNew: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const bootOverlayRef = useRef<HTMLDivElement>(null); // Keep for initial fade
  const logoH1Ref = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const waveformRef = useRef<SVGSVGElement>(null);
  const waveformPathRef = useRef<SVGPathElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);

  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateInterval = 100; // ms for waveform update

  const mousePosition = useRef({ x: -1, y: -1 }); // For waveform and CTA
  const ctaQuickToX = useRef<gsap.QuickToFunc | null>(null);
  const ctaQuickToY = useRef<gsap.QuickToFunc | null>(null);
  const ctaQuickToRotateX = useRef<gsap.QuickToFunc | null>(null);
  const ctaQuickToRotateY = useRef<gsap.QuickToFunc | null>(null);

  // Refs for parallax elements
  const parallaxQuickToX = useRef<Map<HTMLElement, gsap.QuickToFunc>>(new Map());
  const parallaxQuickToY = useRef<Map<HTMLElement, gsap.QuickToFunc>>(new Map());

  const [mounted, setMounted] = useState(false);
  const [isAgentPanelVisible, setIsAgentPanelVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [isSubmittingCallRequest, setIsSubmittingCallRequest] = useState(false);
  const [callRequestSuccess, setCallRequestSuccess] = useState<boolean | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>("");
  
  // New state for multi-step form
  const [currentStep, setCurrentStep] = useState(1); // 1: Agent, 2: Phone, 3: Name, 4: Success
  const [formErrors, setFormErrors] = useState<{phone?: string}>({});

  // Ref for the new agent panel
  const agentSelectionPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generateWavePath = ( amplitude: number, frequency: number, phase: number, points: number = 400, yOffset: number = 50, mouseX: number = -1, mouseInfluenceRadius: number = 80, mouseInfluenceStrength: number = 15) => {
    let path = `M0,${yOffset}`;
    for (let i = 0; i <= points; i++) {
      const x = i;
      let y = yOffset + amplitude * Math.sin((i / frequency) + phase);
      if (mouseX !== -1) {
        const distance = Math.abs(x - mouseX);
        if (distance < mouseInfluenceRadius) {
          const influence = (1 - (distance / mouseInfluenceRadius)) * mouseInfluenceStrength;
          y -= influence * Math.sin((i / (frequency * 0.7)) + phase + Math.PI / 2);
        }
      }
      path += ` L${x},${y}`;
    }
    return path;
  };

  useEffect(() => {
    if (!mounted || !sectionRef.current || !bootOverlayRef.current || !logoH1Ref.current || !taglineRef.current || !waveformRef.current || !waveformPathRef.current || !waveformContainerRef.current || !ctaButtonRef.current ) {
      return;
    }
    
    const currentSectionRef = sectionRef.current;
    const currentWaveformContainerRef = waveformContainerRef.current;
    const currentCtaButtonRef = ctaButtonRef.current;
    const currentLogoH1Ref = logoH1Ref.current; // For parallax
    const currentTaglineRef = taglineRef.current; // For parallax

    // Parallax setup for logo, tagline, and waveform container
    const parallaxElements = [
        { ref: currentLogoH1Ref, strength: 0.03 },
        { ref: currentTaglineRef, strength: 0.02 },
        { ref: currentWaveformContainerRef, strength: 0.015 }
    ];

    parallaxElements.forEach(item => {
        if (item.ref) {
            parallaxQuickToX.current.set(item.ref, gsap.quickTo(item.ref, "x", { duration: 0.7, ease: "power3" }));
            parallaxQuickToY.current.set(item.ref, gsap.quickTo(item.ref, "y", { duration: 0.7, ease: "power3" }));
        }
    });

    // Magnetic CTA setup (remains similar)
    ctaQuickToX.current = gsap.quickTo(currentCtaButtonRef, "x", { duration: 0.4, ease: "power3" });
    ctaQuickToY.current = gsap.quickTo(currentCtaButtonRef, "y", { duration: 0.4, ease: "power3" });
    ctaQuickToRotateX.current = gsap.quickTo(currentCtaButtonRef, "rotationX", { duration: 0.3, ease: "power2" });
    ctaQuickToRotateY.current = gsap.quickTo(currentCtaButtonRef, "rotationY", { duration: 0.3, ease: "power2" });

    const handleMouseMove = (event: MouseEvent) => {
      if (currentWaveformContainerRef) { 
        const rect = currentWaveformContainerRef.getBoundingClientRect(); 
        const svgMouseX = ((event.clientX - rect.left) / rect.width) * 400; 
        mousePosition.current = { x: svgMouseX, y: event.clientY - rect.top }; 
      }

      const { clientX, clientY } = event;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      // Parallax movement for designated elements
      parallaxElements.forEach(item => {
        if (item.ref) {
            const qTX = parallaxQuickToX.current.get(item.ref);
            const qTY = parallaxQuickToY.current.get(item.ref);
            qTX?.(deltaX * item.strength);
            qTY?.(deltaY * item.strength);
        }
      });

      if (currentCtaButtonRef) { 
        const ctaRect = currentCtaButtonRef.getBoundingClientRect(); 
        const ctaCenterX = ctaRect.left + ctaRect.width / 2; 
        const ctaCenterY = ctaRect.top + ctaRect.height / 2; 
        const distanceToCta = Math.sqrt(Math.pow(event.clientX - ctaCenterX, 2) + Math.pow(event.clientY - ctaCenterY, 2)); 
        const magneticField = 150; 
        if (distanceToCta < magneticField) { 
          const moveX = (event.clientX - ctaCenterX) * 0.25; 
          const moveY = (event.clientY - ctaCenterY) * 0.25; 
          ctaQuickToX.current?.(moveX); 
          ctaQuickToY.current?.(moveY); 
          const tiltX = (event.clientY - ctaCenterY) / (ctaRect.height / 2) * -7; 
          const tiltY = (event.clientX - ctaCenterX) / (ctaRect.width / 2) * 7; 
          ctaQuickToRotateX.current?.(tiltX); 
          ctaQuickToRotateY.current?.(tiltY); 
          currentCtaButtonRef.style.setProperty("--glow-opacity", "0.7"); 
        } else { 
          ctaQuickToX.current?.(0); 
          ctaQuickToY.current?.(0); 
          ctaQuickToRotateX.current?.(0); 
          ctaQuickToRotateY.current?.(0); 
          currentCtaButtonRef.style.setProperty("--glow-opacity", "0"); 
        } 
      }
    };
    currentSectionRef.addEventListener('mousemove', handleMouseMove);
    
    const handleCtaMouseLeave = () => { 
      if (currentCtaButtonRef) { 
        // Reset CTA specific movements
        ctaQuickToX.current?.(0); 
        ctaQuickToY.current?.(0); 
        ctaQuickToRotateX.current?.(0); 
        ctaQuickToRotateY.current?.(0); 
        currentCtaButtonRef.style.setProperty("--glow-opacity", "0"); 
      } 
    };
    currentCtaButtonRef.addEventListener('mouseleave', handleCtaMouseLeave);

    // Add a mouseleave event for the entire section to reset parallax
    const handleSectionMouseLeave = () => {
        parallaxElements.forEach(item => {
            if (item.ref) {
                parallaxQuickToX.current.get(item.ref)?.(0);
                parallaxQuickToY.current.get(item.ref)?.(0);
            }
        });
        // Also reset CTA if mouse leaves section while over CTA
        if (currentCtaButtonRef) {
            ctaQuickToX.current?.(0); 
            ctaQuickToY.current?.(0); 
            ctaQuickToRotateX.current?.(0); 
            ctaQuickToRotateY.current?.(0); 
            currentCtaButtonRef.style.setProperty("--glow-opacity", "0"); 
        }
    };
    currentSectionRef.addEventListener('mouseleave', handleSectionMouseLeave);

    const handleCtaClick = () => { 
      if(currentCtaButtonRef) { 
        gsap.fromTo(currentCtaButtonRef, { scale: 1 }, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }); 
        setIsAgentPanelVisible(prev => !prev); // Toggle visibility state
        // Reset to first step when opening panel
        setCurrentStep(1);
        setSelectedAgent(null);
        setPhoneNumber("");
        setCustomerName("");
        setResponseMessage("");
        setCallRequestSuccess(null);
        setFormErrors({});
      }
    };
    currentCtaButtonRef.addEventListener('click', handleCtaClick);

    // --- NEW ANIMATION LOGIC FOR "ABSTRACT EMERGENCE" ---
    const logoText = "Chamada.ai";
    const taglineText = "Fala como um humano.";

    // Clear previous content and prepare for new animations
    if (logoH1Ref.current) logoH1Ref.current.innerHTML = '';
    if (taglineRef.current) taglineRef.current.innerHTML = '';
    
    // Prepare logo characters
    const logoSpans = logoText.split("").map(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; // Handle spaces for inline-block
        span.style.display = 'inline-block';
        // Initial state for animation
        gsap.set(span, { opacity: 0, y: 20, scale: 0.7, filter: 'blur(4px)' });
        if (logoH1Ref.current) logoH1Ref.current.appendChild(span);
        return span;
    });

    // Prepare tagline
    if (taglineRef.current) {
      taglineRef.current.innerHTML = ''; // Clear for spans
      taglineText.split("").forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char === ' ' ? '\u00A0' : char;
        charSpan.style.display = 'inline-block';
        charSpan.style.opacity = '0';
        charSpan.style.transform = 'translateY(10px)'; // Slight initial offset for typing up
        taglineRef.current?.appendChild(charSpan);
      });
      gsap.set(taglineRef.current, { opacity: 1 }); // Ensure container is visible
    }
    
    // Set initial states for waveform and CTA (already handled in JSX with opacity-0 class, but explicit GSAP set is safer)
    gsap.set([waveformContainerRef.current, ctaButtonRef.current], { opacity: 0, y: 30 });


    const tl = gsap.timeline({ delay: 0.3 });

    // 0. System Boot Text Sequence in Overlay (NEW)
    if (bootOverlayRef.current) {
        const bootTexts = ["INITIALIZING...", "SYSTEM CHECK OK", "CORE ALIGNED", "AWAITING INPUT..."];
        const bootTextElement = document.createElement('div');
        bootTextElement.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl sm:text-2xl text-blue-300 font-mono opacity-0';
        bootOverlayRef.current.appendChild(bootTextElement);

        bootTexts.forEach((text, index) => {
            tl.set(bootTextElement, { textContent: text, opacity: 0 })
              .to(bootTextElement, { opacity: 1, duration: 0.05 })
              .to(bootTextElement, { opacity: 0, duration: 0.05 }, `+=0.${index === bootTexts.length - 1 ? 4 : 2}`); // Hold last text a bit longer
        });
         tl.set(bootTextElement, { display: 'none' }); // Hide text element after sequence
    }

    // 1. Boot overlay fade out
    tl.to(bootOverlayRef.current, { 
        opacity: 0, 
        duration: 0.8, 
        ease: "power1.inOut", 
        onComplete: () => { 
            if (bootOverlayRef.current) bootOverlayRef.current.style.display = 'none';
        }
    });

    // 2. "Chamada.ai" character emergence
    tl.to(logoSpans, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        color: '#3b82f6', // Initial pop of blue
        duration: 0.7,
        stagger: 0.06,
        ease: "back.out(1.7)", // A nice bouncy ease
        onStart: () => {
             if (logoH1Ref.current) logoH1Ref.current.style.color = '#3b82f6'; // Ensure parent also gets color if needed
        },
        onComplete: () => {
            gsap.to(logoSpans, { color: '#E5E7EB', duration: 0.6, delay: 0.2, ease: 'power1.out' }); // Tailwind gray-200
            // Subtle ambient pulse for the logo after reveal (NEW)
            gsap.to(logoSpans, {
                opacity: 0.85, // Slightly dim then back to full
                repeat: -1,
                yoyo: true,
                duration: 3, // Slow pulse
                stagger: 0.1,
                ease: "sine.inOut",
                delay: 1.5 // Start after everything settles
            });
        }
    }, "-=0.4"); // Overlap with boot overlay fade

    // 3. Tagline reveal (NEW: character by character)
    if (taglineRef.current) {
        const taglineChars = Array.from(taglineRef.current.children) as HTMLElement[];
        tl.to(taglineChars, {
            opacity: 1,
            y: 0,
            duration: 0.03,
            stagger: 0.04,
            ease: "power1.inOut"
        }, "-=0.2"); // Adjusted timing relative to logo
    }

    // 4. Waveform reveal (container first, then path if we add dashoffset anim)
    tl.to(waveformContainerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "circ.out"
    }, "-=0.6");

    // 5. CTA Button reveal
    tl.to(ctaButtonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.75)" 
    }, "-=0.4");

    // Waveform animation logic (interactive part)
    const svgPath = waveformPathRef.current; 
    let phase = 0; 
    let noise = 0;
    const animateWave = (currentTime: number) => { 
      animationFrameId.current = requestAnimationFrame(animateWave);
      if (!mounted) return; // Ensure component is still mounted
      if (currentTime - lastUpdateTime.current < updateInterval) return; 
      lastUpdateTime.current = currentTime; 
      phase += 0.05; 
      noise += 0.1; 
      const amplitude = 15 + Math.sin(noise) * 3; 
      const frequency = 60 + Math.cos(noise * 0.5) * 5; 
      if (svgPath) { 
        const newPath = generateWavePath(amplitude, frequency, phase, 400, 50, mousePosition.current.x); 
        // Check if tween exists to avoid conflicts if a reveal tween is also on attr:d
        if (!gsap.isTweening(svgPath)) {
          gsap.to(svgPath, { attr: { d: newPath }, duration: updateInterval / 1000, ease: "linear" });
        }
      }
    };

    // Start waveform animation only after it becomes visible or after a slight delay
    tl.call(() => {
        if (svgPath && mounted) { 
            gsap.set(svgPath, {opacity: 1}); // Ensure path itself is visible if container is
            svgPath.setAttribute('d', generateWavePath(15, 60, 0)); 
            animationFrameId.current = requestAnimationFrame(animateWave); 
        }
    }, [], ">-0.5"); // Call this when waveform container is roughly visible
    

    return () => {
      currentSectionRef.removeEventListener('mousemove', handleMouseMove);
      currentSectionRef.removeEventListener('mouseleave', handleSectionMouseLeave); // Remove section mouseleave listener
      if(currentCtaButtonRef) { 
          currentCtaButtonRef.removeEventListener('mouseleave', handleCtaMouseLeave); 
          currentCtaButtonRef.removeEventListener('click', handleCtaClick); 
          gsap.killTweensOf(currentCtaButtonRef); 
      }
      tl.kill();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if(svgPath) gsap.killTweensOf(svgPath);
      if (logoH1Ref.current) logoH1Ref.current.innerHTML = '';
      if (taglineRef.current) taglineRef.current.innerHTML = '';
      setMounted(false); // Reset mounted state on cleanup
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]); // Removed generateWavePath from deps, it's stable

  // Effect for agent panel animations
  useEffect(() => {
    if (mounted && agentSelectionPanelRef.current) {
      const panel = agentSelectionPanelRef.current;
      
      if (isAgentPanelVisible) {
        // Reset to make sure panel is visible 
        gsap.set(panel, { display: 'block', opacity: 0, y: 30 });
        
        // Fade in animation
        gsap.to(panel, {
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          ease: "power3.out",
          onComplete: () => {
            // Step-specific animations - let GSAP handle the current step display
            const steps = panel.querySelectorAll('[data-step]');
            steps.forEach(step => {
              const stepNum = parseInt((step as HTMLElement).dataset.step || "0");
              gsap.set(step, { 
                display: stepNum === currentStep ? 'block' : 'none',
                opacity: stepNum === currentStep ? 0 : 0 
              });
              
              if (stepNum === currentStep) {
                // Animate in the current step
                gsap.to(step, { opacity: 1, duration: 0.4, delay: 0.2 });
              }
            });
          }
        });
      } else {
        // Fade out animation
        gsap.to(panel, {
          opacity: 0, 
          y: 20, 
          duration: 0.4, 
          ease: "power2.in",
          onComplete: () => { 
            gsap.set(panel, { display: 'none' }); 
          }
        });
      }
    }
  }, [isAgentPanelVisible, mounted, currentStep]);

  // Reset the form when changing steps
  useEffect(() => {
    if (agentSelectionPanelRef.current) {
      const steps = agentSelectionPanelRef.current.querySelectorAll('[data-step]');
      steps.forEach(step => {
        const stepNum = parseInt((step as HTMLElement).dataset.step || "0");
        gsap.set(step, { 
          display: stepNum === currentStep ? 'block' : 'none'
        });
        
        if (stepNum === currentStep) {
          // Animate in the current step
          gsap.fromTo(step, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
          );
        }
      });
    }
  }, [currentStep]);

  const handleAgentSelection = (agent: string) => {
    setSelectedAgent(agent);
    // Move to next step after a brief delay
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Only allow digits, format will be added by placeholder and prefix
    const cleanedValue = value.replace(/\D/g, '');
    setPhoneNumber(cleanedValue);
    
    // Clear error when user types
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleCustomerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(event.target.value);
  };

  const goToNextStep = () => {
    // Validate before moving to next step
    if (currentStep === 2) {
      // Validate phone number
      if (!phoneNumber.trim() || phoneNumber.length < 9) {
        setFormErrors({ phone: "Por favor, introduza um número de telemóvel válido (9 dígitos)" });
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedAgent(null);
    setPhoneNumber("");
    setCustomerName("");
    setResponseMessage("");
    setCallRequestSuccess(null);
    setFormErrors({});
  };

  const handleSubmitCallRequest = async () => {
    // Final validation before API call
    if (!selectedAgent) {
      setResponseMessage("Por favor, selecione um tipo de agente.");
      setCallRequestSuccess(false);
      return;
    }
    
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setFormErrors({ phone: "Por favor, introduza um número de telemóvel válido (9 dígitos)" });
      setCallRequestSuccess(false);
      return;
    }

    setIsSubmittingCallRequest(true);
    setResponseMessage(""); // Clear previous messages
    setCallRequestSuccess(null);
    
    try {
      // Use relative URL that works in both development and production
      const backendUrl = '/api/start_call';
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: "+351" + phoneNumber,
          persona: selectedAgent,
          customer_name: customerName || "Website User", // Send default if empty
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResponseMessage(result.message || "Pedido de chamada enviado com sucesso!");
        setCallRequestSuccess(true);
        setCurrentStep(4); // Move to success step
      } else {
        setResponseMessage(`Erro: ${result.details || result.error || 'Ocorreu um erro ao processar o pedido.'}`);
        setCallRequestSuccess(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setResponseMessage('Erro ao comunicar com o servidor. Tente novamente mais tarde.');
      setCallRequestSuccess(false);
    } finally {
      setIsSubmittingCallRequest(false);
    }
  };

  const agentTypes = [
    { 
      id: "restaurante", 
      name: "Restaurante", 
      description: "Agente especializado em restaurantes para gerir reservas e responder a dúvidas sobre o menu e horário.",
      icon: <FaUtensils size={28} />
    }, 
    { 
      id: "clinica", 
      name: "Clínica Dentária", 
      description: "Agente para marcar consultas, responder a dúvidas sobre tratamentos e verificar disponibilidade.",
      icon: <FaTeeth size={28} />
    },
    { 
      id: "vendedor", 
      name: "Vendedor", 
      description: "Agente para assistência de vendas, informações sobre produtos e resolução de problemas com pedidos.",
      icon: <FaShoppingBag size={28} />
    }
  ];

  return (
    <section ref={sectionRef} className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-white px-4 sm:px-6 md:px-8 py-8" style={{ perspective: '1000px' }}>
      <VantaBackground />
      <div ref={bootOverlayRef} className="absolute inset-0 z-50 bg-black opacity-100 flex items-center justify-center">
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <h1 ref={logoH1Ref} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold !leading-tight mb-4 sm:mb-6 md:mb-8 relative select-none">
          {/* "Chamada.ai" characters will be injected here. Default color will be overridden by GSAP */}
        </h1>
        <p ref={taglineRef} className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-300 font-medium mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          {/* Tagline will be injected here */}
        </p>
        <div ref={waveformContainerRef} className="w-full h-20 sm:h-24 md:h-28 lg:h-32 mb-6 sm:mb-8 md:mb-10 lg:mb-12 opacity-0">
          {/* Initial opacity-0 is good for SSR/no-JS, GSAP will take over */}
          <svg ref={waveformRef} viewBox="0 0 400 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <path ref={waveformPathRef} d="M0,50 L400,50" stroke="#3b82f6" strokeWidth="2.5" fill="none" style={{opacity: 0}}/>
          </svg>
        </div>
        <button 
            ref={ctaButtonRef} 
            className="opacity-0 group relative px-8 py-4 bg-gray-900 text-blue-400 font-semibold rounded-lg shadow-md hover:shadow-blue-500/30 transition-all duration-300 ease-out transform-gpu" 
            style={{ boxShadow: '0 0 0px 0px rgba(59, 130, 246, var(--glow-opacity, 0)), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">Receber chamada grátis</span>
          <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-md"></div>
        </button>

        {/* Multi-step Agent Selection Panel - Mobile optimized */}
        <div 
          ref={agentSelectionPanelRef} 
          className="w-full max-w-md sm:max-w-lg md:max-w-xl mt-8 bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl text-gray-50 overflow-hidden"
          style={{ display: 'none' }} 
        >
          {/* Progress bar */}
          <div className="w-full bg-gray-800 h-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          
          {/* Step 1: Agent Selection - Mobile optimized */}
          <div data-step="1" className="p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 sm:mb-8 text-center">Escolha o Agente Virtual</h3>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {agentTypes.map(agent => (
                <button 
                  key={agent.id} 
                  onClick={() => handleAgentSelection(agent.id)}
                  className="group relative w-full p-4 sm:p-5 rounded-lg border-2 transition-all duration-300 ease-out text-left flex items-start gap-3 sm:gap-4
                            bg-gradient-to-br from-gray-800/70 to-gray-900/90 hover:from-blue-900/30 hover:to-blue-800/20
                            border-gray-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-900/40 group-hover:bg-blue-900/60 flex items-center justify-center transition-all duration-300">
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-md sm:text-lg font-semibold text-white mb-1">{agent.name}</span>
                    <span className="block text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-none">{agent.description}</span>
                  </div>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FaChevronRight className="text-blue-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Step 2: Phone Number */}
          <div data-step="2" className="p-6" style={{ display: 'none' }}>
            <button 
              onClick={goToPreviousStep}
              className="group flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <FaChevronLeft className="mr-1" />
              <span>Voltar</span>
            </button>
            
            <h3 className="text-2xl font-semibold text-white mb-8 text-center">Seu Número de Telemóvel</h3>
            
            <div className="mb-6">
              <div className="relative">
                {/* Phone input with proper styling */}
                <div className="flex">
                  <div className="relative inline-flex items-center border-y border-l border-gray-600 bg-gray-800/80 rounded-l-lg px-3 py-4">
                    <Flag code="PT" className="h-4 w-6 mr-2" />
                    <span className="text-white text-lg font-medium">+351</span>
                  </div>
                  <input 
                    type="tel"
                    name="phone"
                    id="phone"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="912 345 678"
                    className="w-full py-4 px-4 border-y border-r border-gray-600 bg-gray-800/80 rounded-r-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                            text-white text-lg tracking-wide"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    required
                  />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FaPhone />
                </div>
              </div>
              {formErrors.phone && (
                <p className="text-red-400 text-sm mt-2">{formErrors.phone}</p>
              )}
              <p className="text-gray-500 text-xs mt-2 font-light">Exemplo: 912345678 (9 dígitos)</p>
            </div>
            
            <button 
              onClick={goToNextStep}
              disabled={!phoneNumber || phoneNumber.length < 9}
              className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 
                        flex items-center justify-center gap-2
                        ${!phoneNumber || phoneNumber.length < 9 
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-600/30'}`}
            >
              <span>Continuar</span>
              <FaChevronRight />
            </button>
          </div>
          
          {/* Step 3: Name and Submit */}
          <div data-step="3" className="p-6" style={{ display: 'none' }}>
            <button 
              onClick={goToPreviousStep}
              className="group flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <FaChevronLeft className="mr-1" />
              <span>Voltar</span>
            </button>
            
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Confirmação</h3>
            
            <div className="mb-6 bg-gray-800/60 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-300 mb-2 text-sm">Agente selecionado:</p>
              <div className="flex items-center gap-3 mb-4">
                {selectedAgent && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center">
                      {agentTypes.find(a => a.id === selectedAgent)?.icon}
                    </div>
                    <span className="font-medium text-white">
                      {agentTypes.find(a => a.id === selectedAgent)?.name}
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-gray-300 mb-2 text-sm">Número de telemóvel:</p>
              <p className="font-medium text-white mb-4">+351 {phoneNumber}</p>
            </div>
            
            {/* Name Input (Optional) - Improved alignment and aesthetics */}
            <div className="mb-8">
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                Seu Nome (Opcional)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  id="customerName" 
                  name="customerName" 
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  placeholder="Como podemos chamá-lo(a)?"
                  className="w-full px-4 py-4 bg-gray-800/80 border-2 border-gray-700 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all 
                           duration-300 text-white text-lg"
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-transparent rounded-lg"></div>
              </div>
              <p className="text-gray-500 text-xs mt-2 ml-1 font-light">Usaremos este nome durante a chamada</p>
            </div>
            
            <button 
              onClick={handleSubmitCallRequest}
              disabled={isSubmittingCallRequest}
              className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 
                        flex items-center justify-center gap-2
                        ${isSubmittingCallRequest 
                          ? 'bg-gray-700 text-gray-400 cursor-wait' 
                          : 'bg-green-600 hover:bg-green-500 text-white shadow-md hover:shadow-green-600/30'}`}
            >
              {isSubmittingCallRequest ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  A pedir chamada...
                </>
              ) : (
                <>
                  <span>Pedir Chamada Agora</span>
                </>
              )}
            </button>
            
            {responseMessage && callRequestSuccess === false && (
              <div className="mt-4 p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-200 text-sm">
                {responseMessage}
              </div>
            )}
          </div>
          
          {/* Step 4: Success State */}
          <div data-step="4" className="p-6" style={{ display: 'none' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-600/20 border-4 border-green-500 flex items-center justify-center mb-6">
                <FaCheck size={30} className="text-green-400" />
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-4">Pedido Enviado com Sucesso!</h3>
              <p className="text-gray-300 mb-8">
                Irá receber uma chamada em breve no número +351 {phoneNumber}.
              </p>
              
              <div className="w-full bg-gray-800/60 rounded-lg p-4 mb-8 border border-gray-700">
                <div className="mb-3">
                  <div className="animate-pulse flex space-x-4 mb-5">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-2 bg-green-500/40 rounded w-3/4"></div>
                      <div className="h-2 bg-green-500/20 rounded w-1/2"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">A conectar agente para a sua chamada...</p>
                </div>
                
                <div className="w-full bg-gray-900/60 h-1 mb-1">
                  <div 
                    className="h-full bg-green-500 animate-[progressBar_3s_ease-in-out_infinite]"
                    style={{ width: '60%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Preparando</span>
                  <span>Chamando</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsAgentPanelVisible(false)}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroNew;