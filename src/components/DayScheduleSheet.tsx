import React, { useState, useEffect } from 'react';
import { TimeBlock, DomainConfig, DomainId } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import {
  X,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  FastForward,
  Rewind,
  Lock,
  MapPin,
  Zap,
  UploadCloud,
  CalendarCheck,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface DayScheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  blocks: TimeBlock[];
  categories?: DomainConfig[];
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock?: (block: TimeBlock) => void;
  onAddBlock?: (newBlock: Omit<TimeBlock, 'id'>) => void;
  onShiftDayBlocks?: (minutes: number) => void;
  onOpenAddModal: (pillarId?: string, defaultDateStr?: string) => void;
  onOpenImportModal?: () => void;
  onOpenImportedModal?: () => void;
  onStartInstantSession?: (options?: {
    pillarId?: string;
    title?: string;
    durationMinutes?: number;
    openInZenFullscreen?: boolean;
  }) => void;
  onOpenInstantSessionModal?: () => void;
  waitingMilestonesCount?: number;
  onOpenMilestonesDrawer?: () => void;
}

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FRENCH_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const HOURS_TIMELINE = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const DayScheduleSheet: React.FC<DayScheduleSheetProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  blocks,
  categories,
  onSelectBlock,
  onUpdateBlock,
  onShiftDayBlocks,
  onOpenAddModal,
  onOpenImportModal,
  onOpenImportedModal,
  onStartInstantSession,
  onOpenInstantSessionModal,
  waitingMilestonesCount = 0,
  onOpenMilestonesDrawer,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timelineDisplayMode, setTimelineDisplayMode] = useState<'schedule' | 'pillars' | 'macro'>('schedule');
  const [shiftFeedback, setShiftFeedback] = useState<string | null>(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Escape key listener to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeCategories: DomainConfig[] = categories && categories.length > 0 ? categories : Object.values(DOMAINS);

  const today = new Date();
  const isTodaySelected =
    today.getFullYear() === selectedDate.getFullYear() &&
    today.getMonth() === selectedDate.getMonth() &&
    today.getDate() === selectedDate.getDate();

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimeString = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

  const dayName = FRENCH_DAYS[selectedDate.getDay()];
  const dayNumber = selectedDate.getDate();
  const monthName = FRENCH_MONTHS[selectedDate.getMonth()];
  const formattedDateTitle = isTodaySelected
    ? `Aujourd'hui, ${dayName} ${dayNumber} ${monthName}`
    : `${dayName} ${dayNumber} ${monthName} ${selectedDate.getFullYear()}`;

  const selectedDateString = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const selectedDayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

  // Filtrer les blocs de cette date précise
  const blocksForDay = blocks.filter((block) => {
    if (block.date) return block.date === selectedDateString;
    if (block.isRecurring && Array.isArray(block.recurringDays)) {
      return block.recurringDays.includes(selectedDayOfWeek);
    }
    return false;
  });

  const chronologicalBlocks = [...blocksForDay].sort((a, b) => a.startMinutes - b.startMinutes);

  const totalPlannedMinutes = blocksForDay.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
  const totalPlannedHoursFormatted =
    totalPlannedMinutes >= 60
      ? `${Math.floor(totalPlannedMinutes / 60)}h${totalPlannedMinutes % 60 > 0 ? `${totalPlannedMinutes % 60}m` : ''}`
      : `${totalPlannedMinutes} min`;

  let dayTotalUnits = 0;
  let dayCompletedUnits = 0;
  blocksForDay.forEach((b) => {
    if (b.subtasks && b.subtasks.length > 0) {
      dayTotalUnits += b.subtasks.length;
      dayCompletedUnits += b.subtasks.filter((st) => st.completed).length;
    } else {
      dayTotalUnits += 1;
      if (b.completed) dayCompletedUnits += 1;
    }
  });
  const dayPercent = dayTotalUnits > 0 ? Math.round((dayCompletedUnits / dayTotalUnits) * 100) : 0;

  const showNotification = (msg: string) => {
    setShiftFeedback(msg);
    setTimeout(() => setShiftFeedback(null), 2500);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const handleToday = () => {
    onSelectDate(new Date());
  };

  const handleShiftBlock = (block: TimeBlock, deltaMinutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateBlock) return;
    const newStartMinutes = Math.max(0, Math.min(24 * 60 - block.durationMinutes, block.startMinutes + deltaMinutes));
    const newEndMinutes = newStartMinutes + block.durationMinutes;

    const updated: TimeBlock = {
      ...block,
      startMinutes: newStartMinutes,
      startTime: minutesToTimeString(newStartMinutes),
      endTime: minutesToTimeString(newEndMinutes),
    };

    onUpdateBlock(updated);
    showNotification(`« ${block.title} » décalé de ${deltaMinutes > 0 ? `+${deltaMinutes}` : deltaMinutes}m (${updated.startTime})`);
  };

  const handleShiftAllBlocks = (deltaMinutes: number) => {
    if (onShiftDayBlocks) {
      onShiftDayBlocks(deltaMinutes);
      showNotification(`Tous les blocs du jour décalés de ${deltaMinutes > 0 ? `+${deltaMinutes}` : deltaMinutes} min`);
      return;
    }

    if (!onUpdateBlock) return;
    blocksForDay.forEach((block) => {
      const newStartMinutes = Math.max(0, Math.min(24 * 60 - block.durationMinutes, block.startMinutes + deltaMinutes));
      const newEndMinutes = newStartMinutes + block.durationMinutes;
      onUpdateBlock({
        ...block,
        startMinutes: newStartMinutes,
        startTime: minutesToTimeString(newStartMinutes),
        endTime: minutesToTimeString(newEndMinutes),
      });
    });
    showNotification(`Tous les blocs du jour décalés de ${deltaMinutes > 0 ? `+${deltaMinutes}` : deltaMinutes} min`);
  };

  if (!isOpen) return null;

  return (
    <div
      id="day-schedule-sheet-portal"
      className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-schedule-title"
    >
      {/* Backdrop sombre et blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Conteneur Bottom Sheet sur mobile / Centered Sheet sur desktop */}
      <div
        id="day-schedule-sheet"
        className="relative w-full sm:max-w-2xl bg-[var(--bg-surface)] border-t sm:border border-[var(--border-card)] shadow-2xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 overflow-hidden transition-all animate-in slide-in-from-bottom duration-300"
      >
        {/* Poignée de glissement mobile */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-[var(--bg-surface-elevated)]/60">
          <div className="w-12 h-1.5 rounded-full bg-[var(--border-highlight)]" />
        </div>

        {/* 1. EN-TÊTE DU VOLET */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] shadow-sm shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="day-schedule-title"
                  className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate"
                >
                  {formattedDateTitle}
                </h2>
                {isTodaySelected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30 shrink-0">
                    Aujourd'hui • {currentTimeString}
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  {blocksForDay.length === 0
                    ? 'Aucune activité planifiée'
                    : `${blocksForDay.length} activité${blocksForDay.length > 1 ? 's' : ''} (${totalPlannedHoursFormatted})`}
                </span>
                {dayTotalUnits > 0 && (
                  <span className="text-[11px] font-semibold text-[#6C5CE7]">
                    • {dayCompletedUnits}/{dayTotalUnits} sous-tâches ({dayPercent}%)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Jour & Bouton Fermer */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                title="Jour précédent"
                aria-label="Jour précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {!isTodaySelected && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#6C5CE7] hover:bg-[#6C5CE7]/10 transition cursor-pointer"
                >
                  Aujourd'hui
                </button>
              )}

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                title="Jour suivant"
                aria-label="Jour suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="close-day-schedule-sheet-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent hover:border-[var(--border-card)] transition cursor-pointer"
              title="Fermer le volet et revenir au calendrier (Échap)"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. BARRE D'ACTIONS RAPIDES : Décalage, Vues, Ajout */}
        <div className="px-4 py-2.5 bg-[var(--bg-surface-elevated)]/50 border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Décalage collectif */}
            {blocksForDay.length > 0 && onUpdateBlock && (
              <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] px-1.5 hidden sm:inline">
                  Décaler :
                </span>
                <button
                  type="button"
                  onClick={() => handleShiftAllBlocks(-30)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] text-[var(--text-secondary)] transition flex items-center gap-0.5 cursor-pointer"
                  title="Avancer tous les blocs de 30m"
                >
                  <Rewind className="w-3 h-3" />
                  <span>-30m</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllBlocks(15)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[#6C5CE7]/20 hover:text-[#6C5CE7] text-[var(--text-secondary)] transition flex items-center gap-0.5 cursor-pointer"
                  title="Décaler tous les blocs de +15m"
                >
                  <span>+15m</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftAllBlocks(30)}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#6C5CE7]/15 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white transition flex items-center gap-0.5 cursor-pointer border border-[#6C5CE7]/30"
                  title="Décaler tout de +30m (imprévu)"
                >
                  <FastForward className="w-3 h-3" />
                  <span>+30m</span>
                </button>
              </div>
            )}

            {/* Commutateur de mode */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimelineDisplayMode('schedule')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  timelineDisplayMode === 'schedule'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Chronologique
              </button>
              <button
                type="button"
                onClick={() => setTimelineDisplayMode('pillars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  timelineDisplayMode === 'pillars'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Piliers
              </button>
              <button
                type="button"
                onClick={() => setTimelineDisplayMode('macro')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  timelineDisplayMode === 'macro'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Macro (Zen)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {waitingMilestonesCount > 0 && onOpenMilestonesDrawer && (
              <button
                type="button"
                onClick={onOpenMilestonesDrawer}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Voir les jalons en attente à planifier"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span className="hidden sm:inline">Jalons</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#6C5CE7] text-white">
                  {waitingMilestonesCount}
                </span>
              </button>
            )}

            {onOpenImportModal && (
              <button
                type="button"
                id="sheet-import-cal-btn"
                onClick={onOpenImportModal}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Importer un fichier .ics (Xiaomi / Google Agenda)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span className="hidden sm:inline">Importer</span>
              </button>
            )}

            {onOpenImportedModal && (
              <button
                type="button"
                id="sheet-view-imported-cal-btn"
                onClick={onOpenImportedModal}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Voir toutes les dates importées de votre agenda"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#55E6C1]" />
                <span className="hidden sm:inline">Dates importées</span>
              </button>
            )}

            <button
              type="button"
              id="sheet-add-block-btn"
              onClick={() => onOpenAddModal(undefined, selectedDateString)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white text-xs font-bold shadow-md shadow-[#8A2BE2]/30 hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Bloc</span>
            </button>
          </div>
        </div>

        {/* Toast de feedback décalage */}
        {shiftFeedback && (
          <div className="absolute top-16 right-6 z-30 bg-[#2D3436] text-white px-3.5 py-1.5 rounded-xl shadow-xl border border-white/10 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <FastForward className="w-3.5 h-3.5 text-[#55E6C1]" />
            <span>{shiftFeedback}</span>
          </div>
        )}

        {/* 3. CONTENU DÉROULANT DU PLANNING */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Bannière de session spontanée (si aujourd'hui) */}
          {isTodaySelected && (
            <div className="bg-gradient-to-r from-[#6C5CE7]/10 via-[#8A2BE2]/10 to-[var(--bg-surface)] border border-[#6C5CE7]/25 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8A2BE2] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    Session spontanée à {currentTimeString}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Lancer un bloc focus débutant immédiatement.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onStartInstantSession?.({
                      pillarId: 'tech',
                      durationMinutes: 25,
                      title: `Focus (${currentTimeString})`,
                      openInZenFullscreen: false,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[#6C5CE7] hover:text-white border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition cursor-pointer shadow-2xs"
                >
                  ⚡ 25 min
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onStartInstantSession?.({
                      pillarId: 'tech',
                      durationMinutes: 50,
                      title: `Deep Work (${currentTimeString})`,
                      openInZenFullscreen: false,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[#6C5CE7] hover:text-white border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition cursor-pointer shadow-2xs"
                >
                  🔥 50 min
                </button>
                {onOpenInstantSessionModal && (
                  <button
                    type="button"
                    onClick={onOpenInstantSessionModal}
                    className="px-2.5 py-1 rounded-lg bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4bc4] transition cursor-pointer shadow-2xs"
                  >
                    Options…
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grille compacte des créneaux horaires */}
          <div className="bg-[var(--bg-surface-elevated)]/70 border border-[var(--border-card)] rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Créneaux Horaires de la Journée</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Cliquez pour planifier à l'heure exacte
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {HOURS_TIMELINE.map((hour) => {
                const [h] = hour.split(':').map(Number);
                const slotMinutes = h * 60;
                const coveringBlock = blocksForDay.find(
                  (b) => slotMinutes >= b.startMinutes && slotMinutes < b.startMinutes + b.durationMinutes
                );

                if (coveringBlock) {
                  const cat = activeCategories.find((c) => c.id === coveringBlock.domain);
                  const catColor = cat?.color || '#6C5CE7';

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onSelectBlock(coveringBlock.id)}
                      className="p-1.5 rounded-xl border text-left transition flex flex-col justify-between h-14 shadow-2xs hover:scale-102 cursor-pointer group"
                      style={{
                        backgroundColor: `${catColor}15`,
                        borderColor: `${catColor}40`,
                      }}
                      title={`${coveringBlock.title} (${coveringBlock.startTime} - ${coveringBlock.endTime})`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                          {hour}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                      </div>
                      <span className="text-[9px] font-medium text-[var(--text-secondary)] line-clamp-1 group-hover:text-[var(--text-primary)]">
                        {coveringBlock.title}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => onOpenAddModal(undefined, selectedDateString)}
                    className="p-1.5 rounded-xl border border-dashed border-[var(--border-card)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[#6C5CE7]/50 text-left transition flex flex-col justify-between h-14 cursor-pointer"
                    title={`Créneau libre à ${hour}. Cliquez pour ajouter un bloc.`}
                  >
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                      {hour}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Libre</span>
                      <Plus className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LISTE DES BLOCS DE LA JOURNÉE */}
          {blocksForDay.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-card)] text-center shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-3 border border-[#6C5CE7]/20">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Journée entièrement libre
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed">
                Aucune activité n'est planifiée pour le <strong className="text-[var(--text-primary)]">{formattedDateTitle}</strong>.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenAddModal(undefined, selectedDateString)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white text-xs font-bold shadow-md shadow-[#8A2BE2]/25 hover:brightness-110 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Planifier une activité</span>
                </button>
                {onOpenImportModal && (
                  <button
                    type="button"
                    onClick={onOpenImportModal}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-[var(--text-primary)] text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    <span>Importer un calendrier (.ics)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {chronologicalBlocks.map((block) => {
                const titleLower = block.title.toLowerCase();
                const isBirthday =
                  titleLower.includes('birthday') ||
                  titleLower.includes('anniversaire') ||
                  titleLower.includes('anniv') ||
                  titleLower.includes('naissance');
                const isAllDay =
                  Boolean(block.isAllDay) ||
                  block.startTime === 'Toute la journée' ||
                  block.durationMinutes >= 1440 ||
                  (isBirthday && (block.startTime === '09:00' || block.startTime === '00:00'));

                const cat = activeCategories.find((c) => c.id === block.domain) || {
                  id: block.domain,
                  name: block.domain,
                  color: block.isFixedConstraint ? (isBirthday ? '#EC4899' : '#F59E0B') : '#6C5CE7',
                  iconName: block.isFixedConstraint ? (isBirthday ? 'Sparkles' : 'Lock') : 'Sparkles',
                };
                const PillarIcon = block.isFixedConstraint
                  ? isBirthday
                    ? Sparkles
                    : Lock
                  : getPillarIcon(cat.iconName);

                const total = block.subtasks?.length || 0;
                const done = block.subtasks?.filter((st) => st.completed).length || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                const isCurrentLive =
                  isTodaySelected &&
                  !isAllDay &&
                  currentHours * 60 + currentMinutes >= block.startMinutes &&
                  currentHours * 60 + currentMinutes < block.startMinutes + block.durationMinutes;

                return (
                  <div
                    key={block.id}
                    onClick={() => onSelectBlock(block.id)}
                    className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group relative ${
                      isCurrentLive
                        ? 'border-[#6C5CE7] ring-1 ring-[#6C5CE7]/40 shadow-[#6C5CE7]/15'
                        : isAllDay && isBirthday
                        ? 'border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5'
                        : 'border-[var(--border-card)] hover:border-[var(--border-highlight)]'
                    }`}
                  >
                    {/* Indicateur En direct */}
                    {isCurrentLive && (
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#FF7675] uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#FF7675] animate-ping inline-block" />
                        <span>En cours en ce moment • {currentTimeString}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: block.isFixedConstraint
                              ? isBirthday
                                ? 'rgba(236, 72, 153, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)'
                              : `${cat.color}15`,
                            borderColor: block.isFixedConstraint
                              ? isBirthday
                                ? 'rgba(236, 72, 153, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                              : `${cat.color}35`,
                            color: block.isFixedConstraint
                              ? isBirthday
                                ? '#EC4899'
                                : '#F59E0B'
                              : cat.color,
                          }}
                        >
                          <PillarIcon className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#6C5CE7] transition-colors">
                              {block.title}
                            </h4>

                            {block.isFixedConstraint ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                  isBirthday
                                    ? 'bg-pink-500/15 text-pink-500 dark:text-pink-400 border-pink-500/30'
                                    : 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {isBirthday ? '🎂 Anniversaire' : '🔒 Contrainte Fixe'}
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                style={{
                                  color: cat.color,
                                  backgroundColor: `${cat.color}12`,
                                  borderColor: `${cat.color}30`,
                                }}
                              >
                                {cat.name}
                              </span>
                            )}
                          </div>

                          {block.globalObjective && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                              {block.globalObjective}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Horaires et boutons de décalage individuel */}
                      <div
                        className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAllDay ? (
                          <span className="text-xs font-bold text-pink-500 dark:text-pink-400 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/25">
                            <span>{isBirthday ? '🎂 Toute la journée' : '📅 Toute la journée'}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] flex items-center gap-1 mr-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            {block.startTime} — {block.endTime} ({block.durationMinutes}m)
                          </span>
                        )}

                        {!isAllDay && onUpdateBlock && (
                          <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleShiftBlock(block, -15, e)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                              title="-15 minutes"
                            >
                              -15
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleShiftBlock(block, 15, e)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-secondary)] hover:text-[#6C5CE7] transition cursor-pointer"
                              title="+15 minutes"
                            >
                              +15
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleShiftBlock(block, 30, e)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white transition cursor-pointer"
                              title="+30 minutes"
                            >
                              +30
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sous-tâches ou contrainte fixe */}
                    <div className="mt-2.5 pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      {block.isFixedConstraint ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                          <Lock className="w-3 h-3 text-[#E17055]" />
                          <span>Contrainte Fixe ({block.sourceCalendar || 'Agenda externe'})</span>
                        </div>
                      ) : total > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cat.color }} />
                          <span className="text-[11px]">
                            {done}/{total} étape{total > 1 ? 's' : ''} ({pct}%)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                          <Sparkles className="w-3 h-3" style={{ color: cat.color }} />
                          <span>Session Immersion Focus</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] group-hover:translate-x-0.5 transition-transform">
                        <span>Ouvrir la Fiche</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. PIED DE PAGE : Bouton pour fermer ou créer un bloc */}
        <div className="p-3 sm:p-4 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            ← Retour au calendrier
          </button>

          <button
            type="button"
            onClick={() => onOpenAddModal(undefined, selectedDateString)}
            className="px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter sur ce jour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
