import React from 'react';
import { DomainConfig, TimeBlock, Project } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import { Plus, Settings2, Sparkles, ChevronRight, Calendar, Layers } from 'lucide-react';

interface CategoriesExplorationGridProps {
  categories: DomainConfig[];
  blocks?: TimeBlock[];
  projects?: Project[];
  onSelectCategory?: (categoryId: string) => void;
  onOpenManagePillars: () => void;
  onQuickAddBlockForPillar?: (categoryId: string) => void;
}

export const CategoriesExplorationGrid: React.FC<CategoriesExplorationGridProps> = ({
  categories,
  blocks = [],
  projects = [],
  onSelectCategory,
  onOpenManagePillars,
  onQuickAddBlockForPillar,
}) => {
  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#6C5CE7]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Piliers & Catégories (Luma Style)
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenManagePillars}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95"
            title="Gérer les piliers et couleurs"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Gérer les Piliers</span>
          </button>
        </div>
      </div>

      {/* Grid of Luma Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {categories.map((cat, index) => {
          const Icon = getPillarIcon(cat.iconName);
          const pillarBlocks = blocks.filter((b) => b.domain === cat.id);
          const pillarProjects = projects.filter((p) => p.domain === cat.id);

          return (
            <div
              key={cat.id || index}
              onClick={(e) => {
                e.preventDefault();
                if (onQuickAddBlockForPillar && cat?.id) {
                  onQuickAddBlockForPillar(cat.id);
                } else if (onSelectCategory && cat?.id) {
                  onSelectCategory(cat.id);
                }
              }}
              className="group relative p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* Subtle top accent gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{ backgroundColor: cat.color || '#6C5CE7' }}
              />

              <div>
                {/* Icon & Quick Add */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: `${cat.color || '#6C5CE7'}18`,
                      color: cat.color || '#6C5CE7',
                    }}
                  >
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>

                  {onQuickAddBlockForPillar && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (cat?.id) {
                          onQuickAddBlockForPillar(cat.id);
                        }
                      }}
                      className="w-7 h-7 rounded-xl flex items-center justify-center bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)] transition active:scale-95 cursor-pointer"
                      title={`Planifier un bloc pour ${cat.name || 'ce pilier'}`}
                      aria-label={`Ajouter un bloc pour ${cat.name || 'ce pilier'}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Title & Label */}
                <h4 className="font-bold text-sm text-[var(--text-primary)] tracking-tight group-hover:text-[#6C5CE7] transition">
                  {cat.name || 'Pilier sans titre'}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                  {cat.label || 'Axe multipotentiel'}
                </p>
              </div>

              {/* Bottom stats badges */}
              <div className="mt-4 pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1" title="Créneaux prévus">
                    <Calendar className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span>{pillarBlocks.length} session{pillarBlocks.length > 1 ? 's' : ''}</span>
                  </span>
                  {pillarProjects.length > 0 && (
                    <span className="flex items-center gap-1" title="Projets Bento">
                      <Layers className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span>{pillarProjects.length} proj.</span>
                    </span>
                  )}
                </div>

                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
