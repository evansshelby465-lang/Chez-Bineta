/**
 * Notification and audio chime utilities for Chez Bineta manager terminal
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play a welcoming bell / kitchen chime for new orders
  playNewOrderChime() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, index) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.6);
      });
    } catch (e) {
      console.warn('Audio chime could not play automatically:', e);
    }
  }

  // Play subtle status update sound for customer
  playStatusUpdateSound() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignored if user hasn't interacted
    }
  }
}

export const soundService = new SoundService();

export function triggerNewOrderNotification(orderNumber: string, customerName: string, total: number) {
  // 1. Play kitchen sound
  soundService.playNewOrderChime();

  // 2. Android vibration pattern
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 400]);
    } catch {
      // Silent catch
    }
  }

  // 3. Web Notification API if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`🔔 Nouvelle commande ${orderNumber} !`, {
        body: `${customerName} a commandé pour ${total.toLocaleString('fr-FR')} FCFA`,
        icon: '/file_00000000276c81f482bf0792c3794c7b.png',
        tag: orderNumber,
      });
    } catch {
      // Notification failed
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
  }
  return false;
}
