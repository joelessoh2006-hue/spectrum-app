import React, { useState } from 'react';
import { DomainId, Project } from '../types';
import { DOMAINS } from '../data/mockData';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectsDashboardProps {
  projects: Project[];
  onBackToAgenda: () => void;
  onOpenAddModal: () => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  onBackToAgenda,
  onOpenAddModal,
  onToggleMilestone,
}) => {
  const [pillarFilter, setPillarFilter] = useState<DomainId | 'all'>('all');

  // Compute multipotential distribution
  const totalProjects = projects.length;
  const techCount = projects.filter((p) => p.domain === 'tech').length;
  const artCount = projects.filter((p) => p.domain === 'art').length;
  const curiosityCount = projects.filter((p) => p.domain === 'curiosity').length;

  const techPct = totalProjects > 0 ? Math.round((techCount / totalProjects) * 100) : 33;
  const artPct = totalProjects > 0 ? Math.round((artCount / totalProjects) * 100) : 33;
  const curiosityPct = totalProjects > 0 ? 100 - techPct - artPct : 34;

  const filteredProjects = projects.filter((p) =>
    pillarFilter === 'all' ? true : p.domain === pillarFilter
  );

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 pt-4 text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E38]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAgenda}
            className="p-2 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-[#A0A0AB] hover:text-white transition-all"
            title="Retour à l'Agenda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A0A0AB]">
              <Layers className="w-3.5 h-3.5 text-[#55E6C1]" />
              <span>Vision Stratégique Multipotentielle</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-0.5 tracking-tight">
              Dashboard Projets (Bento)
            </h1>
          </div>
        </div>

        <button
          id="dashboard-add-project-btn"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#55E6C1] hover:bg-[#43d4af] text-[#121214] text-xs md:text-sm font-bold shadow-lg shadow-[#55E6C1]/25 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* 1. CARTE ÉQUILIBRE MULTIPOTENTIEL */}
      <div className="mt-6 bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#55E6C1]" />
              <h2 className="text-lg font-bold text-white">Équilibre Multipotentiel des Piliers</h2>
            </div>
            <p className="text-xs text-[#A0A0AB] mt-1 max-w-xl leading-relaxed">
              Harmonie dynamique entre tes 3 sphères d'expression. Le cerveau multipotentiel s'épanouit dans la fertilisation croisée plutôt que dans l'hyper-spécialisation isolée.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-[#121214] px-3.5 py-1.5 rounded-xl border border-[#2E2E38] shrink-0">
            <span className="text-[#A0A0AB]">Projets actifs :</span>
            <span className="text-white font-bold">{totalProjects}</span>
          </div>
        </div>

        {/* Segmented multi-color progress bar */}
        <div className="mt-5 space-y-3">
          <div className="w-full h-3 bg-[#121214] rounded-full overflow-hidden flex border border-[#2E2E38]">
            <div
              style={{ width: `${techPct}%`, backgroundColor: DOMAINS.tech.color }}
              className="h-full transition-all duration-500"
              title={`Tech/Dev: ${techPct}%`}
            />
            <div
              style={{ width: `${artPct}%`, backgroundColor: DOMAINS.art.color }}
              className="h-full transition-all duration-500"
              title={`Art/Rap: ${artPct}%`}
            />
            <div
              style={{ width: `${curiosityPct}%`, backgroundColor: DOMAINS.curiosity.color }}
              className="h-full transition-all duration-500"
              title={`Curiosité: ${curiosityPct}%`}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(Object.keys(DOMAINS) as DomainId[]).map((dId) => {
              const cfg = DOMAINS[dId];
              const pct = dId === 'tech' ? techPct : dId === 'art' ? artPct : curiosityPct;
              const count = dId === 'tech' ? techCount : dId === 'art' ? artCount : curiosityCount;

              return (
                <div key={dId} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#EDEDED]">{cfg.name}</span>
                    <span className="text-[#A0A0AB] font-mono ml-1.5">
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
              ? 'bg-[#EDEDED] text-[#121214] border-white shadow-md'
              : 'bg-[#1E1E24] text-[#A0A0AB] border-[#2E2E38] hover:bg-[#282830]'
          }`}
        >
          Tous les projets ({projects.length})
        </button>

        {(Object.keys(DOMAINS) as DomainId[]).map((dId) => {
          const cfg = DOMAINS[dId];
          const count = projects.filter((p) => p.domain === dId).length;
          const isSelected = pillarFilter === dId;

          return (
            <button
              key={dId}
              onClick={() => setPillarFilter(dId)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-[#1E1E24] text-[#A0A0AB] border-[#2E2E38] hover:bg-[#282830]'
              }`}
              style={{
                backgroundColor: isSelected ? cfg.bgRgba : undefined,
                borderColor: isSelected ? cfg.color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span style={{ color: isSelected ? cfg.color : undefined }}>
                {cfg.name} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. BENTO GRID LAYOUT */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const domainCfg = DOMAINS[project.domain] || DOMAINS.tech;
          const isLarge = project.bentoSize === 'large';
          const completedMilestones = project.milestones.filter((m) => m.completed).length;
          const totalMilestones = project.milestones.length;

          return (
            <div
              key={project.id}
              className={`bg-[#1E1E24] border border-[#2E2E38] hover:border-[#3E3E4C] rounded-[20px] p-5 shadow-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden ${
                isLarge ? 'md:col-span-2' : 'col-span-1'
              }`}
            >
              {/* Subtle Domain Accent Flare */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-15"
                style={{ backgroundColor: domainCfg.color }}
              />

              <div>
                {/* Header: Domain Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: domainCfg.bgRgba,
                      borderColor: domainCfg.borderRgba,
                      color: domainCfg.color,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{domainCfg.name}</span>
                  </div>

                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-[#121214] border border-[#2E2E38]">
                    {project.progress}%
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-white leading-snug">{project.title}</h3>
                <p className="text-xs text-[#A0A0AB] mt-1.5 leading-relaxed line-clamp-3">
                  {project.description}
                </p>

                {/* Milestones checklist */}
                {project.milestones.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#2E2E38]/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-[#55E6C1]" />
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
                          className="w-full flex items-center gap-2 text-left group/m p-1 rounded hover:bg-[#121214]/60 transition-colors"
                        >
                          {m.completed ? (
                            <CheckCircle2
                              className="w-4 h-4 shrink-0"
                              style={{ color: domainCfg.color }}
                            />
                          ) : (
                            <Circle className="w-4 h-4 text-[#71717A] shrink-0 group-hover/m:text-[#A0A0AB]" />
                          )}
                          <span
                            className={`text-xs leading-tight line-clamp-1 ${
                              m.completed
                                ? 'line-through text-[#71717A]'
                                : 'text-[#EDEDED] font-medium'
                            }`}
                          >
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Tags and Progress Bar */}
              <div className="mt-5 pt-3 border-t border-[#2E2E38]/80 space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#121214] text-[#A0A0AB] border border-[#2E2E38]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="w-full h-1.5 bg-[#121214] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: domainCfg.color,
                      boxShadow: `0 0 8px ${domainCfg.color}66`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
