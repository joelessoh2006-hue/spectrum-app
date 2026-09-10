import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  LayoutGrid,
  Clock,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  X,
  Layers,
  Compass,
  Zap,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginWithGoogle?: () => void;
  isAuthenticated?: boolean;
}

const SLIDES = [
  {
    id: 'welcome',
    badge: 'Approche Multipotentielle',
    badgeColor: 'text-[#6C5CE7] bg-[#6C5CE7]/10 border-[#6C5CE7]/30',
    title: 'Bienvenue sur Spectrum',
    subtitle: 'L’assistant conçu pour ceux qui refusent de choisir une seule voie.',
    description:
      'Développeur, artiste, chercheur, entrepreneur… Vos centres d’intérêt se croisent et s’enrichissent. Spectrum vous offre le cadre idéal pour avancer sur tous vos fronts sans dispersion ni culpabilité.',
    icon: Sparkles,
    gradient: 'from-[#6C5CE7] via-[#a29bfe] to-[#00CEC9]',
    highlights: [
      { icon: Zap, label: 'Zéro culpabilité', desc: 'Harmonisez plusieurs passions dans une même semaine.' },
      { icon: Compass, label: 'Transition fluide', desc: 'Passez d’un univers à l’autre grâce à des repères visuels clairs.' },
    ],
  },
  {
    id: 'bento',
    badge: 'Organisation Macro',
    badgeColor: 'text-[#00CEC9] bg-[#00CEC9]/10 border-[#00CEC9]/30',
    title: 'La méthode Bento Grid',
    subtitle: 'Compartimentez vos projets par domaine d’énergie.',
    description:
      'Inspirée des boîtes Bento japonaises équilibrées, la grille Bento vous permet de cartographier vos projets en cours (Tech, Art, Curiosité) avec leurs jalons clés, sans jamais saturer votre mémoire de travail.',
    icon: LayoutGrid,
    gradient: 'from-[#00CEC9] to-[#55E6C1]',
    highlights: [
      { icon: Layers, label: '3 Domaines clés', desc: 'Technique, Artistique & Curiosité / Personnel.' },
      { icon: CheckCircle, label: 'Jalons atomiques', desc: 'Validez vos victoires étapes par étapes.' },
    ],
  },
  {
    id: 'timeblocking',
    badge: 'Organisation Micro',
    badgeColor: 'text-[#FDCB6E] bg-[#FDCB6E]/10 border-[#FDCB6E]/30',
    title: 'Le Time-Blocking Rythmé',
    subtitle: 'Allouez des blocs temporels protecteurs.',
    description:
      'Remplacez les listes de tâches anxiogènes par des rendez-vous clairs avec vous-même. Chaque bloc protège votre concentration sur un intervalle précis de la journée et évite le surmenage cognitif.',
    icon: Clock,
    gradient: 'from-[#FDCB6E] to-[#FF7675]',
    highlights: [
      { icon: Clock, label: 'Timeline chronologique', desc: 'Repères clairs de 07h à 22h adaptés à votre rythme.' },
      { icon: Flame, label: 'Gestion d’énergie', desc: 'Programmez selon votre pic d’hyperfocus.' },
    ],
  },
  {
    id: 'fiche',
    badge: 'Exécution & Immersion',
    badgeColor: 'text-[#FF7675] bg-[#FF7675]/10 border-[#FF7675]/30',
    title: 'Fiche d’Activité & Flow',
    subtitle: 'Déclenchez votre concentration en un clic.',
    description:
      'Chaque bloc s’ouvre sur une fiche d’activité immersive : micro-checklist pour découper l’effort, notes de décharge pour capturer les idées fulgurantes, et minuterie de focus pour rester dans la zone.',
    icon: Flame,
    gradient: 'from-[#FF7675] via-[#fd79a8] to-[#6C5CE7]',
    highlights: [
      { icon: Zap, label: 'Focus chronométré', desc: 'Session avec indicateur visuel de temps restant.' },
      { icon: CheckCircle, label: 'Notes de fulgurance', desc: 'Notez les idées parasites sans quitter votre tâche.' },
    ],
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onLoginWithGoogle,
  isAuthenticated = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const isLast = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('spectrum_onboarding_v1', 'completed');
    } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#18181B] border border-[#2E2E38] shadow-2xl overflow-hidden text-[#EDEDED] flex flex-col max-h-[90vh]">
        {/* Header with Skip and Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#27272A]/50">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${slide.badgeColor}`}
            >
              {slide.badge}
            </span>
            <span className="text-xs text-[#71717A] font-mono">
              {currentSlide + 1} / {SLIDES.length}
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="text-xs text-[#A0A0AB] hover:text-white px-2 py-1 rounded-lg hover:bg-[#27272A] transition"
          >
            Passer
          </button>
        </div>

        {/* Slide Content with Animation */}
        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Graphic Icon Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${slide.gradient} p-0.5 shadow-lg shadow-[#6C5CE7]/20 flex items-center justify-center`}
                >
                  <div className="w-full h-full bg-[#121214]/90 rounded-[14px] flex items-center justify-center">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {slide.title}
                  </h2>
                  <p className="text-xs text-[#A0A0AB] leading-relaxed font-medium">
                    {slide.subtitle}
                  </p>
                </div>
              </div>

              {/* Main descriptive text */}
              <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed pt-1">
                {slide.description}
              </p>

              {/* Highlights cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {slide.highlights.map((h, i) => {
                  const HIcon = h.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#121214] border border-[#27272A] flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-[#1E1E24] text-[#00CEC9] shrink-0 mt-0.5">
                        <HIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{h.label}</h4>
                        <p className="text-[11px] text-[#A0A0AB] leading-snug mt-0.5">{h.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final slide CTA if not yet authenticated */}
              {isLast && !isAuthenticated && onLoginWithGoogle && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/20 to-[#00CEC9]/20 border border-[#6C5CE7]/30 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white">
                      Synchronisation Cloud Firestore
                    </div>
                    <div className="text-[11px] text-[#A0A0AB]">
                      Enregistrez vos blocs privés avec votre compte Google.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLoginWithGoogle();
                      handleComplete();
                    }}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#121214] font-semibold text-xs hover:bg-gray-100 transition shadow-md"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Se connecter avec Google</span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls: Dots & Navigation buttons */}
        <div className="px-6 py-4 border-t border-[#27272A] bg-[#121214]/60 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-6 bg-[#6C5CE7]'
                    : 'w-2 bg-[#2E2E38] hover:bg-[#3E3E4A]'
                }`}
                title={`Aller à la diapositive ${index + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-[#A0A0AB] hover:text-white hover:bg-[#27272A] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold text-xs shadow-md shadow-[#6C5CE7]/20 hover:opacity-95 transition active:scale-95"
            >
              <span>{isLast ? 'Commencer l’expérience' : 'Suivant'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
