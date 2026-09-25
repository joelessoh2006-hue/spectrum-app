import React, { useState } from 'react';
import { MonthlyGoal, DomainConfig, Project } from '../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ListPlus,
  Check,
  Zap,
  Tag,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MonthlyGoalsCardProps {
  currentMonthKey: string; // "YYYY-MM"
  monthName: string; // ex: "Septembre 2026"
  goals: MonthlyGoal[];
  onAddGoal: (goal: {
    title: string;
    monthKey: string;
    domainId?: string;
    projectId?: string;
    notes?: string;
  }) => void;
  onAddBatchGoals?: (
    goalItems: {
      title: string;
      monthKey: string;
      domainId?: string;
      projectId?: string;
    }[]
  ) => void;
  onToggleGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onScheduleGoalInDay?: (goal: MonthlyGoal) => void;
  onSendGoalToFloatingTasks?: (goal: MonthlyGoal) => void;
  categories?: DomainConfig[];
  projects?: Project[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export const MonthlyGoalsCard: React.FC<MonthlyGoalsCardProps> = ({
  currentMonthKey,
  monthName,
  goals,
  onAddGoal,
  onAddBatchGoals,
  onToggleGoal,
  onDeleteGoal,
  onScheduleGoalInDay,
  onSendGoalToFloatingTasks,
  categories = [],
  projects = [],
  onPrevMonth,
  onNextMonth,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [batchText, setBatchText] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Filtrer les objectifs pour le mois affiché
  const monthlyGoals = goals.filter((g) => g.monthKey === currentMonthKey);
  const completedCount = monthlyGoals.filter((g) => g.completed).length;
  const totalCount = monthlyGoals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (goalId: string, currentlyCompleted: boolean) => {
    onToggleGoal(goalId);
    if (!currentlyCompleted && completedCount + 1 === totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6C5CE7', '#00CEC9', '#55E6C1', '#FDCB6E'],
        });
      } catch (_) {}
    }
  };

  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    onAddGoal({
      title: newGoalTitle.trim(),
      monthKey: currentMonthKey,
      domainId: selectedPillarId || undefined,
      projectId: selectedProjectId || undefined,
    });

    setNewGoalTitle('');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    const lines = batchText
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    if (onAddBatchGoals) {
      onAddBatchGoals(
        lines.map((title) => ({
          title,
          monthKey: currentMonthKey,
          domainId: selectedPillarId || undefined,
          projectId: selectedProjectId || undefined,
        }))
      );
    } else {
      lines.forEach((title) => {
        onAddGoal({
          title,
          monthKey: currentMonthKey,
          domainId: selectedPillarId || undefined,
          projectId: selectedProjectId || undefined,
        });
      });
    }

    setBatchText('');
    setIsBatchMode(false);
  };

  return (
    <section
      aria-label="Objectifs et priorités stratégiques du mois"
      className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] shadow-sm shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Objectifs & Priorités du Mois
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30">
                {monthName}
              </span>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)]">
                  {completedCount}/{totalCount} ({progressPercent}%)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Le cap stratégique pour guider ton agenda hebdomadaire et tes projets.
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2">
          {onPrevMonth && onNextMonth && (
            <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl p-0.5">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                title="Mois précédent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                title="Mois suivant"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              isBatchMode
                ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Saisir ou coller plusieurs objectifs d'un seul coup"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajout en lot</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            aria-label={isExpanded ? 'Réduire' : 'Déplier'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-[var(--bg-surface-elevated)] rounded-full h-2 overflow-hidden border border-[var(--border-card)]">
          <div
            className="h-full bg-gradient-to-r from-[#6C5CE7] via-[#00CEC9] to-[#55E6C1] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Mode Formulaire en Lot (Bulk paste) */}
          {isBatchMode ? (
            <form onSubmit={handleCreateBatch} className="space-y-2.5 p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[#6C5CE7]/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#6C5CE7] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Coller plusieurs objectifs du mois (1 par ligne)
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Ex: Tirets, numéros ou texte libre nettoyés automatiquement
                </span>
              </div>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={`- Valider mon examen final UVCI\n- Finaliser le site de Marième\n- Créer mon portfolio Vibe Coding\n- 15 sessions Deep Work en Dev`}
                rows={4}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] resize-y font-mono"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Pilier optionnel */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-[var(--text-secondary)]">Pilier :</span>
                    <select
                      value={selectedPillarId}
                      onChange={(e) => setSelectedPillarId(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-primary)]"
                    >
                      <option value="">Tous les piliers</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className="px-3 py-1.5 text-xs rounded-xl text-[var(--text-secondary)] hover:bg-[var(--border-card)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!batchText.trim()}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#6C5CE7] text-white hover:brightness-110 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    Ajouter les objectifs
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Mode Formulaire Simple */
            <form onSubmit={handleCreateSingle} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder={`Définir un objectif pour ${monthName}…`}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
                />
              </div>

              {/* Pilier & Projet select */}
              <div className="flex items-center gap-1.5">
                {categories.length > 0 && (
                  <select
                    value={selectedPillarId}
                    onChange={(e) => setSelectedPillarId(e.target.value)}
                    className="px-2 py-2 text-xs rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] focus:outline-none focus:text-[var(--text-primary)]"
                    title="Associer à un pilier"
                  >
                    <option value="">Pilier (Optionnel)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {projects.length > 0 && (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="hidden sm:block px-2 py-2 text-xs rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] focus:outline-none focus:text-[var(--text-primary)] max-w-[130px] truncate"
                    title="Associer à un projet Bento"
                  >
                    <option value="">Projet (Optionnel)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="submit"
                  disabled={!newGoalTitle.trim()}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#6C5CE7] hover:brightness-110 text-white flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shrink-0 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </form>
          )}

          {/* Liste des objectifs */}
          {monthlyGoals.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-2xl bg-[var(--bg-surface-elevated)]/50 border border-dashed border-[var(--border-card)] space-y-2">
              <div className="w-9 h-9 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] mx-auto flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Aucun objectif défini pour {monthName}.
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Poser 3 à 5 priorités mensuelles donne une direction claire à ton agenda sans t'enfermer dans un carcan rigide.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyGoals.map((goal) => {
                const pillar = categories.find((c) => c.id === goal.domain);
                const project = projects.find((p) => p.id === goal.projectId);

                return (
                  <div
                    key={goal.id}
                    className={`group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                      goal.completed
                        ? 'bg-[var(--bg-surface-elevated)]/40 border-[var(--border-card)] opacity-75'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[#6C5CE7]/40 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggle(goal.id, goal.completed)}
                        className={`w-6 h-6 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                          goal.completed
                            ? 'bg-[#55E6C1] text-black shadow-sm'
                            : 'border-2 border-[var(--border-card)] hover:border-[#6C5CE7] text-transparent hover:text-[var(--text-muted)]'
                        }`}
                        title={goal.completed ? 'Marquer comme non terminé' : 'Marquer comme atteint !'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            goal.completed
                              ? 'line-through text-[var(--text-muted)]'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {goal.title}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {pillar && (
                            <span
                              className="px-1.5 py-0.2 rounded-md text-[10px] font-medium border flex items-center gap-1"
                              style={{
                                backgroundColor: `${pillar.color}15`,
                                borderColor: `${pillar.color}40`,
                                color: pillar.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: pillar.color }}
                              />
                              <span className="truncate max-w-[90px]">{pillar.name}</span>
                            </span>
                          )}

                          {project && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-[#00CEC9]/10 text-[#00CEC9] border border-[#00CEC9]/30 flex items-center gap-1 truncate max-w-[120px]">
                              <Briefcase className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{project.title}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions sur l'objectif */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      {onScheduleGoalInDay && !goal.completed && (
                        <button
                          type="button"
                          onClick={() => onScheduleGoalInDay(goal)}
                          className="px-2 py-1 rounded-xl text-[10px] font-bold bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30 transition cursor-pointer flex items-center gap-1"
                          title="Planifier une session pour cet objectif dans l'agenda d'aujourd'hui"
                        >
                          <Zap className="w-3 h-3 text-[#6C5CE7]" />
                          <span className="hidden md:inline">Planifier</span>
                        </button>
                      )}

                      {onSendGoalToFloatingTasks && !goal.completed && (
                        <button
                          type="button"
                          onClick={() => onSendGoalToFloatingTasks(goal)}
                          className="px-2 py-1 rounded-xl text-[10px] font-bold bg-[#00CEC9]/10 hover:bg-[#00CEC9]/20 text-[#00CEC9] border border-[#00CEC9]/30 transition cursor-pointer flex items-center gap-1"
                          title="Ajouter au sas de délestage des tâches de demain"
                        >
                          <ArrowRight className="w-3 h-3 text-[#00CEC9]" />
                          <span className="hidden md:inline">Sas Demain</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                        title="Supprimer cet objectif"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
