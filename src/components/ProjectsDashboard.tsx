import React, { useState } from 'react';
import { DomainId, Project, TimeBlock, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import {
  Layers,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  Tag,
  Target,
  BarChart3,
  Clock,
  Calendar,
  ListChecks,
  Settings2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectsDashboardProps {
  projects: Project[];
  timeBlocks?: TimeBlock[];
  onBackToAgenda: () => void;
  onOpenAddModal: () => void;
  onSelectBlock?: (blockId: string) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onSeedProjects?: () => void;
  categories?: DomainConfig[];
  onOpenManagePillars?: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  timeBlocks = [],
  onBackToAgenda,
  onOpenAddModal,
  onSelectBlock,
  onToggleMilestone,
  onSeedProjects,
  categories,
  onOpenManagePillars,
}) => {
  const [pillarFilter, setPillarFilter] = useState<string | 'all'>('all');
  const [viewTab, setViewTab] = useState<'projects' | 'blocks'>('projects');

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

  // Compute multipotential distribution dynamically across all categories
  const totalProjects = projects.length;
  const countsByCategory: Record<string, number> = {};
  activeCategories.forEach((c) => {
    countsByCategory[c.id] = projects.filter((p) => p.domain === c.id).length;
  });

  const getDomainConfig = (domainId: string): { name: string; color: string; iconName?: string } => {
    const found = activeCategories.find((c) => c.id === domainId);
    if (found) return { name: found.name, color: found.color, iconName: found.iconName };
    const legacy = (DOMAINS as Record<string, DomainConfig>)[domainId];
    if (legacy) return { name: legacy.name, color: legacy.color };
    return { name: domainId, color: '#6C5CE7' };
  };

  const filteredProjects = projects.filter((p) =>
    pillarFilter === 'all' ? true : p.domain === pillarFilter
  );

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 pt-4 text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAgenda}
            className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95"
            title="Retour à l'Agenda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Vision Stratégique Multipotentielle</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mt-0.5 tracking-tight">
              Dashboard Projets (Bento)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenManagePillars && (
            <button
              onClick={onOpenManagePillars}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95 shadow-sm"
              title="Gérer les piliers"
            >
              <Settings2 className="w-4 h-4 text-[#6C5CE7]" />
              <span className="hidden sm:inline">Gérer les Piliers</span>
            </button>
          )}

          <button
            id="dashboard-add-project-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs md:text-sm font-bold shadow-md shadow-[#6C5CE7]/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Navigation Onglets: Bento Grid vs Blocs de Temps */}
      <div className="flex items-center gap-2 mt-4 pb-1 border-b border-[var(--border-card)]">
        <button
          type="button"
          onClick={() => setViewTab('projects')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'projects'
              ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Projets Bento Grid</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('blocks')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'blocks'
              ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Blocs de Temps & Roadmap</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono">
            {timeBlocks.length}
          </span>
        </button>
      </div>

      {viewTab === 'projects' ? (
        <>
          {/* 1. CARTE ÉQUILIBRE MULTIPOTENTIEL */}
          <div className="mt-6 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#6C5CE7]" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Équilibre Multipotentiel des Piliers
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                  Harmonie dynamique entre vos sphères d'expression. Le cerveau multipotentiel s'épanouit dans la fertilisation croisée plutôt que dans l'hyper-spécialisation isolée.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs bg-[var(--bg-surface-elevated)] px-3.5 py-1.5 rounded-xl border border-[var(--border-card)] shrink-0">
                <span className="text-[var(--text-secondary)]">Projets actifs :</span>
                <span className="text-[var(--text-primary)] font-bold">{totalProjects}</span>
              </div>
            </div>

            {/* Segmented multi-color progress bar */}
            <div className="mt-5 space-y-3">
              <div className="w-full h-3 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden flex border border-[var(--border-card)]">
                {activeCategories.map((cat) => {
                  const count = countsByCategory[cat.id] || 0;
                  const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={cat.id}
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      className="h-full transition-all duration-500"
                      title={`${cat.name}: ${pct}%`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {activeCategories.map((cat) => {
                  const count = countsByCategory[cat.id] || 0;
                  const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;

                  return (
                    <div key={cat.id} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{cat.name}</span>
                        <span className="text-[var(--text-secondary)] font-mono ml-1.5">
                          {pct}% ({count})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setPillarFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                pillarFilter === 'all'
                  ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              Tous les projets ({projects.length})
            </button>

            {activeCategories.map((cat) => {
              const count = countsByCategory[cat.id] || 0;
              const isSelected = pillarFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setPillarFilter(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'shadow-sm'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${cat.color}20` : undefined,
                    borderColor: isSelected ? cat.color : undefined,
                    color: isSelected ? cat.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>
                    {cat.name} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2. BENTO GRID LAYOUT */}
          {filteredProjects.length === 0 ? (
            <div className="mt-6 p-8 rounded-3xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-card)] text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mb-3 border border-[#6C5CE7]/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Aucun projet dans cette vue</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1 leading-relaxed">
                La Bento Grid permet de visualiser vos chantiers créatifs et techniques sans surcharge cognitive.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 hover:bg-[#5b4bc4] transition active:scale-95"
                >
                  + Créer un projet
                </button>
                {onSeedProjects && (
                  <button
                    onClick={onSeedProjects}
                    className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition"
                  >
                    Charger des exemples de projets
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const domainCfg = getDomainConfig(project.domain);
                const isLarge = project.bentoSize === 'large';
                const completedMilestones = project.milestones.filter((m) => m.completed).length;
                const totalMilestones = project.milestones.length;
                const Icon = getPillarIcon(domainCfg.iconName);

                return (
                  <div
                    key={project.id}
                    className={`bg-[var(--bg-surface)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] rounded-2xl md:rounded-3xl p-5 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden ${
                      isLarge ? 'md:col-span-2' : 'col-span-1'
                    }`}
                  >
                    {/* Subtle Accent Flare */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-10"
                      style={{ backgroundColor: domainCfg.color }}
                    />

                    <div>
                      {/* Header: Domain Badge & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: `${domainCfg.color}15`,
                            borderColor: `${domainCfg.color}35`,
                            color: domainCfg.color,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{domainCfg.name}</span>
                        </div>

                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                          {project.progress}%
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      )}

                      {/* Milestones checklist */}
                      {project.milestones.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[var(--border-card)] space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-[#6C5CE7]" />
                              Jalons Clés
                            </span>
                            <span className="font-mono">
                              {completedMilestones}/{totalMilestones}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {project.milestones.slice(0, 3).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => onToggleMilestone(project.id, m.id)}
                                className="w-full flex items-center gap-2 text-left p-1 rounded-xl hover:bg-[var(--bg-surface-elevated)] transition-colors"
                              >
                                {m.completed ? (
                                  <CheckCircle2
                                    className="w-4 h-4 shrink-0"
                                    style={{ color: domainCfg.color }}
                                  />
                                ) : (
                                  <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                                )}
                                <span
                                  className={`text-xs leading-tight line-clamp-1 ${
                                    m.completed
                                      ? 'line-through text-[var(--text-muted)]'
                                      : 'text-[var(--text-primary)] font-medium'
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Time Blocks */}
                      {(() => {
                        const linkedBlocks = timeBlocks.filter((b) => b.projectId === project.id);
                        if (linkedBlocks.length === 0) return null;
                        return (
                          <div className="mt-3.5 pt-3 border-t border-[var(--border-card)] space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#6C5CE7]" />
                                Blocs de temps reliés
                              </span>
                              <span className="font-mono">{linkedBlocks.length}</span>
                            </div>

                            <div className="space-y-1.5">
                              {linkedBlocks.slice(0, 2).map((b) => {
                                const bSubtasks =
                                  b.subtasks && b.subtasks.length > 0
                                    ? b.subtasks
                                    : (b.checklist || []).map((c) => ({
                                        id: c.id,
                                        text: c.title,
                                        completed: c.isCompleted,
                                      }));
                                const bDone = bSubtasks.filter((i) => i.completed).length;
                                const bPct =
                                  bSubtasks.length > 0
                                    ? Math.round((bDone / bSubtasks.length) * 100)
                                    : 0;

                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => onSelectBlock?.(b.id)}
                                    className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs cursor-pointer hover:border-[var(--border-highlight)] transition"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-medium text-[var(--text-primary)] truncate">
                                        {b.title}
                                      </span>
                                      <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                                        {b.durationMinutes}m
                                      </span>
                                    </div>
                                    {bSubtasks.length > 0 && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-[var(--border-card)] rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full"
                                            style={{
                                              width: `${bPct}%`,
                                              backgroundColor: domainCfg.color,
                                            }}
                                          />
                                        </div>
                                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                                          {bPct}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Footer: Tags and Progress Bar */}
                    <div className="mt-5 pt-3 border-t border-[var(--border-card)] space-y-2.5">
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-card)]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="w-full h-1.5 bg-[var(--border-card)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: domainCfg.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* VUE 2: FEUILLE DE ROUTE DES BLOCS DE TEMPS AVEC BARRE DE PROGRESSION DES SOUS-TÂCHES */
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] shadow-sm">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#6C5CE7]" />
                <span>Roadmap des Blocs de Temps & Sous-Tâches</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Suivi détaillé de l'avancement (%) de chaque créneau de travail multipotentiel.
              </p>
            </div>
            <span className="text-xs font-mono text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-xl border border-[#6C5CE7]/20 self-start sm:self-auto">
              {timeBlocks.length} session(s)
            </span>
          </div>

          {timeBlocks.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-card)] text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                Aucun bloc de temps configuré. Créez-en un depuis l'Agenda pour suivre vos sous-tâches ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeBlocks.map((block) => {
                const domainCfg = getDomainConfig(block.domain);
                const blockSubtasks =
                  block.subtasks && block.subtasks.length > 0
                    ? block.subtasks
                    : (block.checklist || []).map((c) => ({
                        id: c.id,
                        text: c.title,
                        completed: c.isCompleted,
                      }));
                const total = blockSubtasks.length;
                const done = blockSubtasks.filter((s) => s.completed).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div
                    key={block.id}
                    onClick={() => onSelectBlock?.(block.id)}
                    className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            backgroundColor: `${domainCfg.color}15`,
                            borderColor: `${domainCfg.color}35`,
                            color: domainCfg.color,
                          }}
                        >
                          {domainCfg.name}
                        </span>
                        <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {block.startTime} — {block.endTime}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[var(--text-primary)]">{block.title}</h3>
                      {block.globalObjective && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {block.globalObjective}
                        </p>
                      )}

                      {/* Subtasks summary */}
                      <div className="mt-3 space-y-1.5">
                        {blockSubtasks.slice(0, 3).map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                          >
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: st.completed ? domainCfg.color : 'var(--text-muted)' }}
                            />
                            <span
                              className={`line-clamp-1 ${
                                st.completed ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {st.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress footer */}
                    <div className="mt-4 pt-3 border-t border-[var(--border-card)] flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--text-secondary)]">
                        {done}/{total} étape{total > 1 ? 's' : ''} validée{done > 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                        <div className="flex-1 h-1.5 bg-[var(--border-card)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: domainCfg.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
