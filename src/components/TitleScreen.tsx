import React from 'react';
import { Volume2, VolumeX, BookOpen, Play } from 'lucide-react';
import { PATHS } from '../data/pathsData';
import { PathType } from '../types/game';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenCodex: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenCodex,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <span className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
            Aetheria // Quantum Labyrinth Initiative
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCodex}
            className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 hover:text-white transition flex items-center gap-2 shadow-xl backdrop-blur-md"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>PATHS & PHYSICS ARCHIVE</span>
          </button>
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 transition shadow-xl backdrop-blur-md"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup with negative space */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto my-auto pointer-events-auto">
        {/* Inline SVG Monogram / Emblem */}
        <div className="w-20 h-20 mb-6 drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <circle cx="50" cy="50" r="46" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="50,14 84,76 16,76" stroke="#0ea5e9" strokeWidth="3" fill="rgba(14,165,233,0.15)" />
            <circle cx="50" cy="50" r="14" stroke="#f59e0b" strokeWidth="2.5" fill="#0f172a" />
            <path d="M50 20 L50 80 M20 50 L80 50" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
          </svg>
        </div>

        {/* Title Typography Lockup */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-3 uppercase">
          Aetheria
        </h1>
        <p className="text-base sm:text-lg font-mono text-cyan-300 font-medium tracking-wide uppercase mb-6">
          Physics Labyrinth of the Cosmic Aeons
        </p>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-sans leading-relaxed mb-8">
          Navigate a procedurally generated 3D maze. Survive atmospheric vacuum perils by resolving 10 real-world celestial and fluid mechanics altars. Every calculation, decision, and reaction aligns you with one of the Eight Cosmic Paths.
        </p>

        {/* Start Game CTA */}
        <button
          onClick={onStartGame}
          className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wider uppercase rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Enter Labyrinth (Space / Enter)</span>
        </button>

        {/* 8 Paths Emblem Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {(Object.keys(PATHS) as PathType[]).map((pathKey) => {
            const p = PATHS[pathKey];
            return (
              <div
                key={pathKey}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Flat Control-Hint Line */}
      <div className="flex items-center justify-center w-full">
        <div className="px-5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-center gap-3 shadow-lg">
          <span className="text-slate-200 font-semibold">WASD Move</span>
          <span>·</span>
          <span>Mouse Look</span>
          <span>·</span>
          <span>Shift Sprint</span>
          <span>·</span>
          <span>E Interact Altar</span>
          <span>·</span>
          <span>F Flashlight</span>
          <span>·</span>
          <span>Space / Enter Start</span>
        </div>
      </div>
    </div>
  );
};
