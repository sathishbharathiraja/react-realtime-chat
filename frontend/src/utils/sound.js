// Simple synthesizer for app sounds using Web Audio API

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play a soft "pop" sound for incoming messages
export const playMessageSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Failed to play message sound", e);
  }
};

let ringInterval = null;

// Play a repeating ringing tone for incoming calls
export const startRingingSound = () => {
  try {
    const ctx = getAudioContext();
    
    const playRingCycle = () => {
      // First beep
      playBeep(ctx, 440, 0.4);
      playBeep(ctx, 480, 0.4);
      
      // Pause then second beep
      setTimeout(() => {
        playBeep(ctx, 440, 0.4);
        playBeep(ctx, 480, 0.4);
      }, 500);
    };

    playRingCycle();
    ringInterval = setInterval(playRingCycle, 2000);
  } catch (e) {
    console.error("Failed to start ringing sound", e);
  }
};

export const stopRingingSound = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

const playBeep = (ctx, frequency, duration) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};
