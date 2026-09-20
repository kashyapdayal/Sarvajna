"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, CloudRain, Sparkles, Waves, Radio, X } from "lucide-react";
import { ambientAudio } from "./SoundEffects";

interface AmbientAudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbientAudioPlayer: React.FC<AmbientAudioPlayerProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<"rain" | "lofi" | "alpha" | "whitenoise">("rain");
  const [volume, setVolume] = useState(0.2);

  useEffect(() => {
    setIsPlaying(ambientAudio.getIsPlaying());
  }, [isOpen]);

  const togglePlay = () => {
    if (isPlaying) {
      ambientAudio.stopAmbient();
      setIsPlaying(false);
    } else {
      ambientAudio.startAmbient(mode, volume);
      setIsPlaying(true);
    }
  };

  const handleModeChange = (newMode: "rain" | "lofi" | "alpha" | "whitenoise") => {
    setMode(newMode);
    if (isPlaying) {
      ambientAudio.startAmbient(newMode, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientAudio.setVolume(newVol);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            Study Soundscape
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 my-4">
        <button
          onClick={() => handleModeChange("rain")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "rain"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <CloudRain className="w-4 h-4 text-sky-500" />
          <span>Soft Rain</span>
        </button>

        <button
          onClick={() => handleModeChange("alpha")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "alpha"
              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
              : "bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Waves className="w-4 h-4 text-indigo-500" />
          <span>Alpha 10Hz</span>
        </button>

        <button
          onClick={() => handleModeChange("lofi")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "lofi"
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              : "bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Lofi Chords</span>
        </button>

        <button
          onClick={() => handleModeChange("whitenoise")}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            mode === "whitenoise"
              ? "bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-600"
              : "bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Radio className="w-4 h-4 text-stone-500" />
          <span>White Noise</span>
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVolumeChange(volume === 0 ? 0.2 : 0)}
            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={togglePlay}
          className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
            isPlaying
              ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          }`}
        >
          {isPlaying ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              Pause Ambience
            </>
          ) : (
            <>Start Focus Soundscape</>
          )}
        </button>
      </div>
    </div>
  );
};
