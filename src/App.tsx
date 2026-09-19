import React, { useState, useEffect, useMemo } from 'react';
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
  deleteUserProject,
  saveUserCategory,
  deleteUserCategory,
  saveUserCategoriesBatch,
  saveUserTimeBlocksBatch,
  deleteUserTimeBlocksBatch,
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
import { InitialPillarsSetupModal } from './components/InitialPillarsSetupModal';
import { InstantSessionModal } from './components/InstantSessionModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationAlertBanner } from './components/NotificationAlertBanner';
import {
  soundSynthesizer,
  isSoundEnabled,
  setSoundEnabled,
  hasBeenNotified,
  markAsNotified,
  sendNativeNotification,
} from './utils/notifications';
import {
  Calendar,
  Layers,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Zap,
} from 'lucide-react';

export default function App() {
  // Splash & Onboarding State
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('spectrum_splash_shown');
    } catch {
      return false;
    }
  });
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
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    try {
      const cached = localStorage.getItem('spectrum_time_blocks_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('spectrum_projects_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [categories, setCategories] = useState<DomainConfig[]>(() => {
    try {
      const cached = localStorage.getItem('spectrum_custom_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'error' | 'syncing'>('connected');

  // Miroir de sauvegarde locale pour garantir la résilience contre toute déconnexion ou rafraîchissement
  useEffect(() => {
    try {
      localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify(timeBlocks));
    } catch (e) {
      console.warn('Erreur synchronisation localStorage timeBlocks:', e);
    }
  }, [timeBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem('spectrum_projects_v2', JSON.stringify(projects));
    } catch (e) {
      console.warn('Erreur synchronisation localStorage projects:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('spectrum_custom_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('Erreur synchronisation localStorage categories:', e);
    }
  }, [categories]);

  // Modals
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [selectedPillarForAdd, setSelectedPillarForAdd] = useState<string | null>(null);
  const [prefilledBlockData, setPrefilledBlockData] = useState<{
    title?: string;
    domain?: string;
    projectId?: string;
    objective?: string;
  } | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isManagePillarsOpen, setIsManagePillarsOpen] = useState(false);
  const [isInitialPillarsSetupOpen, setIsInitialPillarsSetupOpen] = useState(false);
  const [isInstantSessionModalOpen, setIsInstantSessionModalOpen] = useState(false);
  const [autoOpenImmersion, setAutoOpenImmersion] = useState(false);

  // 1. Écoute et restauration automatique de l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthUserChanged(
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsAuthLoading(false);
      },
      (error) => {
        console.error('Erreur restauration session auth:', error);
        setIsAuthLoading(false);
      }
    );

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
    // Si l'état auth est toujours en cours de vérification initiale, on attend
    // pour éviter de repasser prématurément par un état déconnecté ou vidé
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      // Si déconnecté après vérification, préserver la session locale
      // (NE JAMAIS effacer les blocs importés ni les projets de l'utilisateur)
      try {
        const cached = localStorage.getItem('spectrum_time_blocks_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTimeBlocks(parsed);
          }
        }
      } catch (_) {}
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
          // Si Firestore est encore vide mais que l'utilisateur a des blocs locaux (ex: importés avant connexion)
          if (remoteBlocks.length === 0) {
            try {
              const cached = localStorage.getItem('spectrum_time_blocks_v2');
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Sauvegarde automatique des blocs locaux dans Firestore
                  saveUserTimeBlocksBatch(user.uid, parsed).catch((e) =>
                    console.warn('Erreur synchronisation initiale blocs vers Firestore:', e)
                  );
                  setTimeBlocks(parsed);
                  setFirestoreStatus('connected');
                  return;
                }
              }
            } catch (_) {}
          }

          // Auto-repair existing blocks (e.g., birthdays forced to 09:00-10:00 or assigned to curiosity)
          const repaired = remoteBlocks.map((b) => {
            let mod = false;
            let updated = { ...b };
            const titleLower = (b.title || '').toLowerCase();
            const isBirthday =
              titleLower.includes('birthday') ||
              titleLower.includes('anniversaire') ||
              titleLower.includes('anniv') ||
              titleLower.includes('naissance');

            // 1. If it's a fixed constraint or birthday, it shouldn't be assigned to 'curiosity'
            if ((b.isFixedConstraint || isBirthday) && (b.domain === 'curiosity' || !b.domain)) {
              updated.domain = 'constraint';
              updated.isFixedConstraint = true;
              mod = true;
            }

            // 2. If it's an all-day event or birthday stuck at 09:00-10:00
            if (
              (isBirthday || b.isAllDay) &&
              ((b.startTime === '09:00' && b.endTime === '10:00') || !b.isAllDay)
            ) {
              updated.isAllDay = true;
              updated.startTime = 'Toute la journée';
              updated.endTime = 'Toute la journée';
              updated.startMinutes = 0;
              updated.durationMinutes = 1440;
              mod = true;
            }

            if (mod) {
              // Persist repair asynchronously to Firestore
              saveUserTimeBlock(user.uid, updated).catch((e) =>
                console.warn('Erreur auto-réparation bloc:', e)
              );
              return updated;
            }
            return b;
          });

          setTimeBlocks(repaired);
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

      // Piliers dynamiques / Categories (100% personnalisables dès la création de compte)
      unsubscribeCategories = subscribeToUserCategories(
        user.uid,
        (remoteCategories) => {
          if (remoteCategories.length === 0) {
            // Aucun pilier pré-établi d'office pour les nouveaux comptes
            setCategories([]);
            setIsInitialPillarsSetupOpen(true);
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
  }, [user, isAuthLoading]);

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

  // Active in-app notification alert banner
  const [activeAlert, setActiveAlert] = useState<{
    block: TimeBlock;
    minutesBefore: number;
    isStartingNow: boolean;
  } | null>(null);
  const [isNotificationSoundOn, setIsNotificationSoundOn] = useState<boolean>(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = !isNotificationSoundOn;
    setIsNotificationSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      soundSynthesizer.playChime();
    }
  };

  // Date formatée du jour pour les rappels (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Blocs prévus pour aujourd'hui (incluant récurrences actives)
  const todayBlocks = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    return timeBlocks
      .filter((b) => {
        if (b.isRecurring) {
          return Array.isArray(b.recurringDays) && b.recurringDays.includes(currentDayOfWeek);
        }
        return b.date === todayStr;
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [timeBlocks, todayStr]);

  // Surveillance proactive continue (toutes les 15 secondes)
  useEffect(() => {
    const checkUpcomingReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      todayBlocks.forEach((block) => {
        // Ignorer si rappel explicitement désactivé ou déjà terminé
        if (block.reminderEnabled === false || block.completed) return;

        const reminderMinutes = block.reminderMinutesBefore ?? 5;
        const triggerMinutes = block.startMinutes - reminderMinutes;

        // Déclencher quand la minute actuelle correspond au seuil choisi
        const isTriggerTime = currentMinutes === triggerMinutes;

        if (isTriggerTime && !hasBeenNotified(block.id, todayStr, reminderMinutes)) {
          markAsNotified(block.id, todayStr, reminderMinutes);

          const isStartingNow = reminderMinutes === 0;
          const alertData = {
            block,
            minutesBefore: reminderMinutes,
            isStartingNow,
          };

          // 1. Toast / Bannière visuelle in-app
          setActiveAlert(alertData);

          // 2. Carillon sonore zen Web Audio
          if (isSoundEnabled()) {
            soundSynthesizer.playChime();
          }

          // 3. Notification native du navigateur (si accordée)
          const notifTitle = isStartingNow
            ? `C'est l'heure : ${block.title} !`
            : `Rappel : ${block.title} dans ${reminderMinutes} min`;
          const notifBody = `${block.startTime} — ${block.endTime} • ${block.globalObjective || 'Prêt pour votre session'}`;

          sendNativeNotification(notifTitle, {
            body: notifBody,
            onClick: () => {
              setSelectedBlockId(block.id);
              setCurrentView('activity');
            },
          });
        }
      });
    };

    checkUpcomingReminders();
    const interval = setInterval(checkUpcomingReminders, 15000);
    return () => clearInterval(interval);
  }, [todayBlocks, todayStr]);

  const handleOpenBlockFromAlert = (blockId: string) => {
    setSelectedBlockId(blockId);
    setCurrentView('activity');
    setActiveAlert(null);
  };

  const handleSnoozeAlert = (block: TimeBlock, snoozeMinutes: number) => {
    setActiveAlert(null);
    setTimeout(() => {
      setActiveAlert({
        block,
        minutesBefore: 0,
        isStartingNow: true,
      });
      if (isSoundEnabled()) {
        soundSynthesizer.playChime();
      }
    }, snoozeMinutes * 60 * 1000);
  };

  const handleTriggerTestAlert = () => {
    const sampleBlock: TimeBlock = todayBlocks[0] || {
      id: 'test-block-sample',
      title: 'Session Focus Multipotentiel',
      domain: categories[0]?.id || 'tech',
      startTime: '14:00',
      endTime: '15:30',
      startMinutes: 14 * 60,
      durationMinutes: 90,
      isRecurring: false,
      recurringDays: [],
      globalObjective: 'Tester les notifications, le carillon zen et la bannière interactive.',
      notes: '',
      subtasks: [],
      reminderEnabled: true,
      reminderMinutesBefore: 5,
    };

    setActiveAlert({
      block: sampleBlock,
      minutesBefore: 5,
      isStartingNow: false,
    });

    if (isSoundEnabled()) {
      soundSynthesizer.playChime();
    }

    sendNativeNotification('Spectrum • Alerte de test (5 min avant)', {
      body: `${sampleBlock.title} débutera bientôt. Carillon sonore zen validé !`,
      onClick: () => {
        setSelectedBlockId(sampleBlock.id);
        setCurrentView('activity');
      },
    });
  };

  // CRUD TimeBlocks
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setCurrentView('activity');
  };

  const handleOpenAddBlockModal = (pillarId?: string) => {
    setEditingBlock(null);
    setPrefilledBlockData(null);
    setSelectedPillarForAdd(pillarId || null);
    setIsAddBlockOpen(true);
  };

  const handleCloseAddBlockModal = () => {
    setIsAddBlockOpen(false);
    setEditingBlock(null);
    setSelectedPillarForAdd(null);
    setPrefilledBlockData(null);
  };

  const handleOpenEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setPrefilledBlockData(null);
    setSelectedPillarForAdd(block.domain || null);
    setIsAddBlockOpen(true);
  };

  const handleScheduleMilestone = (project: Project, milestoneTitle: string) => {
    setEditingBlock(null);
    setSelectedPillarForAdd(project.domain);
    setPrefilledBlockData({
      title: milestoneTitle,
      domain: project.domain,
      projectId: project.id,
      objective: `Accomplir le jalon : ${milestoneTitle} (${project.title})`,
    });
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
      id: `block-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    }));
    setTimeBlocks((prev) => {
      const updated = [...prev, ...newBlocks];
      try {
        localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserTimeBlocksBatch(user.uid, newBlocks);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur création blocs multiples Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleImportBlocks = async (newBlocks: TimeBlock[]) => {
    // 1. Sauvegarde locale immédiate (state + localStorage)
    setTimeBlocks((prev) => {
      const updated = [...prev, ...newBlocks];
      try {
        localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 2. Sauvegarde atomique par lot (batch) dans Firestore
    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserTimeBlocksBatch(user.uid, newBlocks);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur import calendrier Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleClearBlocks = async () => {
    const currentBlocks = [...timeBlocks];
    setTimeBlocks([]);
    try {
      localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify([]));
    } catch (_) {}

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await clearUserTimeBlocks(user.uid, currentBlocks);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur vidage blocs Firestore:', err);
        setFirestoreStatus('error');
      }
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setTimeBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      try {
        localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    if (user) {
      try {
        await deleteUserTimeBlock(user.uid, blockId);
      } catch (err) {
        console.error('Erreur suppression bloc Firestore:', err);
      }
    }
  };

  const handleDeleteBlocks = async (blockIds: string[]) => {
    const idsSet = new Set(blockIds);
    setTimeBlocks((prev) => {
      const updated = prev.filter((b) => !idsSet.has(b.id));
      try {
        localStorage.setItem('spectrum_time_blocks_v2', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    if (user) {
      try {
        await deleteUserTimeBlocksBatch(user.uid, blockIds);
      } catch (err) {
        console.error('Erreur suppression blocs Firestore:', err);
      }
    }
  };

  // Démarrage rapide d'une session spontanée à la minute précise actuelle
  const handleStartInstantSession = async (options?: {
    pillarId?: string;
    title?: string;
    durationMinutes?: number;
    openInZenFullscreen?: boolean;
  }) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const startHour = now.getHours();
    const startMin = now.getMinutes();
    const startTime = `${pad(startHour)}:${pad(startMin)}`;

    const duration = options?.durationMinutes || 25;
    const startTotalMinutes = startHour * 60 + startMin;
    const endMinutesTotal = startTotalMinutes + duration;
    const endHour = Math.floor((endMinutesTotal / 60) % 24);
    const endMin = endMinutesTotal % 60;
    const endTime = `${pad(endHour)}:${pad(endMin)}`;

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const todayStr = `${year}-${month}-${day}`;

    // Select domain: provided pillarId, or first category, or 'tech'
    const domain =
      options?.pillarId ||
      categories.find((c) => c.id === 'tech')?.id ||
      categories[0]?.id ||
      'tech';
    const categoryObj = categories.find((c) => c.id === domain);
    const domainName = categoryObj ? categoryObj.name : 'Tech / Dev';

    const finalTitle = options?.title || `Session Spontanée : ${domainName}`;

    const newBlock: TimeBlock = {
      id: `block-instant-${Date.now()}`,
      title: finalTitle,
      domain,
      startTime,
      endTime,
      startMinutes: startTotalMinutes,
      durationMinutes: duration,
      globalObjective: finalTitle,
      completed: false,
      date: todayStr,
      isRecurring: false,
      recurringDays: [],
      subtasks: [
        { id: `st-${Date.now()}-1`, text: 'Entrer dans le flow immédiat', completed: false },
        { id: `st-${Date.now()}-2`, text: 'Avancer sur le point clé sans distraction', completed: false },
      ],
      checklist: [
        { id: `st-${Date.now()}-1`, title: 'Entrer dans le flow immédiat', isCompleted: false },
        { id: `st-${Date.now()}-2`, title: 'Avancer sur le point clé sans distraction', isCompleted: false },
      ],
      notes: `### ⚡ Session Spontanée démarrée à ${startTime}\n- **Pilier :** ${domainName}\n- **Créneau réel :** ${startTime} ➔ ${endTime} (${duration} min)\n- **Objectif immédiat :** Flow, concentration & code direct\n\n`,
    };

    setTimeBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSelectedDate(new Date());
    setAutoOpenImmersion(!!options?.openInZenFullscreen);
    setCurrentView('activity');

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserTimeBlock(user.uid, newBlock);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur sauvegarde session spontanée Firestore:', err);
        setFirestoreStatus('error');
      }
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

  const handleAddProjectMilestone = async (projectId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const newMilestone = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: trimmed,
      completed: false,
    };

    const updatedMilestones = [...targetProject.milestones, newMilestone];
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

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
        console.error('Erreur ajout milestone Firestore:', err);
      }
    }
  };

  const handleDeleteProjectMilestone = async (projectId: string, milestoneId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const updatedMilestones = targetProject.milestones.filter((m) => m.id !== milestoneId);
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress =
      updatedMilestones.length > 0
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : 0;

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
        console.error('Erreur suppression milestone Firestore:', err);
      }
    }
  };

  const handleSaveProjectNotes = async (projectId: string, notes: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const updatedProject: Project = {
      ...targetProject,
      notes,
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur sauvegarde notes projet Firestore:', err);
      }
    }
  };

  const handleAddProjectQuickNote = async (projectId: string, noteText: string) => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const newNote = {
      id: `qn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      createdAt: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedProject: Project = {
      ...targetProject,
      quickNotes: [newNote, ...(targetProject.quickNotes || [])],
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur ajout flash note Firestore:', err);
      }
    }
  };

  const handleDeleteProjectQuickNote = async (projectId: string, noteId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    const updatedProject: Project = {
      ...targetProject,
      quickNotes: (targetProject.quickNotes || []).filter((qn) => qn.id !== noteId),
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur suppression flash note Firestore:', err);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (user) {
      try {
        await deleteUserProject(user.uid, projectId);
      } catch (err) {
        console.error('Erreur suppression projet Firestore:', err);
      }
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const completedMilestones = target.milestones.map((m) => ({ ...m, completed: true }));
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const updatedProject: Project = {
      ...target,
      status: 'completed',
      progress: 100,
      archived: true,
      archivedAt: nowIso,
      completionDate: formattedDate,
      milestones: completedMilestones,
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur archivage projet Firestore:', err);
      }
    }
  };

  const handleUnarchiveProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const updatedProject: Project = {
      ...target,
      status: 'in_progress',
      archived: false,
    };

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));

    if (user) {
      try {
        await saveUserProject(user.uid, updatedProject);
      } catch (err) {
        console.error('Erreur désarchivage projet Firestore:', err);
      }
    }
  };

  // Dynamic Pillars / Categories CRUD (100% personnalisables)
  const handleSaveCategory = async (cat: DomainConfig) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      let updated: DomainConfig[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = cat;
      } else {
        updated = [...prev, cat];
      }
      try {
        localStorage.setItem('spectrum_custom_categories', JSON.stringify(updated));
      } catch (_) {}
      return updated;
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
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catId);
      try {
        localStorage.setItem('spectrum_custom_categories', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (user) {
      try {
        await deleteUserCategory(user.uid, catId);
      } catch (err) {
        console.error('Erreur suppression pilier Firestore:', err);
      }
    }
  };

  const handleSaveInitialPillars = async (newPillars: DomainConfig[]) => {
    setCategories(newPillars);
    try {
      localStorage.setItem('spectrum_custom_categories', JSON.stringify(newPillars));
    } catch (_) {}

    if (user) {
      setFirestoreStatus('syncing');
      try {
        await saveUserCategoriesBatch(user.uid, newPillars);
        setFirestoreStatus('connected');
      } catch (err) {
        console.error('Erreur sauvegarde par lot des piliers:', err);
        setFirestoreStatus('error');
        throw err;
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
      {/* 0. Indicateur de chargement global pendant la vérification de l'état Auth au démarrage */}
      {isAuthLoading && (
        <div
          id="global-auth-loading-indicator"
          className="fixed inset-0 z-50 bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 text-[var(--text-primary)] transition-opacity select-none"
        >
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Animated branding logo */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] via-[#0984E3] to-[#00CEC9] p-[2px] animate-spin shadow-lg shadow-[#6C5CE7]/20">
                <div className="w-full h-full bg-[var(--bg-surface)] rounded-[14px]" />
              </div>
              <Sparkles className="w-6 h-6 text-[#6C5CE7] absolute animate-pulse" />
            </div>

            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Spectrum
              </h2>
              <div className="flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs text-[var(--text-secondary)] shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6C5CE7]" />
                <span>Restauration de la session...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. SplashScreen au premier chargement de la session */}
      {!isAuthLoading && showSplash && (
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem('spectrum_splash_shown', 'true');
            } catch (_) {}
          }}
          onFinish={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem('spectrum_splash_shown', 'true');
            } catch (_) {}
          }}
        />
      )}

      {/* 2. Notification In-App Toast Banner */}
      {activeAlert && (
        <NotificationAlertBanner
          alert={activeAlert}
          categories={categories}
          onOpenBlock={handleOpenBlockFromAlert}
          onDismiss={() => setActiveAlert(null)}
          onSnooze={handleSnoozeAlert}
          isSoundOn={isNotificationSoundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 3. Top Header & Auth State */}
      <AuthHeader
        user={user}
        isAuthLoading={isAuthLoading}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLoginGuest={handleLoginGuest}
        onLogout={handleLogout}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenManagePillars={() => setIsManagePillarsOpen(true)}
        onOpenInstantSession={() => setIsInstantSessionModalOpen(true)}
        firestoreStatus={firestoreStatus}
        todayBlocks={todayBlocks}
        categories={categories}
        onTriggerTestAlert={handleTriggerTestAlert}
        onSelectBlock={handleOpenBlockFromAlert}
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
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white shadow-md shadow-[#8A2BE2]/30'
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
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white shadow-md shadow-[#8A2BE2]/30'
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
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white shadow-md shadow-[#8A2BE2]/30'
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
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8A2BE2] text-white shadow-md shadow-[#8A2BE2]/30'
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
            onUpdateBlock={handleUpdateBlock}
            onAddBlock={handleAddBlock}
            onOpenAddModal={handleOpenAddBlockModal}
            onOpenProjects={() => setCurrentView('bento')}
            onSeedTemplates={handleSeedTemplates}
            onClearBlocks={handleClearBlocks}
            categories={categories}
            projects={projects}
            onOpenManagePillars={() => setIsManagePillarsOpen(true)}
            onImportBlocks={handleImportBlocks}
            onDeleteBlock={handleDeleteBlock}
            onDeleteBlocks={handleDeleteBlocks}
            onOpenInstantSessionModal={() => setIsInstantSessionModalOpen(true)}
            onStartInstantSession={handleStartInstantSession}
          />
        )}

        {currentView === 'activity' && (
          <ActivitySheet
            block={activeBlock}
            onBack={() => {
              setAutoOpenImmersion(false);
              setCurrentView('agenda');
            }}
            onUpdateBlock={handleUpdateBlock}
            onOpenAddModal={(pillarId) => handleOpenAddBlockModal(pillarId || activeBlock?.domain)}
            onOpenEditModal={handleOpenEditModal}
            categories={categories}
            initialOpenImmersion={autoOpenImmersion}
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
            onAddMilestone={handleAddProjectMilestone}
            onDeleteMilestone={handleDeleteProjectMilestone}
            onScheduleMilestone={handleScheduleMilestone}
            onDeleteProject={handleDeleteProject}
            onArchiveProject={handleArchiveProject}
            onUnarchiveProject={handleUnarchiveProject}
            onSaveProjectNotes={handleSaveProjectNotes}
            onAddProjectQuickNote={handleAddProjectQuickNote}
            onDeleteProjectQuickNote={handleDeleteProjectQuickNote}
            onSeedProjects={handleSeedTemplates}
            categories={categories}
            onOpenManagePillars={() => setIsManagePillarsOpen(true)}
          />
        )}

        {currentView === 'code' && (
          <FlutterCodeViewer onBackToAgenda={() => setCurrentView('agenda')} />
        )}

        {/* Fallback de sécurité si la vue est indéfinie ou invalide */}
        {!['agenda', 'activity', 'bento', 'code'].includes(currentView) && (
          <AgendaTimeline
            blocks={timeBlocks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectBlock={handleSelectBlock}
            onUpdateBlock={handleUpdateBlock}
            onOpenAddModal={handleOpenAddBlockModal}
            onOpenProjects={() => setCurrentView('bento')}
            onSeedTemplates={handleSeedTemplates}
            onClearBlocks={handleClearBlocks}
            categories={categories}
            onOpenManagePillars={() => setIsManagePillarsOpen(true)}
          />
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
            handleOpenAddBlockModal();
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

      {/* 10. Modals d'ajout et d'édition de bloc de temps et de projet protégées par ErrorBoundary */}
      {isAddBlockOpen && (
        <ErrorBoundary
          onReset={handleCloseAddBlockModal}
          fallbackTitle="Erreur dans la modale d'ajout de bloc"
        >
          <AddBlockModal
            isOpen={isAddBlockOpen}
            onClose={handleCloseAddBlockModal}
            onAddBlock={handleAddBlock}
            onAddBlocks={handleAddBlocks}
            initialBlock={editingBlock}
            initialPillarId={selectedPillarForAdd}
            initialProjectId={prefilledBlockData?.projectId}
            initialTitle={prefilledBlockData?.title}
            initialObjective={prefilledBlockData?.objective}
            onUpdateBlock={handleUpdateBlock}
            projects={projects}
            categories={categories}
            defaultDate={selectedDate}
          />
        </ErrorBoundary>
      )}

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

      {/* 12. Modal Démarrer Maintenant / Session Spontanée à la minute précise */}
      <InstantSessionModal
        isOpen={isInstantSessionModalOpen}
        onClose={() => setIsInstantSessionModalOpen(false)}
        categories={categories}
        onConfirm={handleStartInstantSession}
      />

      {/* 13. Modal d'Accueil & Configuration 100% Personnalisée des Piliers pour les Nouveaux Comptes */}
      <InitialPillarsSetupModal
        isOpen={isInitialPillarsSetupOpen}
        onClose={() => setIsInitialPillarsSetupOpen(false)}
        onSavePillars={handleSaveInitialPillars}
        initialCategories={categories}
        userEmail={user?.displayName || user?.email}
      />
    </div>
  );
}
