// Procedural Ambient Sound Generator using standard Web Audio API
// 100% offline, zero external audio dependencies, instant & lightweight.

export type DeepWorkSoundType = 'rain' | 'cafe' | 'whitenoise' | 'alpha' | 'tibetan';

export interface SoundOption {
  id: DeepWorkSoundType;
  name: string;
  description: string;
  icon: string;
  frequencyHint: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'rain',
    name: 'Pluie douce',
    description: 'Bruit rose filtré avec crépitement apaisant de gouttes d\'eau',
    icon: 'CloudRain',
    frequencyHint: 'Bruit rose + passe-bas 800Hz',
  },
  {
    id: 'cafe',
    name: 'Café feutré',
    description: 'Ambiance chaleureuse, murmurante et feutrée de coffee shop',
    icon: 'Coffee',
    frequencyHint: 'Résonances moyennes chaudes',
  },
  {
    id: 'whitenoise',
    name: 'Bruit blanc doux',
    description: 'Fréquence continue douce pour masquer les bruits parasites extérieurs',
    icon: 'Wind',
    frequencyHint: 'Bruit blanc passe-bande relaxant',
  },
  {
    id: 'alpha',
    name: 'Ondes Alpha (10 Hz)',
    description: 'Battement binaural favorisant l\'état de flow et l\'apprentissage profond',
    icon: 'Brain',
    frequencyHint: 'Binaural 216 Hz & 226 Hz (10 Hz)',
  },
  {
    id: 'tibetan',
    name: 'Bol Tibétain & Zen',
    description: 'Vibrations méditatives et harmoniques sinusoïdales continues',
    icon: 'Bell',
    frequencyHint: 'Harmoniques 280 Hz, 775 Hz, 1320 Hz',
  },
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentNodes: {
  sources: (AudioNode | AudioBufferSourceNode | OscillatorNode)[];
  intervals: (NodeJS.Timeout | number)[];
} | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate 4 seconds of looped noise buffer
function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const whiteL = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;

    if (type === 'white') {
      left[i] = whiteL * 0.25;
      right[i] = whiteR * 0.25;
    } else if (type === 'pink') {
      // Paul Kellet's filtered pink noise algorithm
      b0 = 0.99886 * b0 + whiteL * 0.0555179;
      b1 = 0.99332 * b1 + whiteL * 0.0750759;
      b2 = 0.96900 * b2 + whiteL * 0.1538520;
      b3 = 0.86650 * b3 + whiteL * 0.3104856;
      b4 = 0.55000 * b4 + whiteL * 0.5329522;
      b5 = -0.7616 * b5 - whiteL * 0.0168980;
      left[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteL * 0.5362) * 0.04;
      b6 = whiteL * 0.115926;

      right[i] = left[i] * 0.9 + whiteR * 0.02;
    } else {
      // Brown noise
      lastOut = (lastOut + 0.02 * whiteL) / 1.02;
      left[i] = lastOut * 0.9;
      right[i] = (lastOut + 0.02 * whiteR) / 1.02 * 0.9;
    }
  }

  return buffer;
}

export function stopDeepWorkSound() {
  if (currentNodes) {
    try {
      currentNodes.intervals.forEach((id) => clearInterval(id));
      currentNodes.sources.forEach((node) => {
        if ('stop' in node && typeof (node as AudioBufferSourceNode).stop === 'function') {
          try {
            (node as AudioBufferSourceNode).stop();
          } catch (_) {}
        }
        node.disconnect();
      });
    } catch (_) {}
    currentNodes = null;
  }
}

export function setDeepWorkVolume(volume: number) {
  const clamped = Math.max(0, Math.min(1, volume));
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.setTargetAtTime(clamped * 0.5, audioCtx.currentTime, 0.05);
    } catch (_) {
      masterGain.gain.value = clamped * 0.5;
    }
  }
}

export function playDeepWorkSound(type: DeepWorkSoundType, volume: number = 0.5) {
  stopDeepWorkSound();

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Master Gain for ambient sound
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)) * 0.5, now);
  masterGain.connect(ctx.destination);

  const activeSources: AudioNode[] = [];
  const activeIntervals: number[] = [];

  if (type === 'rain') {
    // Rain: Pink noise with soft low-pass filter and subtle modulation
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.2, now);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.8, now);

    source.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(masterGain);
    source.start();

    activeSources.push(source, filter, rainGain);

    // Random gentle droplet bursts
    const dropletInterval = window.setInterval(() => {
      if (!audioCtx || !masterGain) return;
      try {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const dropFilter = ctx.createBiquadFilter();

        const dropFreq = 1200 + Math.random() * 1400;
        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(dropFreq, ctx.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.4, ctx.currentTime + 0.06);

        dropFilter.type = 'bandpass';
        dropFilter.frequency.setValueAtTime(dropFreq, ctx.currentTime);

        dropGain.gain.setValueAtTime(0.001, ctx.currentTime);
        dropGain.gain.linearRampToValueAtTime(0.025 + Math.random() * 0.02, ctx.currentTime + 0.01);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

        dropOsc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(masterGain);

        dropOsc.start(ctx.currentTime);
        dropOsc.stop(ctx.currentTime + 0.08);
      } catch (_) {}
    }, 280);

    activeIntervals.push(dropletInterval);
  } else if (type === 'cafe') {
    // Cafe: Layered warm brown noise with multi-band filters simulating cozy room ambience
    const brownBuffer = createNoiseBuffer(ctx, 'brown');
    const source = ctx.createBufferSource();
    source.buffer = brownBuffer;
    source.loop = true;

    const filterLow = ctx.createBiquadFilter();
    filterLow.type = 'lowpass';
    filterLow.frequency.setValueAtTime(450, now);

    const filterMid = ctx.createBiquadFilter();
    filterMid.type = 'peaking';
    filterMid.frequency.setValueAtTime(800, now);
    filterMid.gain.setValueAtTime(3, now);
    filterMid.Q.setValueAtTime(2, now);

    const cafeGain = ctx.createGain();
    cafeGain.gain.setValueAtTime(1.1, now);

    source.connect(filterLow);
    filterLow.connect(filterMid);
    filterMid.connect(cafeGain);
    cafeGain.connect(masterGain);
    source.start();

    activeSources.push(source, filterLow, filterMid, cafeGain);
  } else if (type === 'whitenoise') {
    // Soft White/Pink noise comfortably smoothed
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    source.start();

    activeSources.push(source, filter, noiseGain);
  } else if (type === 'alpha') {
    // Alpha Waves: 10 Hz binaural beat (216 Hz & 226 Hz)
    // Left ear: 216 Hz, Right ear: 226 Hz -> generates 10 Hz alpha rhythm in brain
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(216, now);

    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(226, now);

    // Warm sub-bass harmonic for body
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, now);

    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    const gainSub = ctx.createGain();

    gainL.gain.setValueAtTime(0.2, now);
    gainR.gain.setValueAtTime(0.2, now);
    gainSub.gain.setValueAtTime(0.12, now);

    // Stereo panning if supported, else direct mix
    if ('createStereoPanner' in ctx) {
      const pannerL = ctx.createStereoPanner();
      const pannerR = ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(-0.8, now);
      pannerR.pan.setValueAtTime(0.8, now);

      oscLeft.connect(gainL);
      gainL.connect(pannerL);
      pannerL.connect(masterGain);

      oscRight.connect(gainR);
      gainR.connect(pannerR);
      pannerR.connect(masterGain);
      activeSources.push(pannerL, pannerR);
    } else {
      oscLeft.connect(gainL);
      gainL.connect(masterGain);
      oscRight.connect(gainR);
      gainR.connect(masterGain);
    }

    subOsc.connect(gainSub);
    gainSub.connect(masterGain);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    activeSources.push(oscLeft, oscRight, subOsc, gainL, gainR, gainSub);
  } else if (type === 'tibetan') {
    // Tibetan Singing Bowl: Meditative sustained harmonic resonance
    // Base 288 Hz (D4) + overtone 864 Hz + overtone 1440 Hz with gentle amplitude LFO
    const freqs = [288, 576, 864, 1152];
    const gains = [0.25, 0.12, 0.08, 0.04];

    // LFO for breathing pulsation (0.15 Hz = ~7 seconds cycle)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, now);
    lfo.connect(lfoGain);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (idx === 0 ? 0.4 : 0), now); // slight detuning
      gain.gain.setValueAtTime(gains[idx], now);

      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(masterGain!);

      osc.start();
      activeSources.push(osc, gain);
    });

    lfo.start();
    activeSources.push(lfo, lfoGain);
  }

  currentNodes = {
    sources: activeSources,
    intervals: activeIntervals,
  };
}

// Gentle sound notifications for Pomodoro transition
export function playChime(type: 'focus_end' | 'break_end' | 'bowl_strike' = 'focus_end') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chimeGain = ctx.createGain();
    chimeGain.connect(ctx.destination);

    if (type === 'focus_end' || type === 'bowl_strike') {
      // Tibetan Singing Bowl bell strike: rich layered decay
      const fundamental = 392; // G4
      const harmonics = [1, 2.76, 5.4, 8.9];
      const harmonicGains = [0.3, 0.15, 0.06, 0.02];

      harmonics.forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * mult, now);

        gain.gain.setValueAtTime(harmonicGains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(gain);
        gain.connect(chimeGain);

        osc.start(now);
        osc.stop(now + 4);
      });
    } else {
      // Break end: cheerful double bell (chime up: E5 to B5)
      [659.25, 987.77].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.6);

        osc.connect(gain);
        gain.connect(chimeGain);

        osc.start(startTime);
        osc.stop(startTime + 1.8);
      });
    }
  } catch (_) {}
}
