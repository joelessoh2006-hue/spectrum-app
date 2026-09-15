import React, { useState, useEffect, useMemo } from 'react';
import { DomainId, TimeBlock, DomainConfig, Project } from '../types';
import { DOMAINS } from '../data/mockData';
import { MonthlyCalendarWidget } from './MonthlyCalendarWidget';
import { CategoriesExplorationGrid } from './CategoriesExplorationGrid';
import { MultipotentialBalanceRadar } from './MultipotentialBalanceRadar';
import { ImportCalendarModal } from './ImportCalendarModal';
import { WaitingMilestonesDrawer, MilestoneDragData } from './WaitingMilestonesDrawer';
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
  Check,
  FastForward,
  Rewind,
  GripVertical,
  UploadCloud,
  Lock,
  MapPin,
  Zap,
} from 'lucide-react';

interface AgendaTimelineProps {
  blocks: TimeBlock[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock?: (block: TimeBlock) => void;
  onAddBlock?: (newBlock: Omit<TimeBlock, 'id'>) => void;
  onShiftDayBlocks?: (minutes: number) => void;
  onOpenAddModal: (pillarId?: string) => void;
  onOpenProjects: () => void;
  onSeedTemplates?: () => void;
  onClearBlocks?: () => void;
  categories?: DomainConfig[];
  projects?: Project[];
  onOpenManagePillars?: () => void;
  onImportBlocks?: (blocks: TimeBlock[]) => void;
  onOpenInstantSessionModal?: () => void;
  onStartInstantSession?: (options?: {
    pillarId?: string;
    title?: string;
    durationMinutes?: number;
    openInZenFullscreen?: boolean;
  }) => void;
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
  onUpdateBlock,
  onAddBlock,
  onShiftDayBlocks,
  onOpenAddModal,
  onOpenProjects,
  onSeedTemplates,
  onClearBlocks,
  categories,
  projects = [],
  onOpenManagePillars,
  onImportBlocks,
  onOpenInstantSessionModal,
  onStartInstantSession,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverPillarId, setDragOverPillarId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [shiftFeedback, setShiftFeedback] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMilestonesDrawerOpen, setIsMilestonesDrawerOpen] = useState(false);
  const [draggedMilestone, setDraggedMilestone] = useState<MilestoneDragData | null>(null);
  const [dragOverHourSlot, setDragOverHourSlot] = useState<string | null>(null);
  const [timelineDisplayMode, setTimelineDisplayMode] = useState<'macro' | 'detailed'>(() => {
    try {
      return (localStorage.getItem('spectrum_timeline_mode') as 'macro' | 'detailed') || 'detailed';
    } catch {
      return 'detailed';
    }
  });

  const handleToggleDisplayMode = (mode: 'macro' | 'detailed') => {
    setTimelineDisplayMode(mode);
    try {
      localStorage.setItem('spectrum_timeline_mode', mode);
    } catch {
      // ignore
    }
    showNotification(
      mode === 'macro'
        ? 'Mode Piliers (Macro) activé : Créneaux sanctuarisés sans charge mentale'
        : 'Mode Détaillé (Micro) activé : Titres de tâches & objectifs affichés'
    );
  };

  const showNotification = (msg: string) => {
    setShiftFeedback(msg);
    setTimeout(() => {
      setShiftFeedback(null);
    }, 2400);
  };

  // Convert minutes from midnight to "HH:MM"
  const minutesToTimeString = (mins: number): string => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Shift an individual block by +/- delta minutes
  const handleShiftBlock = (block: TimeBlock, deltaMinutes: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    showNotification(`« ${block.title} » décalé de ${deltaMinutes > 0 ? `+${deltaMinutes}` : deltaMinutes} min (${updated.startTime})`);
  };

  // Shift entire day's blocks by delta minutes
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
  const activeCategories: DomainConfig[] = Array.isArray(categories)
    ? categories
    : [];

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
  const dayTotalUnits = blocksForDay.reduce((acc, b) => {
    const subtasks = getBlockSubtasks(b);
    return acc + (subtasks.length > 0 ? subtasks.length : 1);
  }, 0);

  const dayCompletedUnits = blocksForDay.reduce((acc, b) => {
    const subtasks = getBlockSubtasks(b);
    if (subtasks.length > 0) {
      return acc + subtasks.filter((i) => i.completed).length;
    }
    return acc + (b.completed ? 1 : 0);
  }, 0);

  const dayPercent = dayTotalUnits > 0 ? Math.round((dayCompletedUnits / dayTotalUnits) * 100) : 0;

  const HOURS_TIMELINE = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
  ];

  const waitingMilestonesCount = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    let count = 0;
    projects
      .filter((p) => !p.archived && p.status !== 'completed')
      .forEach((p) => {
        count += p.milestones.filter((m) => !m.completed).length;
      });
    return count;
  }, [projects]);

  const handleScheduleMilestoneFromDrawer = (
    data: MilestoneDragData,
    slotTime?: string,
    durationMinutes = 90
  ) => {
    if (!onAddBlock) return;

    let start = slotTime;
    if (!start) {
      if (blocksForDay.length === 0) {
        start = '09:00';
      } else {
        const sorted = [...blocksForDay].sort(
          (a, b) => a.startMinutes + a.durationMinutes - (b.startMinutes + b.durationMinutes)
        );
        const lastBlock = sorted[sorted.length - 1];
        const nextMins = Math.min(
          22 * 60,
          Math.ceil((lastBlock.startMinutes + lastBlock.durationMinutes) / 15) * 15 + 15
        );
        start = minutesToTimeString(nextMins);
      }
    }

    const [startH, startM] = start.split(':').map(Number);
    const startMins = (startH || 0) * 60 + (startM || 0);
    const endMins = Math.min(23 * 60 + 59, startMins + durationMinutes);
    const endTimeStr = minutesToTimeString(endMins);

    const newBlock: Omit<TimeBlock, 'id'> = {
      title: data.title,
      domain: data.domain,
      projectId: data.projectId,
      date: selectedDateString,
      startTime: start,
      endTime: endTimeStr,
      startMinutes: startMins,
      durationMinutes,
      isRecurring: false,
      recurringDays: [],
      globalObjective: `Accomplir le jalon : ${data.title} (${data.projectTitle})`,
      subtasks: [
        { id: `st-${Date.now()}-1`, text: 'Spécifier les requis et l’architecture', completed: false },
        { id: `st-${Date.now()}-2`, text: 'Coder et implémenter le composant', completed: false },
        { id: `st-${Date.now()}-3`, text: 'Tester et valider le rendu', completed: false },
      ],
      notes: `### 🎯 Jalon Bento : ${data.title}\n- Projet parent : **${data.projectTitle}**\n- Pilier : **${data.domain}**\n- Prévu le : **${selectedDateString}** de ${start} à ${endTimeStr}\n\n#### Étapes clés :\n- [ ] Analyse & préparation\n- [ ] Réalisation technique\n- [ ] Validation du jalon`,
    };

    onAddBlock(newBlock);
    showNotification(`Jalon « ${data.title} » planifié à ${start} (${durationMinutes} min) !`);
  };

  const handleDropOnHour = (hour: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverHourSlot(null);

    // 1. Drop d'un jalon Bento
    const milestoneRaw = e.dataTransfer.getData('application/spectrum-milestone');
    if (milestoneRaw) {
      try {
        const milestoneData: MilestoneDragData = JSON.parse(milestoneRaw);
        handleScheduleMilestoneFromDrawer(milestoneData, hour, 90);
        return;
      } catch (_) {}
    }

    // 2. Drop d'un bloc existant pour le repositionner à cette heure
    const droppedBlockId = e.dataTransfer.getData('text/plain') || draggedBlockId;
    if (droppedBlockId && onUpdateBlock) {
      const sourceBlock = blocks.find((b) => b.id === droppedBlockId);
      if (sourceBlock) {
        const [h, m] = hour.split(':').map(Number);
        const newStart = h * 60 + m;
        const newEnd = Math.min(23 * 60 + 59, newStart + sourceBlock.durationMinutes);
        onUpdateBlock({
          ...sourceBlock,
          date: selectedDateString,
          startMinutes: newStart,
          startTime: hour,
          endTime: minutesToTimeString(newEnd),
        });
        showNotification(`« ${sourceBlock.title} » déplacé à ${hour}`);
      }
      setDraggedBlockId(null);
    }
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 pt-4 text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* 1. WIDGET CALENDRIER MENSUEL EN HAUT */}
      <MonthlyCalendarWidget
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        blocks={blocks}
        categories={activeCategories}
      />

      {/* 2. LE RADAR D'ÉQUILIBRE MULTIPOTENTIEL (Analytics & Répartition du temps) */}
      <MultipotentialBalanceRadar
        blocks={blocks}
        categories={activeCategories}
        selectedDate={selectedDate}
      />

      {/* 3. EXPLORATION DES PILIERS (LUMA STYLE) */}
      {onOpenManagePillars && (
        <CategoriesExplorationGrid
          categories={activeCategories}
          blocks={blocksForDay}
          onOpenManagePillars={onOpenManagePillars}
          onQuickAddBlockForPillar={(catId) => onOpenAddModal(catId)}
          onSelectCategory={(catId) => onOpenAddModal(catId)}
        />
      )}

      {/* 4. EN-TÊTE DU JOUR SÉLECTIONNÉ */}
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
          {/* Quick day-wide shift controls: décaler toute la journée */}
          {blocksForDay.length > 0 && onUpdateBlock && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-1.5 flex items-center gap-1 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] px-2 hidden sm:inline">
                Décalage jour :
              </span>
              <button
                type="button"
                onClick={() => handleShiftAllBlocks(-30)}
                className="px-2 py-1 rounded-xl text-xs font-mono font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-0.5 cursor-pointer"
                title="Avancer tous les blocs de 30 minutes"
              >
                <Rewind className="w-3 h-3" />
                <span>-30m</span>
              </button>
              <button
                type="button"
                onClick={() => handleShiftAllBlocks(15)}
                className="px-2 py-1 rounded-xl text-xs font-mono font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[#6C5CE7]/20 hover:text-[#6C5CE7] text-[var(--text-secondary)] transition flex items-center gap-0.5 cursor-pointer"
                title="Décaler tous les blocs de +15 minutes"
              >
                <span>+15m</span>
              </button>
              <button
                type="button"
                onClick={() => handleShiftAllBlocks(30)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#6C5CE7]/15 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white transition flex items-center gap-1 cursor-pointer border border-[#6C5CE7]/30"
                title="Décaler tout le planning de +30 minutes (en cas d'imprévu)"
              >
                <FastForward className="w-3 h-3" />
                <span>+30m</span>
              </button>
            </div>
          )}

          {blocksForDay.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  Avancement du jour
                </div>
                <div className="text-sm font-extrabold font-mono text-[#6C5CE7]">
                  {dayCompletedUnits}/{dayTotalUnits} ({dayPercent}%)
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Sélecteur de Mode Timeline : Macro (Piliers Sanctuarisés) vs Détaillé (Micro-tâches) */}
          <div
            id="agenda-mode-switcher"
            className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-1 flex items-center gap-1 shadow-sm"
          >
            <button
              type="button"
              id="agenda-mode-macro-btn"
              onClick={() => handleToggleDisplayMode('macro')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                timelineDisplayMode === 'macro'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
              title="Mode Piliers (Macro) : Affiche des blocs sanctuarisés épurés (Tech, Art...) et révèle l'objectif précis au clic"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Piliers (Macro)</span>
            </button>
            <button
              type="button"
              id="agenda-mode-detailed-btn"
              onClick={() => handleToggleDisplayMode('detailed')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                timelineDisplayMode === 'detailed'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
              title="Mode Détaillé (Micro) : Affiche directement le titre de chaque tâche spécifique et sa progression"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Détaillé</span>
            </button>
          </div>

          <button
            type="button"
            id="agenda-import-calendar-btn"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-[var(--text-primary)] hover:border-[#6C5CE7] text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Importer des événements d'un calendrier Xiaomi, Google ou Apple (.ics)"
          >
            <UploadCloud className="w-4 h-4 text-[#6C5CE7]" />
            <span>Importer (.ics)</span>
          </button>

          {projects && projects.length > 0 && (
            <button
              type="button"
              id="agenda-open-milestones-drawer-btn"
              onClick={() => setIsMilestonesDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-card)] border border-[var(--border-card)] hover:border-[#6C5CE7] text-[var(--text-primary)] text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer relative"
              title="Ouvrir le tiroir des jalons Bento en attente à glisser-déposer sur la timeline"
            >
              <Layers className="w-4 h-4 text-[#6C5CE7]" />
              <span>Jalons Bento</span>
              {waitingMilestonesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#6C5CE7] text-white">
                  {waitingMilestonesCount}
                </span>
              )}
            </button>
          )}

          {/* Raccourci de Démarrage Rapide : Démarrer maintenant (Spontané) */}
          {onOpenInstantSessionModal && (
            <button
              type="button"
              id="agenda-instant-session-btn"
              onClick={onOpenInstantSessionModal}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xs md:text-sm font-extrabold shadow-md shadow-[#6C5CE7]/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title={`Démarrer une session spontanée à ${currentTimeString} sans planification préalable`}
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Démarrer maintenant</span>
            </button>
          )}

          <button
            type="button"
            id="agenda-add-block-btn"
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs md:text-sm font-bold shadow-md shadow-[#6C5CE7]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Bloc</span>
          </button>
        </div>
      </div>

      {/* BANNIÈRE DE DÉMARRAGE RAPIDE SPONTANÉ (Aujourd'hui) */}
      {isTodaySelected && (
        <div className="bg-gradient-to-r from-[#6C5CE7]/10 via-[#00CEC9]/10 to-[var(--bg-surface)] border border-[#6C5CE7]/25 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] p-[2px] shadow-sm shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px] flex items-center justify-center text-[#6C5CE7]">
                <Zap className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                  Session spontanée à {currentTimeString}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30">
                  En direct
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Envie de coder ou d'avancer tout de suite ? Créez un bloc débutant à la minute exacte.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onStartInstantSession?.({
                  pillarId: 'tech',
                  durationMinutes: 25,
                  title: `Code & Dev (${currentTimeString})`,
                  openInZenFullscreen: false,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[#6C5CE7] hover:text-white border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Créer et ouvrir immédiatement un bloc Tech / Dev de 25 min à la minute exacte"
            >
              <span>⚡ Tech (25 min)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartInstantSession?.({
                  pillarId: 'tech',
                  durationMinutes: 50,
                  title: `Deep Work Code (${currentTimeString})`,
                  openInZenFullscreen: false,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[#6C5CE7] hover:text-white border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] transition shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Créer et ouvrir immédiatement un bloc Deep Work de 50 min"
            >
              <span>🔥 Deep Work (50 min)</span>
            </button>

            <button
              type="button"
              onClick={onOpenInstantSessionModal}
              className="px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4bc4] transition shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Configurer la durée ou le pilier pour démarrer maintenant"
            >
              <span>Personnaliser…</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast for quick shifting */}
      {shiftFeedback && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D3436] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <FastForward className="w-4 h-4 text-[#55E6C1]" />
          <span>{shiftFeedback}</span>
        </div>
      )}

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
              type="button"
              onClick={() => onOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 hover:bg-[#5b4bc4] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
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

      {/* 3.5. RUBAN DES CRÉNEAUX HORAIRES & GLISSER-DÉPOSER DES JALONS */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Créneaux Horaires de la Journée</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-card)]">
                  Zone de dépôt active
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Glissez un jalon Bento directement sur une heure pour planifier 90 min en Deep Work
              </p>
            </div>
          </div>

          {waitingMilestonesCount > 0 && (
            <button
              type="button"
              id="open-drawer-from-strip-btn"
              onClick={() => setIsMilestonesDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7]/10 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/25 text-xs font-bold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Jalons en attente ({waitingMilestonesCount})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Grille horizontale des créneaux horaires */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-15 gap-2 pt-1 overflow-x-auto">
          {HOURS_TIMELINE.map((hour) => {
            const [h] = hour.split(':').map(Number);
            const slotMinutes = h * 60;
            const coveringBlock = blocksForDay.find(
              (b) =>
                slotMinutes >= b.startMinutes &&
                slotMinutes < b.startMinutes + b.durationMinutes
            );
            const isHovered = dragOverHourSlot === hour;

            if (coveringBlock) {
              const cat = activeCategories.find((c) => c.id === coveringBlock.domain);
              const catColor = cat?.color || '#6C5CE7';

              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => onSelectBlock(coveringBlock.id)}
                  className="p-2 rounded-xl border text-left transition flex flex-col justify-between h-20 shadow-2xs hover:shadow-xs group cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundColor: `${catColor}10`,
                    borderColor: `${catColor}40`,
                  }}
                  title={`Occupé : ${coveringBlock.title} (${coveringBlock.startTime} - ${coveringBlock.endTime})`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">
                      {hour}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-2 leading-tight group-hover:text-[var(--text-primary)]">
                    {coveringBlock.title}
                  </span>
                </button>
              );
            }

            return (
              <div
                key={hour}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverHourSlot !== hour) setDragOverHourSlot(hour);
                }}
                onDragLeave={() => {
                  if (dragOverHourSlot === hour) setDragOverHourSlot(null);
                }}
                onDrop={(e) => handleDropOnHour(hour, e)}
                onClick={() => {
                  if (waitingMilestonesCount > 0) {
                    setIsMilestonesDrawerOpen(true);
                  } else {
                    onOpenAddModal();
                  }
                }}
                className={`p-2 rounded-xl border border-dashed text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                  isHovered
                    ? 'border-[#6C5CE7] bg-[#6C5CE7]/20 ring-2 ring-[#6C5CE7] scale-102 shadow-md'
                    : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/60 hover:bg-[var(--bg-surface-elevated)] hover:border-[#6C5CE7]/50'
                }`}
                title={`Créneau libre à ${hour}. Glissez un jalon ou cliquez pour planifier.`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      isHovered ? 'text-[#A29BFE]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {hour}
                  </span>
                  <Plus
                    className={`w-3 h-3 ${
                      isHovered ? 'text-[#A29BFE]' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </div>

                <div className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {isHovered ? (
                    <span className="text-[#A29BFE] font-bold">Déposer ici</span>
                  ) : (
                    <span>Libre (90m)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BLOCS D'ACTIVITÉS RANGÉS PAR PILIERS PERSONNALISÉS */}
      <div className="space-y-6">
        {activeCategories.map((cat) => {
          const domainBlocks = categorizedBlocks[cat.id] || [];
          const Icon = getPillarIcon(cat.iconName);

          return (
            <section
              key={cat.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverPillarId !== cat.id) setDragOverPillarId(cat.id);
              }}
              onDragLeave={() => {
                if (dragOverPillarId === cat.id) setDragOverPillarId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverPillarId(null);
                setDragOverBlockId(null);

                // 1. Vérifier si c'est un Jalon Bento
                const milestoneRaw = e.dataTransfer.getData('application/spectrum-milestone');
                if (milestoneRaw) {
                  try {
                    const milestoneData: MilestoneDragData = JSON.parse(milestoneRaw);
                    handleScheduleMilestoneFromDrawer(
                      { ...milestoneData, domain: cat.id },
                      undefined,
                      90
                    );
                    setDraggedMilestone(null);
                    return;
                  } catch (_) {}
                }

                // 2. Sinon déplacer un bloc existant entre piliers
                const droppedBlockId = e.dataTransfer.getData('text/plain') || draggedBlockId;
                if (!droppedBlockId || !onUpdateBlock) return;
                const targetBlock = blocks.find((b) => b.id === droppedBlockId);
                if (targetBlock && targetBlock.domain !== cat.id) {
                  onUpdateBlock({
                    ...targetBlock,
                    domain: cat.id as DomainId,
                  });
                  showNotification(`Bloc transféré vers le pilier « ${cat.name} »`);
                }
                setDraggedBlockId(null);
              }}
              className={`bg-[var(--bg-surface)] border rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all ${
                dragOverPillarId === cat.id
                  ? 'border-[#6C5CE7] ring-2 ring-[#6C5CE7]/30 bg-[#6C5CE7]/5'
                  : 'border-[var(--border-card)]'
              }`}
            >
              {/* Feedback visuel lors du survol d'un jalon au-dessus d'un pilier */}
              {dragOverPillarId === cat.id && draggedMilestone && (
                <div className="mb-3 p-2.5 rounded-2xl bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 text-[#A29BFE] text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Déposer ici pour créer un bloc dans « {cat.name} » : {draggedMilestone.title}
                  </span>
                </div>
              )}
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
                  type="button"
                  onClick={() => onOpenAddModal(cat.id)}
                  className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors border border-transparent hover:border-[var(--border-card)] cursor-pointer"
                  title={`Ajouter un bloc ${cat.name}`}
                  aria-label={`Ajouter un bloc ${cat.name}`}
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
                    type="button"
                    onClick={() => onOpenAddModal(cat.id)}
                    className="mt-2 text-[11px] font-semibold text-[#6C5CE7] hover:underline transition-colors cursor-pointer"
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

                    const isBeingDragged = draggedBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedBlockId(block.id);
                          e.dataTransfer.setData('text/plain', block.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedBlockId(null);
                          setDragOverPillarId(null);
                          setDragOverBlockId(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedBlockId && draggedBlockId !== block.id) {
                            setDragOverBlockId(block.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverBlockId === block.id) {
                            setDragOverBlockId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sourceId = e.dataTransfer.getData('text/plain') || draggedBlockId;
                          setDragOverBlockId(null);
                          setDragOverPillarId(null);
                          setDraggedBlockId(null);

                          if (!sourceId || sourceId === block.id || !onUpdateBlock) return;
                          const sourceBlock = blocks.find((b) => b.id === sourceId);
                          if (!sourceBlock) return;

                          const targetStart = block.startMinutes;
                          const targetDomain = cat.id as DomainId;

                          onUpdateBlock({
                            ...sourceBlock,
                            domain: targetDomain,
                            startMinutes: targetStart,
                            startTime: block.startTime,
                            endTime: minutesToTimeString(targetStart + sourceBlock.durationMinutes),
                          });
                          showNotification(`« ${sourceBlock.title} » repositionné à ${block.startTime}`);
                        }}
                        onClick={() => onSelectBlock(block.id)}
                        className={`group cursor-pointer bg-[var(--bg-surface-elevated)] border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${
                          isBeingDragged
                            ? 'opacity-40 border-dashed border-[#6C5CE7]'
                            : dragOverBlockId === block.id
                            ? 'border-[#6C5CE7] ring-2 ring-[#6C5CE7]/30 scale-[1.01]'
                            : isLiveNow
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
                          <div className="flex items-center gap-2">
                            <span
                              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                              title="Glisser-déposer pour réordonner ou changer de pilier"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#6C5CE7] transition-colors flex items-center gap-2">
                                {timelineDisplayMode === 'macro' && !block.isFixedConstraint ? (
                                  <>
                                    <span
                                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    <span>{cat.name}</span>
                                  </>
                                ) : (
                                  <span>{block.title}</span>
                                )}
                              </h3>

                              {timelineDisplayMode === 'macro' && !block.isFixedConstraint && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1"
                                  style={{
                                    color: cat.color,
                                    backgroundColor: `${cat.color}15`,
                                    borderColor: `${cat.color}35`,
                                  }}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Créneau Sanctuarisé</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time summary + Quick shift buttons */}
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] flex items-center gap-1 mr-1">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {block.startTime} — {block.endTime} ({block.durationMinutes}m)
                            </span>

                            {/* Quick individual shift controls */}
                            {onUpdateBlock && (
                              <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleShiftBlock(block, -15, e)}
                                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition"
                                  title="Avancer de 15 minutes (-15m)"
                                >
                                  -15
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleShiftBlock(block, 15, e)}
                                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold text-[var(--text-secondary)] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 transition"
                                  title="Décaler de 15 minutes (+15m)"
                                >
                                  +15
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleShiftBlock(block, 30, e)}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#6C5CE7]/15 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white transition flex items-center gap-0.5"
                                  title="Décaler de 30 minutes (+30m)"
                                >
                                  <FastForward className="w-2.5 h-2.5" />
                                  <span>+30m</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mode Macro : Indication discrète et invitation au flow sans surcharge visuelle */}
                        {timelineDisplayMode === 'macro' && !block.isFixedConstraint ? (
                          <div className="mt-1 pl-6 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                            <span className="italic text-[var(--text-muted)] flex items-center gap-1.5">
                              <span>Objectif masqué (esprit libre) • Cliquez pour ouvrir la Fiche</span>
                            </span>
                            <span className="text-[11px] font-semibold text-[#6C5CE7] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                              <span>Fiche & Flow</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        ) : (
                          block.globalObjective && (
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed pl-6">
                              {block.globalObjective}
                            </p>
                          )
                        )}

                        {/* Checklist % indicator or Zen completion indicator or Fixed constraint */}
                        <div className="mt-3 pt-2.5 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2">
                          {block.isFixedConstraint ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-0.5 rounded-lg border border-[var(--border-card)]">
                                  <Lock className="w-3 h-3 text-[#E17055]" />
                                  <span>Contrainte Fixe ({block.sourceCalendar || 'Agenda externe'})</span>
                                </span>
                                {block.location && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                    <MapPin className="w-3 h-3 text-[#6C5CE7]" />
                                    <span className="truncate max-w-[160px]">{block.location}</span>
                                  </span>
                                )}
                              </div>

                              {onUpdateBlock && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateBlock({
                                      ...block,
                                      isFixedConstraint: false,
                                      globalObjective:
                                        block.globalObjective || `Session de travail : ${block.title}`,
                                      subtasks: [
                                        {
                                          id: `st-${Date.now()}`,
                                          text: 'Objectif de la session',
                                          completed: false,
                                        },
                                      ],
                                    });
                                    showNotification('Converti en Bloc d’Activité Spectrum actif !');
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-[#6C5CE7]/15 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Convertir en Bloc d'Activité Spectrum actif avec Fiche & Flow"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>Convertir en Bloc Actif</span>
                                </button>
                              )}
                            </>
                          ) : timelineDisplayMode === 'macro' ? (
                            <>
                              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  {total > 0 ? `${total} étape${total > 1 ? 's' : ''} planifiée${total > 1 ? 's' : ''}` : 'Mode Immersion pure'}
                                </span>
                                {done > 0 && (
                                  <span className="text-[10px] font-bold text-[#55E6C1] bg-[#55E6C1]/10 px-2 py-0.5 rounded-full border border-[#55E6C1]/30">
                                    {done}/{total} complétée{done > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                                <span>Lancer la session</span>
                                <ChevronRight className="w-3 h-3 text-[#6C5CE7]" />
                              </div>
                            </>
                          ) : total > 0 ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                <Sparkles className="w-3.5 h-3.5" style={{ color: cat.color }} />
                                <span className="font-medium text-[11px]">Mode Focus Immersion</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {block.completed ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#55E6C1] bg-[#55E6C1]/10 px-2 py-0.5 rounded-full border border-[#55E6C1]/30">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    Accompli
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--border-card)]">
                                    Prêt à lancer
                                  </span>
                                )}
                              </div>
                            </>
                          )}
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

      {/* Modal d'importation de calendrier Xiaomi / Google (.ics) */}
      <ImportCalendarModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={activeCategories}
        selectedDate={selectedDate}
        onImportBlocks={(newBlocks) => {
          if (onImportBlocks) {
            onImportBlocks(newBlocks);
          }
          showNotification(`${newBlocks.length} événement(s) importé(s) dans votre Agenda !`);
        }}
      />

      {/* Bouton Flottant d'accès rapide aux Jalons Bento */}
      {projects && projects.length > 0 && waitingMilestonesCount > 0 && !isMilestonesDrawerOpen && (
        <aside
          id="floating-milestones-drawer-trigger"
          aria-label="Raccourci des jalons Bento"
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30 flex items-center"
        >
          <button
            type="button"
            onClick={() => setIsMilestonesDrawerOpen(true)}
            className="px-3.5 py-2.5 rounded-full bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-xl shadow-[#6C5CE7]/30 border border-white/20 text-xs md:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ouvrir les Jalons Bento en attente"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Jalons Bento</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono font-extrabold bg-white text-[#6C5CE7]">
              {waitingMilestonesCount}
            </span>
          </button>
        </aside>
      )}

      {/* 5. TIROIR LATÉRAL DES JALONS BENTO EN ATTENTE */}
      <WaitingMilestonesDrawer
        isOpen={isMilestonesDrawerOpen}
        onClose={() => setIsMilestonesDrawerOpen(false)}
        projects={projects}
        blocks={blocks}
        categories={activeCategories}
        selectedDate={selectedDate}
        onScheduleMilestone={handleScheduleMilestoneFromDrawer}
        onOpenProjects={onOpenProjects}
        onDragStartMilestone={(data) => setDraggedMilestone(data)}
        onDragEndMilestone={() => setDraggedMilestone(null)}
      />
    </div>
  );
};
