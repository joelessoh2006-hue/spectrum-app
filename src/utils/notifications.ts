// Utilitaires de gestion des notifications et alertes de début d'activités

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (_) {
      return null;
    }
  }

  playChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Chime zen à 3 harmoniques chaleureuses (E5 -> A5 -> E6)
      const playTone = (freq: number, startTime: number, duration: number, peakVol = 0.15) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(659.25, now, 0.45, 0.14);        // Mi (E5)
      playTone(880.00, now + 0.1, 0.65, 0.16);   // La (A5)
      playTone(1318.51, now + 0.22, 0.85, 0.08); // Mi aigu (E6)
    } catch (e) {
      console.warn('Audio chime non disponible:', e);
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Erreur lors de la demande de permission de notification:', err);
    return 'denied';
  }
};

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem('spectrum_notification_sound') !== 'false';
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem('spectrum_notification_sound', enabled ? 'true' : 'false');
  } catch {}
};

export const getDefaultReminderMinutes = (): number => {
  try {
    const val = localStorage.getItem('spectrum_default_reminder_minutes');
    if (val !== null) return parseInt(val, 10);
  } catch {}
  return 5;
};

export const setDefaultReminderMinutes = (minutes: number): void => {
  try {
    localStorage.setItem('spectrum_default_reminder_minutes', String(minutes));
  } catch {}
};

// Deduplication des alertes déclenchées (évite les répétitions multiples à la même minute)
export const hasBeenNotified = (blockId: string, dateStr: string, minutesBefore: number): boolean => {
  try {
    const key = `spectrum_notif_${dateStr}_${blockId}_${minutesBefore}`;
    return sessionStorage.getItem(key) === '1' || localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

export const markAsNotified = (blockId: string, dateStr: string, minutesBefore: number): void => {
  try {
    const key = `spectrum_notif_${dateStr}_${blockId}_${minutesBefore}`;
    sessionStorage.setItem(key, '1');
    localStorage.setItem(key, '1');
  } catch {}
};

export const sendNativeNotification = async (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body: options?.body || 'Votre activité va commencer.',
    icon: options?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: options?.tag || 'spectrum-activity-reminder',
    vibrate: [200, 100, 200], // Vibration haptique sur mobile
  };

  // 1. Privilégier le Service Worker (obligatoire sur Android Chrome & PWA mobile installée)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Erreur notification via Service Worker, essai avec Notification standard:', swErr);
    }
  }

  // 2. Fallback constructeur standard Notification (navigateurs Desktop)
  try {
    const notif = new Notification(title, notifOptions);

    if (options?.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('Impossible d’envoyer la notification native:', err);
    return false;
  }
};
