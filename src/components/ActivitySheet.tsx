import React, { useState } from 'react';
import { TimeBlock, ChecklistItem } from '../types';
import { DOMAINS } from '../data/mockData';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivitySheetProps {
  block?: TimeBlock | null;
  onBack: () => void;
  onUpdateBlock: (updatedBlock: TimeBlock) => void;
  onOpenAddModal?: () => void;
}

export const ActivitySheet: React.FC<ActivitySheetProps> = ({
  block,
  onBack,
  onUpdateBlock,
  onOpenAddModal,
}) => {
  if (!block) {
    return (
      <div className="pb-28 max-w-3xl mx-auto px-4 pt-6 text-center">
        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-3xl p-8 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-4 border border-[#6C5CE7]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Aucune Fiche d'Activité sélectionnée</h2>
          <p className="text-xs text-[#A0A0AB] mt-2 max-w-md mx-auto leading-relaxed">
            Pour ouvrir une fiche détaillée avec checklist et notes d'immersion, sélectionnez un bloc dans l'Agenda ou créez-en un nouveau.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#121214] border border-[#2E2E38] text-xs font-semibold text-white hover:bg-[#25252D] transition"
            >
              Retour à l'Agenda
            </button>
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-semibold hover:bg-[#5F27CD] transition shadow-lg shadow-[#6C5CE7]/20"
              >
                + Créer un bloc de temps
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const domainConfig = DOMAINS[block.domain] || DOMAINS.tech;
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [asModalSheet, setAsModalSheet] = useState(false);

  // Compute checklist %
  const totalItems = block.checklist.length;
  const completedItems = block.checklist.filter((i) => i.isCompleted).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleToggleTask = (itemId: string) => {
    const updatedChecklist = block.checklist.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.isCompleted;
        if (nextState) {
          // Trigger light celebration confetti
          try {
            confetti({
              particleCount: 25,
              spread: 60,
              origin: { y: 0.7 },
              colors: [domainConfig.color, domainConfig.colorSecondary, '#ffffff'],
            });
          } catch (_) {}
        }
        return { ...item, isCompleted: nextState };
      }
      return item;
    });

    const updated = { ...block, checklist: updatedChecklist };
    onUpdateBlock(updated);
    showSavedBadge();
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      title: newTaskTitle.trim(),
      isCompleted: false,
    };

    const updated = { ...block, checklist: [...block.checklist, newItem] };
    onUpdateBlock(updated);
    setNewTaskTitle('');
    showSavedBadge();
  };

  const handleDeleteTask = (itemId: string) => {
    const updatedChecklist = block.checklist.filter((item) => item.id !== itemId);
    onUpdateBlock({ ...block, checklist: updatedChecklist });
    showSavedBadge();
  };

  const handleNotesChange = (text: string) => {
    onUpdateBlock({ ...block, notes: text });
    showSavedBadge();
  };

  const showSavedBadge = () => {
    setSaveStatus('Synchronisé avec Cloud Firestore');
    setTimeout(() => {
      setSaveStatus(null);
    }, 2200);
  };

  return (
    <div className="min-h-full pb-20 text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top App Bar with back navigation */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-[#121214]/85 border-b border-[#2E2E38] px-4 py-3.5 flex items-center justify-between">
        <button
          id="activity-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-sm font-semibold text-[#A0A0AB] hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Agenda</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-[#1E1E24] p-0.5 rounded-lg border border-[#2E2E38] text-xs">
            <button
              type="button"
              onClick={() => setAsModalSheet(false)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                !asModalSheet ? 'bg-[#2E2E38] text-white font-semibold' : 'text-[#71717A] hover:text-white'
              }`}
            >
              Page
            </button>
            <button
              type="button"
              onClick={() => setAsModalSheet(true)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                asModalSheet ? 'bg-[#2E2E38] text-white font-semibold' : 'text-[#71717A] hover:text-white'
              }`}
            >
              Modal Sheet
            </button>
          </div>

          {saveStatus ? (
            <span className="text-xs font-mono text-[#55E6C1] flex items-center gap-1.5 bg-[#55E6C1]/10 px-2.5 py-1 rounded-full border border-[#55E6C1]/30">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          ) : (
            <span className="text-xs font-mono text-[#71717A] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#55E6C1] inline-block" />
              Firestore Auto-Sync
            </span>
          )}
        </div>
      </div>

      <div className={`max-w-2xl mx-auto px-4 ${asModalSheet ? 'pt-4' : 'pt-6'} space-y-6`}>
        {/* Modal Handle if Modal Sheet presentation */}
        {asModalSheet && (
          <div className="flex justify-center -mt-1 mb-2">
            <div className="w-12 h-1.5 rounded-full bg-[#2E2E38]" />
          </div>
        )}

        {/* Domain pill & Time summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border"
            style={{
              backgroundColor: domainConfig.bgRgba,
              borderColor: domainConfig.borderRgba,
              color: domainConfig.color,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{domainConfig.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-[#A0A0AB]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#71717A]" />
              {block.startTime} — {block.endTime} ({block.durationMinutes} min)
            </span>
            {block.isRecurring && (
              <span className="inline-flex items-center gap-1 bg-[#1E1E24] px-2 py-0.5 rounded border border-[#2E2E38]">
                <Calendar className="w-3 h-3 text-[#71717A]" />
                Récurrent
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {block.title}
          </h1>
          <p className="mt-1 text-sm text-[#A0A0AB]">{domainConfig.label}</p>
        </div>

        {/* 1. OBJECTIF GLOBAL CARD (Background #1E1E24, Radius 20px) */}
        <div
          className="relative bg-[#1E1E24] border rounded-[20px] p-5 shadow-lg overflow-hidden"
          style={{ borderColor: domainConfig.borderRgba }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: domainConfig.color }}
          />

          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: domainConfig.bgRgba, color: domainConfig.color }}
            >
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: domainConfig.color }}>
              Objectif Global (Roadmap)
            </h3>
          </div>

          <p className="text-[#EDEDED] text-sm md:text-base leading-relaxed font-normal">
            {block.globalObjective}
          </p>
        </div>

        {/* 2. SOUS-CHECKLIST INTERACTIVE AVEC % */}
        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: domainConfig.color }} />
              <h2 className="text-base font-bold text-white">Sous-Checklist Interactive</h2>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-bold border font-mono"
              style={{
                backgroundColor: domainConfig.bgRgba,
                borderColor: domainConfig.borderRgba,
                color: domainConfig.color,
              }}
            >
              {completedItems}/{totalItems} ({progressPercent}%)
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-[#121214] rounded-full overflow-hidden border border-[#2E2E38]/80">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: domainConfig.color,
                  boxShadow: `0 0 10px ${domainConfig.color}`,
                }}
              />
            </div>
          </div>

          {/* Checklist Items list */}
          <div className="space-y-2 pt-2">
            {block.checklist.length === 0 ? (
              <p className="text-xs text-[#71717A] italic py-2">
                Aucune action dans cette feuille de route pour le moment.
              </p>
            ) : (
              block.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                    item.isCompleted
                      ? 'bg-[#121214]/60 border-[#2E2E38] opacity-70'
                      : 'bg-[#121214] border-[#2E2E38] hover:border-[#3E3E4C]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(item.id)}
                    className="flex items-start gap-3 text-left flex-1"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-[7px] border flex items-center justify-center transition-all ${
                          item.isCompleted
                            ? 'shadow-sm'
                            : 'border-[#71717A]/80 hover:border-[#A0A0AB] bg-transparent'
                        }`}
                        style={{
                          backgroundColor: item.isCompleted ? domainConfig.color : 'transparent',
                          borderColor: item.isCompleted ? domainConfig.color : undefined,
                        }}
                      >
                        {item.isCompleted && (
                          <Check className="w-3.5 h-3.5 text-[#121214] stroke-[3]" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm leading-snug transition-all ${
                        item.isCompleted
                          ? 'line-through text-[#71717A]'
                          : 'text-[#EDEDED] font-medium'
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-[#FF7675] rounded transition-opacity"
                    title="Supprimer la tâche"
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
              className="flex-1 bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#6C5CE7]"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                backgroundColor: domainConfig.color,
                color: '#121214',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </form>
        </div>

        {/* 3. ZONE DE NOTES (Auto-save) */}
        <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-[#A0A0AB]" />
              Zone de Notes &amp; Synthèse
            </h3>
            <span className="text-[11px] font-mono text-[#71717A]">
              Sauvegarde auto Firestore
            </span>
          </div>

          <textarea
            rows={5}
            value={block.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Prenez des notes de séance, consigner les réflexions, les métriques et liens utiles..."
            className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl p-3.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#6C5CE7] leading-relaxed font-sans"
          />
        </div>
      </div>
    </div>
  );
};
