import React, { useState, useEffect } from 'react';
import { DomainConfig } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import {
  Zap,
  Clock,
  Flame,
  Check,
  X,
  Sparkles,
  Maximize2,
  ChevronRight,
  Terminal,
  Code2,
} from 'lucide-react';

interface InstantSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DomainConfig[];
  onConfirm: (sessionData: {
    pillarId: string;
    title: string;
    durationMinutes: number;
    openInZenFullscreen?: boolean;
  }) => void;
}

export const InstantSessionModal: React.FC<InstantSessionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onConfirm,
}) => {
  // Live ticking clock to show the exact current second and minute
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Selected pillar (default to tech / dev if found, else first category)
  const defaultPillar = categories.find((c) => c.id === 'tech') || categories[0];
  const [selectedPillarId, setSelectedPillarId] = useState<string>(
    defaultPillar ? defaultPillar.id : 'tech'
  );

  // Duration preset (in minutes)
  const [durationMinutes, setDurationMinutes] = useState<number>(25);

  // Custom or suggested title
  const [sessionTitle, setSessionTitle] = useState<string>('');

  // Option to open directly in Fullscreen Immersion Zen Mode
  const [openInZen, setOpenInZen] = useState<boolean>(false);

  // Reset or update selected pillar when opened
  useEffect(() => {
    if (isOpen) {
      const tech = categories.find((c) => c.id === 'tech') || categories[0];
      if (tech) setSelectedPillarId(tech.id);
      setSessionTitle('');
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  // Formatting helpers
  const pad = (n: number) => String(n).padStart(2, '0');
  const startHour = currentTime.getHours();
  const startMin = currentTime.getMinutes();
  const startSec = currentTime.getSeconds();
  const startTimeStr = `${pad(startHour)}:${pad(startMin)}`;
  const liveClockStr = `${pad(startHour)}:${pad(startMin)}:${pad(startSec)}`;

  const totalEndMin = startHour * 60 + startMin + durationMinutes;
  const endHour = Math.floor((totalEndMin / 60) % 24);
  const endMin = totalEndMin % 60;
  const endTimeStr = `${pad(endHour)}:${pad(endMin)}`;

  const selectedCategory =
    categories.find((c) => c.id === selectedPillarId) || defaultPillar;
  const SelectedIcon = getPillarIcon(selectedCategory?.iconName);

  const handleLaunch = () => {
    const finalTitle =
      sessionTitle.trim() ||
      `Session ${selectedCategory?.name || 'Spontanée'} (${startTimeStr})`;

    onConfirm({
      pillarId: selectedPillarId,
      title: finalTitle,
      durationMinutes,
      openInZenFullscreen: openInZen,
    });
    onClose();
  };

  const handleQuickLightningLaunch = () => {
    onConfirm({
      pillarId: selectedPillarId,
      title: `Code & Dev Immédiat (${startTimeStr})`,
      durationMinutes: 25,
      openInZenFullscreen: true,
    });
    onClose();
  };

  const QUICK_TITLE_SUGGESTIONS = [
    'Session Code & Dev',
    'Bug Fix & Debug',
    'Refactorisation',
    'Feature Express',
    'Veille & Lecture',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Lueur d'ambiance aux couleurs du pilier actif */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 transition-all"
          style={{ backgroundColor: selectedCategory?.color || '#6C5CE7' }}
        />

        {/* 1. EN-TÊTE MODAL */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border-card)] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] p-[2px] shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px] flex items-center justify-center text-[#6C5CE7]">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
                  Démarrer une session spontanée
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30 animate-pulse">
                  Direct
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Crée un bloc commençant à la minute précise actuelle et ouvre le minuteur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CORPS DU MODAL (SCROLLABLE) */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* CARTE HEURE PRÉCISE & DÉROULEMENT */}
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] flex items-center justify-center text-[#6C5CE7]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Heure précise de lancement
                </span>
                <div className="text-xl font-black font-mono text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
                  <span>{liveClockStr}</span>
                </div>
              </div>
            </div>

            {/* Créneau calculé */}
            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-card)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Créneau calculé ({durationMinutes} min)
              </span>
              <div className="text-sm font-mono font-bold text-[#6C5CE7]">
                {startTimeStr} ➔ {endTimeStr}
              </div>
            </div>
          </div>

          {/* SÉLECTION DU PILIER D'ACTIVITÉ */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
              <span>Sphère d'activité</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {selectedCategory?.name}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedPillarId;
                const CatIcon = getPillarIcon(cat.iconName);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPillarId(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'border-transparent shadow-md'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[var(--text-secondary)]/30 text-[var(--text-secondary)]'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${cat.color}20`,
                            borderColor: cat.color,
                            color: cat.color,
                          }
                        : {}
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                        color: isSelected ? '#ffffff' : cat.color,
                      }}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SÉLECTION DE LA DURÉE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Durée de la session
              </label>
              <div className="flex items-center gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setDurationMinutes((m) => Math.max(5, m - 5))}
                  className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:bg-[var(--border-card)] text-[var(--text-primary)]"
                >
                  -5m
                </button>
                <span className="px-2 font-bold text-[var(--text-primary)]">{durationMinutes} min</span>
                <button
                  type="button"
                  onClick={() => setDurationMinutes((m) => Math.min(180, m + 5))}
                  className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:bg-[var(--border-card)] text-[var(--text-primary)]"
                >
                  +5m
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { mins: 15, label: '15 min', hint: 'Sprint' },
                { mins: 25, label: '25 min', hint: 'Pomodoro' },
                { mins: 50, label: '50 min', hint: 'Deep Work' },
                { mins: 90, label: '90 min', hint: 'Immersion' },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setDurationMinutes(opt.mins)}
                  className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer ${
                    durationMinutes === opt.mins
                      ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] font-bold shadow-sm'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#6C5CE7]/40'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[9px] opacity-70 font-mono">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* TITRE EXPRESS (OPTIONNEL) & SUGGESTIONS */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Intitulé de la session (Optionnel)
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder={`Ex: Code React, Refactorisation, Bug fix...`}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />

            {/* Suggestions rapides en 1 clic */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TITLE_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setSessionTitle(sug)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--bg-surface-elevated)] hover:bg-[#6C5CE7]/15 hover:text-[#6C5CE7] border border-[var(--border-card)] text-[var(--text-secondary)] transition cursor-pointer"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* CHECKBOX OUVRIR DIRECTEMENT EN MODE PLEIN ÉCRAN ZEN */}
          <label className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] cursor-pointer hover:border-[#6C5CE7]/40 transition">
            <input
              type="checkbox"
              checked={openInZen}
              onChange={(e) => setOpenInZen(e.target.checked)}
              className="w-4 h-4 rounded text-[#6C5CE7] focus:ring-[#6C5CE7]"
            />
            <div className="flex-1 text-xs">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
                Ouvrir directement en Mode Immersion Plein Écran
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Tamise tout le reste de l'écran pour ne laisser que le grand chrono, checklist et notes.
              </p>
            </div>
          </label>
        </div>

        {/* 3. PIED DE PAGE : BOUTONS D'ACTION */}
        <div className="p-4 sm:p-6 pt-3 border-t border-[var(--border-card)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center gap-2.5">
          {/* Raccourci Éclair 1 Clic */}
          <button
            type="button"
            onClick={handleQuickLightningLaunch}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-[var(--text-primary)] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            title="Lance instantanément une session Tech/Dev de 25 min à la minute près"
          >
            <Zap className="w-3.5 h-3.5 text-[#FDCB6E] fill-current" />
            <span>Éclair (Code 25m)</span>
          </button>

          {/* Bouton Principal de Lancement */}
          <button
            type="button"
            id="confirm-instant-session-btn"
            onClick={handleLaunch}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#6C5CE7]/30 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>
              Lancer la session maintenant ({startTimeStr} ➔ {endTimeStr})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
