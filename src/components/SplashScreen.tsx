import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MobiusNeonCanvas } from './MobiusNeonCanvas';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
  isReplay?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onFinish }) => {
  const [drawProgress, setDrawProgress] = useState(0);
  const [showText, setShowText] = useState(false);

  const handleFinish = () => {
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onFinish === 'function') {
      onFinish();
    }
  };

  useEffect(() => {
    // Animate the path drawing from 0 to 1 over 2.2 seconds
    let startTime: number | null = null;
    const duration = 2200; // ms
    let timeoutId: NodeJS.Timeout | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-in-out curve
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setDrawProgress(eased);

      if (t < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setShowText(true);
        // Automatic redirection: transition to agenda without any user click
        timeoutId = setTimeout(() => {
          handleFinish();
        }, 800);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onComplete, onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Skip button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-[#1E1E24]/80 hover:bg-[#2A2A34] border border-[#2E2E38] text-xs text-[#A0A0AB] hover:text-white transition-all cursor-pointer z-20"
      >
        Passer
      </button>

      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#55E6C1]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Neon Möbius Strip Vector Canvas */}
        <div className="relative p-2">
          <MobiusNeonCanvas progress={drawProgress} width={280} height={160} />
          <div className="text-[11px] font-mono tracking-widest text-[#71717A] mt-2">
            RUBAN DE MÖBIUS • TRACÉ EN COURS {Math.round(drawProgress * 100)}%
          </div>
        </div>

        {/* Text Fade-in */}
        <div className="mt-8 min-h-[110px] flex flex-col items-center justify-center">
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <h1 className="text-4xl font-extrabold tracking-tight text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif]">
                  Spectrum
                </h1>
                <p className="mt-2 text-sm text-[#A0A0AB] max-w-xs font-medium">
                  Assistant pour esprit multipotentiel
                </p>

                {/* Subtitle tag */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1E24] border border-[#2E2E38] text-xs font-mono text-[#55E6C1]">
                  <Sparkles className="w-3 h-3 text-[#55E6C1]" />
                  <span>Time-blocking &amp; Piliers cognitifs</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Automatic transition status */}
        <div className="mt-8 min-h-[40px] flex items-center justify-center">
          {showText && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E1E24]/70 border border-[#2E2E38] text-xs font-mono text-[#A0A0AB]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-ping inline-block" />
              <span>Ouverture de l'Agenda...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
