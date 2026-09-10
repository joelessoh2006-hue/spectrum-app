import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  LogOut,
  Sparkles,
  HelpCircle,
  Database,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../context/ThemeContext';

interface AuthHeaderProps {
  user: User | null;
  isAuthLoading: boolean;
  onLoginWithGoogle: () => void;
  onLoginGuest: () => void;
  onLogout: () => void;
  onOpenOnboarding: () => void;
  onOpenManagePillars?: () => void;
  firestoreStatus: 'connected' | 'error' | 'syncing';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  user,
  isAuthLoading,
  onLoginWithGoogle,
  onLoginGuest,
  onLogout,
  onOpenOnboarding,
  onOpenManagePillars,
  firestoreStatus,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="border-b border-[var(--border-app)] bg-[var(--header-bg)] backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] via-[#0984E3] to-[#00CEC9] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[var(--bg-surface)] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-xs bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] bg-clip-text text-transparent">
                S
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight leading-none">
                Spectrum
              </h1>
              <span className="hidden xs:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#6C5CE7]/15 text-[#6C5CE7] border border-[#6C5CE7]/30">
                PWA
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  firestoreStatus === 'connected'
                    ? 'bg-[#55E6C1] animate-pulse'
                    : firestoreStatus === 'syncing'
                    ? 'bg-[#FDCB6E] animate-ping'
                    : 'bg-[#FF7675]'
                }`}
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-mono leading-none">
                {firestoreStatus === 'connected'
                  ? user
                    ? 'Cloud Firestore actif'
                    : 'Hors session (Local)'
                  : firestoreStatus === 'syncing'
                  ? 'Synchronisation…'
                  : 'Hors-ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            id="theme-toggle-button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] flex items-center justify-center transition active:scale-95 shadow-sm"
            title={isDark ? 'Passer au mode clair (Luma App)' : 'Passer au mode sombre'}
            aria-label="Basculer thème"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#FDCB6E] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#6C5CE7] transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Manage Pillars Quick Button */}
          {onOpenManagePillars && (
            <button
              id="header-manage-pillars-btn"
              onClick={onOpenManagePillars}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition active:scale-95 shadow-sm"
              title="Gérer les piliers et catégories"
            >
              <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span className="hidden md:inline">Piliers</span>
            </button>
          )}

          {/* In-app PWA install button */}
          <PWAInstallButton />

          {/* Guide / Onboarding Reopen Button */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition active:scale-95"
            title="Revoir le guide d'organisation multipotentielle"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#00CEC9]" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* User Profile / Auth State */}
          {isAuthLoading ? (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-elevated)] animate-pulse border border-[var(--border-card)]" />
          ) : user ? (
            <div className="relative">
              <button
                id="user-profile-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:border-[var(--border-highlight)] transition active:scale-95 shadow-sm"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Utilisateur'}
                    className="w-6 h-6 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-[#6C5CE7] text-white text-[11px] font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[100px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0] || 'Connecté'}
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-card)] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-primary)]">
                    <div className="pb-3 border-b border-[var(--border-card)] mb-2">
                      <div className="flex items-center gap-2">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#6C5CE7] text-white font-bold flex items-center justify-center text-sm">
                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {user.displayName || 'Utilisateur'}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] truncate font-mono">
                            {user.email || 'Compte invité'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#55E6C1] bg-[#55E6C1]/10 px-2 py-1 rounded-lg border border-[#55E6C1]/20">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Données scopées : users/{user.uid.substring(0, 8)}…</span>
                      </div>
                    </div>

                    {onOpenManagePillars && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenManagePillars();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition mb-1"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#6C5CE7]" />
                        <span>Gérer les Piliers & Couleurs</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#FF7675] hover:bg-[#FF7675]/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="google-signin-btn"
                onClick={onLoginWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-[#121214] hover:bg-gray-100 font-semibold text-xs shadow-md transition active:scale-95"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden xs:inline">Connexion Google</span>
                <span className="xs:hidden">Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

