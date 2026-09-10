import React, { useState, useMemo } from 'react';
import { DomainId, Project, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import { X, Plus, Target, Tag } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Omit<Project, 'id'>) => void;
  categories?: DomainConfig[];
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  categories,
}) => {
  const activeCategories: DomainConfig[] = useMemo(() => {
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

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<string>(activeCategories[0]?.id || 'tech');
  const [description, setDescription] = useState('');
  const [bentoSize, setBentoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [firstMilestone, setFirstMilestone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const milestones = firstMilestone.trim()
      ? [
          { id: `m-${Date.now()}-1`, title: firstMilestone.trim(), completed: false },
          { id: `m-${Date.now()}-2`, title: 'Finalisation et revue', completed: false },
        ]
      : [{ id: `m-${Date.now()}-1`, title: 'Cadrage initial du projet', completed: true }];

    onAdd({
      title: title.trim(),
      domain,
      description: description.trim() || "Projet à long terme dans l'écosystème multipotentiel.",
      progress: 25,
      status: 'in_progress',
      bentoSize,
      tags: tags.length ? tags : ['Multipotentiel', 'Sprint'],
      milestones,
    });

    setTitle('');
    setDescription('');
    setTagsInput('');
    setFirstMilestone('');
    onClose();
  };

  const selectedCat = activeCategories.find((c) => c.id === domain) || activeCategories[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-lg p-6 text-[var(--text-primary)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: selectedCat?.color || '#6C5CE7' }}
            />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Nouveau Grand Projet (Bento)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Domain Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
              Pilier d'appartenance
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeCategories.map((cat) => {
                const isSelected = domain === cat.id;
                const Icon = getPillarIcon(cat.iconName);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDomain(cat.id)}
                    className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : 'border-[var(--border-card)] text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] hover:border-[var(--border-highlight)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.color : undefined,
                      borderColor: isSelected ? cat.color : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Titre du Projet
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Album Conceptuel ou Micro-SaaS..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
              Vision & Description
            </label>
            <textarea
              rows={2}
              placeholder="Enjeu créatif ou technologique..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Bento Size & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                Format Bento
              </label>
              <select
                value={bentoSize}
                onChange={(e) => setBentoSize(e.target.value as any)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
              >
                <option value="large">Grand format (Large)</option>
                <option value="medium">Moyen format (Medium)</option>
                <option value="small">Compact (Small)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <input
                type="text"
                placeholder="Flutter, UI, VST..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Première étape clé (Milestone)
            </label>
            <input
              type="text"
              placeholder="Ex: Sortie de la maquette Alpha..."
              value={firstMilestone}
              onChange={(e) => setFirstMilestone(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-md shadow-[#6C5CE7]/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter au Bento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
