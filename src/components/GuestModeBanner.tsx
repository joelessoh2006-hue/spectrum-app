import React, { useState } from 'react';
import { Sparkles, LogIn, ArrowRight, ShieldCheck, X, RotateCcw } from 'lucide-react';

interface GuestModeBannerProps {
  onLoginWithGoogle: () => void;
  onLoginGuest?: () => void;
}

export const GuestModeBanner: React.FC<GuestModeBannerProps> = ({
  onLoginWithGoogle,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('spectrum_guest_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) {
    return (
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-card)] px-4 py-1.5 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FDCB6E] animate-pulse" />
          <span>Mode découverte actif (données stockées localement sur ce navigateur).</span>
        </div>
        <button
          onClick={() => {
            setIsDismissed(false);
            sessionStorage.removeItem('spectrum_guest_banner_dismissed');
          }}
          className="text-[#6C5CE7] hover:underline font-medium cursor-pointer"
        >
          Afficher le rappel de sauvegarde
        </button>
      </div>
    );
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('spectrum_guest_banner_dismissed', 'true');
    } catch (_) {}
  };

  return (
    <div
      id="guest-mode-callout-banner"
      className="relative z-20 border-b border-[#6C5CE7]/30 bg-gradient-to-r from-[#6C5CE7]/10 via-[#00CEC9]/10 to-[#6C5CE7]/5 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Explanation */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] p-[1.5px] shrink-0 shadow-xs">
            <div className="w-full h-full bg-[var(--bg-surface)] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#6C5CE7] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Mode Découverte Libre
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30">
                100% Fonctionnel & Modifiable
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Créez un compte ou connectez-vous pour sauvegarder vos données dans le cloud et y accéder partout.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end flex-wrap">
          <button
            id="guest-banner-google-signin-btn"
            onClick={onLoginWithGoogle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white hover:brightness-110 font-bold text-xs shadow-md shadow-[#6C5CE7]/30 transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Créer un compte / Connexion</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Fermer ce rappel"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
