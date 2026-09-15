import React, { useState } from 'react';
import { DomainConfig } from '../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  Compass,
  ArrowRight,
  Layers,
  Palette as PaletteIcon,
  X,
  Info,
} from 'lucide-react';
import {
  PILLAR_ICON_DEFINITIONS,
  PRESET_PILLAR_COLORS,
  getPillarIcon,
} from '../utils/iconMap';

interface InitialPillarsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePillars: (pillars: DomainConfig[]) => Promise<void>;
  initialCategories?: DomainConfig[];
  userEmail?: string | null;
}

// Suggestions d'inspiration facultatives pour guider sans imposer
const INSPIRATION_SUGGESTIONS: Omit<DomainConfig, 'id'>[] = [
  {
    name: 'Tech & Code',
    label: 'Architecture, dev & algorithmes',
    color: '#6C5CE7',
    iconName: 'Terminal',
    description: 'Systèmes logiciels, programmation, deep work technique.',
  },
  {
    name: 'Art & Création',
    label: 'Musique, design & flow créatif',
    color: '#FF7675',
    iconName: 'Flame',
    description: 'Production artistique, beatmaking, UI/UX, composition.',
  },
  {
    name: 'Sport & Santé',
    label: 'Entraînement, vitalité & repos',
    color: '#55E6C1',
    iconName: 'Dumbbell',
    description: 'Cardio, musculation, mobilité, sommeil réparateur.',
  },
  {
    name: 'Business & Pro',
    label: 'Stratégie, clients & projets',
    color: '#0984E3',
    iconName: 'Briefcase',
    description: 'Gestion d’activité, développement commercial, partenariats.',
  },
  {
    name: 'Savoir & Études',
    label: 'Veille, lecture & recherche',
    color: '#FDCB6E',
    iconName: 'BookOpen',
    description: 'Apprentissages continus, lectures inspirantes, veille.',
  },
  {
    name: 'Famille & Vie perso',
    label: 'Relations, bien-être & maison',
    color: '#FD79A8',
    iconName: 'Heart',
    description: 'Moments partagés, vie de famille, ressourcement.',
  },
  {
    name: 'Écriture & Pensée',
    label: 'Articles, journal & idées',
    color: '#10AC84',
    iconName: 'Feather',
    description: 'Rédaction, décharge mentale, notes de réflexion.',
  },
];

export const InitialPillarsSetupModal: React.FC<InitialPillarsSetupModalProps> = ({
  isOpen,
  onClose,
  onSavePillars,
  initialCategories = [],
  userEmail,
}) => {
  const [pillarsList, setPillarsList] = useState<DomainConfig[]>(() => {
    return initialCategories.length > 0 ? [...initialCategories] : [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState('#6C5CE7');
  const [formIconName, setFormIconName] = useState('Sparkles');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const openNewPillarForm = () => {
    setEditingPillarId(null);
    setFormName('');
    setFormLabel('');
    setFormColor(PRESET_PILLAR_COLORS[pillarsList.length % PRESET_PILLAR_COLORS.length].hex);
    setFormIconName('Sparkles');
    setFormDescription('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditPillarForm = (pillar: DomainConfig) => {
    setEditingPillarId(pillar.id);
    setFormName(pillar.name);
    setFormLabel(pillar.label || '');
    setFormColor(pillar.color || '#6C5CE7');
    setFormIconName(pillar.iconName || 'Sparkles');
    setFormDescription(pillar.description || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSavePillarForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Le nom du pilier est requis.');
      return;
    }

    if (editingPillarId) {
      setPillarsList((prev) =>
        prev.map((p) =>
          p.id === editingPillarId
            ? {
                ...p,
                name: trimmed,
                label: formLabel.trim(),
                color: formColor,
                iconName: formIconName,
                description: formDescription.trim(),
              }
            : p
        )
      );
    } else {
      const newPillar: DomainConfig = {
        id: `pillar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        label: formLabel.trim() || 'Domaine de vie',
        color: formColor,
        iconName: formIconName,
        description: formDescription.trim(),
        order: pillarsList.length,
        createdAt: new Date().toISOString(),
      };
      setPillarsList((prev) => [...prev, newPillar]);
    }

    setIsFormOpen(false);
    setEditingPillarId(null);
    setFormError(null);
  };

  const handleAddInspiration = (item: Omit<DomainConfig, 'id'>) => {
    // Vérifier si déjà présent par nom
    if (pillarsList.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
      return;
    }
    const newPillar: DomainConfig = {
      id: `pillar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      label: item.label,
      color: item.color,
      iconName: item.iconName,
      description: item.description,
      order: pillarsList.length,
      createdAt: new Date().toISOString(),
    };
    setPillarsList((prev) => [...prev, newPillar]);
  };

  const handleDeletePillar = (id: string) => {
    setPillarsList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSavePillars(pillarsList);
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement piliers initiaux:', err);
      setFormError('Une erreur est survenue lors de l’enregistrement de vos piliers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIconComp = getPillarIcon(formIconName);

  return (
    <div
      id="initial-pillars-setup-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl border border-[var(--border-card)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] via-[#0984E3] to-[#55E6C1] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#6C5CE7]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Vos Piliers Personnalisés
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30">
                  100% sur-mesure
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {userEmail
                  ? `Bienvenue ${userEmail} — aucun pilier imposé par défaut`
                  : 'Définissez librement vos domaines d’énergie et de focus'}
              </p>
            </div>
          </div>

          <button
            id="close-pillars-setup-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
            title="Passer ou fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {formError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Formulaire de création / édition de pilier */}
          {isFormOpen ? (
            <form onSubmit={handleSavePillarForm} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-card)]">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <PaletteIcon className="w-4 h-4 text-[#6C5CE7]" />
                  <span>
                    {editingPillarId ? 'Modifier le pilier' : 'Nouveau pilier sur-mesure'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              {/* Aperçu en temps réel */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ backgroundColor: `${formColor}20`, color: formColor }}
                >
                  <SelectedIconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">
                      {formName.trim() || 'Titre du pilier'}
                    </span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${formColor}20`, color: formColor }}
                    >
                      Aperçu
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {formLabel.trim() || 'Axe / Sous-titre'}
                  </p>
                </div>
              </div>

              {/* Champs Nom et Sous-titre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                    Nom du pilier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Dev, Musique, Sport, Famille, Business..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">
                    Sous-titre / Axe (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Ex: Flow & Création, Santé & Énergie..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
                  />
                </div>
              </div>

              {/* Sélecteur de couleur */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                  Couleur d'accent
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_PILLAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormColor(c.hex)}
                      className={`w-7 h-7 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${
                        formColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-[var(--text-primary)] shadow-md'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {formColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 pl-1">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-7 h-7 rounded-xl cursor-pointer border border-[var(--border-card)] bg-transparent"
                      title="Couleur personnalisée"
                    />
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {formColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sélecteur d'icône */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                  Icône représentative
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                  {PILLAR_ICON_DEFINITIONS.map((def) => {
                    const Icon = def.icon;
                    const isSelected = formIconName === def.name;
                    return (
                      <button
                        key={def.name}
                        type="button"
                        onClick={() => setFormIconName(def.name)}
                        className={`p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6C5CE7] text-white shadow-sm font-bold scale-105'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                        }`}
                        title={def.label}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[8px] truncate max-w-[50px]">
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
                  Description / Intention (optionnelle)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ce que ce domaine représente pour votre équilibre..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {editingPillarId ? 'Mettre à jour' : 'Ajouter ce pilier'}
                </button>
              </div>
            </form>
          ) : (
            /* Liste des piliers configurés */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <span>Vos Piliers Actuels</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-bold">
                      {pillarsList.length}
                    </span>
                  </h3>
                </div>

                <button
                  id="add-custom-pillar-button"
                  type="button"
                  onClick={openNewPillarForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold shadow-sm hover:bg-[#5b4bc4] transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Créer un pilier</span>
                </button>
              </div>

              {/* Si aucun pilier encore créé */}
              {pillarsList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--bg-surface-elevated)]/60 border border-dashed border-[var(--border-card)] text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/15 text-[#6C5CE7] mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      Aucun pilier pré-établi
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1 leading-relaxed">
                      Vous avez carte blanche. Créez vos propres piliers de vie de zéro, ou piochez ci-dessous quelques inspirations à adapter en un clic.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openNewPillarForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4bc4] transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer mon premier pilier de zéro</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pillarsList.map((pillar) => {
                    const Icon = getPillarIcon(pillar.iconName);
                    return (
                      <div
                        key={pillar.id}
                        className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition flex items-center justify-between gap-2.5 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${pillar.color}20`,
                              color: pillar.color,
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate text-[var(--text-primary)]">
                              {pillar.name}
                            </h4>
                            <p className="text-[11px] text-[var(--text-secondary)] truncate">
                              {pillar.label || 'Domaine'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditPillarForm(pillar)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#6C5CE7] hover:bg-[var(--bg-surface)] transition cursor-pointer"
                            title="Modifier ce pilier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePillar(pillar.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Supprimer ce pilier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Suggestions d'inspiration facultatives */}
              <div className="pt-3 border-t border-[var(--border-card)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#55E6C1]" />
                    <span>Suggestions d'inspiration (cliquez pour ajouter &amp; adapter)</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_SUGGESTIONS.map((sug) => {
                    const isAlreadyAdded = pillarsList.some(
                      (p) => p.name.toLowerCase() === sug.name.toLowerCase()
                    );
                    const SugIcon = getPillarIcon(sug.iconName);

                    return (
                      <button
                        key={sug.name}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddInspiration(sug)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isAlreadyAdded
                            ? 'opacity-40 border-transparent bg-[var(--bg-surface-elevated)] cursor-default'
                            : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)] hover:border-[#6C5CE7] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] active:scale-95'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sug.color }}
                        />
                        <SugIcon className="w-3 h-3 text-[var(--text-secondary)]" />
                        <span>{sug.name}</span>
                        {!isAlreadyAdded && <Plus className="w-3 h-3 text-[#6C5CE7]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-card)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              // Permettre de commencer avec 0 pilier (projets libres uniquement)
              setIsSubmitting(true);
              try {
                await onSavePillars([]);
                onClose();
              } catch (_) {
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
          >
            Je préfère commencer sans pilier
          </button>

          <button
            id="validate-custom-pillars-button"
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/25 hover:brightness-110 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? 'Enregistrement…'
                : pillarsList.length > 0
                ? `Valider mes ${pillarsList.length} piliers & Démarrer`
                : 'Commencer mon organisation'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
