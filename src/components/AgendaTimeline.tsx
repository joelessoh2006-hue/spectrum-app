import React, { useState, useEffect } from 'react';
import { DomainId, TimeBlock, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { MonthlyCalendarWidget } from './MonthlyCalendarWidget';
import { CategoriesExplorationGrid } from './CategoriesExplorationGrid';
import { getPillarIcon } from '../utils/iconMap';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  RotateCcw,
  Settings2,
  Layers,
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
  categories?: DomainConfig[];
  onOpenManagePillars?: () => void;
}

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
  categories,
  onOpenManagePillars,
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

  // Formatted date title
  const dayName = FRENCH_DAYS[selectedDate.getDay()];
  const dayNumber = selectedDate.getDate();
  const monthName = FRENCH_MONTHS[selectedDate.getMonth()];
  const formattedDateTitle = isTodaySelected
    ? `Aujourd'hui, ${dayName} ${dayNumber} ${monthName}`
    : `${dayName} ${dayNumber} ${monthName} ${selectedDate.getFullYear()}`;

  // Filter blocks relevant for this selected day
  const selectedDateString = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const selectedDayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

  const blocksForDay = blocks.filter((block) => {
    if (block.date) {
      return block.date === selectedDateString;
    }
    if (block.isRecurring && Array.isArray(block.recurringDays)) {
      return block.recurringDays.includes(selectedDayOfWeek);
    }
    return false;
  });

  // Active categories list
  const activeCategories: DomainConfig[] =
    categories && categories.length > 0
      ? categories
      : Object.values(DOMAINS).map((d) => ({
          id: d.id,
          name: d.name,
          label: d.label,
          color: d.color,
          colorSecondary: d.colorSecondary,
          bgRgba: d.bgRgba,
          borderRgba: d.borderRgba,
          iconName: d.id === 'tech' ? 'Terminal' : d.id === 'art' ? 'Flame' : 'Compass',
        }));

  // Group blocks by category
  const categorizedBlocks: Record<string, TimeBlock[]> = {};
  activeCategories.forEach((cat) => {
    categorizedBlocks[cat.id] = [];
  });

  blocksForDay.forEach((block) => {
    if (categorizedBlocks[block.domain]) {
      categorizedBlocks[block.domain].push(block);
    } else {
      // If domain doesn't exist in active categories, put it in the first or create bucket
      if (!categorizedBlocks[block.domain]) {
        categorizedBlocks[block.domain] = [];
      }
      categorizedBlocks[block.domain].push(block);
    }
  });

  // Sort blocks chronologically
  Object.keys(categorizedBlocks).forEach((catId) => {
    categorizedBlocks[catId].sort((a, b) => a.startMinutes - b.startMinutes);
  });

  const getBlockSubtasks = (block: TimeBlock) => {
    if (block.subtasks && block.subtasks.length > 0) {
      return block.subtasks;
    }
    return (block.checklist || []).map((c) => ({
      id: c.id,
      text: c.title,
      completed: c.isCompleted,
    }));
  };

  // Daily statistics
  const dayTotalTasks = blocksForDay.reduce(
    (acc, b) => acc + getBlockSubtasks(b).length,
    0
  );
  const dayCompletedTasks = blocksForDay.reduce(
    (acc, b) => acc + getBlockSubtasks(b).filter((i) => i.completed).length,
    0
  );
  const dayPercent = dayTotalTasks > 0 ? Math.round((dayCompletedTasks / dayTotalTasks) * 100) : 0;

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 pt-4 text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* 1. WIDGET CALENDRIER MENSUEL EN HAUT */}
      <MonthlyCalendarWidget
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        blocks={blocks}
        categories={activeCategories}
      />

      {/* 2. EXPLORATION DES PILIERS (LUMA STYLE) */}
      {onOpenManagePillars && (
        <CategoriesExplorationGrid
          categories={activeCategories}
          blocks={blocksForDay}
          onOpenManagePillars={onOpenManagePillars}
          onQuickAddBlockForPillar={(catId) => onOpenAddModal()}
        />
      )}

      {/* 3. EN-TÊTE DU JOUR SÉLECTIONNÉ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            <CalendarIcon className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Vue filtrée par date • Cloud Firestore</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            {formattedDateTitle}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {blocksForDay.length === 0
              ? 'Aucun bloc prévu pour ce jour précis.'
              : `${blocksForDay.length} bloc(s) actif(s) répartis dans vos ${activeCategories.length} piliers d'épanouissement.`}
          </p>
        </div>

        {/* Action buttons & Stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {blocksForDay.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  Avancement du jour
                </div>
                <div className="text-sm font-extrabold font-mono text-[#6C5CE7]">
                  {dayCompletedTasks}/{dayTotalTasks} ({dayPercent}%)
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          <button
            id="agenda-add-block-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs md:text-sm font-bold shadow-md shadow-[#6C5CE7]/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Bloc</span>
          </button>
        </div>
      </div>

      {/* Info strip: live time & Firestore status */}
      <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#55E6C1] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#55E6C1]" />
          </span>
          <span className="font-semibold text-[var(--text-primary)]">Heure : {currentTimeString}</span>
          <span className="text-[var(--text-muted)] hidden sm:inline">
            • Cloud Firestore connecté (users/{'{userId}'}/timeblocks)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onSeedTemplates && (
            <button
              onClick={onSeedTemplates}
              className="text-xs font-semibold text-[#6C5CE7] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Modèles d'exemples</span>
            </button>
          )}
          {blocks.length > 0 && onClearBlocks && (
            <button
              onClick={onClearBlocks}
              className="text-[11px] text-[var(--text-muted)] hover:text-[#FF7675] transition-colors"
              title="Vider la collection de test"
            >
              Vider
            </button>
          )}
        </div>
      </div>

      {/* Global empty state banner */}
      {blocks.length === 0 && (
        <div className="mb-6 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-3 border border-[#6C5CE7]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Espace personnel prêt</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1 leading-relaxed">
            Créez vos premiers blocs de temps ou personnalisez vos piliers selon votre équilibre multipotentiel.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 hover:bg-[#5b4bc4] transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer mon premier bloc</span>
            </button>
            {onOpenManagePillars && (
              <button
                onClick={onOpenManagePillars}
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-primary)] text-xs font-medium hover:border-[var(--border-highlight)] transition"
              >
                Gérer les piliers
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. BLOCS D'ACTIVITÉS RANGÉS PAR PILIERS PERSONNALISÉS */}
      <div className="space-y-6">
        {activeCategories.map((cat) => {
          const domainBlocks = categorizedBlocks[cat.id] || [];
          const Icon = getPillarIcon(cat.iconName);

          return (
            <section
              key={cat.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-colors"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)] mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                        {cat.name}
                      </h2>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold border font-mono"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}35`,
                          color: cat.color,
                        }}
                      >
                        {domainBlocks.length} bloc(s)
                      </span>
                    </div>
                    {cat.label && (
                      <p className="text-[11px] text-[var(--text-secondary)]">{cat.label}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onOpenAddModal}
                  className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors border border-transparent hover:border-[var(--border-card)]"
                  title={`Ajouter un bloc ${cat.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Blocks inside this category */}
              {domainBlocks.length === 0 ? (
                <div className="py-4 px-4 text-center rounded-2xl bg-[var(--bg-surface-elevated)]/60 border border-dashed border-[var(--border-card)] flex flex-col items-center justify-center">
                  <p className="text-xs text-[var(--text-secondary)] italic">
                    Aucune activité programmée pour ce jour.
                  </p>
                  <button
                    onClick={onOpenAddModal}
                    className="mt-2 text-[11px] font-semibold text-[#6C5CE7] hover:underline transition-colors"
                  >
                    + Planifier une session pour {cat.name}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {domainBlocks.map((block) => {
                    const blockSubtasks = getBlockSubtasks(block);
                    const total = blockSubtasks.length;
                    const done = blockSubtasks.filter((i) => i.completed).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    const isLiveNow =
                      isTodaySelected &&
                      currentMinutesFromMidnight >= block.startMinutes &&
                      currentMinutesFromMidnight <= block.startMinutes + block.durationMinutes;

                    return (
                      <div
                        key={block.id}
                        onClick={() => onSelectBlock(block.id)}
                        className={`cursor-pointer bg-[var(--bg-surface-elevated)] border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${
                          isLiveNow
                            ? 'border-[#FF7675] ring-2 ring-[#FF7675]/30'
                            : 'border-[var(--border-card)] hover:border-[var(--border-highlight)]'
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
                          <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#6C5CE7] transition-colors">
                            {block.title}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] shrink-0 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            {block.startTime} — {block.endTime} ({block.durationMinutes}m)
                          </span>
                        </div>

                        {block.globalObjective && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                            {block.globalObjective}
                          </p>
                        )}

                        {/* Checklist % indicator */}
                        <div className="mt-3 pt-2.5 border-t border-[var(--border-card)] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cat.color }} />
                            <span>
                              {done}/{total} étape{total > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                            <div className="w-full h-1.5 bg-[var(--border-card)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)]">
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
