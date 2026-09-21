import React, { useState, useEffect, useRef } from 'react';
import { TimeBlock, DomainConfig, Project } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import { PomodoroFlowTimer } from './PomodoroFlowTimer';
import { MarkdownNotesEditor } from './MarkdownNotesEditor';
import { FullscreenImmersionView } from './FullscreenImmersionView';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Flag,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Lock,
  Save,
  Check,
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Flame,
  ListChecks,
  Bell,
  BellOff,
  Layers,
  Target,
  Link2,
  Unlink,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivitySheetProps {
  block?: TimeBlock | null;
  onBack: () => void;
  onUpdateBlock: (updatedBlock: TimeBlock) => void;
  onDeleteBlock?: (blockId: string) => void;
  onOpenAddModal?: (pillarId?: string) => void;
  onOpenEditModal?: (block: TimeBlock) => void;
  categories?: DomainConfig[];
  projects?: Project[];
  onToggleMilestone?: (projectId: string, milestoneId: string) => void;
  onAddProjectMilestone?: (projectId: string, title: string) => void;
  initialOpenImmersion?: boolean;
}

export const ActivitySheet: React.FC<ActivitySheetProps> = ({
  block,
  onBack,
  onUpdateBlock,
  onDeleteBlock,
  onOpenAddModal,
  onOpenEditModal,
  categories,
  projects = [],
  onToggleMilestone,
  onAddProjectMilestone,
  initialOpenImmersion = false,
}) => {
  if (!block) {
    return (
      <div className="pb-28 max-w-3xl mx-auto px-4 pt-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-4 border border-[#6C5CE7]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Aucune Fiche d'Activité sélectionnée</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
            Pour ouvrir une fiche détaillée avec checklist et notes d'immersion, sélectionnez un bloc dans l'Agenda ou créez-en un nouveau.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition active:scale-95"
            >
              Retour à l'Agenda
            </button>
            {onOpenAddModal && (
              <button
                type="button"
                onClick={() => onOpenAddModal?.(block?.domain)}
                className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-semibold hover:bg-[#5b4bc4] transition shadow-md shadow-[#6C5CE7]/20 active:scale-95 cursor-pointer"
              >
                + Créer un bloc de temps
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dynamic domain config
  const activeCategory = categories?.find((c) => c.id === block.domain);
  const domainConfig = activeCategory
    ? {
        name: activeCategory.name,
        color: activeCategory.color,
        label: activeCategory.label || 'Sphère cognitive',
        iconName: activeCategory.iconName,
      }
    : (DOMAINS as Record<string, any>)[block.domain] || {
        name: block.domain,
        color: '#6C5CE7',
        label: 'Sphère cognitive',
        iconName: 'Terminal',
      };

  const Icon = getPillarIcon(domainConfig.iconName);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const titleLower = (block.title || '').toLowerCase();
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

  // Subtasks & checklist items
  const currentSubtasks: { id: string; text: string; completed: boolean }[] =
    block.subtasks && block.subtasks.length > 0
      ? block.subtasks
      : (block.checklist || []).map((c) => ({
          id: c.id,
          text: c.title,
          completed: c.isCompleted,
        }));

  const totalItems = currentSubtasks.length;
  const completedItems = currentSubtasks.filter((i) => i.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Zen Mode state (auto-detected when no subtasks, with user toggle to add subtasks if desired)
  const isZenMode = totalItems === 0;
  const [showAddSubtasksInZen, setShowAddSubtasksInZen] = useState(false);
  const [isImmersionOpen, setIsImmersionOpen] = useState(!!initialOpenImmersion);
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false);

  const handleToggleReminder = () => {
    const next = block.reminderEnabled !== false ? false : true;
    onUpdateBlock({
      ...block,
      reminderEnabled: next,
    });
    showSavedBadge();
  };

  const handleChangeReminderMinutes = (minutes: number) => {
    onUpdateBlock({
      ...block,
      reminderEnabled: true,
      reminderMinutesBefore: minutes,
    });
    setIsReminderMenuOpen(false);
    showSavedBadge();
  };

  useEffect(() => {
    if (initialOpenImmersion) {
      setIsImmersionOpen(true);
    }
  }, [initialOpenImmersion]);

  // Keyboard shortcut: Press 'F' to toggle Immersion Zen Mode (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if ((e.key === 'f' || e.key === 'F') && !isInputActive && !isImmersionOpen) {
        e.preventDefault();
        setIsImmersionOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersionOpen]);

  const showSavedBadge = () => {
    setSaveStatus('Enregistré');
    setTimeout(() => {
      setSaveStatus(null);
    }, 2000);
  };

  // Complete block directly (for Zen mode single task)
  const handleToggleBlockCompletion = () => {
    const nextCompleted = !block.completed;
    if (nextCompleted) {
      try {
        confetti({
          particleCount: 60,
          spread: 90,
          origin: { y: 0.55 },
          colors: [domainConfig.color, '#6C5CE7', '#55E6C1', '#ffffff'],
        });
      } catch (_) {}
    }
    onUpdateBlock({
      ...block,
      completed: nextCompleted,
    });
    showSavedBadge();
  };

  const handleToggleTask = (itemId: string) => {
    const updatedSubtasks = currentSubtasks.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        if (nextState) {
          try {
            confetti({
              particleCount: 25,
              spread: 60,
              origin: { y: 0.7 },
              colors: [domainConfig.color, '#6C5CE7', '#ffffff'],
            });
          } catch (_) {}
        }
        return { ...item, completed: nextState };
      }
      return item;
    });

    const updatedChecklist = updatedSubtasks.map((s) => ({
      id: s.id,
      title: s.text,
      isCompleted: s.completed,
    }));

    // Auto-mark block completed if all subtasks are finished
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);

    onUpdateBlock({
      ...block,
      completed: allDone,
      subtasks: updatedSubtasks,
      checklist: updatedChecklist,
    });
    showSavedBadge();
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem = {
      id: `st-${Date.now()}`,
      text: newTaskTitle.trim(),
      completed: false,
    };

    const updatedSubtasks = [...currentSubtasks, newItem];
    const updatedChecklist = updatedSubtasks.map((s) => ({
      id: s.id,
      title: s.text,
      isCompleted: s.completed,
    }));

    onUpdateBlock({
      ...block,
      subtasks: updatedSubtasks,
      checklist: updatedChecklist,
    });
    setNewTaskTitle('');
    showSavedBadge();
  };

  const handleDeleteTask = (itemId: string) => {
    const updatedSubtasks = currentSubtasks.filter((item) => item.id !== itemId);
    const updatedChecklist = updatedSubtasks.map((s) => ({
      id: s.id,
      title: s.text,
      isCompleted: s.completed,
    }));

    onUpdateBlock({
      ...block,
      subtasks: updatedSubtasks,
      checklist: updatedChecklist,
    });
    showSavedBadge();
  };

  const handleNotesChange = (text: string) => {
    onUpdateBlock({
      ...block,
      notes: text,
    });
    showSavedBadge();
  };

  // Grand Projet lié & Jalons / Sous-tâches
  const linkedProject = projects.find((p) => p.id === block.projectId);
  const [newProjectMilestoneTitle, setNewProjectMilestoneTitle] = useState('');
  const [isChangingProject, setIsChangingProject] = useState(false);

  const handleToggleProjectMilestone = (projectId: string, milestoneId: string) => {
    if (onToggleMilestone) {
      onToggleMilestone(projectId, milestoneId);
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.6 },
          colors: [domainConfig.color, '#6C5CE7', '#55E6C1', '#ffffff'],
        });
      } catch (_) {}
    }
  };

  const handleSetTargetMilestone = (milestoneId: string) => {
    const isTarget = block.milestoneId === milestoneId;
    onUpdateBlock({
      ...block,
      milestoneId: isTarget ? undefined : milestoneId,
    });
    showSavedBadge();
  };

  const handleImportMilestoneToSession = (milestoneTitle: string) => {
    const alreadyExists = currentSubtasks.some(
      (st) => st.text.toLowerCase().trim() === milestoneTitle.toLowerCase().trim()
    );
    if (alreadyExists) return;

    const newItem = {
      id: `st-${Date.now()}`,
      text: milestoneTitle,
      completed: false,
    };
    const updatedSubtasks = [...currentSubtasks, newItem];
    const updatedChecklist = updatedSubtasks.map((s) => ({
      id: s.id,
      title: s.text,
      isCompleted: s.completed,
    }));
    onUpdateBlock({
      ...block,
      subtasks: updatedSubtasks,
      checklist: updatedChecklist,
    });
    showSavedBadge();
  };

  const handleAddMilestoneToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectMilestoneTitle.trim() || !linkedProject || !onAddProjectMilestone) return;
    onAddProjectMilestone(linkedProject.id, newProjectMilestoneTitle.trim());
    setNewProjectMilestoneTitle('');
    showSavedBadge();
  };

  const renderProjectMilestonesCard = () => {
    if (linkedProject) {
      const completedMilestones = linkedProject.milestones?.filter((m) => m.completed).length || 0;
      const totalMilestones = linkedProject.milestones?.length || 0;

      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden animate-fadeIn">
          {/* Accent glow on top right */}
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-10"
            style={{ backgroundColor: domainConfig.color }}
          />

          {/* En-tête du Grand Projet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-[var(--border-card)]"
                style={{
                  backgroundColor: `${domainConfig.color}20`,
                  color: domainConfig.color,
                }}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Grand Projet Associé
                  </span>
                  {block.milestoneId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[10px] font-bold text-[#6C5CE7]">
                      <Target className="w-2.5 h-2.5" /> Jalon ciblé
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                  {linkedProject.title}
                </h3>
              </div>
            </div>

            {/* Progression & Actions de rattachement */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold border font-mono flex items-center gap-1.5"
                style={{
                  backgroundColor: `${domainConfig.color}15`,
                  borderColor: `${domainConfig.color}35`,
                  color: domainConfig.color,
                }}
              >
                <span>
                  {completedMilestones}/{totalMilestones} jalons
                </span>
                <span className="text-[10px] opacity-75">({linkedProject.progress}%)</span>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingProject(!isChangingProject)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-medium transition cursor-pointer"
                title="Modifier ou détacher le projet associé"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sélecteur si l'utilisateur veut changer ou détacher le projet */}
          {isChangingProject && (
            <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>Rattacher cette session à un autre projet :</span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateBlock({ ...block, projectId: undefined, milestoneId: undefined });
                    setIsChangingProject(false);
                    showSavedBadge();
                  }}
                  className="text-[#FF7675] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Unlink className="w-3 h-3" /> Détacher du projet
                </button>
              </div>
              <select
                value={block.projectId || ''}
                onChange={(e) => {
                  const newPId = e.target.value;
                  onUpdateBlock({
                    ...block,
                    projectId: newPId || undefined,
                    milestoneId: undefined,
                  });
                  setIsChangingProject(false);
                  showSavedBadge();
                }}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
              >
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.progress}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Barre de progression du projet Bento */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden border border-[var(--border-card)]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${linkedProject.progress}%`,
                  backgroundColor: domainConfig.color,
                }}
              />
            </div>
          </div>

          {/* Liste des sous-tâches / jalons du projet avec cases à cocher en direct */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: domainConfig.color }} />
                <span>Sous-tâches du projet (cochez en direct pendant la session) :</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Synchronisé avec le Dashboard Bento
              </span>
            </div>

            {(!linkedProject.milestones || linkedProject.milestones.length === 0) ? (
              <p className="text-xs text-[var(--text-secondary)] italic py-3 text-center bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-card)]">
                Aucun jalon défini dans ce projet. Ajoutez votre première sous-tâche ci-dessous !
              </p>
            ) : (
              <div className="space-y-2">
                {linkedProject.milestones.map((milestone) => {
                  const isTarget = block.milestoneId === milestone.id;
                  return (
                    <div
                      key={milestone.id}
                      className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                        isTarget
                          ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-xs'
                          : milestone.completed
                          ? 'bg-[var(--bg-surface-elevated)]/60 border-[var(--border-card)] opacity-75'
                          : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[var(--border-highlight)]'
                      }`}
                    >
                      {/* Checkbox interactive pour cocher directement */}
                      <button
                        type="button"
                        onClick={() => handleToggleProjectMilestone(linkedProject.id, milestone.id)}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer min-w-0"
                        title="Cocher / décocher cette sous-tâche du projet"
                      >
                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              milestone.completed
                                ? 'shadow-sm text-white'
                                : 'border-[var(--border-card)] hover:border-[var(--text-secondary)] bg-transparent'
                            }`}
                            style={{
                              backgroundColor: milestone.completed ? domainConfig.color : 'transparent',
                              borderColor: milestone.completed ? domainConfig.color : undefined,
                            }}
                          >
                            {milestone.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span
                            className={`text-sm leading-snug transition-all truncate ${
                              milestone.completed
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)] font-semibold'
                            }`}
                          >
                            {milestone.title}
                          </span>

                          {isTarget && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6C5CE7] text-white text-[10px] font-bold tracking-wide shadow-xs shrink-0">
                              <Target className="w-2.5 h-2.5" /> Jalon visé
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Actions rapides */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Définir / retirer comme cible du bloc */}
                        <button
                          type="button"
                          onClick={() => handleSetTargetMilestone(milestone.id)}
                          className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                            isTarget
                              ? 'bg-[#6C5CE7] text-white shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface)]'
                          }`}
                          title={
                            isTarget
                              ? 'Retirer comme cible prioritaire de cette session'
                              : 'Définir comme jalon cible pour cette session'
                          }
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>

                        {/* Importer dans les micro-étapes de la session */}
                        <button
                          type="button"
                          onClick={() => handleImportMilestoneToSession(milestone.title)}
                          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] text-xs transition cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Importer comme micro-étape pour cette session"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulaire pour ajouter une sous-tâche au projet */}
          {onAddProjectMilestone && (
            <form onSubmit={handleAddMilestoneToProject} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder={`Ajouter une sous-tâche à ${linkedProject.title}...`}
                value={newProjectMilestoneTitle}
                onChange={(e) => setNewProjectMilestoneTitle(e.target.value)}
                className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
              />
              <button
                type="submit"
                disabled={!newProjectMilestoneTitle.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 text-white shadow-xs cursor-pointer"
                style={{
                  backgroundColor: domainConfig.color,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            </form>
          )}
        </div>
      );
    }

    if (projects && projects.length > 0) {
      return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-card)] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Rattacher à un Grand Projet Bento
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Liez ce bloc à un projet pour afficher et cocher ses sous-tâches en direct.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateBlock({ ...block, projectId: e.target.value });
                  showSavedBadge();
                }
              }}
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7] cursor-pointer"
            >
              <option value="">Associer un projet...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.progress}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pb-32 max-w-3xl mx-auto px-4 pt-4 text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* Top action navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'Agenda</span>
        </button>

        <div className="flex items-center gap-2">
          {/* BOUTON PLEIN ÉCRAN / ZEN */}
          <button
            type="button"
            id="activity-open-zen-btn"
            onClick={() => setIsImmersionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/25 hover:shadow-lg hover:brightness-105 active:scale-95 transition cursor-pointer"
            title="Ouvrir le Mode Immersion Plein Écran (Touche F ou Échap pour quitter)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Plein Écran / Zen</span>
          </button>

          {saveStatus ? (
            <span className="text-xs font-mono text-[#6C5CE7] flex items-center gap-1.5 bg-[#6C5CE7]/10 px-2.5 py-1 rounded-full border border-[#6C5CE7]/30">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          ) : (
            <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#55E6C1] inline-block" />
              Firestore Auto-Sync
            </span>
          )}

          {onOpenEditModal && (
            <button
              type="button"
              onClick={() => onOpenEditModal(block)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#6C5CE7] transition"
            >
              Modifier le bloc
            </button>
          )}

          {onDeleteBlock && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Supprimer définitivement l'activité "${block.title}" ?`)) {
                  onDeleteBlock(block.id);
                  onBack();
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Supprimer cette activité"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain badge & Time summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {block.isFixedConstraint ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/35">
            {isBirthday ? <Sparkles className="w-3.5 h-3.5 text-pink-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isBirthday ? '🎂 Anniversaire / Repère' : '🔒 Contrainte Fixe'}</span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border"
            style={{
              backgroundColor: `${domainConfig.color}15`,
              borderColor: `${domainConfig.color}35`,
              color: domainConfig.color,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{domainConfig.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-[var(--text-secondary)] flex-wrap">
          {isAllDay ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500 dark:text-pink-400 font-bold">
              <span>{isBirthday ? '🎂 Toute la journée (Anniversaire)' : '📅 Toute la journée'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              {block.startTime} — {block.endTime} ({block.durationMinutes} min)
            </span>
          )}
          {block.isRecurring && (
            <span className="inline-flex items-center gap-1 bg-[var(--bg-surface)] px-2.5 py-0.5 rounded-xl border border-[var(--border-card)]">
              <Calendar className="w-3 h-3 text-[#6C5CE7]" />
              Récurrent
            </span>
          )}

          {/* Badge & Contrôle Rapide du Rappel */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReminderMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                block.reminderEnabled !== false
                  ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30 text-[#6C5CE7] hover:bg-[#6C5CE7]/20'
                  : 'bg-[var(--bg-surface)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Configurer le rappel pour cette activité"
            >
              {block.reminderEnabled !== false ? (
                <>
                  <Bell className="w-3 h-3 text-[#6C5CE7]" />
                  <span>
                    Rappel : {block.reminderMinutesBefore === 0 ? "À l'heure pile" : `${block.reminderMinutesBefore ?? 5}m avant`}
                  </span>
                </>
              ) : (
                <>
                  <BellOff className="w-3 h-3" />
                  <span>Rappel désactivé</span>
                </>
              )}
            </button>

            {isReminderMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] shadow-xl p-2.5 z-30 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-card)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <span>Délai du rappel</span>
                  <button
                    type="button"
                    onClick={handleToggleReminder}
                    className="text-[#FF7675] hover:underline"
                  >
                    {block.reminderEnabled !== false ? 'Désactiver' : 'Activer'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {[
                    { min: 0, label: "À l'heure pile (0 min)" },
                    { min: 5, label: '5 minutes avant' },
                    { min: 10, label: '10 minutes avant' },
                    { min: 15, label: '15 minutes avant' },
                    { min: 30, label: '30 minutes avant' },
                  ].map(({ min, label }) => {
                    const isSelected =
                      block.reminderEnabled !== false && (block.reminderMinutesBefore ?? 5) === min;
                    return (
                      <button
                        key={min}
                        type="button"
                        onClick={() => handleChangeReminderMinutes(min)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#6C5CE7] text-white'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TITLE & METADATA */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {block.title}
          </h1>
          {domainConfig.label && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{domainConfig.label}</p>
          )}
        </div>

        {/* Indicator & Bouton Immersion Rapide */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsImmersionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[#6C5CE7] text-[var(--text-primary)] hover:text-white border border-[var(--border-card)] hover:border-[#6C5CE7] text-xs font-bold transition-all shadow-xs cursor-pointer group"
            title="Activer le Mode Immersion Plein Écran (Touche F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#6C5CE7] group-hover:text-white transition-colors" />
            <span>Mode Immersion Plein Écran</span>
            <span className="hidden md:inline px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono opacity-70">
              F
            </span>
          </button>

          {isZenMode && !showAddSubtasksInZen && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#55E6C1]/10 text-[#55E6C1] border border-[#55E6C1]/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tâche Unique</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BRANCHEMENT AUTOMATIQUE :
          A. MODE ZEN / TÂCHE UNIQUE (Si aucune sous-tâche et l'utilisateur n'a pas forcé le mode checklist)
          ========================================================================= */}
      {isZenMode && !showAddSubtasksInZen ? (
        <div className="space-y-6 animate-fadeIn">
          {/* CARTE OBJECTIF IMMERSIF EN GRAND */}
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden text-center sm:text-left">
            {/* Lueur d'ambiance aux couleurs du pilier */}
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all"
              style={{ backgroundColor: domainConfig.color }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
                  style={{
                    backgroundColor: `${domainConfig.color}20`,
                    color: domainConfig.color,
                  }}
                >
                  <Flag className="w-4 h-4" />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: domainConfig.color }}
                >
                  Objectif de la Session
                </span>
              </div>

              <div className="flex items-center gap-2">
                {block.completed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#55E6C1]/15 text-[#55E6C1] text-xs font-bold border border-[#55E6C1]/30">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Session Terminée
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    Session unique sans sous-découpage
                  </span>
                )}
              </div>
            </div>

            {/* Objectif affiché en grand */}
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] leading-snug tracking-tight">
              {block.globalObjective || block.title}
            </h2>

            {block.globalObjective && block.globalObjective !== block.title && (
              <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">
                Focus exclusif : consacrez ce bloc à l'atteinte intégrale de cet objectif.
              </p>
            )}
          </div>

          {/* MINUTEUR POMODORO & AMBIANCES DEEP WORK */}
          <PomodoroFlowTimer
            initialDurationMinutes={block.durationMinutes || 25}
            pillarColor={domainConfig.color}
            pillarName={domainConfig.name}
            blockTitle={block.title}
            onTimerComplete={handleToggleBlockCompletion}
            onOpenFullscreenZen={() => setIsImmersionOpen(true)}
          />

          {/* GROS BOUTON DE VALIDATION UNIQUE */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <button
              type="button"
              onClick={handleToggleBlockCompletion}
              className={`w-full max-w-md py-4 px-6 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                block.completed
                  ? 'bg-[#55E6C1]/20 text-[#55E6C1] border-2 border-[#55E6C1] hover:bg-[#55E6C1]/30'
                  : 'text-white hover:brightness-105 shadow-lg'
              }`}
              style={
                block.completed
                  ? {}
                  : {
                      backgroundColor: domainConfig.color,
                      boxShadow: `0 10px 30px -5px ${domainConfig.color}50`,
                    }
              }
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  block.completed ? 'bg-[#55E6C1] text-black' : 'bg-white/20 text-white'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span>
                {block.completed ? 'Objectif Accompli ! (Cliquer pour rouvrir)' : 'Valider la Session & l’Objectif'}
              </span>
            </button>

            <p className="text-xs text-[var(--text-secondary)] mt-3">
              En validant, le bloc passe en vert dans votre Agenda et compte dans vos statistiques du jour.
            </p>

            {/* Lien discret pour ajouter un découpage si nécessaire */}
            <div className="mt-4 pt-3 border-t border-[var(--border-card)] w-full text-center">
              <button
                type="button"
                onClick={() => setShowAddSubtasksInZen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[#6C5CE7] transition font-medium"
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Besoin d'étapes ? Découper ce bloc en checklist</span>
              </button>
            </div>
          </div>

          {/* Sous-tâches du Grand Projet Associé (Accessible aussi en mode Zen) */}
          {renderProjectMilestonesCard()}
        </div>
      ) : (
        /* =========================================================================
            B. VUE CLASSIQUE : AVEC SOUS-CHECKLIST ET %
            ========================================================================= */
        <div className="space-y-6">
          {/* 1. OBJECTIF GLOBAL CARD */}
          {block.globalObjective && (
            <div className="relative bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-10"
                style={{ backgroundColor: domainConfig.color }}
              />

              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${domainConfig.color}20`,
                    color: domainConfig.color,
                  }}
                >
                  <Flag className="w-4 h-4" />
                </div>
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: domainConfig.color }}
                >
                  Objectif Global (Roadmap)
                </h3>
              </div>

              <p className="text-[var(--text-primary)] text-sm md:text-base leading-relaxed font-normal">
                {block.globalObjective}
              </p>
            </div>
          )}

          {/* MINUTEUR POMODORO & SONS D'AMBIANCE DEEP WORK */}
          <PomodoroFlowTimer
            initialDurationMinutes={block.durationMinutes || 25}
            pillarColor={domainConfig.color}
            pillarName={domainConfig.name}
            blockTitle={block.title}
            onOpenFullscreenZen={() => setIsImmersionOpen(true)}
          />

          {/* SECTION SOUS-TÂCHES DU GRAND PROJET ASSOCIÉ */}
          {renderProjectMilestonesCard()}

          {/* 2. SOUS-CHECKLIST INTERACTIVE DE LA SESSION */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: domainConfig.color }} />
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Micro-étapes de la Session
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Checklist d'exécution pour ce bloc ({block.durationMinutes || 25} min)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalItems === 0 && showAddSubtasksInZen && (
                  <button
                    type="button"
                    onClick={() => setShowAddSubtasksInZen(false)}
                    className="text-xs text-[var(--text-muted)] hover:text-[#6C5CE7] transition"
                  >
                    Retour Mode Zen
                  </button>
                )}
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold border font-mono"
                  style={{
                    backgroundColor: `${domainConfig.color}15`,
                    borderColor: `${domainConfig.color}35`,
                    color: domainConfig.color,
                  }}
                >
                  {completedItems}/{totalItems} ({progressPercent}%)
                </div>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden border border-[var(--border-card)]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: domainConfig.color,
                  }}
                />
              </div>
            </div>

            {/* Checklist Items list */}
            <div className="space-y-2 pt-1">
              {currentSubtasks.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] italic py-2">
                  Aucune étape dans cette feuille de route. Ajoutez-en une ci-dessous ou basculez en Mode Zen.
                </p>
              ) : (
                currentSubtasks.map((item) => (
                  <div
                    key={item.id}
                    className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-[var(--bg-surface-elevated)]/60 border-[var(--border-card)] opacity-70'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[var(--border-highlight)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(item.id)}
                      className="flex items-start gap-3 text-left flex-1"
                    >
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            item.completed
                              ? 'shadow-sm'
                              : 'border-[var(--border-card)] hover:border-[var(--text-secondary)] bg-transparent'
                          }`}
                          style={{
                            backgroundColor: item.completed ? domainConfig.color : 'transparent',
                            borderColor: item.completed ? domainConfig.color : undefined,
                          }}
                        >
                          {item.completed && (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm leading-snug transition-all ${
                          item.completed
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[#FF7675] rounded-lg transition-opacity"
                      title="Supprimer cette étape"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Item form */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Ajouter une action concrète..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 text-white shadow-sm"
                style={{
                  backgroundColor: domainConfig.color,
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ZONE DE NOTES ENRICHIE MARKDOWN (Auto-save Firestore) */}
      <MarkdownNotesEditor
        value={block.notes || ''}
        onChange={handleNotesChange}
        accentColor={domainConfig.color}
        title="Zone de Notes, Terminal & Synthèse"
        placeholder="Consignez vos commandes de terminal (nmap, bash), liens web, réflexions et listes à puces en Markdown..."
      />

      {/* 4. MODE IMMERSION PLEIN ÉCRAN / ZEN (Tamise tout le reste de l'écran) */}
      {isImmersionOpen && (
        <FullscreenImmersionView
          block={block}
          domainConfig={domainConfig}
          subtasks={currentSubtasks}
          onToggleTask={handleToggleTask}
          onAddTask={(text) => {
            const newItem = {
              id: `st-${Date.now()}`,
              text: text.trim(),
              completed: false,
            };
            const updatedSubtasks = [...currentSubtasks, newItem];
            const updatedChecklist = updatedSubtasks.map((s) => ({
              id: s.id,
              title: s.text,
              isCompleted: s.completed,
            }));
            onUpdateBlock({
              ...block,
              subtasks: updatedSubtasks,
              checklist: updatedChecklist,
            });
            showSavedBadge();
          }}
          onDeleteTask={handleDeleteTask}
          notes={block.notes || ''}
          onNotesChange={handleNotesChange}
          onClose={() => setIsImmersionOpen(false)}
          onToggleBlockCompletion={handleToggleBlockCompletion}
          linkedProject={linkedProject}
          onToggleMilestone={handleToggleProjectMilestone}
        />
      )}
    </div>
  );
};
