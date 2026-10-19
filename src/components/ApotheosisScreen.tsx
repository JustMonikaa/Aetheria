import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PathType, PlayerStats } from '../types/game';
import { PATHS } from '../data/pathsData';
import { soundEngine } from '../audio/soundEngine';
import { RotateCcw, Trophy, Target, Sparkles, ShieldCheck, Activity } from 'lucide-react';

interface ApotheosisScreenProps {
  stats: PlayerStats;
  dominantPath: PathType;
  onRestart: () => void;
}

export const ApotheosisScreen: React.FC<ApotheosisScreenProps> = ({
  stats,
  dominantPath,
  onRestart,
}) => {
  const pathData = PATHS[dominantPath];

  useEffect(() => {
    soundEngine.playSuccess();
    // Confetti burst themed to cosmic path colors
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [pathData.color, pathData.accent, '#ffffff', '#38bdf8'],
      });
    } catch {
      // Ignore if confetti context not ready
    }
  }, [dominantPath, pathData]);

  const accuracyPercent = Math.max(
    0,
    Math.round(((stats.puzzlesSolved) / (stats.puzzlesSolved + stats.mistakesCount)) * 100)
  );

  const minutes = Math.floor(stats.timeElapsed / 60);
  const seconds = Math.floor(stats.timeElapsed % 60);
  const timeFormatted = `${minutes}m ${seconds}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg overflow-y-auto select-none">
      <div
        className="relative w-full max-w-3xl bg-slate-950 border-2 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100 shadow-2xl my-auto"
        style={{
          borderColor: pathData.color,
          boxShadow: `0 0 50px ${pathData.glow}`,
        }}
      >
        {/* Crown & Path Alignment Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center p-3 shadow-2xl"
            style={{
              backgroundColor: `${pathData.color}22`,
              border: `2px solid ${pathData.color}`,
              boxShadow: `0 0 25px ${pathData.glow}`,
              color: pathData.accent,
            }}
            dangerouslySetInnerHTML={{ __html: pathData.iconSvg }}
          />

          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span style={{ color: pathData.accent }}>COSMIC ASCENSION COMPLETED</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            {pathData.name}
          </h2>
          <span className="text-sm font-mono text-slate-400 font-semibold uppercase">
            {pathData.title}
          </span>
        </div>

        {/* Path Motto & Epilogue */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col gap-2">
          <p className="text-xs sm:text-sm font-mono text-cyan-300 italic">{pathData.motto}</p>
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mt-1">
            {pathData.epilogue}
          </p>
        </div>

        {/* Playstyle Telemetry & Performance Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">Physics Accuracy</span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums flex items-center justify-center gap-1">
              <Target className="w-4 h-4" /> {accuracyPercent}%
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">Expedition Time</span>
            <span className="text-xl font-bold text-sky-400 tabular-nums flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" /> {timeFormatted}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">Traversed Dist.</span>
            <span className="text-xl font-bold text-amber-400 tabular-nums">
              {Math.round(stats.distanceTraveled)}m
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1 text-center">
            <span className="text-[10px] text-slate-400 uppercase">Life Support Cons.</span>
            <span className="text-xl font-bold text-teal-400 tabular-nums flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> {Math.round(stats.oxygen)}% O₂
            </span>
          </div>
        </div>

        {/* 8 Cosmic Path Affinity Breakdown */}
        <div className="flex flex-col gap-2 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> EIGHTFOLD COSMIC ALIGNMENT SPECTRUM
            </span>
            <span>DOMINANCE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {(Object.keys(PATHS) as PathType[]).map((pKey) => {
              const p = PATHS[pKey];
              const score = stats.pathScores[pKey] || 0;
              const isDominant = pKey === dominantPath;

              return (
                <div
                  key={pKey}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${
                    isDominant ? 'bg-slate-800 border-2' : 'bg-slate-950 border-slate-800/80'
                  }`}
                  style={{ borderColor: isDominant ? p.color : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className={isDominant ? 'font-bold text-white' : 'text-slate-300'}>{p.name}</span>
                  </div>
                  <span className="font-bold tabular-nums" style={{ color: p.accent }}>
                    {score} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Restart / New Odyssey CTA */}
        <button
          onClick={onRestart}
          className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold font-mono text-sm tracking-wider uppercase rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Embark on a New Odyssey</span>
        </button>
      </div>
    </div>
  );
};
