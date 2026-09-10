import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { TimeBlock, Project, DomainConfig } from './types';
import { INITIAL_TIME_BLOCKS, INITIAL_PROJECTS, DOMAINS } from './data/mockData';
import {
  signInWithGoogle,
  signInGuest,
  signOutUser,
  onAuthUserChanged,
  subscribeToUserTimeBlocks,
  subscribeToUserProjects,
  subscribeToUserCategories,
  saveUserTimeBlock,
  deleteUserTimeBlock,
  saveUserProject,
  saveUserCategory,
  deleteUserCategory,
  seedUserDefaultCategories,
  seedUserTemplates,
  clearUserTimeBlocks,
} from './lib/firebase';
import { SplashScreen } from './components/SplashScreen';
import { AuthHeader } from './components/AuthHeader';
import { BottomNavBar, AppView } from './components/BottomNavBar';
import { OnboardingModal } from './components/OnboardingModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AgendaTimeline } from './components/AgendaTimeline';
import { ActivitySheet } from './components/ActivitySheet';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { AddBlockModal } from './components/AddBlockModal';
import { AddProjectModal } from './components/AddProjectModal';
import { ManagePillarsModal } from './components/ManagePillarsModal';
import {
  Calendar,
  Layers,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Splash & Onboarding State
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation State: 'agenda' | 'activity' | 'bento' | 'code'
  const [currentView, setCurrentView] = useState<AppView>('agenda');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Data State
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<DomainConfig[]>(() =>
    Object.values(DOMAINS).map((d) => ({
      id: d.id,
      name: d.name,
      label: d.label,
      color: d.color,
      colorSecondary: d.colorSecondary,
      bgRgba: d.bgRgba,
      borderRgba: d.borderRgba,
      iconName: d.id === 'tech' ? 'Terminal' : d.id === 'art' ? 'Flame' : 'Compass',
    }))
  );
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'error' | 'syncing'>('connected');

  // Modals
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isManagePillarsOpen, setIsManagePillarsOpen] = useState(false);

  // 1. Écoute de l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthUserChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Détection du premier lancement pour l'onboarding multipotentiel
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('spectrum_onboarding_v1');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  // 3. Synchronisation temps réel Cloud Firestore avec scoping users/{userId}/...
  useEffect(() => {
    if (!user) {
      // Si déconnecté, données locales initiales
      setTimeBlocks([]);
      setProjects([]);
      setFirestoreStatus('connected');
      return;
    }

    setFirestoreStatus('syncing');
    let unsubscribeBlocks: (() => void) | undefined;
    let unsubscribeProjects: (() => void) | undefined;
    let unsubscribeCategories: (() => void) | undefined;

    try {
      // Blocs
      unsubscribeBlocks = subscribeToUserTimeBlocks(
        user.uid,
        (remoteBlocks) => {
          setTimeBlocks(remoteBlocks);
          setFirestoreStatus('connected');
        },
        (err) => {
          console.warn('Erreur écoute blocs utilisateur:', err);
          setFirestoreStatus('error');
        }
      );

      // Projets
      unsubscribeProjects = subscribeToUserProjects(
        user.uid,
        (remoteProjects) => {
          setProjects(remoteProjects);
          setFirestoreStatus('connected');
        },
        (err) => {
          console.warn('Erreur écoute projets utilisateur:', err);
          setFirestoreStatus('error');
        }
      );

      // Piliers dynamiques / Categories
      unsubscribeCategories = subscribeToUserCategories(
        user.uid,
        async (remoteCategories) => {
          if (remoteCategories.length === 0) {
            try {
              await seedUserDefaultCategories(user.uid);
            } catch (seedErr) {
              console.warn('Erreur initialisation catégories utilisateur:', seedErr);
            }
          } else {
            setCategories(remoteCategories);
          }
        },
        (err) => {
          console.warn('Erreur écoute catégories utilisateur:', err);
        }
      );
    } catch (err) {
      console.error('Erreur attachement Firestore listeners:', err);
      setFirestoreStatus('error');
    }

    return () => {
      unsubscribeBlocks?.();
      unsubscribeProjects?.();
      unsubscribeCategories?.();
    };
  }, [user]);

  // Auth Handlers
  const handleLoginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.warn('Google Sign-In popup error:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('popup-blocked') || message.includes('cancelled')) {
        setAuthError('La fenêtre de connexion Google a été fermée ou bloquée par le navigateur.');
      } else {
        setAuthError('Connexion Google échouée. Vous pouvez également tester en mode Invité.');
      }
    }
  };

  const handleLoginGuest = async () => {
    setAuthError(null);
    try {
      await signInGuest();
    } catch (err) {
      console.error('Guest login error:', err);
      setAuthError('Impossible de démarrer la session invité.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setSelectedBlockId(null);
      setCurrentView('agenda');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // CRUD TimeBlocks
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setCurrentView('activity');
  };

  const handleOpenEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setIsAddBlockOpen(true);
  };

  const handleUpdateBlock = async (updated: TimeBlock) => {
    setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserTimeBlock(user.uid, updated);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur sauvegarde bloc Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleAddBlock = async (newBlockData: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      ...newBlockData,
      id: `block-${Date.now()}`,
    };
    setTimeBlocks((prev) => [...prev, newBlock]);

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserTimeBlock(user.uid, newBlock);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur création bloc Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleAddBlocks = async (newBlocksData: Omit<TimeBlock, 'id'>[]) => {
    const newBlocks: TimeBlock[] = newBlocksData.map((bData, idx) => ({
      ...bData,
      id: `block-${Date.now()}-${idx}`,
    }));
    setTimeBlocks((prev) => [...prev, ...newBlocks]);

    if (user) {
      setFirestoreStatus('syncing');
      try {
        for (const b of newBlocks) {
          await saveUserTimeBlock(user.uid, b);
        }
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur création blocs multiples Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleClearBlocks = async () => {
    if (user) {
      setFirestoreStatus('syncing');
      try {
        await clearUserTimeBlocks(user.uid, timeBlocks);
        setTimeBlocks([]);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur vidage blocs Firestore:', err);
        setFirestoreStatus('error');
      }
    } else {
      setTimeBlocks([]);
    }
  };

  // CRUD Projects
  const handleAddProject = async (newProjectData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...newProjectData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [newProj, ...prev]);

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserProject(user.uid, newProj);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur création projet Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleToggleMilestone = async (projectId: string, milestoneId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const updatedMilestones = targetProject.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress =
      updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : targetProject.progress;

    const updatedProject: Project = {
      ...targetProject,
      milestones: updatedMilestones,
      progress,
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur update milestone Firestore:', err);
      }
    }
  };

  // Dynamic Pillars / Categories CRUD
  const handleSaveCategory = async (cat: DomainConfig) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      }
      return [...prev, cat];
    });

    if (user) {
      try {
        await saveUserCategory(user.uid, cat);
      } catch (err) {
        console.error('Erreur sauvegarde pilier Firestore:', err);
      }
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));

    if (user) {
      try {
        await deleteUserCategory(user.uid, catId);
      } catch (err) {
        console.error('Erreur suppression pilier Firestore:', err);
      }
    }
  };

  // Seed default templates
  const handleSeedTemplates = async () => {
    if (!user) {
      setTimeBlocks(INITIAL_TIME_BLOCKS);
      setProjects(INITIAL_PROJECTS);
      return;
    }

    setFirestoreStatus('syncing');
    try {
      await seedUserTemplates(user.uid, INITIAL_TIME_BLOCKS, INITIAL_PROJECTS);
      await seedUserDefaultCategories(user.uid);
      setFirestoreStatus('connected');
    } catch (err) {
      console.error('Erreur injection template Firestore:', err);
      setFirestoreStatus('error');
    }
  };

  const activeBlock = timeBlocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-[#6C5CE7]/30 transition-colors">
      {/* 1. SplashScreen au chargement initial */}
      {showSplash && (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* 2. Top Header & Auth State */}
      <AuthHeader
        user={user}
        isAuthLoading={isAuthLoading}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLoginGuest={handleLoginGuest}
        onLogout={handleLogout}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenManagePillars={() => setIsManagePillarsOpen(true)}
        firestoreStatus={firestoreStatus}
      />

      {/* 3. Message d'erreur d'authentification si popup bloqué */}
      {authError && (
        <div className="bg-[#FF7675]/15 border-b border-[#FF7675]/30 px-4 py-2 text-xs text-[#FF7675] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-card)]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 4. Navigation Desktop / Tablette (cachée sur smartphone grâce à la BottomNavBar) */}
      <div className="hidden md:block bg-[var(--bg-surface)] border-b border-[var(--border-app)] px-4 py-2 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="desktop-nav-agenda"
              onClick={() => setCurrentView('agenda')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'agenda'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Time-Blocking</span>
            </button>

            <button
              id="desktop-nav-bento"
              onClick={() => setCurrentView('bento')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'bento'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard Projets (Bento)</span>
            </button>

            <button
              id="desktop-nav-activity"
              onClick={() => setCurrentView('activity')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'activity'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fiche d'Activité & Focus</span>
            </button>

            <button
              id="desktop-nav-code"
              onClick={() => setCurrentView('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'code'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Flutter M3</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManagePillarsOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition"
            >
              Gérer les Piliers ({categories.length})
            </button>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              {user ? (
                <span className="text-[#55E6C1]">users/{user.uid.substring(0, 6)}…</span>
              ) : (
                <span>Session locale</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Notification de connexion si l'utilisateur est anonyme / non connecté */}
      {!user && !isAuthLoading && (
        <div className="bg-gradient-to-r from-[#6C5CE7]/15 to-[#00CEC9]/15 border-b border-[#6C5CE7]/25 px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <span className="w-2 h-2 rounded-full bg-[#00CEC9] animate-pulse" />
            <span>
              Connectez votre compte Google pour sauvegarder vos blocs et projets dans votre base Firestore personnelle (<strong>users/{'{userId}'}/timeblocks</strong>).
            </span>
          </div>
          <button
            onClick={handleLoginWithGoogle}
            className="shrink-0 px-3 py-1 rounded-xl bg-[#6C5CE7] text-white font-bold text-xs hover:bg-[#5b4bc4] transition shadow"
          >
            Connexion Google
          </button>
        </div>
      )}

      {/* 6. Zone Principale d'Affichage selon la vue active */}
      <main className="flex-1 pb-28 md:pb-12">
        {currentView === 'agenda' && (
          <AgendaTimeline
            blocks={timeBlocks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectBlock={handleSelectBlock}
            onOpenAddModal={() => {
              setEditingBlock(null);
              setIsAddBlockOpen(true);
            }}
            onOpenProjects={() => setCurrentView('bento')}
            onSeedTemplates={handleSeedTemplates}
            onClearBlocks={handleClearBlocks}
            categories={categories}
            onOpenManagePillars={() => setIsManagePillarsOpen(true)}
          />
        )}

        {currentView === 'activity' && (
          <ActivitySheet
            block={activeBlock}
            onBack={() => setCurrentView('agenda')}
            onUpdateBlock={handleUpdateBlock}
            onOpenAddModal={() => {
              setEditingBlock(null);
              setIsAddBlockOpen(true);
            }}
            onOpenEditModal={handleOpenEditModal}
            categories={categories}
          />
        )}

        {currentView === 'bento' && (
          <ProjectsDashboard
            projects={projects}
            timeBlocks={timeBlocks}
            onBackToAgenda={() => setCurrentView('agenda')}
            onOpenAddModal={() => setIsAddProjectOpen(true)}
            onSelectBlock={handleSelectBlock}
            onToggleMilestone={handleToggleMilestone}
            onSeedProjects={handleSeedTemplates}
            categories={categories}
            onOpenManagePillars={() => setIsManagePillarsOpen(true)}
          />
        )}

        {currentView === 'code' && (
          <FlutterCodeViewer onBackToAgenda={() => setCurrentView('agenda')} />
        )}
      </main>

      {/* 7. Bottom Navigation Bar Mobile (Fixe en bas sur smartphone) */}
      <BottomNavBar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAddModal={() => {
          if (currentView === 'bento') {
            setIsAddProjectOpen(true);
          } else {
            setEditingBlock(null);
            setIsAddBlockOpen(true);
          }
        }}
        hasActiveBlock={!!activeBlock}
      />

      {/* 8. Indicateur de statut Hors-Ligne pour la PWA */}
      <OfflineIndicator />

      {/* 9. Modal Carrousel Onboarding Multipotentiel */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onLoginWithGoogle={handleLoginWithGoogle}
        isAuthenticated={!!user}
      />

      {/* 10. Modals d'ajout et d'édition de bloc de temps et de projet */}
      <AddBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => {
          setIsAddBlockOpen(false);
          setEditingBlock(null);
        }}
        onAddBlock={handleAddBlock}
        onAddBlocks={handleAddBlocks}
        initialBlock={editingBlock}
        onUpdateBlock={handleUpdateBlock}
        projects={projects}
        categories={categories}
        defaultDate={selectedDate}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onAdd={handleAddProject}
        categories={categories}
      />

      {/* 11. Modal Gestion Personnalisée des Piliers */}
      <ManagePillarsModal
        isOpen={isManagePillarsOpen}
        onClose={() => setIsManagePillarsOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}
