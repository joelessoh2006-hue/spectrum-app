import React, { useState, useMemo } from 'react';
import { TimeBlock, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Lock,
  Zap,
  Clock,
  MapPin,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  UploadCloud,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ImportedEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  categories?: DomainConfig[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectBlock?: (blockId: string) => void;
  onOpenDaySchedule?: () => void;
  onOpenImportModal?: () => void;
  onDeleteBlock?: (blockId: string) => void;
  onDeleteBlocks?: (blockIds: string[]) => void;
}

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FRENCH_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export const ImportedEventsModal: React.FC<ImportedEventsModalProps> = ({
  isOpen,
  onClose,
  blocks,
  categories,
  selectedDate,
  onSelectDate,
  onSelectBlock,
  onOpenDaySchedule,
  onOpenImportModal,
  onDeleteBlock,
  onDeleteBlocks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past' | 'constraints' | 'spectrum'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingDateStr, setDeletingDateStr] = useState<string | null>(null);

  // 1. Identify all blocks imported from .ics
  const importedBlocks = useMemo(() => {
    return blocks.filter((b) => Boolean(b.sourceCalendar || b.id?.startsWith('imported-')));
  }, [blocks]);

  // Today reference (midnight)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }, [today]);

  // Helpers for domain color and name
  const getDomainInfo = (dId: string) => {
    const found = categories?.find((c) => c.id === dId);
    if (found) return { name: found.name, color: found.color };
    const legacy = (DOMAINS as Record<string, DomainConfig>)[dId];
    return legacy ? { name: legacy.name, color: legacy.color } : { name: dId, color: '#6C5CE7' };
  };

  // Helper to parse date string YYYY-MM-DD safely
  const parseDateStr = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  // Helper relative date label (Aujourd'hui, Demain, etc.)
  const getRelativeDayLabel = (dateStr?: string): { text: string; badgeColor: string } | null => {
    if (!dateStr) return null;
    const target = parseDateStr(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: "Aujourd'hui", badgeColor: 'bg-[#6C5CE7] text-white' };
    }
    if (diffDays === 1) {
      return { text: 'Demain', badgeColor: 'bg-[#55E6C1]/20 text-[#55E6C1] border border-[#55E6C1]/40' };
    }
    if (diffDays === -1) {
      return { text: 'Hier', badgeColor: 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]' };
    }
    if (diffDays > 1 && diffDays <= 7) {
      return { text: `Dans ${diffDays} jours`, badgeColor: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' };
    }
    if (diffDays < -1 && diffDays >= -7) {
      return { text: `Il y a ${Math.abs(diffDays)} jours`, badgeColor: 'bg-[var(--text-muted)]/15 text-[var(--text-secondary)]' };
    }
    return null;
  };

  // Format date in full French: "Vendredi 18 septembre 2026"
  const formatFrenchDate = (dateStr?: string): string => {
    if (!dateStr) return 'Date non définie';
    const d = parseDateStr(dateStr);
    const dayName = FRENCH_DAYS[d.getDay()];
    const dayNum = d.getDate();
    const monthName = FRENCH_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName} ${dayNum} ${monthName} ${year}`;
  };

  // 2. Metrics calculation
  const metrics = useMemo(() => {
    const total = importedBlocks.length;
    const datesSet = new Set<string>();
    let constraintsCount = 0;
    let spectrumCount = 0;

    let earliestDate: string | null = null;
    let latestDate: string | null = null;

    importedBlocks.forEach((b) => {
      if (b.date) {
        datesSet.add(b.date);
        if (!earliestDate || b.date < earliestDate) earliestDate = b.date;
        if (!latestDate || b.date > latestDate) latestDate = b.date;
      }
      if (b.isFixedConstraint) constraintsCount++;
      else spectrumCount++;
    });

    return {
      total,
      distinctDates: datesSet.size,
      constraintsCount,
      spectrumCount,
      earliestDate,
      latestDate,
    };
  }, [importedBlocks]);

  // 3. Filtered blocks
  const filteredBlocks = useMemo(() => {
    return importedBlocks.filter((b) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesLocation = (b.location || '').toLowerCase().includes(q);
        const matchesNotes = (b.notes || '').toLowerCase().includes(q);
        const matchesDate = (b.date || '').includes(q);
        if (!matchesTitle && !matchesLocation && !matchesNotes && !matchesDate) {
          return false;
        }
      }

      // Filter category
      if (filterType === 'constraints') {
        return Boolean(b.isFixedConstraint);
      }
      if (filterType === 'spectrum') {
        return !b.isFixedConstraint;
      }
      if (filterType === 'upcoming') {
        if (!b.date) return false;
        return b.date >= todayStr;
      }
      if (filterType === 'past') {
        if (!b.date) return false;
        return b.date < todayStr;
      }

      return true;
    });
  }, [importedBlocks, searchQuery, filterType, todayStr]);

  // 4. Group by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, TimeBlock[]>();

    filteredBlocks.forEach((b) => {
      const dKey = b.date || 'sans-date';
      const list = map.get(dKey) || [];
      list.push(b);
      map.set(dKey, list);
    });

    // Sort each group's blocks by startMinutes
    map.forEach((list) => {
      list.sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));
    });

    // Sort dates
    const dateEntries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'sans-date') return 1;
      if (b[0] === 'sans-date') return -1;
      return sortOrder === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
    });

    return dateEntries;
  }, [filteredBlocks, sortOrder]);

  // Handle jump to date
  const handleJumpToDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'sans-date') return;
    const target = parseDateStr(dateStr);
    onSelectDate(target);
    if (onOpenDaySchedule) {
      onOpenDaySchedule();
    }
    onClose();
  };

  // Handle jump to block
  const handleJumpToBlock = (block: TimeBlock) => {
    if (block.date) {
      onSelectDate(parseDateStr(block.date));
    }
    if (onSelectBlock) {
      onSelectBlock(block.id);
    }
    onClose();
  };

  // Delete all blocks of a date
  const handleDeleteDateBlocks = (dateStr: string, blocksOfDate: TimeBlock[]) => {
    const ids = blocksOfDate.map((b) => b.id);
    if (onDeleteBlocks) {
      onDeleteBlocks(ids);
    } else if (onDeleteBlock) {
      ids.forEach((id) => onDeleteBlock(id));
    }
    setDeletingDateStr(null);
  };

  // Delete all imported blocks
  const handleClearAllImported = () => {
    const allIds = importedBlocks.map((b) => b.id);
    if (onDeleteBlocks) {
      onDeleteBlocks(allIds);
    } else if (onDeleteBlock) {
      allIds.forEach((id) => onDeleteBlock(id));
    }
    setConfirmClearAll(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#55E6C1]/20 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7] shadow-inner">
              <CalendarCheck className="w-6 h-6 text-[#55E6C1]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <span>Dates & Événements Importés</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30 font-mono font-bold">
                  {metrics.total}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Vue chronologique de toutes les dates synchronisées via vos fichiers .ics (Xiaomi, Google Agenda, iCal).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenImportModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportModal();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                title="Importer un autre fichier .ics"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Nouvel import (.ics)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Banner */}
        <div className="p-4 sm:px-6 bg-[var(--bg-surface)] border-b border-[var(--border-card)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <span className="text-[11px] text-[var(--text-muted)] block">Événements importés</span>
            <span className="text-lg font-extrabold text-[var(--text-primary)] mt-0.5 block">{metrics.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <span className="text-[11px] text-[var(--text-muted)] block">Journées concernées</span>
            <span className="text-lg font-extrabold text-[#55E6C1] mt-0.5 block">
              {metrics.distinctDates} {metrics.distinctDates > 1 ? 'dates' : 'date'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <span className="text-[11px] text-[var(--text-muted)] block">Contraintes Fixes</span>
            <span className="text-lg font-extrabold text-amber-400 mt-0.5 block flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{metrics.constraintsCount}</span>
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)]">
            <span className="text-[11px] text-[var(--text-muted)] block">Blocs Actifs Spectrum</span>
            <span className="text-lg font-extrabold text-[#A29BFE] mt-0.5 block flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>{metrics.spectrumCount}</span>
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Sorting */}
        <div className="p-4 sm:px-6 bg-[var(--bg-surface-elevated)]/60 border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, lieu, date..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6C5CE7]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-semibold ${
                filterType === 'all'
                  ? 'bg-[#6C5CE7] text-white shadow-2xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
            >
              Toutes ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('upcoming')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-semibold ${
                filterType === 'upcoming'
                  ? 'bg-[#6C5CE7] text-white shadow-2xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
            >
              À venir / Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setFilterType('past')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-semibold ${
                filterType === 'past'
                  ? 'bg-[#6C5CE7] text-white shadow-2xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
            >
              Passées
            </button>
            <button
              type="button"
              onClick={() => setFilterType('constraints')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-semibold flex items-center gap-1 ${
                filterType === 'constraints'
                  ? 'bg-amber-500 text-black shadow-2xs font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Contraintes</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('spectrum')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-semibold flex items-center gap-1 ${
                filterType === 'spectrum'
                  ? 'bg-[#55E6C1] text-black shadow-2xs font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Actifs</span>
            </button>

            {/* Sort order toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition ml-1 cursor-pointer"
              title={sortOrder === 'asc' ? 'Trier par ordre chronologique' : 'Trier du plus récent au plus ancien'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body: Grouped List of Dates */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {groupedByDate.length === 0 ? (
            /* Empty state */
            <div className="py-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-card)] flex items-center justify-center mx-auto">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {importedBlocks.length === 0
                  ? 'Aucun événement importé dans votre agenda'
                  : 'Aucun événement ne correspond à ce filtre'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {importedBlocks.length === 0
                  ? 'Vous pouvez importer vos rendez-vous et plannings depuis un fichier .ics (Xiaomi HyperOS, Google Agenda ou iCal).'
                  : 'Modifiez votre terme de recherche ou sélectionnez un autre filtre pour voir les dates.'}
              </p>
              {onOpenImportModal && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenImportModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold text-xs transition shadow-md shadow-[#6C5CE7]/20 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Importer un fichier .ics maintenant</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Dates grouped list */
            groupedByDate.map(([dateStr, items]) => {
              const relLabel = getRelativeDayLabel(dateStr);
              const isTodayItem = dateStr === todayStr;
              const isSelectedDate =
                selectedDate &&
                `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` ===
                  dateStr;

              return (
                <div
                  key={dateStr}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isSelectedDate
                      ? 'border-[#6C5CE7] bg-[var(--bg-surface-elevated)] shadow-lg shadow-[#6C5CE7]/10 ring-1 ring-[#6C5CE7]/30'
                      : 'border-[var(--border-card)] bg-[var(--bg-surface-elevated)]/60 hover:border-[var(--border-card)]'
                  }`}
                >
                  {/* Date Header */}
                  <div className="p-4 sm:px-5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#6C5CE7]" />
                        <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] capitalize">
                          {formatFrenchDate(dateStr)}
                        </h3>
                      </div>

                      {relLabel && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${relLabel.badgeColor}`}>
                          {relLabel.text}
                        </span>
                      )}

                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        ({items.length} {items.length > 1 ? 'créneaux' : 'créneau'})
                      </span>
                    </div>

                    {/* Action buttons for this date */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleJumpToDate(dateStr)}
                        className="px-3 py-1.5 rounded-xl bg-[#6C5CE7]/15 hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Ouvrir l'emploi du temps de cette journée"
                      >
                        <span>Ouvrir cette journée</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete this date's imported events */}
                      {(onDeleteBlocks || onDeleteBlock) && (
                        deletingDateStr === dateStr ? (
                          <div className="flex items-center gap-1 bg-rose-500/20 p-1 rounded-xl border border-rose-500/40">
                            <span className="text-[10px] text-rose-300 font-bold px-1">Confirmer ?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDateBlocks(dateStr, items)}
                              className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold"
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDateStr(null)}
                              className="px-2 py-0.5 rounded-lg bg-black/40 text-white text-[10px]"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingDateStr(dateStr)}
                            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Supprimer les événements importés de ce jour"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* List of events inside this date */}
                  <div className="p-3 sm:p-4 divide-y divide-[var(--border-card)]">
                    {items.map((block) => {
                      const domainInfo = getDomainInfo(block.domain);
                      const titleLower = block.title.toLowerCase();
                      const isBirthday =
                        titleLower.includes('birthday') ||
                        titleLower.includes('anniversaire') ||
                        titleLower.includes('anniv') ||
                        titleLower.includes('naissance');
                      const isAllDay =
                        Boolean(block.isAllDay) ||
                        block.startTime === 'Toute la journée' ||
                        block.durationMinutes >= 1440 ||
                        (isBirthday && (block.startTime === '09:00' || block.startTime === '00:00'));

                      return (
                        <div
                          key={block.id}
                          className="py-2.5 sm:py-3 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3 min-w-[240px] flex-1">
                            {/* Time badge */}
                            {isAllDay ? (
                              <div className="shrink-0 mt-0.5 px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/25 text-xs font-bold text-pink-500 dark:text-pink-400 flex items-center gap-1.5 shadow-2xs">
                                <span>{isBirthday ? '🎂 Toute la journée' : '📅 Toute la journée'}</span>
                              </div>
                            ) : (
                              <div className="shrink-0 mt-0.5 px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5 shadow-2xs">
                                <Clock className="w-3 h-3 text-[#6C5CE7]" />
                                <span>
                                  {block.startTime}
                                  {block.endTime ? ` - ${block.endTime}` : ''}
                                </span>
                              </div>
                            )}

                            {/* Block info */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                  {block.title}
                                </h4>

                                {/* Fixed Constraint Badge vs Active block */}
                                {block.isFixedConstraint ? (
                                  <>
                                    {isBirthday && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/15 text-pink-500 dark:text-pink-400 border border-pink-500/30 flex items-center gap-1">
                                        🎂 Anniversaire
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Contrainte Fixe</span>
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {/* Pillar Badge ONLY for true Spectrum Active Blocks */}
                                    <span
                                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                                      style={{ backgroundColor: domainInfo.color }}
                                    >
                                      {domainInfo.name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#55E6C1]/15 text-[#55E6C1] border border-[#55E6C1]/30 flex items-center gap-1">
                                      <Zap className="w-2.5 h-2.5" />
                                      <span>Bloc Actif</span>
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Location or duration notes */}
                              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                                <span>{isAllDay ? 'Journée entière' : `${block.durationMinutes} minutes`}</span>
                                {block.location && (
                                  <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                                    <MapPin className="w-3 h-3 text-[#55E6C1]" />
                                    <span className="truncate max-w-[200px]">{block.location}</span>
                                  </span>
                                )}
                                <span className="text-[10px] opacity-75">
                                  {block.sourceCalendar || 'Calendrier importé'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Item quick actions */}
                          <div className="flex items-center gap-2 self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleJumpToBlock(block)}
                              className="px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] transition flex items-center gap-1 cursor-pointer"
                              title="Voir les détails de cette activité"
                            >
                              <span>Détails</span>
                              <ExternalLink className="w-3 h-3 text-[#6C5CE7]" />
                            </button>

                            {onDeleteBlock && (
                              <button
                                type="button"
                                onClick={() => onDeleteBlock(block.id)}
                                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition opacity-60 group-hover:opacity-100 cursor-pointer"
                                title="Supprimer cet événement uniquement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-[var(--border-card)] bg-[var(--bg-surface-elevated)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#55E6C1]" />
            <span>
              Sélectionnez <strong>« Ouvrir cette journée »</strong> pour explorer ou réajuster les créneaux dans l'agenda.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {importedBlocks.length > 0 && (onDeleteBlocks || onDeleteBlock) && (
              confirmClearAll ? (
                <div className="flex items-center gap-1.5 bg-rose-500/20 px-2.5 py-1 rounded-xl border border-rose-500/40">
                  <span className="text-rose-300 font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Supprimer tous les {metrics.total} événements importés ?</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllImported}
                    className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-0.5 rounded-lg bg-black/40 text-white text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-semibold transition cursor-pointer"
                >
                  Tout effacer ({metrics.total})
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-card)] border border-[var(--border-card)] font-bold text-[var(--text-primary)] transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
