import React, { useState } from 'react';
import { FloatingTask, DomainConfig } from '../types';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FloatingTasksCardProps {
  selectedDate: Date;
  tasks: FloatingTask[];
  onAddTask: (text: string, targetDateStr: string, domainId?: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onPlanTaskInAgenda?: (task: FloatingTask) => void;
  categories?: DomainConfig[];
}

export const FloatingTasksCard: React.FC<FloatingTasksCardProps> = ({
  selectedDate,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onPlanTaskInAgenda,
  categories = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [viewDateMode, setViewDateMode] = useState<'selected' | 'tomorrow' | 'all'>('selected');

  // Dates formatting
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const activeDateStr = viewDateMode === 'tomorrow' ? tomorrowDateStr : selectedDateStr;

  // Filtrage des tâches selon l'onglet
  const displayedTasks = tasks.filter((t) => {
    if (viewDateMode === 'all') return true;
    if (viewDateMode === 'tomorrow') return t.targetDate === tomorrowDateStr;
    return t.targetDate === selectedDateStr;
  });

  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const totalCount = displayedTasks.length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim(), activeDateStr, selectedPillarId || undefined);
    setNewTaskText('');
  };

  return (
    <section
      aria-label="Sas de délestage des tâches flottantes"
      className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-all"
    >
      {/* Header avec compteur et bouton replier */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00CEC9]/15 border border-[#00CEC9]/30 flex items-center justify-center text-[#00CEC9] shadow-sm shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Sas du Lendemain & Tâches Flottantes
              </h3>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00CEC9]/15 text-[#00CEC9] border border-[#00CEC9]/30">
                  {completedCount}/{totalCount} terminées
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Note tes actions sans horaire fixe pour décharger ton esprit la veille ou au réveil.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
          aria-label={isExpanded ? 'Replier le sas' : 'Déplier le sas'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Onglets de bascule rapide : Ce Jour / Lendemain / Toutes */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-card)] max-w-fit">
            <button
              type="button"
              onClick={() => setViewDateMode('selected')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewDateMode === 'selected'
                  ? 'bg-[#00CEC9] text-black shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Jour sélectionné
            </button>
            <button
              type="button"
              onClick={() => setViewDateMode('tomorrow')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewDateMode === 'tomorrow'
                  ? 'bg-[#00CEC9] text-black shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Pour demain</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => setViewDateMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewDateMode === 'all'
                  ? 'bg-[#00CEC9] text-black shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Toutes ({tasks.length})
            </button>
          </div>

          {/* Formulaire d'ajout rapide ultra-fluide */}
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={
                  viewDateMode === 'tomorrow'
                    ? "Ex: Relire la doc SQL, payer la facture, appeler Marc... (pour demain)"
                    : "Ex: Tâche à faire aujourd'hui sans heure imposée..."
                }
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#00CEC9] transition"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedPillarId}
                onChange={(e) => setSelectedPillarId(e.target.value)}
                className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs text-[var(--text-secondary)] rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-[#00CEC9] cursor-pointer hidden sm:block"
                title="Pilier optionnel"
              >
                <option value="">Sans pilier</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#00CEC9] hover:bg-[#00b5b0] disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </form>

          {/* Liste des tâches flottantes */}
          <div className="space-y-1.5 pt-1">
            {displayedTasks.length === 0 ? (
              <div className="py-5 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-card)] rounded-xl">
                <span>Aucune tâche flottante en attente. Déverse ici tes pensées dès que la flemme de planifier se fait sentir.</span>
              </div>
            ) : (
              displayedTasks.map((task) => {
                const pillar = categories.find((c) => c.id === task.domain);
                const pillarColor = pillar?.color || '#00CEC9';

                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                      task.completed
                        ? 'bg-[var(--bg-surface-elevated)]/40 border-[var(--border-card)] opacity-60'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[#00CEC9]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="text-[var(--text-muted)] hover:text-[#00CEC9] transition cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00CEC9]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs block truncate ${
                            task.completed
                              ? 'line-through text-[var(--text-muted)]'
                              : 'text-[var(--text-primary)] font-medium'
                          }`}
                        >
                          {task.text}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                          {task.targetDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{task.targetDate}</span>
                            </span>
                          )}
                          {pillar && (
                            <span
                              className="px-1.5 py-0.2 rounded-full font-bold"
                              style={{
                                backgroundColor: `${pillarColor}15`,
                                color: pillarColor,
                              }}
                            >
                              {pillar.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onPlanTaskInAgenda && !task.completed && (
                        <button
                          type="button"
                          onClick={() => onPlanTaskInAgenda(task)}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[#6C5CE7]/15 hover:text-[#6C5CE7] border border-[var(--border-card)] text-[10px] font-bold text-[var(--text-secondary)] transition cursor-pointer flex items-center gap-1"
                          title="Convertir en bloc de temps dans l'agenda"
                        >
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Planifier</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition cursor-pointer"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};
