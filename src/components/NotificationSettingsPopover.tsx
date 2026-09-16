import React, { useState, useEffect, useRef } from 'react';
import { TimeBlock, DomainConfig } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isSoundEnabled,
  setSoundEnabled,
  getDefaultReminderMinutes,
  setDefaultReminderMinutes,
  soundSynthesizer,
  sendNativeNotification,
} from '../utils/notifications';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface NotificationSettingsPopoverProps {
  todayBlocks: TimeBlock[];
  categories: DomainConfig[];
  onTriggerTestAlert: () => void;
  onSelectBlock?: (blockId: string) => void;
}

export const NotificationSettingsPopover: React.FC<NotificationSettingsPopoverProps> = ({
  todayBlocks,
  categories,
  onTriggerTestAlert,
  onSelectBlock,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());
  const [defaultMinutes, setDefaultMinutes] = useState<number>(getDefaultReminderMinutes());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Count active reminders for today
  const activeReminders = todayBlocks.filter((b) => b.reminderEnabled !== false && !b.completed);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      sendNativeNotification('Spectrum • Notifications actives', {
        body: 'Vous recevrez des rappels avant le début de vos blocs d’activités !',
      });
      soundSynthesizer.playChime();
    }
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      soundSynthesizer.playChime();
    }
  };

  const handleChangeDefaultMinutes = (minutes: number) => {
    setDefaultMinutes(minutes);
    setDefaultReminderMinutes(minutes);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        id="notification-center-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer ${
          isOpen
            ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white ring-2 ring-[#6C5CE7]/30'
            : activeReminders.length > 0
            ? 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[#6C5CE7] hover:border-[#6C5CE7]'
            : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)]'
        }`}
        title="Centre des notifications et rappels d'activités"
        aria-label="Rappels d'activités"
      >
        <Bell className="w-4 h-4" />
        {activeReminders.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7675] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[var(--bg-surface)]">
            {activeReminders.length > 9 ? '9+' : activeReminders.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] shadow-2xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6C5CE7]/15 text-[#6C5CE7] flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-none">
                  Rappels d'Activités
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Alertes de début de sessions
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onTriggerTestAlert}
              className="px-2.5 py-1 rounded-lg bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Déclencher une alerte test immédiate"
            >
              <Sparkles className="w-3 h-3" />
              <span>Tester l'alerte</span>
            </button>
          </div>

          {/* Browser Permission Status */}
          <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Notifications système</span>
              </span>
              {permission === 'granted' ? (
                <span className="text-[10px] font-bold text-[#55E6C1] bg-[#55E6C1]/15 px-2 py-0.5 rounded-full border border-[#55E6C1]/30 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Actives</span>
                </span>
              ) : permission === 'denied' ? (
                <span className="text-[10px] font-bold text-[#FF7675] bg-[#FF7675]/15 px-2 py-0.5 rounded-full border border-[#FF7675]/30">
                  Bloquées
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#FDCB6E] bg-[#FDCB6E]/15 px-2 py-0.5 rounded-full border border-[#FDCB6E]/30">
                  En attente
                </span>
              )}
            </div>

            {permission !== 'granted' ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Autorisez les notifications système pour recevoir des alertes même lorsque l'application est en arrière-plan.
                </p>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="w-full py-1.5 rounded-lg bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Activer les notifications du navigateur</span>
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Les notifications du navigateur s'afficheront sur votre écran même lorsque vous êtes sur un autre onglet.
              </p>
            )}
          </div>

          {/* Sound & Chime Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  soundActive ? 'bg-[#55E6C1]/15 text-[#55E6C1]' : 'bg-[var(--border-card)] text-[var(--text-muted)]'
                }`}
              >
                {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Carillon zen sonore
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Chime harmonieux au début
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundActive ? 'bg-[#6C5CE7]' : 'bg-[var(--border-card)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  soundActive ? 'translate-x-5' : 'translate-x-0.5'
                } shadow-sm`}
              />
            </button>
          </div>

          {/* Timing par défaut */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Délai de notification par défaut</span>
              </label>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                {defaultMinutes === 0 ? "À l'heure pile" : `${defaultMinutes} min avant`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {[
                { min: 0, label: '0 min' },
                { min: 5, label: '5 min' },
                { min: 10, label: '10 min' },
                { min: 15, label: '15 min' },
                { min: 30, label: '30 min' },
              ].map(({ min, label }) => {
                const isSelected = defaultMinutes === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleChangeDefaultMinutes(min)}
                    className={`py-1.5 rounded-lg text-xs font-bold text-center transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-xs'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#6C5CE7]/50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              Vous pouvez aussi personnaliser ce délai individuellement pour chaque activité.
            </p>
          </div>

          {/* Upcoming Reminders List for Today */}
          <div className="border-t border-[var(--border-card)] pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">
                Activités de la journée ({todayBlocks.length})
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {activeReminders.length} avec rappel actif
              </span>
            </div>

            {todayBlocks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-2 text-center">
                Aucune activité prévue aujourd'hui.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {todayBlocks.map((block) => {
                  const cat = categories.find((c) => c.id === block.domain);
                  const isReminderOn = block.reminderEnabled !== false;
                  const mins = block.reminderMinutesBefore ?? defaultMinutes;

                  return (
                    <div
                      key={block.id}
                      onClick={() => {
                        onSelectBlock?.(block.id);
                        setIsOpen(false);
                      }}
                      className="group p-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#6C5CE7]/10 border border-[var(--border-card)] hover:border-[#6C5CE7]/40 flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color || '#6C5CE7' }}
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                            {block.title}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {block.startTime} — {block.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isReminderOn ? (
                          <span className="text-[9px] font-bold text-[#6C5CE7] bg-[#6C5CE7]/15 px-1.5 py-0.5 rounded border border-[#6C5CE7]/30 flex items-center gap-0.5">
                            <Bell className="w-2.5 h-2.5" />
                            <span>{mins === 0 ? '0m' : `-${mins}m`}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-[var(--text-muted)]">
                            Désactivé
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#6C5CE7] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
