// Web Audio API based POS alert chimes without external asset dependencies

let unlockedCtx: AudioContext | null = null;

/** Call once on user gesture so alerts can play in background tabs later. */
export const unlockAudio = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!unlockedCtx) unlockedCtx = new AudioContextClass();
    if (unlockedCtx.state === 'suspended') void unlockedCtx.resume();
  } catch {
    // ignore
  }
};

function urgentBurst(ctx: AudioContext, at: number) {
  // Two-tone urgent siren (880Hz <-> 660Hz), ~0.9s
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, at);
  osc.frequency.setValueAtTime(660, at + 0.22);
  osc.frequency.setValueAtTime(880, at + 0.44);
  osc.frequency.setValueAtTime(660, at + 0.66);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.22, at + 0.05);
  gain.gain.setValueAtTime(0.22, at + 0.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.95);
}

/** Loud repeating new-order alarm for ~durationMs (default 4s). */
export const playNewOrderAlert = (durationMs = 4000) => {
  try {
    unlockAudio();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = unlockedCtx ?? new AudioContextClass();
    const bursts = Math.max(1, Math.round(durationMs / 1000));
    const now = ctx.currentTime + 0.05;
    for (let i = 0; i < bursts; i++) {
      urgentBurst(ctx, now + i * 1.0);
    }
    setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        // ignore
      }
      if (ctx === unlockedCtx) unlockedCtx = null;
    }, durationMs + 800);
  } catch {
    // Audio context may be blocked before first user gesture
  }
};
export const playPosChime = (durationMs = 1500) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play pleasant 2-tone doorbell / register chime
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.2); // C6
    gain2.gain.setValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + (durationMs / 1000));
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + (durationMs / 1000));
  } catch {
    // Audio context may be blocked before first user gesture
  }
};
