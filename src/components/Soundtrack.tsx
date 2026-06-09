import { useState, useRef } from 'react';
import { Volume2, VolumeX, Wind } from 'lucide-react';

export default function Soundtrack({ language }: { language: 'en' | 'id' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startAmbientSynth = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create a 5-second white noise buffer for continuous playback
      const bufferSize = ctx.sampleRate * 5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Noise source
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSourceRef.current = noiseSource;

      // Lowpass filter to simulate deep forest wind
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350; // Deep rumble
      filter.Q.value = 2.0;
      filterRef.current = filter;

      // LFO to modulate filter frequency (creates wood whispering wind effect)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15; // Slow modulation (6 seconds per cycle)
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200; // Modulate frequency between 150Hz and 550Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfoRef.current = lfo;

      // Main Gain to prevent loudness
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.0, ctx.currentTime);
      // Fade in wind
      mainGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);

      // Connect nodes
      noiseSource.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      // Start sound
      lfo.start();
      noiseSource.start();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Audio Context not supported or interaction blocked:", err);
    }
  };

  const stopAmbientSynth = () => {
    if (audioContextRef.current) {
      try {
        if (noiseSourceRef.current) noiseSourceRef.current.stop();
        if (lfoRef.current) lfoRef.current.stop();
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAmbientSynth();
    } else {
      startAmbientSynth();
    }
  };

  return (
    <button
      id="btn-soundtrack-toggle"
      onClick={toggleSound}
      className={`fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-xs font-mono transition-all duration-500 ease-out cursor-pointer ${
        isPlaying
          ? 'bg-beige text-forest border-beige shadow-lg scale-105'
          : 'bg-forest-dark/80 text-beige/80 border-beige/20 hover:border-wood backdrop-blur-md'
      }`}
      aria-label="Toggle Forest Wind Soundtrack"
    >
      <div className="relative flex h-2 w-2">
        {isPlaying && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wood opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-wood' : 'bg-gray-500'}`}></span>
      </div>
      
      <span className="font-medium tracking-wider">
        {isPlaying 
          ? (language === 'en' ? 'SOUND: FOREST WIND' : 'AUDIO: DESAU ANGIN')
          : (language === 'en' ? 'LISTEN TO NATURE' : 'DENGAR DESAU ALAM')
        }
      </span>
      {isPlaying ? <Volume2 size={14} className="animate-pulse text-wood" /> : <VolumeX size={14} />}
    </button>
  );
}
