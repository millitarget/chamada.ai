'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

// --- Data (Assuming similar structure) ---
interface SectorData {
  id: string;
  name: string;
  businessData: { id: string; label: string; value?: string }[];
  clientInteractions: { id: string; query: string; response: string; relatedBusinessDataIds?: string[] }[];
}

const sectors: SectorData[] = [
  {
    id: 'restaurante',
    name: 'Restaurantes',
    businessData: [
      { id: 'menu', label: 'Menu Digital Atualizado' },
      { id: 'hours', label: 'Horário', value: '09:00 - 23:00' },
      { id: 'status', label: 'Estado Atual', value: 'Aberto' },
    ],
    clientInteractions: [
      { id: 'r_q1', query: 'Vocês estão abertos agora?', response: 'Sim, estamos abertos até às 23:00!', relatedBusinessDataIds: ['hours', 'status'] },
      { id: 'r_q2', query: 'Qual é o prato do dia?', response: 'O nosso prato do dia é Arroz de Marisco.', relatedBusinessDataIds: ['menu'] },
    ],
  },
  {
    id: 'clinica',
    name: 'Clínicas Dentárias',
    businessData: [
      { id: 'appointments', label: 'Agenda de Consultas' },
      { id: 'services', label: 'Serviços Disponíveis' },
    ],
    clientInteractions: [
      { id: 'c_q1', query: 'Gostaria de marcar uma consulta.', response: 'Claro! Qual o dia e hora preferencial para si?', relatedBusinessDataIds: ['appointments', 'services'] },
    ],
  },
];


// --- Line Styling Constants ---
const DEFAULT_LINE_OPACITY = 0.3;
const DEFAULT_LINE_WIDTH = 1;
const ACTIVE_LINE_OPACITY = 1;
const ACTIVE_LINE_WIDTH = 2;
const REVEALED_INTERACTION_LINE_WIDTH = 1.5;
const DIMMED_LINE_OPACITY = 0.1;
const DIMMED_LINE_WIDTH = 0.75;

const DEFAULT_LINE_COLOR_DATA = "rgba(59, 130, 246, 0.4)";
const DEFAULT_LINE_COLOR_INTERACTION = "rgba(56, 189, 248, 0.4)";
const ACTIVE_LINE_COLOR = "#3b82f6"; // Electric Blue
const ACTIVE_REVEAL_LINE_COLOR = "#06b6d4"; // Cyan for revealed answer

interface LineDef {
  id: string;
  d: string;
  type: 'data-to-brain' | 'brain-to-interaction';
}

// --- Component ---
const SectorSpecificAISolutions: React.FC = () => {
  const [activeSector, setActiveSector] = useState<SectorData>(sectors[0]);
  const [selectedBusinessDataId, setSelectedBusinessDataId] = useState<string | null>(null);
  const [revealedInteractionId, setRevealedInteractionId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const businessDataRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const clientInteractionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const aiBrainRef = useRef<HTMLDivElement>(null);
  const svgCanvasRef = useRef<SVGSVGElement>(null);
  
  const [lineDefs, setLineDefs] = useState<LineDef[]>([]);
  const initialLinesDrawnRef = useRef<boolean>(false);

  // --- Effects ---
  useEffect(() => { // Reset on sector change
    setSelectedBusinessDataId(null);
    setRevealedInteractionId(null);
    setIsAnimating(false);
    initialLinesDrawnRef.current = false; 
    // Clear any active GSAP animations on elements if necessary
    gsap.killTweensOf('.interactive-item, .ai-brain-visual, .line-path');
    // Force re-render of all items to default state
    // The lineDefs recalculation and subsequent useEffect will handle lines.
  }, [activeSector]);

  const getElementEdgePoint = useCallback((element: HTMLElement | null, svgBounds: DOMRect | null, side: 'left' | 'right' = 'right') => {
    if (!element || !svgBounds) return { x: 0, y: 0 };
    const rect = element.getBoundingClientRect();
    return {
        x: (side === 'right' ? rect.right : rect.left) - svgBounds.left,
        y: rect.top + rect.height / 2 - svgBounds.top,
    };
  }, []);
  
  const calculateLines = useCallback(() => {
    if (!svgCanvasRef.current || !aiBrainRef.current) {
      setLineDefs([]);
      return;
    }
    const svgBounds = svgCanvasRef.current.getBoundingClientRect();
    const newLines: LineDef[] = [];
    const brainRect = aiBrainRef.current.getBoundingClientRect();
    const brainCenter = {
        x: brainRect.left + brainRect.width / 2 - svgBounds.left,
        y: brainRect.top + brainRect.height / 2 - svgBounds.top,
    };

    activeSector.businessData.forEach(data => {
      const dataEl = businessDataRefs.current.get(data.id);
      if (dataEl) {
        const dataPoint = getElementEdgePoint(dataEl, svgBounds, 'right');
        newLines.push({
          id: `line-data-${data.id}`,
          d: `M${dataPoint.x},${dataPoint.y} L${brainCenter.x},${brainCenter.y}`,
          type: 'data-to-brain',
        });
      }
    });

    activeSector.clientInteractions.forEach(interaction => {
      const interactionEl = clientInteractionRefs.current.get(interaction.id);
      // Only draw lines for interactions if they are revealed or if nothing is selected (default view)
      if (interactionEl && (revealedInteractionId === interaction.id || !selectedBusinessDataId)) {
         let interactionPoint = getElementEdgePoint(interactionEl, svgBounds, 'left');
         // Nudge Y point slightly up for interaction cards to avoid text overlap
         const interactionRect = interactionEl.getBoundingClientRect(); // Get rect again for precise height
         interactionPoint.y = interactionRect.top + interactionRect.height * 0.40 - svgBounds.top; 

         newLines.push({
          id: `line-interaction-${interaction.id}`,
          d: `M${brainCenter.x},${brainCenter.y} L${interactionPoint.x},${interactionPoint.y}`,
          type: 'brain-to-interaction',
        });
      }
    });
    setLineDefs(newLines);
  }, [activeSector, getElementEdgePoint, revealedInteractionId, selectedBusinessDataId]); // Dependencies

  useEffect(() => { // Recalculate lines when these change
      calculateLines();
      const handleResize = () => calculateLines();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [calculateLines]); // calculateLines itself has dependencies

  useEffect(() => { // Line animation effect
    if (!svgCanvasRef.current || isAnimating) return; // Don't interfere with main timeline

    const paths = svgCanvasRef.current.querySelectorAll<SVGPathElement>('.line-path');
    
    if (!initialLinesDrawnRef.current && paths.length > 0) {
        paths.forEach(path => {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 });
        });
        gsap.to(paths, {
            strokeDashoffset: 0,
            opacity: DEFAULT_LINE_OPACITY,
            strokeWidth: DEFAULT_LINE_WIDTH,
            stroke: (i) => lineDefs[i]?.type === 'data-to-brain' ? DEFAULT_LINE_COLOR_DATA : DEFAULT_LINE_COLOR_INTERACTION,
            duration: 0.6,
            stagger: 0.05,
            delay: 0.2, // after content fade-in
            ease: 'power2.out',
            onComplete: () => {
              initialLinesDrawnRef.current = true;
            },
        });
    } else if (initialLinesDrawnRef.current && paths.length > 0) {
        // Default state or after deselection
        paths.forEach(path => {
            const lineDef = lineDefs.find(l => l.id === path.dataset.lineid);
            let isActiveDataLine = selectedBusinessDataId && lineDef?.type === 'data-to-brain' && lineDef.id.endsWith(selectedBusinessDataId);
            let isActiveInteractionLine = revealedInteractionId && lineDef?.type === 'brain-to-interaction' && lineDef.id.endsWith(revealedInteractionId);

            gsap.to(path, {
                opacity: isActiveDataLine || isActiveInteractionLine ? ACTIVE_LINE_OPACITY : (selectedBusinessDataId ? DIMMED_LINE_OPACITY : DEFAULT_LINE_OPACITY),
                strokeWidth: isActiveDataLine 
                                ? ACTIVE_LINE_WIDTH 
                                : (isActiveInteractionLine 
                                    ? REVEALED_INTERACTION_LINE_WIDTH 
                                    : (selectedBusinessDataId ? DIMMED_LINE_WIDTH : DEFAULT_LINE_WIDTH)),
                stroke: isActiveDataLine ? ACTIVE_LINE_COLOR : 
                        isActiveInteractionLine ? ACTIVE_REVEAL_LINE_COLOR : 
                        (lineDef?.type === 'data-to-brain' ? DEFAULT_LINE_COLOR_DATA : DEFAULT_LINE_COLOR_INTERACTION),
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    } else if (paths.length === 0 && revealedInteractionId) {
        // Special case: only one answer revealed, its line needs to draw
        // This path is tricky because lineDefs might be minimal. calculateLines needs to ensure line for revealedInteractionId is present.
        // And this effect might need to specifically target that one line.
        // For now, covered by the general logic if lineDefs are updated correctly.
    }


  }, [lineDefs, isAnimating, selectedBusinessDataId, revealedInteractionId]); // Rerun if lines change or animation state allows


  const handleBusinessDataClick = (clickedId: string) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    const dataItemToAnimate = businessDataRefs.current.get(clickedId);
    const brainEl = aiBrainRef.current;
    const dataLineToBrain = svgCanvasRef.current?.querySelector(`.line-path[data-lineid="line-data-${clickedId}"]`);

    // --- DESELECTION ---
    if (selectedBusinessDataId === clickedId) {
      setSelectedBusinessDataId(null);
      setRevealedInteractionId(null); // This will trigger line and interaction re-render/animation via useEffect

      // Animate all business data items back to default
      businessDataRefs.current.forEach(el => tl.to(el, { opacity: 1, scale: 1, filter: 'none', duration: 0.4, ease: 'power2.out' }, 0));
      // Animate all client interactions back to default (fade in)
      clientInteractionRefs.current.forEach(el => tl.to(el, { opacity: 1, scale: 1, display: 'block', duration: 0.4, ease: 'power2.out' }, "<0.1"));
      if (brainEl) tl.to(brainEl, { scale: 1, opacity: 1, filter: 'brightness(100%)', duration: 0.4, ease: 'power2.out' }, 0);
      // Lines will reset via useEffect reacting to state changes
      return;
    }

    // --- NEW SELECTION ---
    setSelectedBusinessDataId(clickedId);
    setRevealedInteractionId(null); // Clear previous answer

    // 1. Focus Input & Dim others
    businessDataRefs.current.forEach((el, id) => {
      if (id === clickedId) {
        tl.to(el, { scale: 1.1, filter: 'drop-shadow(0 0 10px ${ACTIVE_LINE_COLOR})', opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
      } else {
        tl.to(el, { opacity: 0.3, scale: 0.9, filter: 'grayscale(80%)', duration: 0.4, ease: 'power2.out' }, 0);
      }
    });

    // Fade out ALL current client interactions
    clientInteractionRefs.current.forEach(el => {
       if(el && el.style.display !== 'none') { // Only animate visible ones
         tl.to(el, { 
           opacity: 0, 
           scale: 0.8, 
           duration: 0.3, 
           ease: 'power1.in', 
           onComplete: () => {
             gsap.set(el, {display: 'none'});
           }
         }, "<0.1");
       }
    });
    
    // Line from selected data to brain LIGHTS UP
    if (dataLineToBrain) {
      tl.to(dataLineToBrain, { stroke: ACTIVE_LINE_COLOR, strokeWidth: ACTIVE_LINE_WIDTH + 0.5, opacity: ACTIVE_LINE_OPACITY, duration: 0.4 }, 0);
    }
    // Other lines DIM
    svgCanvasRef.current?.querySelectorAll<SVGPathElement>('.line-path').forEach(p => {
      if (p !== dataLineToBrain) tl.to(p, { opacity: DIMMED_LINE_OPACITY, strokeWidth: DIMMED_LINE_WIDTH, duration: 0.4 }, 0);
    });

    // 2. Brain Charge-Up
    if (brainEl) {
      tl.to(brainEl, { scale: 1.5, filter: 'brightness(180%) drop-shadow(0 0 15px ${ACTIVE_LINE_COLOR})', duration: 0.3, ease: 'power1.out' }, ">-0.2");
    }

    // 3. Brain Explosion
    if (brainEl) {
      tl.to(brainEl, { 
        scale: 5, // Explode larger
        opacity: 0, 
        duration: 0.4, 
        ease: 'power1.in',
        onComplete: () => {
          const relatedInteraction = activeSector.clientInteractions.find(ci => ci.relatedBusinessDataIds?.includes(clickedId));
          if (relatedInteraction) {
            setRevealedInteractionId(relatedInteraction.id);
          }
          gsap.set(brainEl, { scale: 1, opacity: 1, filter: 'brightness(100%)' }); // Reset brain for next cycle (instantly, it's hidden)
        }
      }, ">-0.1");
    }
    // 4. Answer Reveal - will be triggered by useEffect watching revealedInteractionId
  };
  
  // Effect for Revealed Answer Animation
  useEffect(() => {
    if (revealedInteractionId && !isAnimating) { // isAnimating check might be redundant if timeline controls it
        const answerEl = clientInteractionRefs.current.get(revealedInteractionId);
        const brainToAnswerLine = svgCanvasRef.current?.querySelector(`.line-path[data-lineid="line-interaction-${revealedInteractionId}"]`);

        if (answerEl) {
            gsap.set(answerEl, { display: 'block', opacity: 0, scale: 0.7 }); // Ensure it's display block before animating
            gsap.to(answerEl, {
                opacity: 1,
                scale: 1,
                duration: 0.5,
                delay: 0.1, // Slight delay after explosion/state set
                ease: 'back.out(1.7)',
            });
        }
        if (brainToAnswerLine) {
            const length = (brainToAnswerLine as SVGPathElement).getTotalLength();
            gsap.set(brainToAnswerLine, {strokeDasharray: length, strokeDashoffset: length, opacity:0, stroke: ACTIVE_REVEAL_LINE_COLOR, strokeWidth: REVEALED_INTERACTION_LINE_WIDTH});
            gsap.to(brainToAnswerLine, {
                strokeDashoffset: 0,
                opacity: ACTIVE_LINE_OPACITY,
                duration: 0.6,
                delay: 0.2,
                ease: 'power2.out'
            });
        }
    }
  }, [revealedInteractionId, isAnimating]);


  // --- JSX ---
  const AIBrainVisual = ({ brainRefProp }: { brainRefProp: React.Ref<HTMLDivElement> }) => (
    <div ref={brainRefProp} className="ai-brain-visual relative w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 mx-auto my-6 md:my-8 transition-all duration-300 ease-out">
      <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse"></div>
      <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-blue-600/50 animate-pulse [animation-delay:0.2s]"></div>
      <div className="absolute inset-3 sm:inset-4 rounded-full bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5M19.5 8.25h-1.5m-15 3.75H3m18 0h-1.5M19.5 12h-1.5m-15 3.75H3m18 0h-1.5m-3.75 6.75v-1.5m0-15V3" />
        </svg>
      </div>
    </div>
  );

  return (
    <section className="w-full py-12 sm:py-20 bg-gray-900 text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-center mb-10 sm:mb-14">
          Chamada.ai em Ação: Soluções Dedicadas
        </h2>
        
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
          {sectors.map((sector) => (
            <button
              key={sector.id}
              onClick={() => {
                setActiveSector(sector);
              }}
              className={`px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm md:text-base rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105
                          ${activeSector.id === sector.id 
                              ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white hover:shadow-md hover:shadow-gray-600/30'}`}
            >
              {sector.name}
            </button>
          ))}
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-start min-h-[400px] md:min-h-[450px]">
          <svg ref={svgCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {lineDefs.map(line => (
              <path
                key={line.id}
                data-lineid={line.id}
                d={line.d}
                fill="none"
                className="line-path transition-all duration-200 ease-out" 
              />
            ))}
          </svg>

          {/* --- Left Side: Business Data --- */}
          <div className="z-10 space-y-2.5 sm:space-y-3 text-center md:text-left order-2 md:order-1">
            <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-300 mb-4 sm:mb-6">Dados do Negócio</h4>
            {activeSector.businessData.map(data => (
              <div 
                key={data.id} 
                ref={(el) => { if (el) businessDataRefs.current.set(data.id, el); else businessDataRefs.current.delete(data.id); }}
                onClick={() => handleBusinessDataClick(data.id)}
                className={`interactive-item p-3 rounded-lg cursor-pointer transition-all duration-200 ease-out bg-gray-800/50 hover:bg-gray-700/70
                            ${selectedBusinessDataId === data.id ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-500/30' : ''}`}
              >
                <p className="text-xs sm:text-sm text-gray-100 group-hover:text-white">{data.label}</p>
                {data.value && <p className="text-sm sm:text-base font-semibold text-sky-300 group-hover:text-sky-200">{data.value}</p>}
              </div>
            ))}
          </div>

          {/* --- Center: AI Brain Visual --- */}
          <div className="z-10 flex flex-col items-center justify-center order-1 md:order-2 pt-0 md:pt-10">
            <AIBrainVisual brainRefProp={aiBrainRef} />
          </div>

          {/* --- Right Side: Client Interactions --- */}
          <div className="z-10 space-y-3 sm:space-y-4 text-center md:text-left order-3 md:order-3">
            <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-sky-300 mb-4 sm:mb-6">Interações com Clientes</h4>
            {activeSector.clientInteractions.map(interaction => {
              const isRevealed = revealedInteractionId === interaction.id;
              const showByDefault = !selectedBusinessDataId && !revealedInteractionId;

              return (
                <div
                  key={interaction.id}
                  ref={(el) => { if (el) clientInteractionRefs.current.set(interaction.id, el); else clientInteractionRefs.current.delete(interaction.id); }}
                  className={`interactive-item p-3 rounded-lg bg-gray-800/40 transition-opacity duration-300 ease-out text-xs sm:text-sm
                              ${isRevealed ? 'opacity-100 scale-100 shadow-lg shadow-sky-500/30 ring-1 ring-sky-400' : ''}
                              ${!isRevealed && !showByDefault ? 'opacity-0 scale-90 pointer-events-none' : ''}
                              ${showByDefault ? 'opacity-100 scale-100' : ''}
                            `}
                  style={{ display: (!isRevealed && !showByDefault && selectedBusinessDataId) ? 'none' : 'block' }} 
                >
                  <p className="text-gray-300 mb-1">Cliente: <span className="text-gray-50 italic">"{interaction.query}"</span></p>
                  <p className="text-sky-300">AI: <span className="text-sky-100 font-medium">"{interaction.response}"</span></p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectorSpecificAISolutions; 