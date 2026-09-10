import React, { useState, useEffect } from 'react';
import { TimeBlock, Project, DomainId } from './types';
import { INITIAL_TIME_BLOCKS, INITIAL_PROJECTS, DOMAINS } from './data/mockData';
import {
  subscribeToTimeBlocks,
  subscribeToProjects,
  saveTimeBlock,
  saveProject,
  seedTemplatesToFirestore,
  clearAllBlocksFromFirestore,
  firebaseConfig,
} from './lib/firebase';
import { SplashScreen } from './components/SplashScreen';
import { AgendaTimeline } from './components/AgendaTimeline';
import { ActivitySheet } from './components/ActivitySheet';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { AddBlockModal } from './components/AddBlockModal';
import { AddProjectModal } from './components/AddProjectModal';
import {
  Calendar,
  Layers,
  Code2,
  Sparkles,
  Smartphone,
  Play,
  RotateCcw,
  CheckCircle2,
  Database,
  Cloud,
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'agenda' | 'activity' | 'projects' | 'code'>('agenda');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Firestore & Realtime data state
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(INITIAL_TIME_BLOCKS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  // Écoute temps réel Cloud Firestore (onSnapshot) pour TimeBlocks et Projets Bento Grid
  useEffect(() => {
    let unsubscribeBlocks: (() => void) | undefined;
    let unsubscribeProjects: (() => void) | undefined;

    try {
      unsubscribeBlocks = subscribeToTimeBlocks(
        (remoteBlocks, isFirst) => {
          setIsFirestoreConnected(true);
          if (remoteBlocks.length > 0) {
            setTimeBlocks(remoteBlocks);
          } else if (isFirst) {
            // Premier chargement si la collection Firestore est vide : peupler avec les modèles
            seedTemplatesToFirestore(INITIAL_TIME_BLOCKS, INITIAL_PROJECTS).catch((err) => {
              console.warn('Auto-seed initial notice:', err);
            });
            setTimeBlocks(INITIAL_TIME_BLOCKS);
          } else {
            setTimeBlocks([]);
          }
        },
        (err) => {
          console.warn('Erreur Firestore onSnapshot (time_blocks):', err);
          setIsFirestoreConnected(false);
        }
      );

      unsubscribeProjects = subscribeToProjects(
        (remoteProjects, isFirst) => {
          setIsFirestoreConnected(true);
          if (remoteProjects.length > 0) {
            setProjects(remoteProjects);
          } else if (isFirst) {
            setProjects(INITIAL_PROJECTS);
          } else {
            setProjects([]);
          }
        },
        (err) => {
          console.warn('Erreur Firestore onSnapshot (projects):', err);
          setIsFirestoreConnected(false);
        }
      );
    } catch (e) {
      console.error('Erreur initialisation listeners Firestore:', e);
      setIsFirestoreConnected(false);
    }

    return () => {
      unsubscribeBlocks?.();
      unsubscribeProjects?.();
    };
  }, []);

  // Handlers Firestore réactifs
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setCurrentView('activity');
  };

  const handleUpdateBlock = async (updated: TimeBlock) => {
    // Mise à jour optimiste locale immédiate
    setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setIsSyncing(true);
    try {
      await saveTimeBlock(updated);
    } catch (err) {
      console.error('Erreur setDoc Firestore (block):', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddBlock = async (newBlockData: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      ...newBlockData,
      id: `block-${Date.now()}`,
    };
    setTimeBlocks((prev) => [...prev, newBlock]);
    setIsSyncing(true);
    try {
      await saveTimeBlock(newBlock);
    } catch (err) {
      console.error('Erreur setDoc Firestore (new block):', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddProject = async (newProjectData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...newProjectData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [newProj, ...prev]);
    setIsSyncing(true);
    try {
      await saveProject(newProj);
    } catch (err) {
      console.error('Erreur setDoc Firestore (new project):', err);
    } finally {
      setIsSyncing(false);
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
    setIsSyncing(true);
    try {
      await saveProject(updatedProject);
    } catch (err) {
      console.error('Erreur setDoc Firestore (milestone):', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearBlocks = async () => {
    setIsSyncing(true);
    try {
      await clearAllBlocksFromFirestore(timeBlocks);
      setTimeBlocks([]);
    } catch (err) {
      console.error('Erreur clear Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedTemplates = async () => {
    setIsSyncing(true);
    try {
      await seedTemplatesToFirestore(INITIAL_TIME_BLOCKS, INITIAL_PROJECTS);
      setTimeBlocks(INITIAL_TIME_BLOCKS);
      setProjects(INITIAL_PROJECTS);
    } catch (err) {
      console.error('Erreur seeding Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeBlock = timeBlocks.find((b) => b.id === selectedBlockId) || timeBlocks[0];

  return (
    <div className="min-h-screen bg-[#121214] text-[#EDEDED] font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-[#6C5CE7]/30">
      {/* 1. Splash Screen Overlay if active */}
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
          }}
        />
      )}

      {/* 2. Top Application Bar */}
      <header className="sticky top-0 z-30 bg-[#17171B]/90 backdrop-blur-md border-b border-[#2E2E38] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div
            onClick={() => {
              setCurrentView('agenda');
              setSelectedBlockId(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] via-[#55E6C1] to-[#FF7675] p-[1.5px] shadow-lg shadow-[#6C5CE7]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#121214] rounded-[10px] flex items-center justify-center">
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#6C5CE7] to-[#55E6C1]">
                  ∞
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-[#55E6C1] transition-colors">
                  Spectrum
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E1E24] border border-[#2E2E38] text-[#55E6C1] font-semibold">
                  Flutter M3
                </span>
              </div>
              <span className="text-[11px] text-[#A0A0AB] hidden sm:inline">
                Assistant pour esprit multipotentiel
              </span>
            </div>
          </div>

          {/* Firestore Connection Badge */}
          <div
            title={`Projet Firebase: ${firebaseConfig.projectId}`}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#1E1E24] border border-[#2E2E38] text-[11px]"
          >
            <span className="relative flex h-2 w-2">
              {isFirestoreConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#55E6C1] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isFirestoreConnected ? 'bg-[#55E6C1]' : 'bg-[#FF7675]'
                }`}
              />
            </span>
            <span className="font-mono text-[#A0A0AB]">
              Firestore: <span className="text-white font-semibold">{firebaseConfig.projectId}</span>
            </span>
            {isSyncing ? (
              <span className="text-[#55E6C1] animate-pulse text-[10px] font-mono">• sync...</span>
            ) : (
              <span className="text-[#55E6C1] text-[10px] font-mono">live</span>
            )}
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1.5 bg-[#121214] p-1 rounded-2xl border border-[#2E2E38]">
            <button
              id="nav-agenda-btn"
              onClick={() => {
                setCurrentView('agenda');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'agenda'
                  ? 'bg-[#1E1E24] text-white shadow-sm border border-[#2E2E38]'
                  : 'text-[#A0A0AB] hover:text-white hover:bg-[#1E1E24]/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span className="hidden md:inline">1. Agenda (Timeline)</span>
              <span className="md:hidden">Agenda</span>
            </button>

            <button
              id="nav-activity-btn"
              onClick={() => {
                if (!selectedBlockId && timeBlocks.length > 0) {
                  setSelectedBlockId(timeBlocks[0].id);
                }
                setCurrentView('activity');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'activity'
                  ? 'bg-[#1E1E24] text-white shadow-sm border border-[#2E2E38]'
                  : 'text-[#A0A0AB] hover:text-white hover:bg-[#1E1E24]/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7675]" />
              <span className="hidden md:inline">2. Fiche d'Activité</span>
              <span className="md:hidden">Activité</span>
            </button>

            <button
              id="nav-projects-btn"
              onClick={() => {
                setCurrentView('projects');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'projects'
                  ? 'bg-[#1E1E24] text-white shadow-sm border border-[#2E2E38]'
                  : 'text-[#A0A0AB] hover:text-white hover:bg-[#1E1E24]/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#55E6C1]" />
              <span className="hidden md:inline">3. Dashboard (Bento)</span>
              <span className="md:hidden">Bento</span>
            </button>

            <button
              id="nav-code-btn"
              onClick={() => {
                setCurrentView('code');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentView === 'code'
                  ? 'bg-[#6C5CE7] text-white shadow-md'
                  : 'text-[#A0A0AB] hover:text-white hover:bg-[#1E1E24]/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="font-bold">Code Flutter (Dart)</span>
            </button>
          </nav>

          {/* Replay Splash Button */}
          <button
            id="replay-splash-btn"
            onClick={() => setShowSplash(true)}
            className="p-2 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-[#2E2E38] text-[#A0A0AB] hover:text-white transition-colors"
            title="Rejouer l'animation d'ouverture (Ruban de Möbius)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Views Router */}
      <main className="flex-1">
        {currentView === 'agenda' && (
          <AgendaTimeline
            blocks={timeBlocks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectBlock={handleSelectBlock}
            onOpenAddModal={() => setIsAddBlockOpen(true)}
            onOpenProjects={() => setCurrentView('projects')}
            onSeedTemplates={handleSeedTemplates}
            onClearBlocks={handleClearBlocks}
          />
        )}

        {currentView === 'activity' && activeBlock && (
          <ActivitySheet
            block={activeBlock}
            onBack={() => setCurrentView('agenda')}
            onUpdateBlock={handleUpdateBlock}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsDashboard
            projects={projects}
            onBackToAgenda={() => setCurrentView('agenda')}
            onOpenAddModal={() => setIsAddProjectOpen(true)}
            onToggleMilestone={handleToggleMilestone}
          />
        )}

        {currentView === 'code' && <FlutterCodeViewer />}
      </main>

      {/* Modals */}
      <AddBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onAdd={handleAddBlock}
        defaultDate={selectedDate}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onAdd={handleAddProject}
      />
    </div>
  );
}
