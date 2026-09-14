import React, { useState, useEffect, useRef } from 'react';
import { TimeBlock, DomainConfig } from '../types';
import { getPillarIcon } from '../utils/iconMap';
import { MarkdownNotesEditor } from './MarkdownNotesEditor';
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Check,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  CloudRain,
  Coffee,
  Wind,
  Brain,
  Bell,
  CheckCircle2,
  Flag,
  ListTodo,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DeepWorkSoundType,
  SOUND_OPTIONS,
  playDeepWorkSound,
  stopDeepWorkSound,
  setDeepWorkVolume,
  playChime,
} from '../utils/deepWorkAudio';

interface FullscreenImmersionViewProps {
  block: TimeBlock;
  domainConfig: {
    name: string;
    color: string;
    label?: string;
    iconName?: string;
  };
  subtasks: { id: string; text: string; completed: boolean }[];
  onToggleTask: (id: string) => void;
  onAddTask: (text: string) => void;
  onDeleteTask: (id: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onClose: () => void;
  onToggleBlockCompletion: () => void;
}

export const FullscreenImmersionView: React.FC<FullscreenImmersionViewProps> = ({
  block,
  domainConfig,
  subtasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  notes,
  onNotesChange,
  onClose,
  onToggleBlockCompletion,
}) => {
  const Icon = getPillarIcon(domainConfig.iconName);

  // Timer states
  const defaultMinutes = block.durationMinutes || 25;
  const [selectedDuration, setSelectedDuration] = useState<number>(defaultMinutes);
  const [secondsLeft, setSecondsLeft] = useState<number>(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerPreset, setTimerPreset] = useState<'custom' | '25' | '50' | '90'>('custom');

  // Audio Ambient states
  const [activeSound, setActiveSound] = useState<DeepWorkSoundType>('rain');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4);
  const [showSoundSelector, setShowSoundSelector] = useState<boolean>(false);

  // Native fullscreen state
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [newSubtaskInput, setNewSubtaskInput] = useState<string>('');
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);

  // Active view tab on mobile screens (Timer / Tasks / Notes)
  const [mobileTab, setMobileTab] = useState<'timer' | 'notes'>('timer');

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync native fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Escape key handler to exit immersion mode cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If sound selector is open, close it first
        if (showSoundSelector) {
          setShowSoundSelector(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showSoundSelector]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      stopDeepWorkSound();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current as NodeJS.Timeout);
            setIsRunning(false);
            playChime('focus_end');
            try {
              confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.5 },
                colors: [domainConfig.color, '#6C5CE7', '#55E6C1', '#ffffff'],
              });
            } catch (_) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, domainConfig.color]);

  const toggleTimer = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    // If starting and sound is toggled on, start sound
    if (nextRunning && isAudioPlaying) {
      playDeepWorkSound(activeSound, volume);
    }
  };

  const resetTimer = (durationMinutes = selectedDuration) => {
    setIsRunning(false);
    setSelectedDuration(durationMinutes);
    setSecondsLeft(durationMinutes * 60);
  };

  const handleAddMinutes = (extraMinutes: number) => {
    setSecondsLeft((prev) => prev + extraMinutes * 60);
  };

  const handlePresetSelect = (mins: number, presetKey: '25' | '50' | '90') => {
    setTimerPreset(presetKey);
    resetTimer(mins);
  };

  // Sound playback handlers
  const toggleAudio = () => {
    if (isAudioPlaying) {
      stopDeepWorkSound();
      setIsAudioPlaying(false);
    } else {
      playDeepWorkSound(activeSound, volume);
      setIsAudioPlaying(true);
    }
  };

  const handleSelectSound = (soundId: DeepWorkSoundType) => {
    setActiveSound(soundId);
    if (isAudioPlaying) {
      playDeepWorkSound(soundId, volume);
    }
    setShowSoundSelector(false);
  };

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsNativeFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsNativeFullscreen(false);
        }
      }
    } catch (_) {
      // Fallback is already handled by fixed inset-0 overlay
    }
  };

  // Subtask addition
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    onAddTask(newSubtaskInput.trim());
    setNewSubtaskInput('');
    triggerSaveBadge();
  };

  const triggerSaveBadge = () => {
    setSaveIndicator('Enregistré');
    setTimeout(() => setSaveIndicator(null), 1800);
  };

  // Time format calculations
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = selectedDuration * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  const completedCount = subtasks.filter((t) => t.completed).length;

  return (
    <div
      id="zen-immersion-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#080B11] text-[#E2E8F0] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#6C5CE7] selection:text-white"
    >
      {/* Lueur d'ambiance en arrière-plan aux couleurs du domaine */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-15 transition-all duration-1000"
        style={{ backgroundColor: domainConfig.color }}
      />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-10 bg-[#6C5CE7]" />

      {/* 1. EN-TÊTE ULTRA-ÉPURÉ DU MODE IMMERSION */}
      <header className="relative z-20 px-4 sm:px-8 py-3.5 border-b border-white/10 bg-[#080B11]/80 backdrop-blur-md flex items-center justify-between gap-4">
        {/* Pilier et Titre du bloc */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
            style={{
              backgroundColor: `${domainConfig.color}25`,
              color: domainConfig.color,
            }}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest"
                style={{ color: domainConfig.color }}
              >
                {domainConfig.name}
              </span>
              <span className="text-[10px] text-white/40">•</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Mode Immersion Zen
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md md:max-w-lg">
              {block.title}
            </h1>
          </div>
        </div>

        {/* Contrôles de droite (Audio, Plein écran natif, Quitter) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Menu audio d'ambiance */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSoundSelector(!showSoundSelector)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isAudioPlaying
                  ? 'bg-[#6C5CE7]/20 border-[#6C5CE7] text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Ambiance sonore de Deep Work"
            >
              {isAudioPlaying ? (
                <Volume2 className="w-4 h-4 text-[#A29BFE] animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/60" />
              )}
              <span className="hidden md:inline">
                {isAudioPlaying
                  ? SOUND_OPTIONS.find((s) => s.id === activeSound)?.name || 'Son actif'
                  : 'Ambiance'}
              </span>
            </button>

            {/* Dropdown sélecteur d'ambiance */}
            {showSoundSelector && (
              <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-[#0E131F] border border-white/15 rounded-2xl shadow-2xl z-50 space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  <span>Sons génératifs offline</span>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="text-[10px] text-[#A29BFE] hover:underline"
                  >
                    {isAudioPlaying ? 'Mettre en pause' : 'Démarrer'}
                  </button>
                </div>

                {SOUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSound(opt.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      activeSound === opt.id
                        ? 'bg-[#6C5CE7]/30 text-white font-bold border border-[#6C5CE7]/50'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{opt.name}</span>
                    {activeSound === opt.id && isAudioPlaying && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton bascule Fullscreen API */}
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer hidden sm:flex items-center gap-1 text-xs"
            title={isNativeFullscreen ? 'Quitter le plein écran OS' : 'Plein écran OS complet'}
          >
            {isNativeFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Bouton Quitter le Zen */}
          <button
            type="button"
            id="exit-zen-immersion-btn"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Quitter le mode immersion (Touche Échap)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter Zen</span>
            <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-white/60 font-mono">
              Échap
            </kbd>
          </button>
        </div>
      </header>

      {/* Onglets Mobile pour basculer facilement entre Minuteur/Checklist et Notes */}
      <div className="lg:hidden flex border-b border-white/10 bg-[#0E131F]/90 px-4">
        <button
          type="button"
          onClick={() => setMobileTab('timer')}
          className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition ${
            mobileTab === 'timer'
              ? 'border-[#6C5CE7] text-white'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Minuteur & Tâches ({subtasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('notes')}
          className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition ${
            mobileTab === 'notes'
              ? 'border-[#6C5CE7] text-white'
              : 'border-transparent text-white/50 hover:text-white/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Carnet de Notes</span>
        </button>
      </div>

      {/* 2. CORPS CENTRAL : GRILLE DISTRACTION-FREE */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
        {/* COLONNE GAUCHE : MINUTEUR GÉANT ÉPURÉ & CHECKLIST 2-3 TÂCHES */}
        <div
          className={`w-full lg:w-[480px] xl:w-[520px] flex flex-col gap-6 shrink-0 ${
            mobileTab === 'notes' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* CARTE 1 : LE GRAND COMPTE À REBOURS ÉPURÉ */}
          <div className="relative bg-[#0E131F]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Barre de progression néon subtile tout en haut de la carte */}
            <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
              <div
                className="h-full transition-all duration-1000 ease-linear shadow-sm"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: domainConfig.color,
                  boxShadow: `0 0 12px ${domainConfig.color}`,
                }}
              />
            </div>

            {/* Presets rapides de durée */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
              {[
                { label: 'Pomodoro 25m', mins: 25, key: '25' as const },
                { label: 'Deep Work 50m', mins: 50, key: '50' as const },
                { label: 'Sprint 90m', mins: 90, key: '90' as const },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  onClick={() => handlePresetSelect(preset.mins, preset.key)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                    selectedDuration === preset.mins
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* LE GRAND AFFICHAGE NUMÉRIQUE DU CHRONO */}
            <div className="my-2 select-none">
              <div
                className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter text-white drop-shadow-md"
                style={{
                  textShadow: isRunning ? `0 0 40px ${domainConfig.color}40` : 'none',
                }}
              >
                {timeString}
              </div>
              <p className="text-xs text-white/40 mt-1 font-mono">
                {isRunning ? '● En cours de flow' : '❚❚ En pause'} • {progressPercent}% écoulé
              </p>
            </div>

            {/* CONTRÔLES PRINCIPAUX DU MINUTEUR */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => resetTimer()}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer active:scale-95"
                title="Réinitialiser le décompte"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                id="zen-timer-toggle-btn"
                onClick={toggleTimer}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: domainConfig.color,
                  boxShadow: `0 12px 36px -8px ${domainConfig.color}80`,
                }}
                title={isRunning ? 'Mettre en pause' : 'Lancer le minuteur'}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8 fill-white" />
                ) : (
                  <Play className="w-8 h-8 fill-white ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAddMinutes(5)}
                className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono font-bold transition cursor-pointer active:scale-95"
                title="Ajouter 5 minutes"
              >
                +5m
              </button>
            </div>

            {/* Bouton d'accomplissement rapide de l'objectif */}
            <button
              type="button"
              onClick={onToggleBlockCompletion}
              className={`mt-6 w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                block.completed
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {block.completed
                  ? 'Session validée (Cliquer pour rouvrir)'
                  : 'Marquer l’objectif de session comme accompli'}
              </span>
            </button>
          </div>

          {/* CARTE 2 : VOS 2 OU 3 CASES À COCHER */}
          <div className="bg-[#0E131F]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: domainConfig.color }} />
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Vos 2 ou 3 étapes clés
                </h2>
              </div>
              <span className="text-xs font-mono text-white/50">
                {completedCount}/{subtasks.length}
              </span>
            </div>

            {/* Liste des cases à cocher épurées */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56 pr-1">
              {subtasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/40 italic">
                  Aucune sous-tâche définie pour l'instant.
                  <br />
                  Notez vos 2 ou 3 étapes clés ci-dessous pour garder le cap.
                </div>
              ) : (
                subtasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      task.completed
                        ? 'bg-white/3 border-white/5 text-white/40'
                        : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTask(task.id);
                        triggerSaveBadge();
                      }}
                      className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          task.completed
                            ? 'bg-[#55E6C1] border-[#55E6C1] text-black shadow-sm'
                            : 'border-white/30 hover:border-white'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span
                        className={`text-xs sm:text-sm leading-snug ${
                          task.completed ? 'line-through text-white/40' : 'font-medium text-white'
                        }`}
                      >
                        {task.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulaire ajout rapide d'étape */}
            <form onSubmit={handleAddNewTask} className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                placeholder="Ajouter une étape de focus..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#6C5CE7]"
              />
              <button
                type="submit"
                disabled={!newSubtaskInput.trim()}
                className="px-3 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4bc4] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE : VOTRE CARNET DE NOTES (Terminal, Markdown, Code) */}
        <div
          className={`flex-1 flex flex-col bg-[#0E131F]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl min-h-[460px] ${
            mobileTab === 'timer' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6C5CE7]" />
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Votre Carnet de Notes & Code
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {saveIndicator ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {saveIndicator}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-white/40">Auto-sync actif</span>
              )}
            </div>
          </div>

          {/* Éditeur Markdown intégré dans le plein écran */}
          <div className="flex-1 flex flex-col">
            <MarkdownNotesEditor
              value={notes}
              onChange={(newText) => {
                onNotesChange(newText);
                triggerSaveBadge();
              }}
              accentColor={domainConfig.color}
              title="Notes d'Immersion, Snippets & Commandes"
              placeholder="Écrivez librement pendant votre session de code : idées, snippets, erreurs rencontrées, logs..."
            />
          </div>
        </div>
      </main>
    </div>
  );
};
