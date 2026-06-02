/**
 * Web Audio API synthesizer for positive and negative educational feedback chimes,
 * plus Speak browser SpeechSynthesis helpers for pronunciation.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type: 'success' | 'failure' | 'click') => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (type === 'success') {
      // Pleasant rising high major third chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      // G5 (784Hz) then C6 (1046.5Hz)
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc2.frequency.setValueAtTime(392.00, now + 0.2); // G4
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      
    } else if (type === 'failure') {
      // Disappointing descending heavy frequency buzz
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      
      // Descending pitch
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.35);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
      
    } else if (type === 'click') {
      // Subtly muted transient tick
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (e) {
    console.warn('Audio Synthesis not fully supported or blocked by user gesture.', e);
  }
};

/**
 * Uses browser text-to-speech to pronounce English words
 */
export const speakEnglishWord = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop playing anything current
      
      // Clean up slash choices (pronounce the first candidate)
      const queryText = text.includes('/') ? text.split('/')[0].trim() : text;
      
      const utterance = new SpeechSynthesisUtterance(queryText);
      utterance.lang = 'en-US';
      
      // Try to find a nice premium US English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en-US') && voice.name.toLowerCase().includes('google')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 0.9; // Just slightly slower for perfect educational clarity
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Speech synthesis failed', e);
  }
};
