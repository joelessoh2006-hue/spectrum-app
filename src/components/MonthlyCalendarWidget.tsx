import React, { useState, useMemo } from 'react';
import { TimeBlock, DomainId, DomainConfig } from '../types';
import { DOMAINS } from '../data/mockData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, CalendarCheck } from 'lucide-react';

interface MonthlyCalendarWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  blocks: TimeBlock[];
  categories?: DomainConfig[];
  onDayClickScrollToSchedule?: () => void;
  onOpenDaySchedule?: () => void;
  onOpenImportedEvents?: () => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const MonthlyCalendarWidget: React.FC<MonthlyCalendarWidgetProps> = ({
  selectedDate,
  onSelectDate,
  blocks,
  categories,
  onDayClickScrollToSchedule,
  onOpenDaySchedule,
  onOpenImportedEvents,
}) => {
  // Calendar browsing month/year
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-11

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  // Set of dates with imported events from .ics
  const importedDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const b of blocks) {
      if (b.date && Boolean(b.sourceCalendar || b.id?.startsWith('imported-'))) {
        set.add(b.date);
      }
    }
    return set;
  }, [blocks]);

  const totalImportedCount = useMemo(() => {
    return blocks.filter((b) => Boolean(b.sourceCalendar || b.id?.startsWith('imported-'))).length;
  }, [blocks]);

  // Previous & Next month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(now);
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // In JS, getDay() returns 0 for Sunday, 1 for Monday... We want Monday = 0
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Helper to get blocks matching a specific day
  const getDomainsForDay = (year: number, month: number, day: number): Set<DomainId> => {
    const targetDate = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // 1 = Monday, 7 = Sunday
    const weekday = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

    const domains = new Set<DomainId>();
    for (const b of blocks) {
      if (b.date) {
        if (b.date === dateStr) {
          domains.add(b.domain);
        }
      } else if (b.isRecurring && b.recurringDays.includes(weekday)) {
        domains.add(b.domain);
      }
    }
    return domains;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const getDomainColor = (dId: string): string => {
    const found = categories?.find((c) => c.id === dId);
    if (found) return found.color;
    const legacy = (DOMAINS as Record<string, DomainConfig>)[dId];
    return legacy ? legacy.color : '#6C5CE7';
  };

  const legendItems = categories && categories.length > 0
    ? categories
    : Object.values(DOMAINS);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm transition-all">
      {/* Header: Month / Year Title & Nav buttons */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Cliquez sur un jour pour ouvrir son emploi du temps complet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenImportedEvents && (
            <button
              type="button"
              id="calendar-header-imported-btn"
              onClick={onOpenImportedEvents}
              className="px-2.5 py-1 text-[11px] font-bold text-[#55E6C1] bg-[#55E6C1]/10 hover:bg-[#55E6C1]/20 border border-[#55E6C1]/40 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Consulter toutes les dates importées"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Dates importées</span>
              {totalImportedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-[#55E6C1] text-black">
                  {totalImportedCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#6C5CE7] hover:bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 rounded-xl transition-all active:scale-95"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] rounded-xl border border-[var(--border-card)] transition-all active:scale-95"
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] rounded-xl border border-[var(--border-card)] transition-all active:scale-95"
            title="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Names Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {WEEK_DAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
              i >= 5 ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Trailing days of previous month */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
          const prevDay = daysInPrevMonth - firstDayOfWeek + idx + 1;
          return (
            <div
              key={`prev-${prevDay}`}
              className="h-10 md:h-11 flex flex-col items-center justify-center rounded-xl text-xs text-[var(--text-muted)] opacity-40 select-none pointer-events-none"
            >
              <span>{prevDay}</span>
            </div>
          );
        })}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selected = isSelected(day);
          const currentDay = isToday(day);
          const domains = getDomainsForDay(viewYear, viewMonth, day);
          const hasBlocks = domains.size > 0;
          const hasImported = importedDatesSet.has(dateStr);

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => {
                const newDate = new Date(viewYear, viewMonth, day);
                onSelectDate(newDate);
                if (onOpenDaySchedule) {
                  onOpenDaySchedule();
                } else if (onDayClickScrollToSchedule) {
                  onDayClickScrollToSchedule();
                }
              }}
              className={`group relative h-10 md:h-11 flex flex-col items-center justify-center rounded-xl text-xs transition-all duration-150 ${
                selected
                  ? 'bg-[#6C5CE7] text-white font-bold shadow-md shadow-[#6C5CE7]/35 ring-1 ring-white/40 scale-105 z-10'
                  : currentDay
                  ? 'bg-[var(--bg-surface-elevated)] text-[#6C5CE7] font-bold border-2 border-[#6C5CE7]'
                  : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--border-highlight)] border border-[var(--border-card)]'
              }`}
            >
              {/* Imported .ics Event Indicator Dot */}
              {hasImported && (
                <span
                  className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    selected ? 'bg-[#55E6C1]' : 'bg-[#55E6C1] ring-1 ring-[var(--bg-surface)]'
                  }`}
                  title="Contient des événements importés (.ics)"
                />
              )}

              <span className="leading-none">{day}</span>

              {/* Multipotential Domain Dots Indicator */}
              {hasBlocks && (
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from(domains).map((dId) => {
                    const color = getDomainColor(dId);
                    return (
                      <span
                        key={dId}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: selected ? '#FFFFFF' : color,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend below the calendar */}
      <div className="mt-3 pt-3 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center gap-3">
          {legendItems.slice(0, 4).map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate max-w-[110px]">{cat.name}</span>
            </div>
          ))}

          {totalImportedCount > 0 && onOpenImportedEvents && (
            <button
              type="button"
              onClick={onOpenImportedEvents}
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#55E6C1] hover:underline bg-[#55E6C1]/10 px-2 py-0.5 rounded-lg border border-[#55E6C1]/25 hover:bg-[#55E6C1]/20 transition cursor-pointer"
              title="Consulter la liste de toutes les dates et événements importés"
            >
              <CalendarCheck className="w-3 h-3" />
              <span>{totalImportedCount} importé{totalImportedCount > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span className="text-[#A29BFE] font-medium hidden sm:inline">💡 Cliquez sur un jour pour ouvrir son emploi du temps</span>
          <span>• Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
