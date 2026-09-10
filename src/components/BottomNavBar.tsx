import React from 'react';
import { Calendar, LayoutGrid, Flame, Code2, Plus } from 'lucide-react';

export type AppView = 'agenda' | 'bento' | 'activity' | 'code';

interface BottomNavBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAddModal: () => void;
  hasActiveBlock: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onNavigate,
  onOpenAddModal,
  hasActiveBlock,
}) => {
  const navItems: { id: AppView; label: string; icon: React.FC<{ className?: string }>; badge?: boolean }[] = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'bento', label: 'Bento Grid', icon: LayoutGrid },
    { id: 'activity', label: 'Fiche & Flow', icon: Flame, badge: hasActiveBlock },
    { id: 'code', label: 'Flutter / Dart', icon: Code2 },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--nav-bg)] backdrop-blur-2xl border-t border-[var(--border-app)] px-3 py-1.5 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
      aria-label="Navigation mobile principale"
    >
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#6C5CE7] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#6C5CE7]' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF7675] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] mt-0.5 shadow-sm shadow-[#6C5CE7]/50" />
              )}
            </button>
          );
        })}

        {/* Central Quick Add Action Button (Luma / iOS Vibrant Floating Button) */}
        <div className="px-1 shrink-0 -mt-5">
          <button
            id="mobile-quick-add-btn"
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00CEC9] text-white flex items-center justify-center shadow-lg shadow-[#6C5CE7]/35 hover:scale-105 active:scale-95 transition-transform border-2 border-[var(--bg-surface)]"
            title="Ajouter un bloc de temps ou un projet"
            aria-label="Ajouter"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#00CEC9] dark:text-[#55E6C1] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#00CEC9] dark:text-[#55E6C1]' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF7675] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] dark:bg-[#55E6C1] mt-0.5 shadow-sm shadow-[#00CEC9]/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
