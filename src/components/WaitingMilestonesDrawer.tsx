import React, { useState, useMemo } from 'react';
import { Project, DomainConfig, TimeBlock } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import {
  Layers,
  X,
  GripVertical,
  CalendarPlus,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowRight,
  Zap,
} from 'lucide-react';

export interface MilestoneDragData {
  milestoneId: string;
  title: string;
  projectId: string;
  projectTitle: string;
  domain: string;
}

interface WaitingMilestonesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  blocks: TimeBlock[];
  categories: DomainConfig[];
  selectedDate: Date;
  onScheduleMilestone: (
    data: MilestoneDragData,
    slotTime?: string,
    durationMinutes?: number
  ) => void;
  onOpenProjects: () => void;
  onDragStartMilestone?: (data: MilestoneDragData) => void;
  onDragEndMilestone?: () => void;
}

export const WaitingMilestonesDrawer: React.FC<WaitingMilestonesDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  blocks,
  categories,
  selectedDate,
  onScheduleMilestone,
  onOpenProjects,
  onDragStartMilestone,
  onDragEndMilestone,
}) => {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDateString = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  }, [selectedDate]);

  // Extraire tous les jalons non complétés des projets actifs (non archivés)
  const allWaitingMilestones = useMemo(() => {
    const list: Array<
      MilestoneDragData & {
        projectStatus: string;
        isScheduledToday: boolean;
        scheduledTime?: string;
      }
    > = [];

    projects
      .filter((p) => !p.archived && p.status !== 'completed')
      .forEach((project) => {
        project.milestones
          .filter((m) => !m.completed)
          .forEach((m) => {
            // Vérifier si un bloc d'activité existe déjà pour ce jalon aujourd'hui
            const matchingBlock = blocks.find(
              (b) =>
                b.projectId === project.id &&
                b.date === selectedDateString &&
                (b.title.toLowerCase().includes(m.title.toLowerCase()) ||
                  m.title.toLowerCase().includes(b.title.toLowerCase()))
            );

            list.push({
              milestoneId: m.id,
              title: m.title,
              projectId: project.id,
              projectTitle: project.title,
              domain: project.domain,
              projectStatus: project.status,
              isScheduledToday: !!matchingBlock,
              scheduledTime: matchingBlock?.startTime,
            });
          });
      });

    return list;
  }, [projects, blocks, selectedDateString]);

  // Filtrage par projet et recherche
  const filteredMilestones = useMemo(() => {
    return allWaitingMilestones.filter((m) => {
      const matchesProject =
        selectedProjectFilter === 'all' || m.projectId === selectedProjectFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesSearch;
    });
  }, [allWaitingMilestones, selectedProjectFilter, searchQuery]);

  // Trouver la configuration du pilier
  const getCategory = (domainId: string): DomainConfig => {
    if (domainId === 'unassigned' || domainId === 'none' || !domainId) {
      return {
        id: 'unassigned',
        name: 'Sans pilier',
        label: 'Libre',
        color: '#94A3B8',
        iconName: 'Compass',
      };
    }
    const found = categories.find((c) => c.id === domainId);
    if (found) return found;
    return {
      id: domainId,
      name: domainId,
      label: 'Pilier',
      color: '#6C5CE7',
      iconName: 'Sparkles',
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop sombre transparent */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Panneau latéral / Tiroir */}
      <aside
        id="waiting-milestones-drawer"
        className="relative w-full sm:w-[440px] bg-[var(--bg-surface)] border-l border-[var(--border-card)] shadow-2xl flex flex-col h-full z-10 transition-transform animate-in slide-in-from-right duration-200"
      >
        {/* En-tête du tiroir */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Jalons Bento en attente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#6C5CE7] text-white font-mono">
                  {allWaitingMilestones.length}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Glissez sur un créneau ou cliquez pour planifier
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-milestones-drawer"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-card)] transition cursor-pointer"
            aria-label="Fermer le tiroir"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Astuce visuelle de Glisser-Déposer */}
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/10 via-[#00CEC9]/10 to-transparent border border-[#6C5CE7]/20 flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
          <div className="w-7 h-7 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center shrink-0 text-[#6C5CE7]">
            <Zap className="w-4 h-4" />
          </div>
          <div className="leading-snug text-[11px]">
            <span className="font-bold text-[#A29BFE]">Drag & Drop instantané :</span> Attrapez un
            jalon avec la poignée <GripVertical className="w-3 h-3 inline text-[var(--text-muted)]" /> et
            déposez-le directement sur une heure de la timeline !
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="p-4 space-y-2.5 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filtrer les jalons (ex: React, Panier)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sélecteur de projet */}
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              aria-label="Filtrer par projet"
              className="bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[#6C5CE7] max-w-[140px] truncate"
            >
              <option value="all">Tous ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des jalons */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMilestones.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[var(--bg-surface-elevated)] border border-dashed border-[var(--border-card)] flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-[#55E6C1]/10 text-[#55E6C1] flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {searchQuery || selectedProjectFilter !== 'all'
                  ? 'Aucun jalon ne correspond au filtre.'
                  : 'Tous les jalons sont complétés !'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[260px]">
                {allWaitingMilestones.length === 0
                  ? 'Vos projets Bento sont à jour. Créez un nouveau projet ou ajoutez de nouveaux jalons.'
                  : 'Modifiez vos filtres pour afficher les autres jalons.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProjects();
                }}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4bc4] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ouvrir les Projets Bento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            filteredMilestones.map((m) => {
              const cat = getCategory(m.domain);
              const PillarIcon = getPillarIcon(cat.iconName);

              return (
                <div
                  key={`${m.projectId}-${m.milestoneId}`}
                  draggable={true}
                  onDragStart={(e) => {
                    const payload: MilestoneDragData = {
                      milestoneId: m.milestoneId,
                      title: m.title,
                      projectId: m.projectId,
                      projectTitle: m.projectTitle,
                      domain: m.domain,
                    };
                    e.dataTransfer.setData(
                      'application/spectrum-milestone',
                      JSON.stringify(payload)
                    );
                    e.dataTransfer.setData('text/plain', m.title);
                    e.dataTransfer.effectAllowed = 'copyMove';

                    if (onDragStartMilestone) {
                      onDragStartMilestone(payload);
                    }
                  }}
                  onDragEnd={() => {
                    if (onDragEndMilestone) {
                      onDragEndMilestone();
                    }
                  }}
                  className={`group relative bg-[var(--bg-surface-elevated)] border rounded-2xl p-3.5 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-[#6C5CE7] hover:shadow-md ${
                    m.isScheduledToday
                      ? 'border-[#55E6C1]/40 bg-[#55E6C1]/5'
                      : 'border-[var(--border-card)]'
                  }`}
                >
                  {/* Badge & Projet */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}35`,
                          color: cat.color,
                        }}
                      >
                        <PillarIcon className="w-3 h-3" />
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                        • {m.projectTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {m.isScheduledToday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#55E6C1] bg-[#55E6C1]/15 px-2 py-0.5 rounded-full border border-[#55E6C1]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Prévu à {m.scheduledTime}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-0.5">
                          <GripVertical className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[#6C5CE7] transition" />
                          <span className="hidden group-hover:inline">Glisser</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Titre du jalon */}
                  <h4 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                    {m.title}
                  </h4>

                  {/* Raccourcis rapides de planification (1 clic sans drag & drop) */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-card)] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#6C5CE7]" />
                      <span>Planifier à :</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {['09:00', '14:00', '16:30', '20:00'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onScheduleMilestone(m, time, 90);
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-[var(--bg-surface)] hover:bg-[#6C5CE7] hover:text-white border border-[var(--border-card)] hover:border-[#6C5CE7] text-[var(--text-secondary)] transition cursor-pointer"
                          title={`Créer un bloc de 90m démarrant à ${time}`}
                        >
                          {time}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleMilestone(m, undefined, 90);
                        }}
                        className="p-1 rounded-lg text-[10px] bg-[#6C5CE7]/15 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 transition cursor-pointer"
                        title="Planifier au prochain créneau disponible"
                      >
                        <CalendarPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de page du tiroir */}
        <div className="p-3.5 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProjects();
            }}
            className="text-[11px] font-semibold text-[#6C5CE7] hover:underline flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gérer les projets Bento</span>
          </button>

          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {allWaitingMilestones.length} jalon(s) disponible(s)
          </span>
        </div>
      </aside>
    </div>
  );
};
