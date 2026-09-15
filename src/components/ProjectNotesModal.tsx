import React, { useState, useEffect } from 'react';
import { Project, ProjectQuickNote } from '../types';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Save,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface ProjectNotesModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (projectId: string, notes: string) => void;
  onAddQuickNote: (projectId: string, noteText: string) => void;
  onDeleteQuickNote: (projectId: string, noteId: string) => void;
  pillarName?: string;
  pillarColor?: string;
}

export const ProjectNotesModal: React.FC<ProjectNotesModalProps> = ({
  project,
  isOpen,
  onClose,
  onSaveNotes,
  onAddQuickNote,
  onDeleteQuickNote,
  pillarName = 'Projet Libre',
  pillarColor = '#6C5CE7',
}) => {
  const [activeTab, setActiveTab] = useState<'notebook' | 'log'>('notebook');
  const [notesContent, setNotesContent] = useState('');
  const [newQuickNoteText, setNewQuickNoteText] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync state when project changes or opens
  useEffect(() => {
    if (project) {
      setNotesContent(project.notes || '');
      setNewQuickNoteText('');
      setIsSavedRecently(false);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleManualSave = () => {
    onSaveNotes(project.id, notesContent);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleAddLogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newQuickNoteText.trim();
    if (!text) return;
    onAddQuickNote(project.id, text);
    setNewQuickNoteText('');
  };

  const quickNotesList = project.quickNotes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col text-[var(--text-primary)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--border-card)] flex items-start justify-between gap-3 bg-[var(--bg-surface-elevated)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${pillarColor}15`,
                  borderColor: `${pillarColor}35`,
                  color: pillarColor,
                }}
              >
                {pillarName}
              </span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                {project.progress}% terminé
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6C5CE7] shrink-0" />
              <span className="truncate">{project.title}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[var(--border-card)] bg-[var(--bg-surface)]">
          <button
            type="button"
            onClick={() => setActiveTab('notebook')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notebook'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Carnet de bord &amp; Ressources</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'log'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mémos &amp; Flashs datés</span>
            {quickNotesList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] font-mono">
                {quickNotesList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'notebook' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notes libres, liens &amp; spécifications</span>
                </label>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {notesContent.length} caractères
                </div>
              </div>

              <textarea
                rows={10}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Consignez ici vos idées, retours d'expérience, liens Figma/GitHub, commandes utiles ou réflexions stratégiques sur ce projet..."
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7] transition font-sans leading-relaxed resize-y"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-[var(--text-muted)] italic">
                  Astuce : Notez vos idées ici pour décharger votre esprit sans surcharger la to-do list.
                </p>

                <button
                  type="button"
                  onClick={handleManualSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold shadow-md shadow-[#6C5CE7]/20 transition active:scale-95 cursor-pointer"
                >
                  {isSavedRecently ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#55E6C1]" />
                      <span>Enregistré !</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer la note</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-4">
              {/* Formulaire ajout rapide d'un mémo daté */}
              <form onSubmit={handleAddLogItem} className="flex gap-2">
                <input
                  type="text"
                  value={newQuickNoteText}
                  onChange={(e) => setNewQuickNoteText(e.target.value)}
                  placeholder="Noter un flash, une décision ou une idée rapide..."
                  className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
                />
                <button
                  type="submit"
                  disabled={!newQuickNoteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </form>

              {/* Liste des mémos datés */}
              <div className="space-y-2">
                {quickNotesList.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/40">
                    <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">
                      Aucun mémo flash pour le moment
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                      Utilisez cet espace pour archiver les micro-décisions et apprentissages au fil des séances.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                    {quickNotesList.map((qn) => (
                      <div
                        key={qn.id}
                        className="group p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition flex items-start justify-between gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-primary)] leading-relaxed break-words">
                            {qn.text}
                          </p>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1.5 inline-block">
                            {qn.createdAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteQuickNote(project.id, qn.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--text-muted)] hover:text-[#FF7675] hover:bg-[var(--bg-surface)] transition cursor-pointer shrink-0"
                          title="Supprimer ce mémo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pillarColor }} />
            <span className="truncate max-w-[200px] sm:max-w-xs">{project.title}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[var(--border-card)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
