import React, { useState } from 'react';
import { DomainId, Project } from '../types';
import { DOMAINS } from '../data/mockData';
import { X, Plus, Target, Tag } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Omit<Project, 'id'>) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<DomainId>('tech');
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
      description: description.trim() || 'Projet à long terme dans l\'écosystème multipotentiel.',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] w-full max-w-lg p-6 text-[#EDEDED] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#2E2E38]">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#55E6C1]" />
            <h2 className="text-lg font-bold">Nouveau Grand Projet (Bento)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0A0AB] hover:text-white hover:bg-[#282830] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Domain Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-2 uppercase tracking-wider">
              Pilier d'appartenance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DOMAINS) as DomainId[]).map((dId) => {
                const cfg = DOMAINS[dId];
                const isSelected = domain === dId;
                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => setDomain(dId)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'text-white shadow-lg'
                        : 'border-[#2E2E38] text-[#A0A0AB] bg-[#121214]/60 hover:bg-[#121214]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cfg.bgRgba : undefined,
                      borderColor: isSelected ? cfg.color : undefined,
                    }}
                  >
                    <span style={{ color: isSelected ? cfg.color : undefined }}>
                      {cfg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider">
              Titre du Projet
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Album Conceptuel ou Micro-SaaS..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#55E6C1]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider">
              Vision &amp; Description
            </label>
            <textarea
              rows={2}
              placeholder="Enjeu créatif ou technologique..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#55E6C1]"
            />
          </div>

          {/* Bento Size & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                Format Bento
              </label>
              <select
                value={bentoSize}
                onChange={(e) => setBentoSize(e.target.value as any)}
                className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-3 py-2 text-sm text-[#EDEDED] focus:outline-none focus:border-[#55E6C1]"
              >
                <option value="large">Grand format (Large)</option>
                <option value="medium">Moyen format (Medium)</option>
                <option value="small">Compact (Small)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags (séparés par virgule)
              </label>
              <input
                type="text"
                placeholder="Flutter, UI, VST..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-3 py-2 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#55E6C1]"
              />
            </div>
          </div>

          {/* Milestone */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AB] mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Première étape clé (Milestone)
            </label>
            <input
              type="text"
              placeholder="Ex: Sortie de la maquette Alpha..."
              value={firstMilestone}
              onChange={(e) => setFirstMilestone(e.target.value)}
              className="w-full bg-[#121214] border border-[#2E2E38] rounded-xl px-4 py-2 text-sm text-[#EDEDED] placeholder-[#71717A] focus:outline-none focus:border-[#55E6C1]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#2E2E38]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#A0A0AB] hover:bg-[#282830]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#55E6C1] hover:bg-[#43d4af] text-[#121214] shadow-lg shadow-[#55E6C1]/25"
            >
              <Plus className="w-4 h-4" />
              Ajouter au Bento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
