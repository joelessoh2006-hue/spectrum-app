import React, { useState } from 'react';
import { TimeBlock, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
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
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivitySheetProps {
  block?: TimeBlock | null;
  onBack: () => void;
  onUpdateBlock: (updatedBlock: TimeBlock) => void;
  onOpenAddModal?: (pillarId?: string) => void;
  onOpenEditModal?: (block: TimeBlock) => void;
  categories?: DomainConfig[];
}

export const ActivitySheet: React.FC<ActivitySheetProps> = ({
  block,
  onBack,
  onUpdateBlock,
  onOpenAddModal,
  onOpenEditModal,
  categories,
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

  const showSavedBadge = () => {
    setSaveStatus('Enregistré');
    setTimeout(() => {
      setSaveStatus(null);
    }, 2000);
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

    onUpdateBlock({
      ...block,
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
        </div>
      </div>

      {/* Domain badge & Time summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {block.startTime} — {block.endTime} ({block.durationMinutes} min)
          </span>
          {block.isRecurring && (
            <span className="inline-flex items-center gap-1 bg-[var(--bg-surface)] px-2.5 py-0.5 rounded-xl border border-[var(--border-card)]">
              <Calendar className="w-3 h-3 text-[#6C5CE7]" />
              Récurrent
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {block.title}
        </h1>
        {domainConfig.label && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{domainConfig.label}</p>
        )}
      </div>

      {/* 1. OBJECTIF GLOBAL CARD */}
      {block.globalObjective && (
        <div
          className="relative bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden"
        >
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
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: domainConfig.color }}>
              Objectif Global (Roadmap)
            </h3>
          </div>

          <p className="text-[var(--text-primary)] text-sm md:text-base leading-relaxed font-normal">
            {block.globalObjective}
          </p>
        </div>
      )}

      {/* 2. SOUS-CHECKLIST INTERACTIVE AVEC % */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" style={{ color: domainConfig.color }} />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Étapes du Projet / Checklist
            </h2>
          </div>
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
              Aucune étape dans cette feuille de route pour le moment.
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

      {/* 3. ZONE DE NOTES (Auto-save) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Save className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Zone de Notes & Synthèse</span>
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Sauvegarde auto Firestore
          </span>
        </div>

        <textarea
          rows={5}
          value={block.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Prenez des notes de séance, consigner les réflexions, les métriques et liens utiles..."
          className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] leading-relaxed font-sans"
        />
      </div>
    </div>
  );
};
