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
  Trash2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Archive,
  RotateCcw,
  Award,
  Compass,
  FileText,
  StickyNote,
  ArrowRightLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectNotesModal } from './ProjectNotesModal';
import { TransferProjectModal } from './TransferProjectModal';

interface ProjectsDashboardProps {
  projects: Project[];
  timeBlocks?: TimeBlock[];
  onBackToAgenda: () => void;
  onOpenAddModal: () => void;
  onOpenImportProgram?: () => void;
  onSelectBlock?: (blockId: string) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onAddMilestone?: (projectId: string, title: string) => void;
  onDeleteMilestone?: (projectId: string, milestoneId: string) => void;
  onScheduleMilestone?: (project: Project, milestoneTitle: string, milestoneId?: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onUnarchiveProject?: (projectId: string) => void;
  onTransferProject?: (projectId: string, newDomainId: string, options?: { updateTimeBlocksDomain?: boolean }) => void;
  onSaveProjectNotes?: (projectId: string, notes: string) => void;
  onAddProjectQuickNote?: (projectId: string, noteText: string) => void;
  onDeleteProjectQuickNote?: (projectId: string, noteId: string) => void;
  onSeedProjects?: () => void;
  categories?: DomainConfig[];
  onOpenManagePillars?: () => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  timeBlocks = [],
  onBackToAgenda,
  onOpenAddModal,
  onOpenImportProgram,
  onSelectBlock,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onScheduleMilestone,
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
  onTransferProject,
  onSaveProjectNotes,
  onAddProjectQuickNote,
  onDeleteProjectQuickNote,
  onSeedProjects,
  categories,
  onOpenManagePillars,
}) => {
  const [pillarFilter, setPillarFilter] = useState<string | 'all'>('all');
  const [trophyFilter, setTrophyFilter] = useState<string | 'all'>('all');
  const [viewTab, setViewTab] = useState<'projects' | 'trophies' | 'blocks'>('projects');
  const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, string>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [selectedProjectForNotes, setSelectedProjectForNotes] = useState<Project | null>(null);
  const [projectToTransfer, setProjectToTransfer] = useState<Project | null>(null);
  const [activeCardTab, setActiveCardTab] = useState<Record<string, 'milestones' | 'notes'>>({});

  // Séparation projets actifs sur le Bento vs Galerie des Trophées archivés
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => !!p.archived);

  const handleArchiveWithCelebration = (projectId: string) => {
    try {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00CEC9', '#FFD700', '#6C5CE7', '#55E6C1'],
      });
    } catch (_) {}
    onArchiveProject?.(projectId);
  };

  const handleUnarchive = (projectId: string) => {
    onUnarchiveProject?.(projectId);
  };

  const handleMilestoneInputChange = (projectId: string, text: string) => {
    setNewMilestoneInputs((prev) => ({ ...prev, [projectId]: text }));
  };

  const handleAddMilestoneSubmit = (projectId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = (newMilestoneInputs[projectId] || '').trim();
    if (!text || !onAddMilestone) return;

    onAddMilestone(projectId, text);
    setNewMilestoneInputs((prev) => ({ ...prev, [projectId]: '' }));
  };

  const handleToggleMilestoneWithConfetti = (
    projectId: string,
    milestoneId: string,
    willBeComplete: boolean
  ) => {
    onToggleMilestone(projectId, milestoneId);
    if (willBeComplete) {
      const prj = projects.find((p) => p.id === projectId);
      if (prj) {
        const remaining = prj.milestones.filter((m) => !m.completed && m.id !== milestoneId).length;
        if (remaining === 0) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      }
    }
  };

  const activeCategories: DomainConfig[] = Array.isArray(categories)
    ? categories
    : [];

  // Distribution multipotentielle des projets actifs sur le Bento
  const totalActiveProjects = activeProjects.length;
  const countsByCategory: Record<string, number> = {};
  activeCategories.forEach((c) => {
    countsByCategory[c.id] = activeProjects.filter((p) => p.domain === c.id).length;
  });
  const unassignedActiveCount = activeProjects.filter(
    (p) => p.domain === 'unassigned' || p.domain === 'none' || !p.domain
  ).length;

  // Statistiques de la Galerie des Trophées
  const totalArchivedMilestones = archivedProjects.reduce(
    (acc, p) => acc + (p.milestones?.length || 0),
    0
  );
  const countsByTrophyCategory: Record<string, number> = {};
  activeCategories.forEach((c) => {
    countsByTrophyCategory[c.id] = archivedProjects.filter((p) => p.domain === c.id).length;
  });
  const unassignedTrophyCount = archivedProjects.filter(
    (p) => p.domain === 'unassigned' || p.domain === 'none' || !p.domain
  ).length;

  const getDomainConfig = (domainId: string): { name: string; color: string; iconName?: string } => {
    if (domainId === 'unassigned' || domainId === 'none' || !domainId) {
      return { name: 'Sans pilier', color: '#94A3B8', iconName: 'Compass' };
    }
    const found = activeCategories.find((c) => c.id === domainId);
    if (found) return { name: found.name, color: found.color, iconName: found.iconName };
    const legacy = (DOMAINS as Record<string, DomainConfig>)[domainId];
    if (legacy) return { name: legacy.name, color: legacy.color };
    return { name: domainId, color: '#6C5CE7' };
  };

  const filteredProjects = activeProjects.filter((p) => {
    if (pillarFilter === 'all') return true;
    if (pillarFilter === 'unassigned') {
      return p.domain === 'unassigned' || p.domain === 'none' || !p.domain;
    }
    return p.domain === pillarFilter;
  });

  const filteredTrophies = archivedProjects.filter((p) => {
    if (trophyFilter === 'all') return true;
    if (trophyFilter === 'unassigned') {
      return p.domain === 'unassigned' || p.domain === 'none' || !p.domain;
    }
    return p.domain === trophyFilter;
  });

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 pt-4 text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAgenda}
            className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer"
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

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenImportProgram && (
            <button
              onClick={onOpenImportProgram}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/15 to-[#00CEC9]/15 border border-[#6C5CE7]/35 text-xs font-bold text-[var(--text-primary)] hover:border-[#6C5CE7] transition active:scale-95 shadow-sm cursor-pointer"
              title="Importer un programme complet (ex: Task Master Pro Dev Web)"
            >
              <Sparkles className="w-4 h-4 text-[#00CEC9]" />
              <span className="hidden sm:inline">Importer un Programme</span>
              <span className="sm:hidden">Programme</span>
            </button>
          )}

          {onOpenManagePillars && (
            <button
              onClick={onOpenManagePillars}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95 shadow-sm cursor-pointer"
              title="Gérer les piliers"
            >
              <Settings2 className="w-4 h-4 text-[#6C5CE7]" />
              <span className="hidden sm:inline">Gérer les Piliers</span>
            </button>
          )}

          <button
            id="dashboard-add-project-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs md:text-sm font-bold shadow-md shadow-[#6C5CE7]/20 transition-all self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Navigation Onglets: Bento Grid vs Réalisations & Victoires vs Blocs de Temps */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pb-1 border-b border-[var(--border-card)]">
        <button
          type="button"
          onClick={() => setViewTab('projects')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'projects'
              ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Projets Bento Grid</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            viewTab === 'projects' ? 'bg-black/20 text-white' : 'bg-[var(--bg-surface-elevated)]'
          }`}>
            {activeProjects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('trophies')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'trophies'
              ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/25 font-black'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
          }`}
        >
          <Trophy className={`w-3.5 h-3.5 ${viewTab === 'trophies' ? 'text-neutral-950' : 'text-amber-400'}`} />
          <span>Réalisations &amp; Victoires</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
            viewTab === 'trophies' ? 'bg-black/20 text-neutral-950' : 'bg-amber-400/15 text-amber-400'
          }`}>
            {archivedProjects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('blocks')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'blocks'
              ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Blocs de Temps &amp; Roadmap</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            viewTab === 'blocks' ? 'bg-black/20 text-white' : 'bg-[var(--bg-surface-elevated)]'
          }`}>
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
                <span className="text-[var(--text-primary)] font-bold">{totalActiveProjects}</span>
              </div>
            </div>

            {/* Segmented multi-color progress bar */}
            <div className="mt-5 space-y-3">
              <div className="w-full h-3 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden flex border border-[var(--border-card)]">
                {activeCategories.map((cat) => {
                  const count = countsByCategory[cat.id] || 0;
                  const pct = totalActiveProjects > 0 ? Math.round((count / totalActiveProjects) * 100) : 0;
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
                {unassignedActiveCount > 0 && (
                  <div
                    style={{
                      width: `${Math.round((unassignedActiveCount / totalActiveProjects) * 100)}%`,
                      backgroundColor: '#94A3B8',
                    }}
                    className="h-full transition-all duration-500"
                    title={`Sans pilier: ${Math.round((unassignedActiveCount / totalActiveProjects) * 100)}%`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {activeCategories.map((cat) => {
                  const count = countsByCategory[cat.id] || 0;
                  const pct = totalActiveProjects > 0 ? Math.round((count / totalActiveProjects) * 100) : 0;

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

                {unassignedActiveCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-400"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">Sans pilier (Libre)</span>
                      <span className="text-[var(--text-secondary)] font-mono ml-1.5">
                        {Math.round((unassignedActiveCount / totalActiveProjects) * 100)}% ({unassignedActiveCount})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setPillarFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                pillarFilter === 'all'
                  ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              Tous les projets actifs ({activeProjects.length})
            </button>

            {activeCategories.map((cat) => {
              const count = countsByCategory[cat.id] || 0;
              const isSelected = pillarFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setPillarFilter(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
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

            {unassignedActiveCount > 0 && (
              <button
                onClick={() => setPillarFilter('unassigned')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  pillarFilter === 'unassigned'
                    ? 'bg-slate-700/80 border-slate-400 text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Sans pilier ({unassignedActiveCount})</span>
              </button>
            )}

            {activeCategories.length === 0 && onOpenManagePillars && (
              <button
                onClick={onOpenManagePillars}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/25 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+ Définir mes piliers</span>
              </button>
            )}
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

                        <div className="flex items-center gap-1.5">
                          {onTransferProject && (
                            <button
                              type="button"
                              onClick={() => setProjectToTransfer(project)}
                              className="p-1 text-[var(--text-muted)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                              title="Transférer vers un autre pilier"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForNotes(project)}
                            className="p-1 text-[var(--text-muted)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer relative"
                            title="Ouvrir le carnet de notes & mémos du projet"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {((project.notes && project.notes.trim().length > 0) ||
                              (project.quickNotes && project.quickNotes.length > 0)) && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6C5CE7]" />
                            )}
                          </button>
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                            {project.progress}%
                          </span>
                          {onArchiveProject && (
                            <button
                              type="button"
                              onClick={() => handleArchiveWithCelebration(project.id)}
                              className="p-1 text-[var(--text-muted)] hover:text-amber-400 hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                              title="Archiver ce projet dans Réalisations & Victoires"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteProject && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer le projet "${project.title}" ?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-[#FF7675] hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                              title="Supprimer ce projet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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

                      {/* Bannière de Victoire 100% & Bouton d'Archivage rapide */}
                      {(project.progress === 100 || (totalMilestones > 0 && completedMilestones === totalMilestones)) && (
                        <div className="mt-3.5 p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-amber-300">
                              Projet accompli à 100 % ! 🎉
                            </span>
                          </div>
                          {onArchiveProject && (
                            <button
                              type="button"
                              onClick={() => handleArchiveWithCelebration(project.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap self-end sm:self-auto"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archiver le projet</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Onglets de la carte : Jalons vs Notes */}
                      <div className="mt-4 pt-3 border-t border-[var(--border-card)]">
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCardTab((prev) => ({ ...prev, [project.id]: 'milestones' }))
                              }
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                (activeCardTab[project.id] || 'milestones') === 'milestones'
                                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <Target className="w-3 h-3" />
                              <span>Jalons</span>
                              <span className="font-mono text-[10px] opacity-85">
                                ({completedMilestones}/{totalMilestones})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveCardTab((prev) => ({ ...prev, [project.id]: 'notes' }))
                              }
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                activeCardTab[project.id] === 'notes'
                                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>Notes</span>
                              {((project.notes && project.notes.trim().length > 0) ||
                                (project.quickNotes && project.quickNotes.length > 0)) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              )}
                            </button>
                          </div>

                          {activeCardTab[project.id] === 'notes' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProjectForNotes(project)}
                              className="text-[10px] font-bold text-[#6C5CE7] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Ouvrir carnet</span>
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </button>
                          ) : (
                            <span
                              className="font-mono text-xs font-semibold"
                              style={{
                                color:
                                  completedMilestones === totalMilestones && totalMilestones > 0
                                    ? '#55E6C1'
                                    : undefined,
                              }}
                            >
                              {completedMilestones}/{totalMilestones}
                            </span>
                          )}
                        </div>

                        {/* ONGLET 1 : JALONS */}
                        {(activeCardTab[project.id] || 'milestones') === 'milestones' ? (
                          <div className="space-y-2.5">

                        {/* List of milestones */}
                        {project.milestones.length > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                            {(expandedProjects[project.id]
                              ? project.milestones
                              : project.milestones.slice(0, 4)
                            ).map((m) => (
                              <div
                                key={m.id}
                                className="group flex items-center justify-between gap-1.5 p-1 rounded-xl hover:bg-[var(--bg-surface-elevated)] transition-colors"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleMilestoneWithConfetti(
                                      project.id,
                                      m.id,
                                      !m.completed
                                    )
                                  }
                                  className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                                >
                                  {m.completed ? (
                                    <CheckCircle2
                                      className="w-4 h-4 shrink-0 transition-transform active:scale-90"
                                      style={{ color: domainCfg.color }}
                                    />
                                  ) : (
                                    <Circle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] shrink-0 transition-transform active:scale-90" />
                                  )}
                                  <span
                                    className={`text-xs leading-tight break-words ${
                                      m.completed
                                        ? 'line-through text-[var(--text-muted)] opacity-75'
                                        : 'text-[var(--text-primary)] font-medium'
                                    }`}
                                  >
                                    {m.title}
                                  </span>
                                </button>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  {onScheduleMilestone && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScheduleMilestone(project, m.title, m.id);
                                      }}
                                      className="p-1 text-[var(--text-muted)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface)] rounded-lg transition-colors cursor-pointer group-hover:text-[var(--text-secondary)]"
                                      title="Planifier ce jalon dans l'Agenda (créer un bloc de temps)"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {onDeleteMilestone && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteMilestone(project.id, m.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#FF7675] hover:bg-[var(--bg-surface)] rounded-lg transition-colors cursor-pointer"
                                      title="Supprimer cette tâche"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {project.milestones.length > 4 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedProjects((prev) => ({
                                    ...prev,
                                    [project.id]: !prev[project.id],
                                  }))
                                }
                                className="text-[10px] font-semibold text-[#6C5CE7] hover:underline pt-0.5 inline-flex items-center gap-1 cursor-pointer"
                              >
                                {expandedProjects[project.id] ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Réduire</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>
                                      Voir les {project.milestones.length - 4} autres tâches
                                    </span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                            Aucune tâche définie pour ce projet.
                          </p>
                        )}

                        {/* Quick Add Milestone / Task Input directly in the card */}
                        {onAddMilestone && (
                          <form
                            onSubmit={(e) => handleAddMilestoneSubmit(project.id, e)}
                            className="flex items-center gap-1.5 pt-1"
                          >
                            <input
                              type="text"
                              placeholder="+ Ajouter une tâche ou étape..."
                              value={newMilestoneInputs[project.id] || ''}
                              onChange={(e) =>
                                handleMilestoneInputChange(project.id, e.target.value)
                              }
                              className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
                            />
                            <button
                              type="submit"
                              disabled={!(newMilestoneInputs[project.id] || '').trim()}
                              className="p-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center cursor-pointer shrink-0"
                              title="Ajouter au projet"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      /* CONTENU ONGLET 2 : NOTES & RÉFLEXIONS */
                      <div className="space-y-2.5">
                        {project.notes ? (
                          <div
                            onClick={() => setSelectedProjectForNotes(project)}
                            className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs text-[var(--text-secondary)] hover:border-[#6C5CE7] transition cursor-pointer group"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#6C5CE7]" />
                                Carnet de bord
                              </span>
                              <span className="text-[#6C5CE7] opacity-0 group-hover:opacity-100 transition">
                                Éditer
                              </span>
                            </div>
                            <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap text-[var(--text-primary)]">
                              {project.notes}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForNotes(project)}
                            className="w-full p-3 rounded-xl border border-dashed border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/50 hover:bg-[var(--bg-surface-elevated)] hover:border-[#6C5CE7] text-left transition cursor-pointer text-xs text-[var(--text-muted)] flex items-center gap-2"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#6C5CE7]" />
                            <span>Rédiger une note ou coller des ressources...</span>
                          </button>
                        )}

                        {/* Aperçu des mémos flash datés */}
                        {project.quickNotes && project.quickNotes.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                              <span>Derniers mémos datés</span>
                              <span className="font-mono text-[9px] text-[var(--text-muted)]">
                                {project.quickNotes.length}
                              </span>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {project.quickNotes.slice(0, 3).map((qn) => (
                                <div
                                  key={qn.id}
                                  className="p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[11px] text-[var(--text-primary)] border border-[var(--border-card)] flex items-center justify-between gap-1.5"
                                >
                                  <span className="truncate">{qn.text}</span>
                                  <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                                    {qn.createdAt}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForNotes(project)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] text-[11px] font-bold transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>
                              Gérer le carnet (
                              {(project.notes ? 1 : 0) + (project.quickNotes?.length || 0)})
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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
      ) : viewTab === 'trophies' ? (
        /* VUE 2: GALERIE DES TROPHÉES (RÉALISATIONS & VICTOIRES) */
        <div className="mt-6 space-y-6">
          {/* Header & Statistiques Trophées */}
          <div className="bg-[var(--bg-surface)] border border-amber-400/30 rounded-2xl md:rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Subtle Gold / Amber Flare */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15 bg-amber-400" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-sm">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                      Galerie des Trophées &amp; Victoires
                    </h2>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold font-mono text-[11px] border border-amber-400/30">
                      100% Archivés
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                    L'écrin de tous vos accomplissements. Quand un projet atteint 100%, l'archiver libère votre Bento tout en gardant l'historique valorisant et la trace indélébile de votre persévérance.
                  </p>
                </div>
              </div>

              {/* 3 mini-stat pill counters */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-center">
                  <div className="text-base sm:text-lg font-black font-mono text-amber-400">
                    {archivedProjects.length}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                    Trophées
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-center">
                  <div className="text-base sm:text-lg font-black font-mono text-[#55E6C1]">
                    {totalArchivedMilestones}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                    Jalons validés
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-center">
                  <div className="text-base sm:text-lg font-black font-mono text-[#6C5CE7]">
                    {Object.values(countsByTrophyCategory).filter((c) => c > 0).length}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-medium">
                    Sphères
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills for Trophies */}
          {archivedProjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setTrophyFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  trophyFilter === 'all'
                    ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                Toutes les victoires ({archivedProjects.length})
              </button>

              {activeCategories.map((cat) => {
                const count = countsByTrophyCategory[cat.id] || 0;
                if (count === 0) return null;
                const isSelected = trophyFilter === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTrophyFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
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

              {unassignedTrophyCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTrophyFilter('unassigned')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    trophyFilter === 'unassigned'
                      ? 'bg-slate-700/80 border-slate-400 text-white shadow-sm'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sans pilier ({unassignedTrophyCount})</span>
                </button>
              )}
            </div>
          )}

          {/* Trophies Grid */}
          {filteredTrophies.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[var(--bg-surface)] border border-dashed border-amber-400/30 text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-400/20">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {archivedProjects.length === 0
                  ? 'Aucun projet archivé pour le moment'
                  : 'Aucune victoire dans ce filtre'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mt-1.5 leading-relaxed">
                {archivedProjects.length === 0
                  ? 'Quand un de vos projets atteint 100 %, cliquez sur « Archiver le projet » sur sa carte Bento. Il viendra enrichir votre galerie de réussites sans encombrer votre espace de travail actif.'
                  : 'Sélectionnez "Toutes les victoires" pour voir les autres trophées.'}
              </p>
              {archivedProjects.length === 0 && (
                <button
                  type="button"
                  onClick={() => setViewTab('projects')}
                  className="mt-5 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 transition active:scale-95 cursor-pointer"
                >
                  Voir les projets en cours
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrophies.map((project) => {
                const domainCfg = getDomainConfig(project.domain);
                const Icon = getPillarIcon(domainCfg.iconName);
                const totalM = project.milestones?.length || 0;

                return (
                  <div
                    key={project.id}
                    className="bg-[var(--bg-surface)] border border-amber-400/30 hover:border-amber-400/60 rounded-2xl md:rounded-3xl p-5 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden"
                  >
                    {/* Golden Trophy Glow Flare */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 bg-amber-400" />

                    <div>
                      {/* Ribbon: Completion badge & Pillar */}
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

                        <div className="flex items-center gap-1.5">
                          {onTransferProject && (
                            <button
                              type="button"
                              onClick={() => setProjectToTransfer(project)}
                              className="p-1 text-[var(--text-muted)] hover:text-amber-400 hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                              title="Transférer ce trophée vers un autre pilier"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForNotes(project)}
                            className="p-1 text-[var(--text-muted)] hover:text-amber-400 hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                            title="Consulter le carnet de notes & apprentissages"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-xl bg-amber-400/15 border border-amber-400/30">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            100%
                          </span>
                        </div>
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

                      {/* Date d'accomplissement */}
                      {(project.completionDate || project.archivedAt) && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[11px] text-[var(--text-secondary)]">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Terminé {project.completionDate ? `le ${project.completionDate}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Accomplished Milestones checklist */}
                      {project.milestones && project.milestones.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[var(--border-card)] space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#55E6C1]" />
                              Jalons accomplis
                            </span>
                            <span className="font-mono text-xs text-[#55E6C1] font-bold">
                              {totalM}/{totalM}
                            </span>
                          </div>

                          <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                            {project.milestones.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-2 p-1 text-xs text-[var(--text-primary)]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#55E6C1] shrink-0" />
                                <span className="line-through opacity-80 break-words leading-tight">
                                  {m.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Restore / Delete */}
                    <div className="mt-5 pt-3 border-t border-[var(--border-card)] flex items-center justify-between gap-2">
                      {onUnarchiveProject && (
                        <button
                          type="button"
                          onClick={() => handleUnarchive(project.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-card)] hover:border-[#6C5CE7] text-[var(--text-primary)] hover:text-[#6C5CE7] text-xs font-semibold transition active:scale-95 cursor-pointer"
                          title="Restaurer le projet sur le Bento actif"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#6C5CE7]" />
                          <span>Restaurer sur le Bento</span>
                        </button>
                      )}

                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer définitivement le trophée "${project.title}" ?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[#FF7675] hover:bg-[var(--bg-surface-elevated)] rounded-xl transition cursor-pointer ml-auto"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

      {/* MODAL CARNET DE BORD & NOTES DU PROJET */}
      {selectedProjectForNotes && (
        <ProjectNotesModal
          isOpen={!!selectedProjectForNotes}
          project={
            projects.find((p) => p.id === selectedProjectForNotes.id) || selectedProjectForNotes
          }
          onClose={() => setSelectedProjectForNotes(null)}
          onSaveNotes={(pId, notes) => onSaveProjectNotes?.(pId, notes)}
          onAddQuickNote={(pId, noteText) => onAddProjectQuickNote?.(pId, noteText)}
          onDeleteQuickNote={(pId, noteId) => onDeleteProjectQuickNote?.(pId, noteId)}
          onOpenTransfer={(proj) => {
            setProjectToTransfer(proj);
            setSelectedProjectForNotes(null);
          }}
          pillarName={getDomainConfig(selectedProjectForNotes.domain).name}
          pillarColor={getDomainConfig(selectedProjectForNotes.domain).color}
        />
      )}

      {/* MODAL TRANSFERT DE PROJET ENTRE PILIERS */}
      {projectToTransfer && (
        <TransferProjectModal
          isOpen={!!projectToTransfer}
          project={
            projects.find((p) => p.id === projectToTransfer.id) || projectToTransfer
          }
          onClose={() => setProjectToTransfer(null)}
          categories={categories}
          onTransferProject={(pId, newDomainId, options) => {
            onTransferProject?.(pId, newDomainId, options);
          }}
        />
      )}
    </div>
  );
};
