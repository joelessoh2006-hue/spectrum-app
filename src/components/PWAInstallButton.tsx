import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Si déjà en mode application autonome (PWA installée)
  if (isInstalled) {
    return null;
  }

  // Installation native (Android / Chrome / Edge)
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xs font-semibold shadow-lg shadow-[#6C5CE7]/20 hover:opacity-95 transition active:scale-95"
        title="Installer l'application Spectrum sur votre appareil"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer l'App</span>
      </button>
    );
  }

  // Guide spécifique iOS Safari (WebKit ne supporte pas l'invite native)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1E24] border border-[#2E2E38] text-xs font-medium text-[#EDEDED] hover:bg-[#25252D] transition active:scale-95"
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00CEC9]" />
          <span>Installer PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#18181B] border border-[#2E2E38] p-5 shadow-2xl text-[#EDEDED]">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white font-bold text-sm">
                    S
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Installer Spectrum sur iOS</h3>
                    <p className="text-[11px] text-[#A0A0AB]">Ajouter à l'écran d'accueil</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-[#27272A] text-[#71717A] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[#A0A0AB]">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                  <Share2 className="w-5 h-5 text-[#00CEC9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Étape 1 :</strong> Appuyez sur le bouton{' '}
                    <strong className="text-white">Partager</strong> dans la barre d'outils Safari (icône en bas).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                  <PlusSquare className="w-5 h-5 text-[#55E6C1] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Étape 2 :</strong> Faites défiler vers le bas et sélectionnez{' '}
                    <strong className="text-white">Sur l'écran d'accueil</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-[#6C5CE7] text-white font-medium text-xs hover:bg-[#5F27CD] transition"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
