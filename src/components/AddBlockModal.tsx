import React, { useState, useMemo, useEffect } from 'react';
import { DomainId, TimeBlock, Project, Subtask, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import {
  X,
  Plus,
  Clock,
  Flag,
  Calendar,
  Repeat,
  Trash2,
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
  Layers,
} from 'lucide-react';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock?: (block: Omit<TimeBlock, 'id'>) => void;
  onAddBlocks?: (blocks: Omit<TimeBlock, 'id'>[]) => void;
  initialBlock?: TimeBlock | null;
  initialPillarId?: string | null;
  onUpdateBlock?: (block: TimeBlock) => void;
  defaultDate?: Date;
  projects?: Project[];
  categories?: DomainConfig[];
}

// 7 jours de la semaine (1 = Lundi, 7 = Dimanche)
const WEEKDAYS = [
  { day: 1, short: 'L', full: 'Lundi' },
  { day: 2, short: 'M', full: 'Mardi' },
  { day: 3, short: 'M', full: 'Mercredi' },
  { day: 4, short: 'J', full: 'Jeudi' },
  { day: 5, short: 'V', full: 'Vendredi' },
  { day: 6, short: 'S', full: 'Samedi' },
  { day: 7, short: 'D', full: 'Dimanche' },
];

type RecurrenceHorizon = '2_weeks' | '1_month' | '3_months' | 'custom_date';

// Formatage sécurisé de date AAAA-MM-JJ
const getFormattedDateString = (d?: Date | string): string => {
  try {
    const dateObj = d instanceof Date ? d : d ? new Date(d) : new Date();
    if (isNaN(dateObj.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
};

export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  onAddBlock,
  onAddBlocks,
  initialBlock,
  initialPillarId,
  onUpdateBlock,
  defaultDate,
  projects = [],
  categories,
}) => {
  const activeCategories: DomainConfig[] = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) return categories;
    return Object.values(DOMAINS).map((d) => ({
      id: d.id,
      name: d.name,
      label: d.label,
      color: d.color,
      colorSecondary: d.colorSecondary,
      bgRgba: d.bgRgba,
      borderRgba: d.borderRgba,
      iconName: d.id === 'tech' ? 'Terminal' : d.id === 'art' ? 'Flame' : 'Compass',
    }));
  }, [categories]);

  // Form State
  const [title, setTitle] = useState(initialBlock?.title || '');
  const [domain, setDomain] = useState<string>(() => {
    return initialPillarId || initialBlock?.domain || activeCategories[0]?.id || 'tech';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialBlock?.projectId || '');
  const [startTime, setStartTime] = useState(initialBlock?.startTime || '14:00');
  const [endTime, setEndTime] = useState(initialBlock?.endTime || '15:30');
  const [globalObjective, setGlobalObjective] = useState(initialBlock?.globalObjective || '');

  // Scheduling State
  const [isSpecificDate, setIsSpecificDate] = useState<boolean>(() => {
    if (initialBlock) {
      return !initialBlock.isRecurring;
    }
    return true;
  });

  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    if (initialBlock?.date) return initialBlock.date;
    return getFormattedDateString(defaultDate);
  });

  // Recurring days (Par défaut: Lundi à Vendredi [1, 2, 3, 4, 5])
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (initialBlock?.recurringDays && initialBlock.recurringDays.length > 0) {
      return initialBlock.recurringDays;
    }
    return [1, 2, 3, 4, 5];
  });

  // Recurrence Horizon
  const [recurrenceHorizon, setRecurrenceHorizon] = useState<RecurrenceHorizon>('2_weeks');
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return getFormattedDateString(d);
  });

  // Dynamic Subtasks / Checklist
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    if (initialBlock?.subtasks && initialBlock.subtasks.length > 0) {
      return initialBlock.subtasks.map((s) => ({
        id: s.id || `st-${Math.random()}`,
        text: s.text || '',
        completed: Boolean(s.completed),
      }));
    }
    if (initialBlock?.checklist && initialBlock.checklist.length > 0) {
      return initialBlock.checklist.map((c) => ({
        id: c.id || `st-${Math.random()}`,
        text: c.title || '',
        completed: Boolean(c.isCompleted),
      }));
    }
    return [
      { id: `st-1`, text: 'Spécification et cadrage de la session', completed: false },
      { id: `st-2`, text: 'Réalisation du livrable ou flow créatif', completed: false },
    ];
  });
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Synchronisation dynamique à chaque ouverture de la modale ou changement de pilier ciblé
  useEffect(() => {
    if (!isOpen) return;

    if (initialBlock) {
      setTitle(initialBlock.title || '');
      setDomain(initialBlock.domain || initialPillarId || activeCategories[0]?.id || 'tech');
      setSelectedProjectId(initialBlock.projectId || '');
      setStartTime(initialBlock.startTime || '14:00');
      setEndTime(initialBlock.endTime || '15:30');
      setGlobalObjective(initialBlock.globalObjective || '');
      setIsSpecificDate(!initialBlock.isRecurring);
      setScheduledDate(initialBlock.date || getFormattedDateString(defaultDate));
      setSelectedDays(
        initialBlock.recurringDays && initialBlock.recurringDays.length > 0
          ? initialBlock.recurringDays
          : [1, 2, 3, 4, 5]
      );
      if (initialBlock.subtasks && initialBlock.subtasks.length > 0) {
        setSubtasks(
          initialBlock.subtasks.map((s) => ({
            id: s.id || `st-${Math.random()}`,
            text: s.text || '',
            completed: Boolean(s.completed),
          }))
        );
      } else if (initialBlock.checklist && initialBlock.checklist.length > 0) {
        setSubtasks(
          initialBlock.checklist.map((c) => ({
            id: c.id || `st-${Math.random()}`,
            text: c.title || '',
            completed: Boolean(c.isCompleted),
          }))
        );
      } else {
        setSubtasks([
          { id: `st-1`, text: 'Spécification et cadrage de la session', completed: false },
          { id: `st-2`, text: 'Réalisation du livrable ou flow créatif', completed: false },
        ]);
      }
    } else {
      // Mode création d'un nouveau bloc
      setTitle('');
      // Résolution sécurisée du pilier
      const targetPillar =
        initialPillarId && activeCategories.some((c) => c.id === initialPillarId)
          ? initialPillarId
          : initialPillarId || activeCategories[0]?.id || 'tech';
      setDomain(targetPillar);
      setSelectedProjectId('');
      setStartTime('14:00');
      setEndTime('15:30');
      setGlobalObjective('');
      setIsSpecificDate(true);
      setScheduledDate(getFormattedDateString(defaultDate));
      setSelectedDays([1, 2, 3, 4, 5]);
      setSubtasks([
        { id: `st-1`, text: 'Spécification et cadrage de la session', completed: false },
        { id: `st-2`, text: 'Réalisation du livrable ou flow créatif', completed: false },
      ]);
      setNewSubtaskText('');
    }
  }, [isOpen, initialBlock, initialPillarId, defaultDate, activeCategories]);

  if (!isOpen) return null;

  // Calcul du nombre de jours / sessions à générer selon l'horizon choisi
  const calculatedDates = useMemo(() => {
    if (isSpecificDate) return [scheduledDate];
    if (selectedDays.length === 0) return [];

    const dates: string[] = [];
    const start = new Date(scheduledDate || new Date());
    let end = new Date(start);

    if (recurrenceHorizon === '2_weeks') {
      end.setDate(end.getDate() + 14);
    } else if (recurrenceHorizon === '1_month') {
      end.setMonth(end.getMonth() + 1);
    } else if (recurrenceHorizon === '3_months') {
      end.setMonth(end.getMonth() + 3);
    } else if (recurrenceHorizon === 'custom_date') {
      end = new Date(customEndDate);
    }

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [isSpecificDate, scheduledDate, selectedDays, recurrenceHorizon, customEndDate]);

  // Subtask Handlers
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSt: Subtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSt]);
    setNewSubtaskText('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleDay = (dayNum: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  const calculateMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startMinutes = calculateMinutes(startTime);
    const endMinutes = calculateMinutes(endTime);
    const durationMinutes = Math.max(15, endMinutes - startMinutes);

    const finalSubtasks = subtasks.length > 0
      ? subtasks
      : [{ id: `st-${Date.now()}`, text: 'Étape initiale', completed: false }];

    const finalChecklist = finalSubtasks.map((st) => ({
      id: st.id,
      title: st.text,
      isCompleted: st.completed,
    }));

    // Mode Édition
    if (initialBlock && onUpdateBlock) {
      const updatedBlock: TimeBlock = {
        ...initialBlock,
        title: title.trim(),
        domain,
        projectId: selectedProjectId || undefined,
        date: isSpecificDate ? scheduledDate : initialBlock.date,
        startTime,
        endTime,
        startMinutes,
        durationMinutes,
        isRecurring: !isSpecificDate,
        recurringDays: !isSpecificDate ? selectedDays : [],
        globalObjective: globalObjective.trim() || 'Objectif de session défini.',
        subtasks: finalSubtasks,
        checklist: finalChecklist,
      };

      onUpdateBlock(updatedBlock);
      onClose();
      return;
    }

    // Mode Création
    if (isSpecificDate) {
      const singleBlock: Omit<TimeBlock, 'id'> = {
        title: title.trim(),
        domain,
        projectId: selectedProjectId || undefined,
        date: scheduledDate,
        startTime,
        endTime,
        startMinutes,
        durationMinutes,
        isRecurring: false,
        recurringDays: [],
        globalObjective: globalObjective.trim() || 'Objectif de session défini.',
        notes: '',
        subtasks: finalSubtasks,
        checklist: finalChecklist,
      };

      if (onAddBlocks) {
        onAddBlocks([singleBlock]);
      } else if (onAddBlock) {
        onAddBlock(singleBlock);
      }
    } else {
      const datesToGenerate = calculatedDates.length > 0 ? calculatedDates : [scheduledDate];

      const generatedBlocks: Omit<TimeBlock, 'id'>[] = datesToGenerate.map((dateStr, idx) => ({
        title: title.trim(),
        domain,
        projectId: selectedProjectId || undefined,
        date: dateStr,
        startTime,
        endTime,
        startMinutes,
        durationMinutes,
        isRecurring: true,
        recurringDays: selectedDays,
        globalObjective: globalObjective.trim() || 'Objectif de session défini.',
        notes: '',
        subtasks: finalSubtasks.map((st, sIdx) => ({
          id: `st-${Date.now()}-${idx}-${sIdx}`,
          text: st.text,
          completed: false,
        })),
        checklist: finalSubtasks.map((st, sIdx) => ({
          id: `st-${Date.now()}-${idx}-${sIdx}`,
          title: st.text,
          isCompleted: false,
        })),
      }));

      if (onAddBlocks) {
        onAddBlocks(generatedBlocks);
      } else if (onAddBlock) {
        generatedBlocks.forEach((b) => onAddBlock(b));
      }
    }

    onClose();
  };

  const selectedCategory =
    activeCategories.find((c) => c?.id === domain) ||
    activeCategories[0] || {
      id: 'tech',
      name: 'Tech & Architecture',
      color: '#6C5CE7',
      iconName: 'Terminal',
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-xl my-8 text-[var(--text-primary)] shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-card)] bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ backgroundColor: selectedCategory?.color || '#6C5CE7' }}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {initialBlock ? 'Modifier le Bloc de Temps' : 'Nouveau Bloc de Temps'}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Planification temporelle & checklist dynamique
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Pilier Multipotentiel Dynamique */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Pilier Multipotentiel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeCategories.map((cat, index) => {
                const isSelected = domain === cat.id;
                const Icon = getPillarIcon(cat.iconName);
                return (
                  <button
                    key={cat.id || index}
                    type="button"
                    onClick={() => setDomain(cat.id)}
                    className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'border-[var(--border-card)] text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] hover:border-[var(--border-highlight)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? (cat.color || '#6C5CE7') : undefined,
                      borderColor: isSelected ? (cat.color || '#6C5CE7') : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.name || 'Pilier'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Titre & Projet Lié */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Titre du Bloc *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Architecture Firestore, Beatmaking trap, Lecture deep work..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
              />
            </div>

            {projects.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Rattacher à un Grand Projet (Optionnel)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                >
                  <option value="">Aucun projet lié (Session autonome)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.progress}%)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Mode de Programmation : Jour Unique vs Récurrence */}
          <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-2xl border border-[var(--border-card)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#6C5CE7]" />
                Type de programmation
              </label>
              <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={() => setIsSpecificDate(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    isSpecificDate
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Date Unique
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpecificDate(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    !isSpecificDate
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Récurrent
                </button>
              </div>
            </div>

            {isSpecificDate ? (
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date du bloc :
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1.5 font-medium">
                    Jours de la semaine actifs :
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map(({ day, short, full }) => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`h-11 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            isChecked
                              ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-sm'
                              : 'bg-[var(--bg-surface)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                          title={full}
                        >
                          <span>{short}</span>
                          <span className="text-[9px] font-normal opacity-80 leading-none">
                            {full.substring(0, 3)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horizon temporel de récurrence */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
                  <label className="block text-[11px] text-[var(--text-secondary)] font-medium">
                    Horizon de récurrence :
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: '2_weeks', label: '2 semaines' },
                      { id: '1_month', label: '1 mois' },
                      { id: '3_months', label: '3 mois' },
                      { id: 'custom_date', label: 'Date précise' },
                    ].map((opt) => {
                      const isSelected = recurrenceHorizon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRecurrenceHorizon(opt.id as RecurrenceHorizon)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                            isSelected
                              ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white'
                              : 'bg-[var(--bg-surface)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {recurrenceHorizon === 'custom_date' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] space-y-1">
                      <span className="text-[10px] text-[var(--text-secondary)]">Jusqu'au (date de fin) :</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>
                  )}

                  {/* Résumé de génération */}
                  <div className="mt-2 px-3 py-2 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-between text-xs text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
                      <span>
                        <strong>{calculatedDates.length} session(s)</strong> générées
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {selectedDays.length} j/semaine
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Créneau Horaire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* 5. Objectif Global */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> Objectif Global de la session
            </label>
            <textarea
              rows={2}
              placeholder="Résultat concret attendu à la fin de ce créneau..."
              value={globalObjective}
              onChange={(e) => setGlobalObjective(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* 6. ÉTAPES DU PROJET / CHECKLIST (Sous-tâches dynamiques) */}
          <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-2xl border border-[var(--border-card)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#6C5CE7]" />
                <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Étapes du Projet / Checklist
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-secondary)] px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)]">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length} achevée(s)
              </span>
            </div>

            {/* Saisie interactive avec bouton + Ajouter & validation Entrée */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ajouter une étape (ex: Spécification, Maquette, Export)..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskText.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6C5CE7] text-white hover:bg-[#5b4bc4] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* Affichage de la liste des étapes avec bouton supprimer */}
            <div className="space-y-1.5 pt-1">
              {subtasks.length === 0 ? (
                <p className="text-[11px] text-[var(--text-secondary)] italic py-2 text-center">
                  Aucune étape ajoutée pour l'instant. Utilisez le champ ci-dessus pour découper votre session.
                </p>
              ) : (
                subtasks.map((st, index) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition group"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(st.id)}
                        className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                        title={st.completed ? 'Marquer comme non fait' : 'Marquer comme fait'}
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#6C5CE7]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]" />
                        )}
                      </button>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                        #{index + 1}
                      </span>
                      <span
                        className={`text-xs truncate ${
                          st.completed
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        {st.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#FF7675] hover:bg-[#FF7675]/10 transition opacity-80 group-hover:opacity-100 shrink-0"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-md shadow-[#6C5CE7]/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>
                {initialBlock
                  ? 'Enregistrer les modifications'
                  : isSpecificDate
                  ? 'Créer le bloc de temps'
                  : `Générer les ${calculatedDates.length} blocs récurrents`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
