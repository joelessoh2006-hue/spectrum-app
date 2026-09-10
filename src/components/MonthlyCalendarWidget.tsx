import React, { useState } from 'react';
import { TimeBlock, DomainId } from '../types';
import { DOMAINS } from '../data/mockData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

interface MonthlyCalendarWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  blocks: TimeBlock[];
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
}) => {
  // Calendar browsing month/year
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-11

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

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

  return (
    <div className="bg-[#1E1E24] border border-[#2E2E38] rounded-[20px] p-4 md:p-5 shadow-xl transition-all">
      {/* Header: Month / Year Title & Nav buttons */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#2E2E38]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center justify-center text-[#6C5CE7]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <p className="text-[11px] text-[#A0A0AB]">
              Cliquez sur un jour pour filtrer par piliers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#55E6C1] hover:text-white bg-[#55E6C1]/10 hover:bg-[#55E6C1]/20 border border-[#55E6C1]/30 rounded-lg transition-all"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-[#A0A0AB] hover:text-white bg-[#121214] hover:bg-[#282830] rounded-lg border border-[#2E2E38] transition-all"
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-[#A0A0AB] hover:text-white bg-[#121214] hover:bg-[#282830] rounded-lg border border-[#2E2E38] transition-all"
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
              i >= 5 ? 'text-[#71717A]' : 'text-[#A0A0AB]'
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
              className="h-10 md:h-11 flex flex-col items-center justify-center rounded-xl text-xs text-[#3E3E4C] select-none pointer-events-none"
            >
              <span>{prevDay}</span>
            </div>
          );
        })}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const selected = isSelected(day);
          const currentDay = isToday(day);
          const domains = getDomainsForDay(viewYear, viewMonth, day);
          const hasBlocks = domains.size > 0;

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => {
                const newDate = new Date(viewYear, viewMonth, day);
                onSelectDate(newDate);
              }}
              className={`group relative h-10 md:h-11 flex flex-col items-center justify-center rounded-xl text-xs transition-all duration-150 ${
                selected
                  ? 'bg-[#6C5CE7] text-white font-bold shadow-lg shadow-[#6C5CE7]/35 ring-1 ring-white/40 scale-105 z-10'
                  : currentDay
                  ? 'bg-[#121214] text-[#55E6C1] font-bold border border-[#55E6C1]/50 hover:bg-[#282830]'
                  : 'bg-[#121214]/60 text-[#EDEDED] hover:bg-[#282830] hover:text-white border border-[#2E2E38]/50'
              }`}
            >
              <span className="leading-none">{day}</span>

              {/* Multipotential Domain Dots Indicator */}
              {hasBlocks && (
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from(domains).map((dId) => {
                    const cfg = DOMAINS[dId];
                    return (
                      <span
                        key={dId}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: selected ? '#FFFFFF' : cfg.color,
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
      <div className="mt-3 pt-3 border-t border-[#2E2E38] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A0A0AB]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6C5CE7]" />
            <span>Tech / Dev</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF7675]" />
            <span>Art / Rap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#55E6C1]" />
            <span>Curiosité</span>
          </div>
        </div>

        <div className="font-mono text-[#71717A]">
          Firestore Cloud Sync
        </div>
      </div>
    </div>
  );
};
