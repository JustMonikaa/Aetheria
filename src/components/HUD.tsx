import React, { useState, useEffect } from 'react';
import { ChamberNode, PathType, PlayerStats } from '../types/game';
import { MazeData } from '../game/mazeGenerator';
import { PATHS } from '../data/pathsData';
import { StoryArcTracker } from './StoryArcTracker';
import { Minimap } from './Minimap';
import {
  Wind,
  ShieldAlert,
  BatteryCharging,
  Zap,
  Volume2,
  VolumeX,
  Compass,
  Radio,
  BookOpen,
  Sparkles,
  Flashlight,
  Hand,
  Smartphone,
  Map as MapIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  dominantPath: PathType;
  chambers: ChamberNode[];
  activeChamberId: string | null;
  nearChamber: ChamberNode | null;
  nearChamberIds: string[];
  nearDataLogText: string | null;
  inOxygenVent: boolean;
  flashlightOn: boolean;
  guidanceChamberName: string | null;
  isMuted: boolean;
  mazeData: MazeData;
  playerPos: { x: number; z: number };
  playerYaw: number;
  discoveredCells: Set<string>;
  isMapExpanded: boolean;
  onToggleMapExpand: () => void;
  onToggleMute: () => void;
  onOpenApparatus: () => void;
  onOpenCodex: () => void;
  onToggleFlashlight: () => void;
  onVirtualMove?: (x: number, z: number, sprint: boolean) => void;
  onVirtualLook?: (dx: number, dy: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  dominantPath,
  chambers,
  activeChamberId,
  nearChamber,
  nearChamberIds,
  nearDataLogText,
  inOxygenVent,
  flashlightOn,
  guidanceChamberName,
  isMuted,
  mazeData,
  playerPos,
  playerYaw,
  discoveredCells,
  isMapExpanded,
  onToggleMapExpand,
  onToggleMute,
  onOpenApparatus,
  onOpenCodex,
  onToggleFlashlight,
  onVirtualMove,
  onVirtualLook,
}) => {
  const currentPath = PATHS[dominantPath];
  const isO2Critical = stats.oxygen < 25;
  const isStabilityLow = stats.stability < 30;

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchSprinting, setTouchSprinting] = useState(false);

  useEffect(() => {
    const hasTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        window.matchMedia('(pointer: coarse)').matches);
    setIsTouchDevice(Boolean(hasTouch));
  }, []);

  // Format elapsed time (MM:SS)
  const minutes = Math.floor(stats.timeElapsed / 60);
  const seconds = Math.floor(stats.timeElapsed % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Touch joystick state
  const handleTouchDir = (x: number, z: number) => {
    if (onVirtualMove) {
      onVirtualMove(x, z, touchSprinting);
    }
  };

  const stopTouchDir = () => {
    if (onVirtualMove) {
      onVirtualMove(0, 0, false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4 z-20 overflow-hidden">
      {/* TOP PERIMETER: Story Arc Tracker & System Controls */}
      <div className="flex items-start justify-between w-full gap-3 sm:gap-4">
        {/* Hidden Path: Mysterious Cosmic Telemetry Badge */}
        <div
          className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-950/85 border backdrop-blur-md shadow-xl"
          style={{
            borderColor: currentPath.color,
            boxShadow: `0 0 15px ${currentPath.glow}`,
          }}
        >
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center p-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-500/40"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              COSMIC RESONANCE
            </span>
            <span className="text-[11px] sm:text-xs font-bold font-mono tracking-wider text-cyan-300">
              ATTUNING ACTIONS...
            </span>
          </div>
        </div>

        {/* Center: Story Arc Visual Progress Bar with nearby curve-wave indicator */}
        <div className="pointer-events-auto flex-1 max-w-xl mx-auto">
          <StoryArcTracker
            chambers={chambers}
            activeChamberId={activeChamberId}
            nearChamberIds={nearChamberIds}
            dominantPath={dominantPath}
            puzzlesSolved={stats.puzzlesSolved}
          />
        </div>

        {/* Top-Right Quick Actions (Map, Codex, Touch Controls Toggle, & Audio Mute) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMapExpand}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-950/85 hover:bg-slate-900 border rounded-xl transition flex items-center gap-1.5 text-xs font-mono shadow-lg cursor-pointer ${
              isMapExpanded ? 'border-cyan-500 text-cyan-300' : 'border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle Tactical Map Schematic [M]"
          >
            <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="hidden sm:inline">MAP [M]</span>
          </button>
          <button
            onClick={() => setIsTouchDevice(!isTouchDevice)}
            className={`p-1.5 sm:p-2 bg-slate-950/85 hover:bg-slate-900 border rounded-xl transition shadow-lg cursor-pointer flex items-center gap-1 text-xs font-mono ${
              isTouchDevice ? 'border-cyan-500 text-cyan-300' : 'border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isTouchDevice ? 'Hide On-Screen Controls' : 'Show On-Screen Virtual Controls'}
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onOpenCodex}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono shadow-lg cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            <span className="hidden sm:inline">CODEX</span>
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Floating Top-Right Tactical Radar Minimap */}
      <div className="absolute top-16 sm:top-18 right-3 sm:right-4 pointer-events-auto">
        <Minimap
          mazeData={mazeData}
          playerPos={playerPos}
          playerYaw={playerYaw}
          discoveredCells={discoveredCells}
          chambers={chambers}
          guidanceChamberName={guidanceChamberName}
          isExpanded={isMapExpanded}
          onToggleExpand={onToggleMapExpand}
        />
      </div>

      {/* CENTER CROSSHAIR */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400/80" />
          <div className="absolute w-4 h-0.5 border-t border-slate-500/40" />
          <div className="absolute h-4 w-0.5 border-l border-slate-500/40" />
        </div>
      </div>

      {/* INTERACTIVE PROMPT POPUPS (Center-Bottom) */}
      <div className="flex flex-col items-center gap-2 mb-2 pointer-events-auto">
        {/* Guidance Light Column Notification */}
        {guidanceChamberName && (
          <div className="px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400/80 text-cyan-200 font-mono text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse">
            <Radio className="w-4 h-4 text-cyan-300" />
            <span>BEACON ACTIVE: Navigational Light Column Projected over {guidanceChamberName}</span>
          </div>
        )}

        {/* Interact button - ONLY shown if near chamber is NOT solved */}
        {nearChamber && !nearChamber.solved && (
          <button
            onClick={onOpenApparatus}
            className="px-5 py-3 rounded-2xl bg-slate-950/95 border-2 text-white font-mono text-sm font-bold flex items-center gap-3 shadow-2xl transition hover:scale-105 cursor-pointer"
            style={{
              borderColor: '#38bdf8',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)',
            }}
          >
            <Radio className="w-5 h-5 animate-pulse text-sky-400" />
            <span>PRESS [E] OR TAP TO EXAMINE {nearChamber.name.toUpperCase()}</span>
          </button>
        )}

        {inOxygenVent && (
          <div className="px-4 py-2 rounded-xl bg-teal-950/90 border border-teal-400 text-teal-200 font-mono text-xs flex items-center gap-2 shadow-lg">
            <Wind className="w-4 h-4 text-teal-300 animate-spin" />
            <span>Oxygen Vent Active: Life Support Replenishing</span>
          </div>
        )}

        {nearDataLogText && (
          <div className="max-w-md p-3.5 rounded-xl bg-slate-950/90 border border-sky-500/50 text-slate-200 text-xs font-mono shadow-2xl">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
              <Compass className="w-3.5 h-3.5" /> ARCHIVE TRANSCRIPT
            </div>
            <p className="whitespace-pre-line text-slate-300 text-[11px] leading-relaxed">
              {nearDataLogText}
            </p>
          </div>
        )}
      </div>

      {/* TOUCHSCREEN ONSCREEN VIRTUAL CONTROLS (If touch supported) */}
      {isTouchDevice && (
        <div className="pointer-events-auto flex items-end justify-between w-full mb-3 px-2">
          {/* Virtual D-Pad for Touch Movement */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/80 border border-slate-800 rounded-2xl backdrop-blur-md">
            <div />
            <button
              onPointerDown={() => handleTouchDir(0, 1)}
              onPointerUp={stopTouchDir}
              onPointerCancel={stopTouchDir}
              className="w-12 h-12 bg-slate-900 border border-slate-700 active:bg-sky-600 rounded-xl flex items-center justify-center text-slate-200 active:text-white"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />

            <button
              onPointerDown={() => handleTouchDir(-1, 0)}
              onPointerUp={stopTouchDir}
              onPointerCancel={stopTouchDir}
              className="w-12 h-12 bg-slate-900 border border-slate-700 active:bg-sky-600 rounded-xl flex items-center justify-center text-slate-200 active:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <button
              onPointerDown={() => handleTouchDir(0, -1)}
              onPointerUp={stopTouchDir}
              onPointerCancel={stopTouchDir}
              className="w-12 h-12 bg-slate-900 border border-slate-700 active:bg-sky-600 rounded-xl flex items-center justify-center text-slate-200 active:text-white"
            >
              <ArrowDown className="w-6 h-6" />
            </button>

            <button
              onPointerDown={() => handleTouchDir(1, 0)}
              onPointerUp={stopTouchDir}
              onPointerCancel={stopTouchDir}
              className="w-12 h-12 bg-slate-900 border border-slate-700 active:bg-sky-600 rounded-xl flex items-center justify-center text-slate-200 active:text-white"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons for Touch */}
          <div className="flex flex-col gap-2">
            {nearChamber && !nearChamber.solved && (
              <button
                onClick={onOpenApparatus}
                className="px-4 py-2.5 bg-sky-600 active:bg-sky-500 text-white font-mono text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Hand className="w-4 h-4" /> EXAMINE
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setTouchSprinting((s) => !s)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 ${
                  touchSprinting
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <Zap className="w-4 h-4" /> SPRINT
              </button>

              <button
                onClick={onToggleFlashlight}
                className={`p-2.5 rounded-xl border ${
                  flashlightOn
                    ? 'bg-amber-600/30 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <Flashlight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM PERIMETER: Survival Vitals & Telemetry Cluster */}
      <div className="flex items-end justify-between w-full gap-2 sm:gap-4">
        {/* Left: Player Vitals Cluster */}
        <div className="pointer-events-auto flex flex-col gap-2 p-2.5 sm:p-3 bg-slate-950/85 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md min-w-[240px] sm:min-w-[280px]">
          {/* Oxygen Level */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Wind className={`w-3.5 h-3.5 ${isO2Critical ? 'text-rose-400 animate-bounce' : 'text-sky-400'}`} />
                <span>OXYGEN (O₂)</span>
              </span>
              <span className={`font-bold tabular-nums ${isO2Critical ? 'text-rose-400' : 'text-slate-200'}`}>
                {Math.round(stats.oxygen)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isO2Critical ? 'bg-rose-500' : 'bg-sky-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, stats.oxygen))}%` }}
              />
            </div>
          </div>

          {/* Suit Stability / Pressure */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldAlert className={`w-3.5 h-3.5 ${isStabilityLow ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span>SUIT STABILITY</span>
              </span>
              <span className="font-bold tabular-nums text-slate-200">
                {Math.round(stats.stability)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, stats.stability))}%` }}
              />
            </div>
          </div>

          {/* Battery & Stamina Sub-grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900 text-[10px] sm:text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-amber-400" />
                <span>BATTERY:</span>
              </span>
              <span className="text-slate-200 font-semibold tabular-nums">
                {Math.round(stats.flashlightBattery)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>STAMINA:</span>
              </span>
              <span className="text-slate-200 font-semibold tabular-nums">
                {Math.round(stats.sprintStamina)}%
              </span>
            </div>
          </div>
        </div>

        {/* Center: Flat Control-Hint Line */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] font-mono text-slate-400 shadow-md">
          <span>WASD Move</span>
          <span>·</span>
          <span>Mouse Look</span>
          <span>·</span>
          <span>Hold Shift (Free Pointer & Click)</span>
          <span>·</span>
          <span>E Interact</span>
          <span>·</span>
          <span>F Flashlight ({flashlightOn ? 'ON' : 'OFF'})</span>
          <span>·</span>
          <span>M Map</span>
        </div>

        {/* Right: Telemetry & Mission Clock */}
        <div className="pointer-events-auto flex flex-col gap-1 p-2.5 sm:p-3 bg-slate-950/85 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md text-right font-mono min-w-[130px] sm:min-w-[160px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">EXPEDITION TIME</span>
          <span className="text-base sm:text-lg font-bold text-slate-100 tabular-nums">{timeFormatted}</span>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 border-t border-slate-900 pt-1 mt-1">
            <span>DISTANCE:</span>
            <span className="text-slate-200 tabular-nums">{Math.round(stats.distanceTraveled)}m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
