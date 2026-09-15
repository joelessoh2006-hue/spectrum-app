import React, { useState, useMemo } from 'react';
import { DomainId, Project, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { getPillarIcon } from '../utils/iconMap';
import { X, Plus, Target, Tag, Trash2, CheckCircle2, Circle, Compass, FileText, ClipboardList } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Omit<Project, 'id'>) => void;
  categories?: DomainConfig[];
}

interface DraftMilestone {
  title: string;
  completed: boolean;
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
  const [initialNotes, setInitialNotes] = useState('');
  const [bentoSize, setBentoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [milestonesList, setMilestonesList] = useState<DraftMilestone[]>([
    { title: 'Cadrage initial du projet', completed: false },
    { title: 'Sortie du premier prototype', completed: false },
  ]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  // Live preview of progress based on checked milestones
  const completedCount = milestonesList.filter((m) => m.completed).length;
  const totalCount = milestonesList.length;
  const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  const handleAddMilestoneItem = (markAsCompleted = false) => {
    const trimmed = newMilestoneText.trim();
    if (!trimmed) return;
    setMilestonesList((prev) => [...prev, { title: trimmed, completed: markAsCompleted }]);
    setNewMilestoneText('');
  };

  const handleToggleMilestoneCompleted = (index: number) => {
    setMilestonesList((prev) =>
      prev.map((m, i) => (i === index ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleRemoveMilestoneItem = (index: number) => {
    setMilestonesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParseBulkMilestones = (replaceExisting = false) => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: DraftMilestone[] = [];

    for (const rawLine of lines) {
      let clean = rawLine;
      let completed = false;

      // Detect [x], [X], [ x ], - [x], etc.
      if (/^(-\s*)?\[\s*x\s*\]\s*/i.test(clean)) {
        completed = true;
        clean = clean.replace(/^(-\s*)?\[\s*x\s*\]\s*/i, '');
      } else if (/^(-\s*)?\[\s*\]\s*/.test(clean)) {
        completed = false;
        clean = clean.replace(/^(-\s*)?\[\s*\]\s*/, '');
      } else if (/^[-*•]\s+/.test(clean)) {
        clean = clean.replace(/^[-*•]\s+/, '');
      }

      clean = clean.trim();
      if (clean) {
        parsed.push({ title: clean, completed });
      }
    }

    if (parsed.length > 0) {
      if (replaceExisting) {
        setMilestonesList(parsed);
      } else {
        setMilestonesList((prev) => [...prev, ...parsed]);
      }
      setBulkPasteText('');
      setIsBulkPasteOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Merge any text typed in newMilestoneText if not yet clicked "+"
    const finalMilestonesDraft = [...milestonesList];
    if (newMilestoneText.trim() && !finalMilestonesDraft.some((m) => m.title === newMilestoneText.trim())) {
      finalMilestonesDraft.push({ title: newMilestoneText.trim(), completed: false });
    }

    const milestones =
      finalMilestonesDraft.length > 0
        ? finalMilestonesDraft.map((m, idx) => ({
            id: `m-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            title: m.title,
            completed: m.completed,
          }))
        : [{ id: `m-${Date.now()}-1`, title: 'Cadrage initial du projet', completed: false }];

    const doneItems = milestones.filter((m) => m.completed).length;
    const progress = milestones.length > 0 ? Math.round((doneItems / milestones.length) * 100) : 0;
    const status = progress === 100 ? 'completed' : 'in_progress';

    onAdd({
      title: title.trim(),
      domain,
      description: description.trim() || "Projet à long terme dans l'écosystème multipotentiel.",
      progress,
      status,
      bentoSize,
      tags: tags.length ? tags : ['Multipotentiel', 'Sprint'],
      milestones,
      notes: initialNotes.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setInitialNotes('');
    setTagsInput('');
    setMilestonesList([
      { title: 'Cadrage initial du projet', completed: false },
      { title: 'Sortie du premier prototype', completed: false },
    ]);
    setNewMilestoneText('');
    onClose();
  };

  const selectedCat = activeCategories.find((c) => c.id === domain) || activeCategories[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-lg p-6 text-[var(--text-primary)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
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
                    className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
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

              {/* Option Sans pilier / Projet Libre */}
              <button
                type="button"
                onClick={() => setDomain('unassigned')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  domain === 'unassigned'
                    ? 'bg-slate-700/80 border-slate-400 text-white shadow-sm'
                    : 'border-[var(--border-card)] text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 shrink-0 ${domain === 'unassigned' ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">Sans pilier (Libre)</span>
              </button>
            </div>

            {domain === 'unassigned' && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-400/30 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Projet Libre :</strong> Ce projet sera visible dans votre Bento sans impacter les quotas ni la répartition de vos piliers de vie.
                </span>
              </div>
            )}
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

          {/* Notes & Réflexions initiales (optionnel) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>Notes &amp; Ressources initiales (optionnel)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Liens utiles, réflexions, idées à explorer pour ce projet..."
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
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

          {/* Milestones / Tasks List with Checkboxes & Live Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Étapes clés &amp; Tâches initiales</span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  ({completedCount}/{totalCount})
                </span>
              </label>

              {/* Jauge et pourcentage en temps réel + Bouton Coller Liste */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkPasteOpen(!isBulkPasteOpen)}
                  className="text-[11px] font-bold text-[#6C5CE7] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>{isBulkPasteOpen ? 'Fermer import' : 'Coller une liste'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-300 rounded-full"
                      style={{ width: `${calculatedProgress}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      calculatedProgress > 0 ? 'text-[#00CEC9]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {calculatedProgress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Zone d'import rapide / collage de cours & leçons */}
            {isBulkPasteOpen && (
              <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[#6C5CE7]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#6C5CE7]" />
                    <span>Coller votre plan de cours / leçons</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Détecte auto <code className="text-[#00CEC9]">[x]</code> et <code className="text-[var(--text-secondary)]">[ ]</code>
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder={`Collez votre liste ici, ex :\n[x] Leçon 1 : Qu'est ce que la recherche + Exercice 1\n[x] Leçon 2 : Qu'est ce que la recherche scientifique\n[ ] Leçon 3 : Types de recherche...`}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono leading-relaxed focus:outline-none focus:border-[#6C5CE7]"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {bulkPasteText.split('\n').filter((l) => l.trim()).length} ligne(s) détectée(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleParseBulkMilestones(false)}
                      disabled={!bulkPasteText.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[#6C5CE7] disabled:opacity-40 transition cursor-pointer"
                    >
                      + Ajouter à la suite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleParseBulkMilestones(true)}
                      disabled={!bulkPasteText.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold hover:bg-[#5b4bc4] disabled:opacity-40 transition cursor-pointer shadow-sm"
                    >
                      Remplacer tout
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-[var(--text-muted)]">
              💡 Cochez dès maintenant les tâches déjà accomplies hors agenda : elles alimenteront la progression du projet dès sa création.
            </p>

            {/* Existing milestones in list */}
            {milestonesList.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {milestonesList.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all ${
                      m.completed
                        ? 'bg-[#55E6C1]/10 border-[#55E6C1]/30 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] text-[var(--text-primary)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleMilestoneCompleted(idx)}
                      className="flex items-center gap-2.5 flex-1 text-left cursor-pointer group"
                      title={m.completed ? 'Marquer comme non terminée' : 'Marquer comme déjà terminée'}
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00CEC9] shrink-0 fill-[#00CEC9]/20" />
                      ) : (
                        <Circle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#6C5CE7] shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          m.completed ? 'line-through text-[var(--text-muted)] font-medium' : 'font-normal'
                        }`}
                      >
                        {m.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {m.completed && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00CEC9]/15 text-[#00CEC9] font-mono">
                          Fait
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestoneItem(idx)}
                        className="text-[var(--text-muted)] hover:text-[#FF7675] p-1 rounded-lg transition cursor-pointer"
                        title="Supprimer cette étape"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add a new milestone */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ex: Première version du code, maquettes Figma..."
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestoneItem(false);
                  }
                }}
                className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
              />
              <button
                type="button"
                onClick={() => handleAddMilestoneItem(false)}
                disabled={!newMilestoneText.trim()}
                className="px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[#6C5CE7] hover:text-[#6C5CE7] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Ajouter à faire"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>À faire</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddMilestoneItem(true)}
                disabled={!newMilestoneText.trim()}
                className="px-3 py-2 rounded-xl bg-[#00CEC9]/15 border border-[#00CEC9]/40 text-xs font-bold text-[#00CEC9] hover:bg-[#00CEC9]/25 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Ajouter comme déjà fait"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Déjà fait</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border-card)]">
            <div className="text-xs text-[var(--text-muted)]">
              {calculatedProgress > 0 ? (
                <span className="font-semibold text-[#00CEC9]">
                  Démarrera à {calculatedProgress}% ({completedCount}/{totalCount} étapes finies)
                </span>
              ) : (
                <span>Démarrera à 0%</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                id="submit-add-project-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-md shadow-[#6C5CE7]/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter au Bento</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
