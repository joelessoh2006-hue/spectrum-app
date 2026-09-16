import React from 'react';
import { TimeBlock, DomainConfig } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import {
  Bell,
  Clock,
  Sparkles,
  X,
  Play,
  Volume2,
  VolumeX,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface NotificationAlertBannerProps {
  alert: {
    block: TimeBlock;
    minutesBefore: number;
    isStartingNow: boolean;
  } | null;
  categories: DomainConfig[];
  onOpenBlock: (blockId: string) => void;
  onDismiss: () => void;
  onSnooze: (block: TimeBlock, snoozeMinutes: number) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
}

export const NotificationAlertBanner: React.FC<NotificationAlertBannerProps> = ({
  alert,
  categories,
  onOpenBlock,
  onDismiss,
  onSnooze,
  isSoundOn,
  onToggleSound,
}) => {
  if (!alert) return null;

  const { block, minutesBefore, isStartingNow } = alert;
  const cat = categories.find((c) => c.id === block.domain) || {
    id: block.domain,
    name: block.domain,
    color: '#6C5CE7',
    iconName: 'Sparkles',
  };
  const Icon = getPillarIcon(cat.iconName);

  return (
    <div className="fixed top-4 right-4 sm:right-6 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[var(--bg-surface)]/95 backdrop-blur-xl border-2 border-[#6C5CE7] rounded-2xl p-4 shadow-2xl shadow-[#6C5CE7]/20 text-[var(--text-primary)]">
        {/* Header Alert */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 text-[#6C5CE7] flex items-center justify-center shrink-0 border border-[#6C5CE7]/30">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C5CE7] block leading-none">
                {isStartingNow ? 'Rappel Immédiat' : `Rappel d'Activité (${minutesBefore} min avant)`}
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-[#6C5CE7]" />
                {isStartingNow
                  ? `Commence maintenant • ${block.startTime}`
                  : `Débute à ${block.startTime} (dans ${minutesBefore}m)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSound}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
              title={isSoundOn ? 'Sonnerie activée (cliquer pour couper)' : 'Sonnerie coupée'}
            >
              {isSoundOn ? <Volume2 className="w-3.5 h-3.5 text-[#55E6C1]" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
              title="Fermer ce rappel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5 pl-10 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
                border: `1px solid ${cat.color}35`,
              }}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.name}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {block.durationMinutes} min
            </span>
          </div>

          <h4 className="text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-1">
            {block.title}
          </h4>

          {block.globalObjective && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 leading-relaxed">
              {block.globalObjective}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-2.5 border-t border-[var(--border-card)] flex items-center justify-between gap-2 pl-10">
          <button
            type="button"
            onClick={() => onSnooze(block, 5)}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold hover:border-[#6C5CE7] transition cursor-pointer"
            title="Me rappeler dans 5 minutes"
          >
            +5 min
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={() => onOpenBlock(block.id)}
              className="px-3.5 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Lancer le Flow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
