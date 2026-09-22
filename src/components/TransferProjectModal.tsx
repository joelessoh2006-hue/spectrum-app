import React, { useState } from 'react';
import { Project, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import { X, ArrowRightLeft, Check, Sparkles, FolderSync, Info } from 'lucide-react';

interface TransferProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  categories?: DomainConfig[];
  onTransferProject: (projectId: string, newDomainId: string, options?: { updateTimeBlocksDomain?: boolean }) => void;
}

export const TransferProjectModal: React.FC<TransferProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  categories,
  onTransferProject,
}) => {
  const activeCategories: DomainConfig[] = React.useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return Object.values(DOMAINS).map((d) => ({
      id: d.id,
      name: d.name,
      label: d.label,
      color: d.color,
      colorSecondary: d.colorSecondary,
      bgRgba: d.bgRgba,
      borderRgba: d.borderRgba,
      iconName: d.id === 'tech' ? 'Terminal' : d.id === 'art' ? 'Flame' : 'Compass',
    }));
  }, [categories]);

  const [targetPillarId, setTargetPillarId] = useState<string>('');
  const [updateLinkedBlocks, setUpdateLinkedBlocks] = useState<boolean>(true);

  React.useEffect(() => {
    if (project) {
      // Pré-sélectionner un autre pilier disponible
      const currentDomain = project.domain;
      const other = activeCategories.find((c) => c.id !== currentDomain);
      setTargetPillarId(other ? other.id : currentDomain);
    }
  }, [project, activeCategories]);

  if (!isOpen || !project) return null;

  const currentCategory = activeCategories.find((c) => c.id === project.domain) || {
    id: project.domain,
    name: project.domain,
    color: '#6C5CE7',
    iconName: 'Compass',
  };

  const targetCategory = activeCategories.find((c) => c.id === targetPillarId) || currentCategory;
  const CurrentIcon = getPillarIcon(currentCategory.iconName);
  const TargetIcon = getPillarIcon(targetCategory.iconName);

  const isSamePillar = targetPillarId === project.domain;

  const handleConfirm = () => {
    if (isSamePillar) return;
    onTransferProject(project.id, targetPillarId, { updateTimeBlocksDomain: updateLinkedBlocks });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-lg flex flex-col text-[var(--text-primary)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-card)] flex items-start justify-between gap-3 bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Transférer le projet
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Changer le pilier de rattachement de ce projet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Project preview card */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Projet sélectionné
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Transfer Visual Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* From */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${currentCategory.color}20`,
                  color: currentCategory.color,
                }}
              >
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Pilier actuel</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {currentCategory.name}
                </div>
              </div>
            </div>

            {/* To */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 flex items-center gap-3 transition-all"
              style={{
                borderColor: isSamePillar ? 'var(--border-card)' : targetCategory.color,
                backgroundColor: isSamePillar ? 'var(--bg-surface-elevated)' : `${targetCategory.color}08`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: `${targetCategory.color}20`,
                  color: targetCategory.color,
                }}
              >
                <TargetIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Nouveau pilier</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {targetCategory.name}
                </div>
              </div>
            </div>
          </div>

          {/* Pillars Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
              Sélectionnez le pilier de destination :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-thin">
              {activeCategories.map((cat) => {
                const Icon = getPillarIcon(cat.iconName);
                const isSelected = targetPillarId === cat.id;
                const isCurrent = project.domain === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTargetPillarId(cat.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 ring-1 ring-[#6C5CE7]'
                        : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)] hover:border-[var(--border-highlight)]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {cat.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-card)] shrink-0">
                            Actuel
                          </span>
                        )}
                      </div>
                      {cat.label && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {cat.label}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#6C5CE7] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option: Re-domain linked activities */}
          <div className="pt-2 border-t border-[var(--border-card)]">
            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:bg-[var(--bg-surface)] transition">
              <input
                type="checkbox"
                checked={updateLinkedBlocks}
                onChange={(e) => setUpdateLinkedBlocks(e.target.checked)}
                className="mt-0.5 rounded text-[#6C5CE7] focus:ring-[#6C5CE7] cursor-pointer"
              />
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
                  Mettre à jour aussi les activités liées dans l'Agenda
                </span>
                Réaligne la couleur et le pilier des blocs de temps déjà programmés pour ce projet vers le nouveau pilier.
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-card)] flex items-center justify-end gap-2.5 bg-[var(--bg-surface-elevated)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={isSamePillar}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isSamePillar ? '#6C5CE7' : targetCategory.color,
            }}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transférer vers {targetCategory.name}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
