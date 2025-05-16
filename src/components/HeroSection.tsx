'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VantaBackground from './VantaBackground';

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
  const [isSubmittingCallRequest, setIsSubmittingCallRequest] = useState(false);

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

        // Reset parallax elements to origin, could also be done on section mouse leave
        // parallaxElements.forEach(item => {
        //     if (item.ref) {
        //         parallaxQuickToX.current.get(item.ref)?.(0);
        //         parallaxQuickToY.current.get(item.ref)?.(0);
        //     }
        // });
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
        // console.log("CTA Clicked!"); 
        setIsAgentPanelVisible(prev => !prev); // Toggle visibility state
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

  // Effect to animate agent panel based on isAgentPanelVisible state
  useEffect(() => {
    if (agentSelectionPanelRef.current) {
      if (isAgentPanelVisible) {
        gsap.set(agentSelectionPanelRef.current, { display: 'block', opacity: 0, y: -20 });
        gsap.to(agentSelectionPanelRef.current, { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, // Slightly faster panel bg anim
          ease: "power2.out",
          onComplete: () => {
            // Stagger animate children of the panel
            if (agentSelectionPanelRef.current) {
              // Select direct children that are visually distinct sections for stagger
              const childrenToAnimate = Array.from(agentSelectionPanelRef.current.querySelectorAll(":scope > h3, :scope > div, :scope > button"));
              gsap.fromTo(childrenToAnimate, 
                { opacity: 0, y: 15 }, 
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power1.out" }
              );
            }
          }
        });
      } else {
        gsap.to(agentSelectionPanelRef.current, { 
          opacity: 0, 
          y: -20, 
          duration: 0.3, 
          ease: "power1.in", 
          onComplete: () => {
            if (agentSelectionPanelRef.current) {
              agentSelectionPanelRef.current.style.display = 'none';
              // Reset children opacity if they were animated individually, though parent opacity 0 handles it visually
              const childrenToReset = Array.from(agentSelectionPanelRef.current.querySelectorAll(":scope > h3, :scope > div, :scope > button"));
              gsap.set(childrenToReset, { opacity: 0 }); 
            }
        }});
      }
    }
  }, [isAgentPanelVisible]);

  const handleAgentSelection = (agent: string) => {
    setSelectedAgent(agent);
    // Potentially scroll to phone input or highlight next step
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };

  const handleSubmitCallRequest = async () => {
    if (!selectedAgent) {
      alert("Por favor, selecione um tipo de agente.");
      return;
    }
    if (!phoneNumber.trim()) {
      alert("Por favor, introduza o seu número de telemóvel.");
      return;
    }

    setIsSubmittingCallRequest(true);
    console.log("Solicitação de chamada:", { agent: selectedAgent, phone: phoneNumber });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds delay

    setIsSubmittingCallRequest(false);
    alert(`Chamada pedida para ${selectedAgent} para o número ${phoneNumber}! (Simulado)`);
    
    // Optionally close panel and reset states
    setIsAgentPanelVisible(false);
    setSelectedAgent(null);
    setPhoneNumber("");
  };

  const agentTypes = [
    { id: "restaurante", name: "Restaurante", description: "Agente especializado em restaurantes." }, 
    { id: "clinica", name: "Clínica Dentária", description: "Agente para marcar consultas e informações." },
    { id: "vendedor", name: "Vendedor", description: "Agente para assistência de vendas." }
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

        {/* Agent Selection Panel (shadcn/ui inspired) */}
        <div 
          ref={agentSelectionPanelRef} 
          className="w-full max-w-md sm:max-w-lg md:max-w-xl mt-8 p-6 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl text-gray-50"
          style={{ display: 'none' }} 
        >
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">Escolha o Agente Virtual</h3>
          
          <div className="space-y-4 mb-6">
            {agentTypes.map(agent => (
              <button 
                key={agent.id} 
                onClick={() => handleAgentSelection(agent.id)}
                className={`w-full p-4 rounded-md border transition-all duration-200 ease-in-out text-left flex flex-col items-start 
                            ${selectedAgent === agent.id 
                                ? 'bg-blue-600 border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                                : 'bg-gray-800 border-gray-700 hover:border-blue-400 hover:bg-gray-700/60'}`}
              >
                <span className="block text-md sm:text-lg font-semibold text-white">{agent.name}</span>
                <span className="block text-xs sm:text-sm text-gray-400 mt-1">{agent.description}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">Número de Telemóvel</label>
            <input 
              type="tel" 
              id="phoneNumber" 
              name="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="+351 9XX XXX XXX"
              className="w-full px-3 py-2.5 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors text-white placeholder-gray-500"
            />
          </div>

          <button 
            onClick={handleSubmitCallRequest}
            disabled={isSubmittingCallRequest}
            className={`w-full h-11 px-4 py-2 font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center 
                        ${isSubmittingCallRequest 
                            ? 'bg-blue-500/70 text-gray-300 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-500'}`}
          >
            {isSubmittingCallRequest ? (
              <svg className="animate-spin h-5 w-5 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Pedir Chamada Agora"
            )}
          </button>
        </div>

      </div>
    </section>
  );
};

export default HeroNew;