import React, { useState } from 'react';
import { DomainConfig } from '../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  Layers,
  Palette as PaletteIcon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  PILLAR_ICON_DEFINITIONS,
  PRESET_PILLAR_COLORS,
  getPillarIcon,
} from '../utils/iconMap';

interface ManagePillarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DomainConfig[];
  onSaveCategory: (category: DomainConfig) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

export const ManagePillarsModal: React.FC<ManagePillarsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<DomainConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState('#6C5CE7');
  const [formIconName, setFormIconName] = useState('Sparkles');
  const [formDescription, setFormDescription] = useState('');

  if (!isOpen) return null;

  const startEdit = (cat: DomainConfig) => {
    setEditingCategory(cat);
    setIsCreatingNew(false);
    setFormName(cat.name);
    setFormLabel(cat.label || '');
    setFormColor(cat.color || '#6C5CE7');
    setFormIconName(cat.iconName || 'Sparkles');
    setFormDescription(cat.description || '');
    setError(null);
  };

  const startCreate = () => {
    setIsCreatingNew(true);
    setEditingCategory(null);
    setFormName('');
    setFormLabel('');
    setFormColor('#0984E3');
    setFormIconName('Sparkles');
    setFormDescription('');
    setError(null);
  };

  const cancelEditOrCreate = () => {
    setEditingCategory(null);
    setIsCreatingNew(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Le titre du pilier est obligatoire');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreatingNew) {
        const newId = `pillar-${Date.now()}`;
        const newCategory: DomainConfig = {
          id: newId,
          name: formName.trim(),
          label: formLabel.trim() || 'Pilier de vie',
          color: formColor,
          iconName: formIconName,
          description: formDescription.trim(),
          order: categories.length + 1,
          createdAt: new Date().toISOString(),
        };
        await onSaveCategory(newCategory);
      } else if (editingCategory) {
        const updatedCategory: DomainConfig = {
          ...editingCategory,
          name: formName.trim(),
          label: formLabel.trim(),
          color: formColor,
          iconName: formIconName,
          description: formDescription.trim(),
        };
        await onSaveCategory(updatedCategory);
      }

      setIsCreatingNew(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Erreur enregistrement pilier:', err);
      setError('Impossible d’enregistrer le pilier.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (catId: string) => {
    if (categories.length <= 1) {
      setError('Vous devez conserver au moins un pilier d’activité.');
      return;
    }
    setIsSaving(true);
    try {
      await onDeleteCategory(catId);
      setDeleteConfirmId(null);
      if (editingCategory?.id === catId) {
        setEditingCategory(null);
      }
    } catch (err) {
      console.error('Erreur suppression pilier:', err);
      setError('Impossible de supprimer ce pilier.');
    } finally {
      setIsSaving(false);
    }
  };

  const SelectedIconComp = getPillarIcon(formIconName);

  return (
    <div
      id="manage-pillars-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl border border-[var(--border-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-card)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] p-[1.5px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#6C5CE7]" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Piliers & Catégories
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Personnalisez vos domaines d’équilibre multipotentiel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* If Editing or Creating */}
          {editingCategory || isCreatingNew ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <PaletteIcon className="w-4 h-4 text-[#6C5CE7]" />
                  <span>
                    {isCreatingNew ? 'Nouveau Pilier' : `Modifier « ${editingCategory?.name} »`}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={cancelEditOrCreate}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                >
                  Retour à la liste
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform"
                    style={{ backgroundColor: `${formColor}20`, color: formColor }}
                  >
                    <SelectedIconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {formName.trim() || 'Titre du pilier'}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${formColor}20`, color: formColor }}
                      >
                        Aperçu
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formLabel.trim() || 'Sous-titre / Axe de focus'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                    Nom du pilier *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Tech / Dev, Art / Rap, Sport..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-sm focus:outline-none focus:border-[#6C5CE7] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                    Sous-titre / Axe
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Ex: Code & Systèmes, Flow & Création..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-sm focus:outline-none focus:border-[#6C5CE7] transition"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                  Couleur d’accentuation
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {PRESET_PILLAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormColor(c.hex)}
                      className={`w-8 h-8 rounded-xl transition-all relative flex items-center justify-center ${
                        formColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-[var(--text-primary)] shadow-md'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {formColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}

                  {/* Custom Hex Picker Input */}
                  <div className="flex items-center gap-1.5 pl-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded-xl cursor-pointer border border-[var(--border-card)] bg-transparent"
                      title="Couleur personnalisée"
                    />
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {formColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                  Icône illustrative (Style iOS / Luma)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                  {PILLAR_ICON_DEFINITIONS.map((def) => {
                    const Icon = def.icon;
                    const isSelected = formIconName === def.name;
                    return (
                      <button
                        key={def.name}
                        type="button"
                        onClick={() => setFormIconName(def.name)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#6C5CE7] text-white shadow-sm scale-105 font-bold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                        }`}
                        title={def.label}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[9px] truncate max-w-[55px]">
                          {def.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                  Description / Intention
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ce que ce pilier représente dans votre équilibre de vie..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-sm focus:outline-none focus:border-[#6C5CE7] transition resize-none"
                />
              </div>

              {/* Actions Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-card)]">
                <button
                  type="button"
                  onClick={cancelEditOrCreate}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement…' : isCreatingNew ? 'Créer le pilier' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          ) : (
            /* Pillar List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Piliers enregistrés ({categories.length})
                </span>
                <button
                  id="add-pillar-btn"
                  onClick={startCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-semibold shadow-sm hover:bg-[#5b4bc4] transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un pilier</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const Icon = getPillarIcon(cat.iconName);
                  const isConfirmingDelete = deleteConfirmId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold truncate">{cat.name}</h4>
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                          </div>
                          {cat.label && (
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {cat.label}
                            </p>
                          )}
                          {cat.description && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-sm mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 animate-in fade-in">
                            <button
                              onClick={() => handleDelete(cat.id)}
                              disabled={isSaving}
                              className="px-2.5 py-1 rounded-xl bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] text-[11px]"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface)] transition"
                              title="Modifier ce pilier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {categories.length > 1 && (
                              <button
                                onClick={() => setDeleteConfirmId(cat.id)}
                                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition"
                                title="Supprimer ce pilier"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 sm:px-6 py-3 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-card)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#55E6C1]" />
            <span>Synchronisé en temps réel dans votre profil Firestore (users/{'{userId}'}/categories)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
