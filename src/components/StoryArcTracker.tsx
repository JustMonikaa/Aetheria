import React from 'react';
import { ChamberNode, PathType } from '../types/game';
import { PATHS } from '../data/pathsData';
import { CheckCircle2, Circle, Radio, Activity } from 'lucide-react';

interface StoryArcTrackerProps {
  chambers: ChamberNode[];
  activeChamberId: string | null;
  nearChamberIds: string[];
  dominantPath: PathType;
  puzzlesSolved: number;
}

export const StoryArcTracker: React.FC<StoryArcTrackerProps> = ({
  chambers,
  activeChamberId,
  nearChamberIds,
  dominantPath,
  puzzlesSolved,
}) => {
  const pathData = PATHS[dominantPath];
  const progressPercent = Math.round((puzzlesSolved / chambers.length) * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-2xl px-4 py-2 bg-slate-950/85 border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md">
      {/* Top row: Mysterious Cosmic Telemetry & Completion Status (Current Path Hidden) */}
      <div className="flex items-center justify-between text-xs tracking-wider">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: pathData.color, boxShadow: `0 0 10px ${pathData.color}` }}
          />
          <span className="font-semibold font-mono text-cyan-300 uppercase text-[11px] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>AEON RESONANCE // ATTUNING</span>
          </span>
          <span className="text-slate-400 hidden sm:inline text-[10px] font-mono">
            [Telemetry Recording Actions]
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[11px]">ARC PROGRESS:</span>
          <span className="font-bold tabular-nums text-cyan-400 text-xs">
            {puzzlesSolved}/{chambers.length} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Segmented Milestone Progress Bar */}
      <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden flex items-center border border-slate-800">
        <div
          className="h-full transition-all duration-700 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, #38bdf8, ${pathData.color})`,
            boxShadow: `0 0 12px ${pathData.color}`,
          }}
        />
      </div>

      {/* Milestones Node Icons */}
      <div className="flex items-center justify-between w-full pt-1.5 relative">
        {chambers.map((ch) => {
          const isSolved = ch.solved;
          const isCurrent = activeChamberId === ch.id;
          const isNearby = nearChamberIds.includes(ch.id);

          return (
            <div
              key={ch.id}
              className="group relative flex flex-col items-center"
              title={`Chamber ${ch.problem.topicNumber}: ${ch.problem.topicTitle}${
                isNearby ? ' (PROXIMITY DETECTED)' : ''
              }`}
            >
              {/* Curve wave radar line if player is near this chamber */}
              {isNearby && !isSolved && (
                <div className="absolute -top-4 flex flex-col items-center pointer-events-none">
                  {/* Curved wave sonar radar arcs */}
                  <svg className="w-6 h-3 text-cyan-400 drop-shadow-[0_0_8px_#38bdf8]" viewBox="0 0 24 10">
                    <path
                      d="M 2 8 Q 12 1 22 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 5 9 Q 12 4 19 9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  </svg>
                  {/* Subtle ping pulse */}
                  <span className="absolute -top-0.5 w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
                </div>
              )}

              <div className="flex items-center justify-center transition-transform group-hover:scale-125">
                {isSolved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                ) : isNearby ? (
                  <div className="relative flex items-center justify-center">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_#38bdf8]" />
                  </div>
                ) : isCurrent ? (
                  <Radio className="w-3 h-3 text-amber-400/80" />
                ) : (
                  <Circle className="w-3 h-3 text-slate-600" />
                )}
              </div>
              <span
                className={`text-[9px] font-mono mt-0.5 transition-colors ${
                  isNearby ? 'text-cyan-300 font-bold' : isSolved ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {ch.problem.topicNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
