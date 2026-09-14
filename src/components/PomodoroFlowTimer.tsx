import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  CloudRain,
  Wind,
  Brain,
  Bell,
  Sparkles,
  Timer,
  FastForward,
  Flame,
  ChevronDown,
  ChevronUp,
  Check,
  Maximize2,
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

export type TimerMode = 'pomodoro' | 'continuous';
export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

interface PomodoroFlowTimerProps {
  initialDurationMinutes?: number;
  pillarColor?: string;
  pillarName?: string;
  blockTitle?: string;
  onTimerComplete?: () => void;
  onOpenFullscreenZen?: () => void;
}

export const PomodoroFlowTimer: React.FC<PomodoroFlowTimerProps> = ({
  initialDurationMinutes = 25,
  pillarColor = '#6C5CE7',
  pillarName = 'Focus',
  blockTitle,
  onTimerComplete,
  onOpenFullscreenZen,
}) => {
  // Timer Mode: 'pomodoro' (25/5 alternance) vs 'continuous' (décompte unique)
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('focus');
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(1);
  const totalCyclesBeforeLongBreak = 4;

  // Custom durations (in minutes)
  const [focusDuration, setFocusDuration] = useState<number>(
    Math.min(60, Math.max(15, initialDurationMinutes))
  );
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);

  // Active countdown seconds
  const getCurrentPhaseDurationSeconds = (phase: PomodoroPhase, mode: TimerMode) => {
    if (mode === 'continuous') {
      return (initialDurationMinutes || 25) * 60;
    }
    if (phase === 'focus') return focusDuration * 60;
    if (phase === 'short_break') return shortBreakDuration * 60;
    return longBreakDuration * 60;
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    getCurrentPhaseDurationSeconds('focus', 'pomodoro')
  );
  const [totalSecondsForPhase, setTotalSecondsForPhase] = useState<number>(() =>
    getCurrentPhaseDurationSeconds('focus', 'pomodoro')
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Audio Ambient Generator State
  const [activeSound, setActiveSound] = useState<DeepWorkSoundType>('rain');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [autoPlayAudioWithTimer, setAutoPlayAudioWithTimer] = useState<boolean>(true);
  const [isAudioPanelExpanded, setIsAudioPanelExpanded] = useState<boolean>(false);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopDeepWorkSound();
    };
  }, []);

  // Update volume in real-time
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setDeepWorkVolume(newVol);
  };

  // Toggle ambient sound playback
  const toggleAudio = (soundToPlay?: DeepWorkSoundType) => {
    const targetSound = soundToPlay || activeSound;
    if (soundToPlay) {
      setActiveSound(soundToPlay);
    }

    if (isAudioPlaying && targetSound === activeSound && !soundToPlay) {
      stopDeepWorkSound();
      setIsAudioPlaying(false);
    } else {
      playDeepWorkSound(targetSound, volume);
      setIsAudioPlaying(true);
    }
  };

  // Select sound option
  const handleSelectSound = (soundType: DeepWorkSoundType) => {
    setActiveSound(soundType);
    if (isAudioPlaying) {
      playDeepWorkSound(soundType, volume);
    }
  };

  // Switch timer mode (Pomodoro vs Continuous)
  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(newMode);
    if (newMode === 'continuous') {
      const dur = (initialDurationMinutes || 25) * 60;
      setSecondsLeft(dur);
      setTotalSecondsForPhase(dur);
    } else {
      setPomodoroPhase('focus');
      const dur = focusDuration * 60;
      setSecondsLeft(dur);
      setTotalSecondsForPhase(dur);
    }
  };

  // Switch Pomodoro phase
  const transitionToNextPhase = () => {
    setIsRunning(false);

    if (pomodoroPhase === 'focus') {
      // Focus just completed!
      playChime('focus_end');
      try {
        confetti({
          particleCount: 55,
          spread: 80,
          origin: { y: 0.6 },
          colors: [pillarColor, '#55E6C1', '#ffffff'],
        });
      } catch (_) {}

      // Mute audio during break if wanted
      if (isAudioPlaying) {
        stopDeepWorkSound();
        setIsAudioPlaying(false);
      }

      if (pomodoroCycle % totalCyclesBeforeLongBreak === 0) {
        setPomodoroPhase('long_break');
        const dur = longBreakDuration * 60;
        setSecondsLeft(dur);
        setTotalSecondsForPhase(dur);
      } else {
        setPomodoroPhase('short_break');
        const dur = shortBreakDuration * 60;
        setSecondsLeft(dur);
        setTotalSecondsForPhase(dur);
      }
    } else {
      // Break just finished!
      playChime('break_end');
      setPomodoroCycle((prev) => prev + 1);
      setPomodoroPhase('focus');
      const dur = focusDuration * 60;
      setSecondsLeft(dur);
      setTotalSecondsForPhase(dur);

      if (autoPlayAudioWithTimer) {
        playDeepWorkSound(activeSound, volume);
        setIsAudioPlaying(true);
      }
    }
  };

  // Countdown timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerMode === 'pomodoro') {
              transitionToNextPhase();
            } else {
              setIsRunning(false);
              playChime('focus_end');
              try {
                confetti({
                  particleCount: 70,
                  spread: 90,
                  origin: { y: 0.6 },
                  colors: [pillarColor, '#55E6C1', '#ffffff'],
                });
              } catch (_) {}
              onTimerComplete?.();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, timerMode, pomodoroPhase, pomodoroCycle]);

  // Toggle Timer Play/Pause
  const handleToggleTimer = () => {
    const willRun = !isRunning;
    setIsRunning(willRun);

    // If starting timer and user has auto-sound enabled in focus phase
    if (willRun && autoPlayAudioWithTimer && (timerMode === 'continuous' || pomodoroPhase === 'focus')) {
      if (!isAudioPlaying) {
        playDeepWorkSound(activeSound, volume);
        setIsAudioPlaying(true);
      }
    } else if (!willRun && isAudioPlaying) {
      // Pause audio gently if pausing timer
      stopDeepWorkSound();
      setIsAudioPlaying(false);
    }
  };

  // Reset current phase timer
  const handleResetTimer = (customMins?: number) => {
    setIsRunning(false);
    if (customMins) {
      setFocusDuration(customMins);
      const secs = customMins * 60;
      setSecondsLeft(secs);
      setTotalSecondsForPhase(secs);
    } else {
      const secs = getCurrentPhaseDurationSeconds(pomodoroPhase, timerMode);
      setSecondsLeft(secs);
      setTotalSecondsForPhase(secs);
    }
  };

  // Skip to next phase (Pomodoro)
  const handleSkipPhase = () => {
    transitionToNextPhase();
  };

  // Format mm:ss
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage (0 to 100)
  const progressPercent = totalSecondsForPhase > 0
    ? Math.max(0, Math.min(100, Math.round(((totalSecondsForPhase - secondsLeft) / totalSecondsForPhase) * 100)))
    : 0;

  // Sound icons helper
  const getSoundIcon = (id: DeepWorkSoundType) => {
    switch (id) {
      case 'rain':
        return CloudRain;
      case 'cafe':
        return Coffee;
      case 'whitenoise':
        return Wind;
      case 'alpha':
        return Brain;
      case 'tibetan':
        return Bell;
    }
  };

  const isBreak = timerMode === 'pomodoro' && (pomodoroPhase === 'short_break' || pomodoroPhase === 'long_break');
  const phaseColor = isBreak ? '#55E6C1' : pillarColor;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden transition-all">
      {/* Soft domain ambient glow */}
      <div
        className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-15 transition-all"
        style={{ backgroundColor: phaseColor }}
      />

      {/* HEADER: Mode Selector (Pomodoro vs Continu) + Phase Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-card)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: phaseColor }}
          >
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {timerMode === 'pomodoro' ? 'Minuteur Pomodoro Flow' : 'Minuteur Focus Continu'}
              </h3>
              {timerMode === 'pomodoro' && (
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${phaseColor}15`,
                    borderColor: `${phaseColor}30`,
                    color: phaseColor,
                  }}
                >
                  {pomodoroPhase === 'focus'
                    ? `Session Focus • Cycle ${pomodoroCycle}`
                    : pomodoroPhase === 'short_break'
                    ? 'Pause Courte'
                    : 'Pause Longue'}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {timerMode === 'pomodoro'
                ? 'Rythme 25 min d’hyper-focus / 5 min de repos pour préserver l’énergie.'
                : 'Session fluide et ininterrompue pour les plongées longues.'}
            </p>
          </div>
        </div>

        {/* Mode Selector pills */}
        <div className="flex items-center bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-xl p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSwitchMode('pomodoro')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              timerMode === 'pomodoro'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pomodoro (25/5)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('continuous')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              timerMode === 'continuous'
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Continu</span>
          </button>

          {onOpenFullscreenZen && (
            <button
              type="button"
              onClick={onOpenFullscreenZen}
              className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white transition cursor-pointer flex items-center gap-1 border border-[#6C5CE7]/30"
              title="Passer en Mode Immersion Plein Écran (Touche F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Zen</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN TIMER DISPLAY */}
      <div className="py-6 flex flex-col items-center justify-center text-center relative">
        {/* Pomodoro Cycles Progress indicators (4 dots) */}
        {timerMode === 'pomodoro' && (
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map((step) => {
              const isCompleted = pomodoroCycle > step;
              const isCurrent = pomodoroCycle === step;
              return (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-[#55E6C1] shadow-xs'
                      : isCurrent
                      ? 'ring-2 ring-offset-2 ring-[#6C5CE7] bg-[#6C5CE7] scale-110'
                      : 'bg-[var(--border-card)]'
                  }`}
                  title={`Cycle Pomodoro ${step}/4`}
                />
              );
            })}
            <span className="text-[11px] font-mono font-medium text-[var(--text-muted)] ml-1">
              Cycle {pomodoroCycle}/4
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full max-w-md h-2 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden mb-4 border border-[var(--border-card)]">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: phaseColor,
            }}
          />
        </div>

        {/* Large Time Display */}
        <div
          className="text-6xl sm:text-7xl font-mono font-black tracking-tight select-none my-1 transition-colors"
          style={{
            color: isRunning ? phaseColor : 'var(--text-primary)',
          }}
        >
          {formatTime(secondsLeft)}
        </div>

        {/* Subtitle / Status */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] mt-1">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5" style={{ color: phaseColor }}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: phaseColor }} />
              {isBreak ? 'Pause régénératrice en cours...' : 'Immersion active • Zéro distraction'}
            </span>
          ) : secondsLeft === 0 ? (
            <span className="text-[#55E6C1] font-bold">Phase achevée !</span>
          ) : (
            <span>Prêt à démarrer</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={handleToggleTimer}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            style={{
              backgroundColor: isRunning ? '#FF7675' : phaseColor,
              boxShadow: `0 8px 24px -4px ${phaseColor}40`,
            }}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Mettre en pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{isBreak ? 'Lancer la Pause' : 'Démarrer le Focus'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleResetTimer()}
            className="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-highlight)] transition active:scale-95 cursor-pointer"
            title="Réinitialiser ce cycle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {timerMode === 'pomodoro' && (
            <button
              type="button"
              onClick={handleSkipPhase}
              className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95 cursor-pointer"
              title={isBreak ? 'Passer au focus suivant' : 'Passer à la pause'}
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Passer l’étape</span>
            </button>
          )}
        </div>

        {/* Quick presets */}
        {timerMode === 'pomodoro' && pomodoroPhase === 'focus' && (
          <div className="flex items-center gap-1.5 mt-4 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="hidden sm:inline mr-1">Durée focus :</span>
            {[20, 25, 30, 50].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleResetTimer(mins)}
                className={`px-2 py-0.5 rounded-lg border transition ${
                  focusDuration === mins
                    ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[#6C5CE7] text-[var(--text-secondary)]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {timerMode === 'continuous' && (
          <div className="flex items-center gap-1.5 mt-4 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="hidden sm:inline mr-1">Durée :</span>
            {[15, 25, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(mins * 60);
                  setTotalSecondsForPhase(mins * 60);
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] hover:border-[#6C5CE7] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION AUDIO DEEP WORK INTÉGRÉE
          ========================================================================= */}
      <div className="mt-4 pt-4 border-t border-[var(--border-card)]">
        {/* Audio Banner Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-card)] rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Audio Play/Stop Master Button */}
            <button
              type="button"
              onClick={() => toggleAudio()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                isAudioPlaying
                  ? 'bg-[#00CEC9] text-black shadow-[#00CEC9]/30'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
              }`}
              title={isAudioPlaying ? 'Arrêter l’ambiance audio' : 'Activer l’ambiance audio'}
            >
              {isAudioPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-black rounded-full animate-[bounce_0.6s_infinite_ease-in-out]" style={{ height: '60%' }} />
                  <span className="w-1 bg-black rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.2s]" style={{ height: '100%' }} />
                  <span className="w-1 bg-black rounded-full animate-[bounce_0.7s_infinite_ease-in-out_0.1s]" style={{ height: '40%' }} />
                </div>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Ambiances Audio Deep Work
                </span>
                {isAudioPlaying && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00CEC9]/15 text-[#00CEC9] border border-[#00CEC9]/30">
                    En direct : {SOUND_OPTIONS.find((s) => s.id === activeSound)?.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Ondes cérébrales & bruits naturels synthétisés hors-ligne (100% sans téléchargement).
              </p>
            </div>
          </div>

          {/* Right controls: Volume slider + Bell chime tester + Expand toggle */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Volume control */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-[var(--bg-surface)] accent-[#00CEC9] rounded-lg cursor-pointer"
                title={`Volume : ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Sing Bowl chime strike */}
            <button
              type="button"
              onClick={() => playChime('bowl_strike')}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[#6C5CE7] hover:border-[#6C5CE7] transition flex items-center gap-1.5 cursor-pointer"
              title="Jouer un tintement de bol tibétain pour vous recentrer"
            >
              <Bell className="w-3 h-3 text-[#6C5CE7]" />
              <span className="hidden sm:inline">Bol Zen</span>
            </button>

            {/* Toggle sound picker panel */}
            <button
              type="button"
              onClick={() => setIsAudioPanelExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              title={isAudioPanelExpanded ? 'Masquer la liste' : 'Choisir une ambiance'}
            >
              {isAudioPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXPANDED SOUND PICKER */}
        {isAudioPanelExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 animate-fadeIn">
            {SOUND_OPTIONS.map((snd) => {
              const Icon = getSoundIcon(snd.id);
              const isSelected = activeSound === snd.id;
              const isCurrentlyPlayingThis = isAudioPlaying && isSelected;

              return (
                <div
                  key={snd.id}
                  onClick={() => {
                    handleSelectSound(snd.id);
                    if (!isAudioPlaying) {
                      toggleAudio(snd.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#6C5CE7]/10 border-[#6C5CE7] shadow-sm'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-card)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#6C5CE7] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-card)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {snd.name}
                      </span>
                    </div>

                    {isCurrentlyPlayingThis ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#00CEC9]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00CEC9] animate-ping" />
                        Actif
                      </span>
                    ) : isSelected ? (
                      <span className="text-[10px] font-mono text-[#6C5CE7] font-semibold">
                        Sélectionné
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {snd.description}
                  </p>

                  <div className="mt-2 text-[9px] font-mono text-[var(--text-muted)]">
                    {snd.frequencyHint}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Option checkbox : Auto-play with timer */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPlayAudioWithTimer}
              onChange={(e) => setAutoPlayAudioWithTimer(e.target.checked)}
              className="rounded accent-[#6C5CE7] cursor-pointer"
            />
            <span>Lancer automatiquement l'ambiance sonore au démarrage du focus</span>
          </label>

          <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
            Synthétiseur Web Audio API
          </span>
        </div>
      </div>
    </div>
  );
};
