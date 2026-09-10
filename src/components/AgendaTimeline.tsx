import React, { useState, useEffect } from 'react';
import { DomainId, TimeBlock } from '../types';
import { DOMAINS } from '../data/mockData';
import { MonthlyCalendarWidget } from './MonthlyCalendarWidget';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Terminal,
  Flame,
  Compass,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

interface AgendaTimelineProps {
  blocks: TimeBlock[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectBlock: (blockId: string) => void;
  onOpenAddModal: () => void;
  onOpenProjects: () => void;
  onSeedTemplates?: () => void;
  onClearBlocks?: () => void;
}

const DOMAIN_ICONS: Record<DomainId, React.ComponentType<{ className?: string }>> = {
  tech: Terminal,
  art: Flame,
  curiosity: Compass,
};

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FRENCH_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const AgendaTimeline: React.FC<AgendaTimelineProps> = ({
  blocks,
  selectedDate,
  onSelectDate,
  onSelectBlock,
  onOpenAddModal,
  onOpenProjects,
  onSeedTemplates,
  onClearBlocks,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const isTodaySelected =
    today.getFullYear() === selectedDate.getFullYear() &&
    today.getMonth() === selectedDate.getMonth() &&
    today.getDate() === selectedDate.getDate();

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentMinutesFromMidnight = currentHours * 60 + currentMinutes;
  const currentTimeString = `${String(currentHours).padStart(2, '0')}:${String(
    currentMinutes
  ).padStart(2, '0')}`;

  // Format selected date nicely in French
  const dayName = FRENCH_DAYS[selectedDate.getDay()];
  const dayNumber = selectedDate.getDate();
  const monthName = FRENCH_MONTHS[selectedDate.getMonth()];
  const yearNumber = selectedDate.getFullYear();
  const formattedDateTitle = isTodaySelected
    ? `Aujourd'hui • ${dayName} ${dayNumber} ${monthName}`
    : `${dayName} ${dayNumber} ${monthName} ${yearNumber}`;

  // Filter blocks matching the selected date
  const selectedDateStr = `${yearNumber}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  // 1 = Monday, 7 = Sunday
  const selectedWeekday = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

  const blocksForDay = blocks.filter((b) => {
    if (b.date) {
      return b.date === selectedDateStr;
    }
    return b.isRecurring && b.recurringDays.includes(selectedWeekday);
  });

  // Group by category (Tech, Art/Rap, Curiosité)
  const categorizedBlocks: Record<DomainId, TimeBlock[]> = {
    tech: blocksForDay
      .filter((b) => b.domain === 'tech')
      .sort((a, b) => a.startMinutes - b.startMinutes),
    art: blocksForDay
      .filter((b) => b.domain === 'art')
      .sort((a, b) => a.startMinutes - b.startMinutes),
    curiosity: blocksForDay
      .filter((b) => b.domain === 'curiosity')
      .sort((a, b) => a.startMinutes - b.startMinutes),
  };

  // Day progress statistics
  const dayTotalTasks = blocksForDay.reduce((acc, b) => acc + b.checklist.length, 0);
  const dayCompletedTasks = blocksForDay.reduce(
    (acc, b) => acc + b.checklist.filter((i) => i.isCompleted).length,
    0
  );
  const dayPercent = dayTotalTasks > 0 ? Math.round((dayCompletedTasks / dayTotalTasks) * 100) : 0;

  const domainKeys: DomainId[] = ['tech', 'art', 'curiosity'];

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 pt-4 text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* 1. WIDGET CALENDRIER MENSUEL EN HAUT (Au-dessus de Aujourd'hui) */}
      <MonthlyCalendarWidget
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        blocks={blocks}
      />

      {/* 2. EN-TÊTE DU JOUR SÉLECTIONNÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2E2E38]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A0A0AB]">
            <CalendarIcon className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Vue filtrée par date • Cloud Firestore</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
            {formattedDateTitle}
          </h1>
          <p className="text-xs text-[#A0A0AB] mt-1">
            {blocksForDay.length === 0
              ? 'Aucun bloc prévu pour ce jour précis.'
              : `${blocksForDay.length} bloc(s) actif(s) répartis dans vos 3 piliers cognitifs.`}
          </p>
        </div>

        {/* Action buttons & Stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {blocksForDay.length > 0 && (
            <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[#A0A0AB] tracking-wider">
                  Avancement du jour
                </div>
                <div className="text-sm font-extrabold font-mono text-[#55E6C1]">
                  {dayCompletedTasks}/{dayTotalTasks} ({dayPercent}%)
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#55E6C1]/10 border border-[#55E6C1]/30 flex items-center justify-center text-[#55E6C1]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          <button
            id="agenda-add-block-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5a48e5] text-white text-xs md:text-sm font-bold shadow-lg shadow-[#6C5CE7]/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Bloc</span>
          </button>
        </div>
      </div>

      {/* Info strip: live time & Firestore status */}
      <div className="p-3 rounded-2xl bg-[#1E1E24]/70 border border-[#2E2E38] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#A0A0AB]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#55E6C1] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#55E6C1]" />
          </span>
          <span className="font-semibold text-white">Heure courante : {currentTimeString}</span>
          <span className="text-[#71717A] hidden sm:inline">
            • Cloud Firestore connecté (spectrum-d28e6 • onSnapshot & setDoc)
          </span>
        </div>

        {/* Database state controls */}
        <div className="flex items-center gap-2">
          {blocks.length === 0 && onSeedTemplates && (
            <button
              onClick={onSeedTemplates}
              className="text-xs font-semibold text-[#55E6C1] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Charger modèles d'exemples</span>
            </button>
          )}
          {blocks.length > 0 && onClearBlocks && (
            <button
              onClick={onClearBlocks}
              className="text-[11px] text-[#71717A] hover:text-[#FF7675] transition-colors"
              title="Vider la collection de test"
            >
              Vider l'agenda
            </button>
          )}
        </div>
      </div>

      {/* Global empty state banner for empty user accounts */}
      {blocks.length === 0 && (
        <div className="mb-6 p-6 rounded-3xl bg-[#1E1E24] border border-[#2E2E38] text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-3 border border-[#6C5CE7]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Espace personnel propre & prêt</h3>
          <p className="text-xs text-[#A0A0AB] max-w-md mx-auto mt-1 leading-relaxed">
            Toutes les données de test ont été retirées. Vous pouvez créer vos propres blocs d'hyperfocus ou charger des exemples pour découvrir l'organisation multipotentielle.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold shadow-lg shadow-[#6C5CE7]/20 hover:bg-[#5F27CD] transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer mon premier bloc</span>
            </button>
            {onSeedTemplates && (
              <button
                onClick={onSeedTemplates}
                className="px-3.5 py-2 rounded-xl bg-[#121214] border border-[#2E2E38] text-[#A0A0AB] hover:text-white text-xs font-medium transition"
              >
                Charger des exemples de démarrage
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. BLOCS D'ACTIVITÉS RANGÉS PAR CATÉGORIES (Tech, Art/Rap, Curiosité) */}
      <div className="space-y-6">
        {domainKeys.map((domainId) => {
          const cfg = DOMAINS[domainId];
          const domainBlocks = categorizedBlocks[domainId];
          const Icon = DOMAIN_ICONS[domainId];

          return (
            <section
              key={domainId}
              className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-5 shadow-lg relative overflow-hidden"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2E2E38]/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: cfg.bgRgba,
                      borderColor: cfg.borderRgba,
                      color: cfg.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {cfg.name}
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold border font-mono"
                        style={{
                          backgroundColor: cfg.bgRgba,
                          borderColor: cfg.borderRgba,
                          color: cfg.color,
                        }}
                      >
                        {domainBlocks.length} bloc(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A0A0AB]">{cfg.label}</p>
                  </div>
                </div>

                <button
                  onClick={onOpenAddModal}
                  className="p-1.5 rounded-xl text-[#71717A] hover:text-white hover:bg-[#121214] transition-colors border border-transparent hover:border-[#2E2E38]"
                  title={`Ajouter un bloc ${cfg.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Blocks inside this category */}
              {domainBlocks.length === 0 ? (
                <div className="py-4 px-4 text-center rounded-xl bg-[#121214]/50 border border-dashed border-[#2E2E38] flex flex-col items-center justify-center">
                  <p className="text-xs text-[#71717A] italic">
                    Aucune activité {cfg.name} programmée pour ce jour.
                  </p>
                  <button
                    onClick={onOpenAddModal}
                    className="mt-2 text-[11px] font-semibold text-[#A0A0AB] hover:text-white transition-colors"
                  >
                    + Planifier une session {cfg.name}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {domainBlocks.map((block) => {
                    const total = block.checklist.length;
                    const done = block.checklist.filter((i) => i.isCompleted).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    const isLiveNow =
                      isTodaySelected &&
                      currentMinutesFromMidnight >= block.startMinutes &&
                      currentMinutesFromMidnight <= block.startMinutes + block.durationMinutes;

                    return (
                      <div
                        key={block.id}
                        onClick={() => onSelectBlock(block.id)}
                        className={`cursor-pointer bg-[#121214] border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden ${
                          isLiveNow
                            ? 'border-[#FF7675]/80 ring-1 ring-[#FF7675]/50'
                            : 'border-[#2E2E38] hover:border-[#3E3E4C]'
                        }`}
                      >
                        {/* Live active beacon */}
                        {isLiveNow && (
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#FF7675] uppercase">
                            <span className="w-2 h-2 rounded-full bg-[#FF7675] animate-ping inline-block" />
                            <span>En ce moment • {currentTimeString}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-white group-hover:text-[#55E6C1] transition-colors">
                            {block.title}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-[#A0A0AB] shrink-0 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#71717A]" />
                            {block.startTime} — {block.endTime} ({block.durationMinutes}m)
                          </span>
                        </div>

                        <p className="text-xs text-[#A0A0AB] line-clamp-2 leading-relaxed">
                          {block.globalObjective}
                        </p>

                        {/* Checklist % indicator */}
                        <div className="mt-3 pt-2.5 border-t border-[#2E2E38] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-[#A0A0AB]">
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                            <span>
                              {done}/{total} sous-tâche(s)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                            <div className="w-full h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: cfg.color,
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold" style={{ color: cfg.color }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
