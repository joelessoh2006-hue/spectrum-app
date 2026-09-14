import React, { useState, useRef } from 'react';
import { DomainConfig, ImportedCalendarEvent, TimeBlock } from '../types';
import { parseICS, getSampleXiaomiICS } from '../utils/icsParser';
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
  const [filterTodayOnly, setFilterTodayOnly] = useState<boolean>(false);
  const [showXiaomiGuide, setShowXiaomiGuide] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
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

  // Filter events based on user selection
  const displayedEvents = filterTodayOnly
    ? parsedEvents.filter((e) => e.dateStr === selectedDateStr)
    : parsedEvents;

  const includedCount = displayedEvents.filter((e) => e.included).length;

  const handleExecuteImport = () => {
    const toImport = displayedEvents.filter((e) => e.included);
    if (toImport.length === 0) return;

    const newBlocks: TimeBlock[] = toImport.map((evt) => {
      // Calculate startMinutes from "HH:MM"
      const [sh, sm] = evt.startTime.split(':').map((n) => parseInt(n, 10));
      const startMinutes = (sh || 0) * 60 + (sm || 0);

      const isConstraint = evt.importAs === 'constraint';
      const targetDomain = isConstraint ? 'curiosity' : evt.selectedPillarId;

      return {
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: evt.title,
        domain: targetDomain,
        date: evt.dateStr,
        startTime: evt.startTime,
        endTime: evt.endTime,
        startMinutes,
        durationMinutes: evt.durationMinutes,
        isRecurring: false,
        recurringDays: [],
        globalObjective: isConstraint
          ? (evt.description || 'Contrainte fixe de planning importée depuis votre calendrier.')
          : (evt.description || `Session de travail issue de votre calendrier : ${evt.title}`),
        subtasks: isConstraint
          ? []
          : [
              {
                id: `st-${Date.now()}-1`,
                text: 'Objectif de la session importée',
                completed: false,
              },
            ],
        checklist: [],
        notes: evt.description
          ? `### 📅 Notes importées du calendrier\n${evt.description}${evt.location ? `\n\n**Lieu** : ${evt.location}` : ''}`
          : evt.location
          ? `**Lieu** : ${evt.location}`
          : '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#6C5CE7] flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span>Importer un Calendrier</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30">
                  Xiaomi & Google (.ics)
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Intégrez vos rendez-vous en contraintes fixes ou en blocs d'activité sans double saisie.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-card)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Xiaomi Guide Dropdown */}
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-surface-elevated)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowXiaomiGuide((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#6C5CE7]" />
                <span>Comment exporter l'agenda depuis un smartphone Xiaomi (MIUI / HyperOS) ?</span>
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
                  <strong>Méthode 1 (Export Google lié à Xiaomi) :</strong> La plupart des calendriers Xiaomi sont synchronisés avec Google. Allez sur{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6C5CE7] underline font-semibold"
                  >
                    calendar.google.com
                  </a>
                  {' '}→ <em>Paramètres</em> → <em>Importer et exporter</em> → <em>Exporter (.ics)</em>.
                </p>
                <p>
                  <strong>Méthode 2 (Application Calendrier Xiaomi) :</strong> Ouvrez <em>Calendrier Xiaomi</em> → Menu (3 points ou engrenage) → <em>Paramètres avancés</em> → <em>Exporter</em> (enregistre un fichier .ics dans Téléchargements).
                </p>
                <p className="text-[11px] font-mono text-[#55E6C1] bg-[#55E6C1]/10 p-2 rounded-xl border border-[#55E6C1]/20">
                  ⚡ <strong>Méthode 3 (Application Flutter native sur Xiaomi) :</strong> L'application native Flutter peut directement lire l'agenda local via l'autorisation <code>READ_CALENDAR</code> (voir onglet Code Flutter).
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
                Compatible avec les fichiers de calendrier exportés depuis Xiaomi, Google Agenda, Apple iCal et Outlook.
              </p>

              {/* Quick sample button */}
              <div className="mt-5 pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Pas de fichier sous la main ?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#6C5CE7]/15 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tester avec un export exemple Xiaomi</span>
                </button>
              </div>
            </div>
          ) : (
            /* File is loaded & events displayed */
            <div className="space-y-4">
              {/* File details bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#55E6C1]/15 text-[#55E6C1] flex items-center justify-center border border-[#55E6C1]/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                      {parsedEvents.length} événement(s) détecté(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFileContent(null);
                      setFileName(null);
                      setParsedEvents([]);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[#FF7675] transition underline cursor-pointer"
                  >
                    Changer de fichier
                  </button>
                </div>
              </div>

              {/* Controls: Date filter & bulk actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterTodayOnly((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      filterTodayOnly
                        ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    <span>Jour sélectionné ({selectedDateStr})</span>
                  </button>

                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {displayedEvents.length} affiché(s)
                  </span>
                </div>

                {/* Bulk action buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBulkSetType('constraint')}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    title="Définir tous les événements comme des contraintes fixes"
                  >
                    Tout en Contraintes 🔒
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetType('spectrum_block')}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-card)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    title="Convertir tous les événements en Blocs Spectrum actifs"
                  >
                    Tout en Blocs ⚡
                  </button>
                </div>
              </div>

              {/* Events list */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {displayedEvents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)] italic bg-[var(--bg-surface-elevated)]/40 rounded-2xl border border-dashed border-[var(--border-card)]">
                    Aucun événement correspondant aux critères de filtre.
                  </div>
                ) : (
                  displayedEvents.map((evt) => {
                    const isConstraint = evt.importAs === 'constraint';
                    const activePillar = categories.find((c) => c.id === evt.selectedPillarId) || categories[0];
                    const PillarIcon = getPillarIcon(activePillar?.iconName || 'Terminal');

                    return (
                      <div
                        key={evt.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          !evt.included
                            ? 'opacity-40 bg-[var(--bg-surface-elevated)]/30 border-[var(--border-card)]'
                            : isConstraint
                            ? 'bg-[var(--bg-surface-elevated)]/80 border-[var(--border-card)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-card)] hover:border-[#6C5CE7]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Checkbox + info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleInclude(evt.id)}
                              className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                evt.included
                                  ? 'bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-sm'
                                  : 'border-[var(--border-card)] bg-transparent'
                              }`}
                            >
                              {evt.included && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                  {evt.title}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-lg border border-[var(--border-card)]">
                                  <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                  {evt.startTime} — {evt.endTime} ({evt.durationMinutes}m)
                                </span>
                              </div>

                              {/* Description or location */}
                              {(evt.description || evt.location) && (
                                <div className="mt-1 text-xs text-[var(--text-secondary)] space-y-0.5">
                                  {evt.location && (
                                    <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                                      <MapPin className="w-3 h-3" />
                                      <span>{evt.location}</span>
                                    </p>
                                  )}
                                  {evt.description && (
                                    <p className="line-clamp-1 text-[11px] text-[var(--text-secondary)]">
                                      {evt.description}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Choice between "Contrainte Fixe" vs "Bloc Spectrum" */}
                          {evt.included && (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                              {/* Toggle between Contrainte and Bloc */}
                              <div className="p-0.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleChangeImportAs(evt.id, 'constraint')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                    isConstraint
                                      ? 'bg-[var(--border-card)] text-[var(--text-primary)] shadow-sm'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                  }`}
                                  title="Importer comme créneau de contrainte fixe"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Contrainte</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleChangeImportAs(evt.id, 'spectrum_block')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                    !isConstraint
                                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                  }`}
                                  title="Convertir en Bloc d'Activité Spectrum avec Fiche et Flow"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>Bloc Actif</span>
                                </button>
                              </div>

                              {/* Pillar selector if converted to Spectrum Block */}
                              {!isConstraint && (
                                <select
                                  value={evt.selectedPillarId}
                                  onChange={(e) => handleChangePillar(evt.id, e.target.value)}
                                  className="text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl px-2.5 py-1 text-[var(--text-primary)] focus:outline-none focus:border-[#6C5CE7]"
                                  style={{
                                    color: activePillar?.color,
                                  }}
                                >
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} className="text-black">
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
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
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {importSuccessCount} événement(s) importé(s) avec succès dans votre Agenda !
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-secondary)]">
            {fileContent && (
              <span>
                <strong className="text-[var(--text-primary)]">{includedCount}</strong> événement(s) sélectionné(s) sur {displayedEvents.length}
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
              className="px-5 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-[#6C5CE7]/20 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Importer dans l'Agenda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
