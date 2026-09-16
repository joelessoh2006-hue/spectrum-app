import React, { useState, useRef, useMemo } from 'react';
import { DomainConfig, ImportedCalendarEvent, TimeBlock } from '../types';
import { parseICS, getSampleXiaomiICS, guessCategoryAndType } from '../utils/icsParser';
import { getPillarIcon } from '../utils/iconMap';
import {
  Calendar,
  UploadCloud,
  FileText,
  Clock,
  MapPin,
  Check,
  CheckCircle2,
  Lock,
  Zap,
  Sparkles,
  HelpCircle,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  Wand2,
  Layers,
  CalendarDays,
} from 'lucide-react';

interface ImportCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DomainConfig[];
  selectedDate: Date;
  onImportBlocks: (blocks: TimeBlock[]) => void;
}

export const ImportCalendarModal: React.FC<ImportCalendarModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedDate,
  onImportBlocks,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<ImportedCalendarEvent[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'constraint' | 'spectrum_block' | 'allday'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showXiaomiGuide, setShowXiaomiGuide] = useState<boolean>(false);
  const [showConceptsGuide, setShowConceptsGuide] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultPillarId = categories[0]?.id || 'tech';

  const formatTwoDigits = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const selectedDateStr = `${selectedDate.getFullYear()}-${formatTwoDigits(selectedDate.getMonth() + 1)}-${formatTwoDigits(selectedDate.getDate())}`;

  const handleProcessICS = (content: string, name: string) => {
    setFileContent(content);
    setFileName(name);
    const events = parseICS(content, defaultPillarId, selectedDate);
    setParsedEvents(events);
    setImportSuccessCount(null);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        handleProcessICS(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleXiaomiICS(selectedDate);
    handleProcessICS(sample, 'export_calendrier_xiaomi.ics');
  };

  const handleToggleInclude = (id: string) => {
    setParsedEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, included: !evt.included } : evt))
    );
  };

  const handleChangeImportAs = (id: string, importAs: 'constraint' | 'spectrum_block') => {
    setParsedEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, importAs } : evt))
    );
  };

  const handleChangePillar = (id: string, pillarId: string) => {
    setParsedEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, selectedPillarId: pillarId } : evt))
    );
  };

  const handleBulkSetType = (type: 'constraint' | 'spectrum_block') => {
    setParsedEvents((prev) => prev.map((evt) => ({ ...evt, importAs: type })));
  };

  const handleBulkToggleInclude = (included: boolean) => {
    setParsedEvents((prev) => prev.map((evt) => ({ ...evt, included })));
  };

  // Magic 1-click Auto-Classification
  const handleAutoClassifyAll = () => {
    let constraints = 0;
    let blocks = 0;

    setParsedEvents((prev) =>
      prev.map((evt) => {
        const { importAs, pillarId, reason } = guessCategoryAndType(
          evt.title,
          evt.description || '',
          defaultPillarId
        );
        if (importAs === 'constraint') constraints++;
        else blocks++;

        return {
          ...evt,
          importAs,
          selectedPillarId: pillarId,
          classificationReason: evt.isAllDay ? '📅 Événement journée entière (All-Day)' : reason,
        };
      })
    );

    setAiFeedbackMessage(
      `✨ Analyse terminée avec succès : ${constraints} contrainte(s) et ${blocks} bloc(s) d'activité classifiés automatiquement.`
    );
    setTimeout(() => {
      setAiFeedbackMessage(null);
    }, 4500);
  };

  // Filter events based on user selection and search query
  const displayedEvents = useMemo(() => {
    return parsedEvents.filter((evt) => {
      // 1. Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesDesc = (evt.description || '').toLowerCase().includes(q);
        const matchesLoc = (evt.location || '').toLowerCase().includes(q);
        const matchesDate = evt.dateStr.includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesDate) {
          return false;
        }
      }

      // 2. Filter by mode
      if (filterMode === 'today') {
        return evt.dateStr === selectedDateStr;
      }
      if (filterMode === 'constraint') {
        return evt.importAs === 'constraint';
      }
      if (filterMode === 'spectrum_block') {
        return evt.importAs === 'spectrum_block';
      }
      if (filterMode === 'allday') {
        return Boolean(evt.isAllDay);
      }
      return true;
    });
  }, [parsedEvents, filterMode, searchQuery, selectedDateStr]);

  const includedCount = displayedEvents.filter((e) => e.included).length;

  const handleExecuteImport = () => {
    const toImport = displayedEvents.filter((e) => e.included);
    if (toImport.length === 0) return;

    const newBlocks: TimeBlock[] = toImport.map((evt) => {
      const isConstraint = evt.importAs === 'constraint';
      const targetDomain = isConstraint ? 'curiosity' : evt.selectedPillarId;

      // Handle All-Day events sensibly so they don't block 24 continuous hours on the timeline
      let startMinutes: number;
      let durationMinutes: number;
      let startTime = evt.startTime;
      let endTime = evt.endTime;

      if (evt.isAllDay || evt.durationMinutes >= 1440) {
        // Place as a morning banner block (09:00 - 10:00) so it doesn't obstruct other daytime blocks
        startMinutes = 9 * 60;
        durationMinutes = 60;
        startTime = '09:00';
        endTime = '10:00';
      } else {
        const [sh, sm] = evt.startTime.split(':').map((n) => parseInt(n, 10));
        startMinutes = (sh || 0) * 60 + (sm || 0);
        durationMinutes = Math.max(15, evt.durationMinutes);
      }

      return {
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: evt.title,
        domain: targetDomain,
        date: evt.dateStr,
        startTime,
        endTime,
        startMinutes,
        durationMinutes,
        isRecurring: false,
        recurringDays: [],
        globalObjective: isConstraint
          ? (evt.description || `Contrainte fixe : ${evt.title}`)
          : (evt.description || `Session de travail issue de votre calendrier : ${evt.title}`),
        subtasks: isConstraint
          ? []
          : [
              {
                id: `st-${Date.now()}-1`,
                text: 'Objectif principal de la session',
                completed: false,
              },
            ],
        checklist: [],
        notes: [
          evt.isAllDay ? '📌 **Événement sur toute la journée (All-Day)**' : '',
          evt.description ? `### 📅 Notes du calendrier\n${evt.description}` : '',
          evt.location ? `**Lieu** : ${evt.location}` : '',
          evt.classificationReason ? `*Classification auto : ${evt.classificationReason}*` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        isFixedConstraint: isConstraint,
        sourceCalendar: 'Calendrier Xiaomi / Google',
        location: evt.location,
        completed: false,
      };
    });

    onImportBlocks(newBlocks);
    setImportSuccessCount(newBlocks.length);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-surface-elevated)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#6C5CE7] flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span>Importer un Calendrier</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30">
                  .ics Xiaomi & Google
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Analysez et classez vos événements en un coup d'œil.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)] transition cursor-pointer"
            aria-label="Fermer la modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Guide Pédagogique : Différence Contrainte vs Bloc Actif */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-surface-elevated)] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowConceptsGuide((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6C5CE7]" />
                <span>Comment choisir entre « Contrainte Fixe » et « Bloc Actif » ?</span>
              </span>
              {showConceptsGuide ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {showConceptsGuide && (
              <div className="px-4 pb-4 pt-2 text-xs border-t border-[var(--border-card)] bg-[var(--bg-surface)] grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500 dark:text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Contrainte Fixe (Obligations extérieures)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    <strong>Exemples :</strong> Médecin, cours, réunions de travail, rendez-vous administratif, trajets, anniversaires.
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    👉 <em>Bloque le créneau dans l'agenda sans lancer de minuteur ni imposer de sous-tâches.</em>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/25 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#6C5CE7]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Bloc Actif (Création & Focus)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    <strong>Exemples :</strong> Coder une app, écrire un texte, session beatmaking, lecture d'un essai, veille.
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    👉 <em>Rattaché à un de vos Piliers (Tech, Art, Curiosité) avec mode Zen et fiche d'activité.</em>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Xiaomi Guide Dropdown */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-surface-elevated)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowXiaomiGuide((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#55E6C1]" />
                <span>Où trouver votre fichier .ics sur smartphone Xiaomi / Google Agenda ?</span>
              </span>
              {showXiaomiGuide ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {showXiaomiGuide && (
              <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] space-y-2 border-t border-[var(--border-card)] bg-[var(--bg-surface)]">
                <p>
                  <strong>Option Google Agenda (Recommandé) :</strong> Rendez-vous sur{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6C5CE7] underline font-semibold"
                  >
                    calendar.google.com
                  </a>
                  {' '}→ Roue crantée <em>Paramètres</em> → <em>Importer et exporter</em> → <em>Exporter</em>. Le fichier téléchargé se termine par <code>.ics</code>.
                </p>
                <p>
                  <strong>Option Calendrier Xiaomi (MIUI / HyperOS) :</strong> Ouvrez l'application <em>Calendrier</em> → Menu ☰ ou ⚙️ → <em>Paramètres avancés</em> → <em>Exporter</em> dans vos documents.
                </p>
              </div>
            )}
          </div>

          {/* Upload / Drag & Drop Zone */}
          {!fileContent ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 scale-[1.01]'
                  : 'border-[var(--border-card)] hover:border-[#6C5CE7] bg-[var(--bg-surface-elevated)]/40 hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,.ical,text/calendar"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto mb-3 border border-[#6C5CE7]/20 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Glissez votre fichier .ics ici ou cliquez pour parcourir
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm mx-auto">
                Compatible avec les calendriers Google, Xiaomi, Apple iCal et Outlook.
              </p>

              {/* Quick sample button */}
              <div className="mt-5 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Tester d'abord ?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6C5CE7]/15 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Charger un exemple de calendrier</span>
                </button>
              </div>
            </div>
          ) : (
            /* File is loaded & events displayed */
            <div className="space-y-4">
              {/* File details & Magic Auto-Classify Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#55E6C1]/15 text-[#55E6C1] flex items-center justify-center border border-[#55E6C1]/30 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                      {parsedEvents.length} événement(s) détecté(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAutoClassifyAll}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-[#8A2BE2]/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Analyser automatiquement les titres et affecter Contrainte ou Bloc Actif"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>🪄 Auto-classifier intelligemment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFileContent(null);
                      setFileName(null);
                      setParsedEvents([]);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[#FF7675] transition underline px-1 cursor-pointer"
                  >
                    Changer de fichier
                  </button>
                </div>
              </div>

              {/* Feedback banner if auto-classification was triggered */}
              {aiFeedbackMessage && (
                <div className="p-3 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-[#6C5CE7] shrink-0" />
                  <span>{aiFeedbackMessage}</span>
                </div>
              )}

              {/* Search & Filtering Toolbar */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un événement (ex: cours, médecin, dev, réunion)..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Filter mode chips & bulk actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        filterMode === 'all'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Tous ({parsedEvents.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('today')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        filterMode === 'today'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <CalendarDays className="w-3 h-3" />
                      <span>Jour sélectionné</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('constraint')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        filterMode === 'constraint'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Contraintes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('spectrum_block')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        filterMode === 'spectrum_block'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>Blocs Actifs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterMode('allday')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        filterMode === 'allday'
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>Journée entière</span>
                    </button>
                  </div>

                  {/* Bulk toggles */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBulkToggleInclude(true)}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)] transition cursor-pointer"
                    >
                      Tout cocher
                    </button>
                    <span className="text-[var(--text-muted)]">•</span>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleInclude(false)}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)] transition cursor-pointer"
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>
              </div>

              {/* Events list with Crystal-Clear Layout */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {displayedEvents.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--text-muted)] italic bg-[var(--bg-surface-elevated)]/40 rounded-2xl border border-dashed border-[var(--border-card)] space-y-1">
                    <p className="font-semibold text-[var(--text-secondary)]">Aucun événement trouvé.</p>
                    <p>Essayez de réinitialiser vos filtres ou votre recherche.</p>
                  </div>
                ) : (
                  displayedEvents.map((evt) => {
                    const isConstraint = evt.importAs === 'constraint';
                    const activePillar = categories.find((c) => c.id === evt.selectedPillarId) || categories[0];
                    const PillarIcon = getPillarIcon(activePillar?.iconName || 'Terminal');

                    return (
                      <div
                        key={evt.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          !evt.included
                            ? 'opacity-40 bg-[var(--bg-surface-elevated)]/30 border-[var(--border-card)]'
                            : isConstraint
                            ? 'bg-[var(--bg-surface-elevated)]/90 border-[var(--border-card)] shadow-xs'
                            : 'bg-[var(--bg-surface)] border-[var(--border-card)] hover:border-[#6C5CE7]/60 shadow-sm'
                        }`}
                      >
                        {/* Top Row: Checkbox, Badges & Date */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleInclude(evt.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                evt.included
                                  ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-sm'
                                  : 'border-[var(--border-card)] bg-transparent'
                              }`}
                              title={evt.included ? 'Décocher pour exclure' : 'Cocher pour importer'}
                            >
                              {evt.included && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            {/* Badge Contrainte / Bloc */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                isConstraint
                                  ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25'
                                  : 'bg-[#6C5CE7]/15 text-[#6C5CE7] border-[#6C5CE7]/30'
                              }`}
                            >
                              {isConstraint ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                              <span>{isConstraint ? 'Contrainte Fixe' : 'Bloc Actif'}</span>
                            </span>

                            {/* Time badge */}
                            {evt.isAllDay ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3" />
                                <span>Toute la journée</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-lg border border-[var(--border-card)]">
                                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                <span>{evt.startTime} — {evt.endTime} ({evt.durationMinutes >= 60 ? `${Math.floor(evt.durationMinutes / 60)}h${evt.durationMinutes % 60 ? evt.durationMinutes % 60 : ''}` : `${evt.durationMinutes}m`})</span>
                              </span>
                            )}
                          </div>

                          {/* Date badge */}
                          <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            <span>{evt.dateStr}</span>
                          </div>
                        </div>

                        {/* Title of the event (ALWAYS FULLY VISIBLE, NEVER SQUEEZED) */}
                        <div>
                          <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-snug break-words">
                            {evt.title}
                          </h4>

                          {/* Location & Description */}
                          {(evt.location || evt.description) && (
                            <div className="mt-1.5 space-y-1 text-xs">
                              {evt.location && (
                                <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                  <MapPin className="w-3 h-3 text-[#FF7675] shrink-0" />
                                  <span className="break-words">{evt.location}</span>
                                </p>
                              )}
                              {evt.description && (
                                <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] p-2 rounded-xl border border-[var(--border-card)]/50 break-words line-clamp-2">
                                  {evt.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Recommendation Explanation Chip */}
                        {evt.classificationReason && (
                          <div className="text-[11px] px-2.5 py-1.5 rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{evt.classificationReason}</span>
                          </div>
                        )}

                        {/* Action Row: Full width choice of Contrainte vs Bloc Spectrum */}
                        {evt.included && (
                          <div className="pt-2 border-t border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                                Importer comme :
                              </span>

                              <div className="p-0.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleChangeImportAs(evt.id, 'constraint')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    isConstraint
                                      ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                  }`}
                                  title="Conserver comme créneau de contrainte fixe (RDV, cours, réunion)"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Contrainte</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleChangeImportAs(evt.id, 'spectrum_block')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    !isConstraint
                                      ? 'bg-[#6C5CE7] text-white shadow-xs'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                  }`}
                                  title="Transformer en Bloc Actif avec Fiche d'activité et mode Focus"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>Bloc Actif</span>
                                </button>
                              </div>
                            </div>

                            {/* If Bloc Actif, choose Pillar */}
                            {!isConstraint && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                                  Pilier :
                                </span>
                                <div className="flex items-center gap-1">
                                  {categories.map((cat) => {
                                    const isSelectedPillar = evt.selectedPillarId === cat.id;
                                    const CatIcon = getPillarIcon(cat.iconName || 'Terminal');
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleChangePillar(evt.id, cat.id)}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border ${
                                          isSelectedPillar
                                            ? 'shadow-xs text-white'
                                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]'
                                        }`}
                                        style={{
                                          backgroundColor: isSelectedPillar ? cat.color : undefined,
                                          borderColor: isSelectedPillar ? cat.color : undefined,
                                        }}
                                        title={`Affecter au pilier ${cat.name}`}
                                      >
                                        <CatIcon className="w-3 h-3" />
                                        <span>{cat.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Import Success notification banner */}
          {importSuccessCount !== null && (
            <div className="p-4 rounded-2xl bg-[#55E6C1]/15 border border-[#55E6C1]/30 text-[#55E6C1] text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {importSuccessCount} événement(s) importé(s) avec succès dans votre Agenda !
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-secondary)]">
            {fileContent && (
              <span>
                <strong className="text-[var(--text-primary)]">{includedCount}</strong> événement(s) prêt(s) à être importé(s) sur {displayedEvents.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)] transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={!fileContent || includedCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-[#6C5CE7]/25 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Importer dans l'Agenda ({includedCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
