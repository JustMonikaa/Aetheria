import React from 'react';
import { PlayerStats, PathType } from '../types/game';
import { PATHS } from '../data/pathsData';
import { Skull, RotateCcw, AlertOctagon } from 'lucide-react';

interface GameOverScreenProps {
  stats: PlayerStats;
  dominantPath: PathType;
  cause: 'oxygen' | 'stability';
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  dominantPath,
  cause,
  onRestart,
}) => {
  const pathData = PATHS[dominantPath];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border border-rose-600/70 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100 shadow-[0_0_50px_rgba(225,29,72,0.4)] my-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/80 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
          <Skull className="w-8 h-8 animate-pulse" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono text-rose-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> LIFE SUPPORT COMPROMISED
          </span>
          <h2 className="text-3xl font-black uppercase text-white">Critical Systems Failure</h2>
          <p className="text-xs font-sans text-slate-300 mt-1">
            {cause === 'oxygen'
              ? 'Atmospheric suit O₂ depleted to absolute vacuum. Consciousness lost in the labyrinth corridors.'
              : 'Suit structural stability failed under anomalous gravimetric pressure.'}
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex flex-col text-slate-400">
            <span>CHAMBERS SOLVED:</span>
            <span className="text-slate-100 font-bold text-sm">{stats.puzzlesSolved} / 10</span>
          </div>
          <div className="flex flex-col text-slate-400">
            <span>INTERIM ALIGNMENT:</span>
            <span className="font-bold text-sm" style={{ color: pathData.accent }}>
              {pathData.name}
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Revive Expedition</span>
        </button>
      </div>
    </div>
  );
};
