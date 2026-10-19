import React, { useState, useEffect, useRef } from 'react';
import { ChamberNode } from '../types/game';
import { MazeData } from '../game/mazeGenerator';
import {
  Maximize2,
  Minimize2,
  Compass,
  CheckCircle2,
  Radio,
  Wind,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
} from 'lucide-react';

interface MinimapProps {
  mazeData: MazeData;
  playerPos: { x: number; z: number };
  playerYaw: number;
  discoveredCells: Set<string>;
  chambers: ChamberNode[];
  guidanceChamberName: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  mazeData,
  playerPos,
  playerYaw,
  discoveredCells,
  chambers,
  guidanceChamberName,
  isExpanded,
  onToggleExpand,
}) => {
  const { width, height, cellSize, cells, oxygenVents, hazards } = mazeData;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Calculate exploration percentage
  const totalCells = width * height;
  const exploredCount = discoveredCells.size;
  const exploredPercent = Math.min(100, Math.round((exploredCount / totalCells) * 100));

  const solvedCount = chambers.filter((c) => c.solved).length;

  // Player normalized coordinates in cell space
  const playerCellX = playerPos.x / cellSize;
  const playerCellZ = playerPos.z / cellSize;

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Background
    ctx.fillStyle = '#060b17';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Scaling and positioning
    // In compact mode: center on player
    // In expanded mode: scale to fit maze or user zoom
    let cellPixelSize: number;
    let originX: number;
    let originY: number;

    if (isExpanded) {
      const padding = 24;
      const availableW = displayWidth - padding * 2;
      const availableH = displayHeight - padding * 2;
      const baseCellSize = Math.min(availableW / width, availableH / height);
      cellPixelSize = baseCellSize * zoomLevel;
      originX = (displayWidth - width * cellPixelSize) / 2;
      originY = (displayHeight - height * cellPixelSize) / 2;
    } else {
      // Compact radar: centered on player with fixed zoom
      cellPixelSize = 14;
      originX = displayWidth / 2 - playerCellX * cellPixelSize;
      originY = displayHeight / 2 - playerCellZ * cellPixelSize;
    }

    // Draw subtle grid mesh for unexplored sectors
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= width; x++) {
      const px = originX + x * cellPixelSize;
      if (px >= 0 && px <= displayWidth) {
        ctx.beginPath();
        ctx.moveTo(px, Math.max(0, originY));
        ctx.lineTo(px, Math.min(displayHeight, originY + height * cellPixelSize));
        ctx.stroke();
      }
    }
    for (let z = 0; z <= height; z++) {
      const pz = originY + z * cellPixelSize;
      if (pz >= 0 && pz <= displayHeight) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, originX), pz);
        ctx.lineTo(Math.min(displayWidth, originX + width * cellPixelSize), pz);
        ctx.stroke();
      }
    }

    // 1. Draw Discovered Corridors & Cells
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${z}`;
        const isDiscovered = discoveredCells.has(key);
        const px = originX + x * cellPixelSize;
        const pz = originY + z * cellPixelSize;

        // Skip cells far outside viewport in compact mode
        if (
          px + cellPixelSize < 0 ||
          px > displayWidth ||
          pz + cellPixelSize < 0 ||
          pz > displayHeight
        ) {
          continue;
        }

        const cell = cells[z][x];

        if (isDiscovered) {
          // Discovered floor
          ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
          ctx.fillRect(px, pz, cellPixelSize, cellPixelSize);

          // Corridor path center accent
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fillRect(
            px + cellPixelSize * 0.25,
            pz + cellPixelSize * 0.25,
            cellPixelSize * 0.5,
            cellPixelSize * 0.5
          );

          // Walls of discovered cell
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = Math.max(1.5, cellPixelSize * 0.12);
          ctx.lineCap = 'round';

          if (cell.walls.north) {
            ctx.beginPath();
            ctx.moveTo(px, pz);
            ctx.lineTo(px + cellPixelSize, pz);
            ctx.stroke();
          }
          if (cell.walls.south && z === height - 1) {
            ctx.beginPath();
            ctx.moveTo(px, pz + cellPixelSize);
            ctx.lineTo(px + cellPixelSize, pz + cellPixelSize);
            ctx.stroke();
          }
          if (cell.walls.west) {
            ctx.beginPath();
            ctx.moveTo(px, pz);
            ctx.lineTo(px, pz + cellPixelSize);
            ctx.stroke();
          }
          if (cell.walls.east && x === width - 1) {
            ctx.beginPath();
            ctx.moveTo(px + cellPixelSize, pz);
            ctx.lineTo(px + cellPixelSize, pz + cellPixelSize);
            ctx.stroke();
          }
        } else {
          // Undiscovered fog
          ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
          ctx.fillRect(px, pz, cellPixelSize, cellPixelSize);
        }
      }
    }

    // 2. Draw Oxygen Vents
    for (const vent of oxygenVents) {
      const isKnown = discoveredCells.has(`${vent.x},${vent.z}`) || isExpanded;
      if (!isKnown) continue;

      const vx = originX + (vent.x + 0.5) * cellPixelSize;
      const vz = originY + (vent.z + 0.5) * cellPixelSize;

      ctx.save();
      ctx.beginPath();
      ctx.arc(vx, vz, Math.max(3, cellPixelSize * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Hazards
    for (const hazard of hazards) {
      const isKnown = discoveredCells.has(`${hazard.x},${hazard.z}`);
      if (!isKnown) continue;

      const hx = originX + (hazard.x + 0.5) * cellPixelSize;
      const hz = originY + (hazard.z + 0.5) * cellPixelSize;

      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hz, Math.max(3, cellPixelSize * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = hazard.type === 'steam' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(168, 85, 247, 0.4)';
      ctx.fill();
      ctx.strokeStyle = hazard.type === 'steam' ? '#f97316' : '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Chambers (Solved & Unsolved & Active Guidance Beacon)
    const now = Date.now() * 0.003;
    for (let i = 0; i < chambers.length; i++) {
      const ch = chambers[i];
      const isKnown = discoveredCells.has(`${ch.x},${ch.z}`) || isExpanded;
      const isGuidance = guidanceChamberName && ch.name.toLowerCase() === guidanceChamberName.toLowerCase();

      // Always show guidance beacon on map even if unexplored!
      if (!isKnown && !isGuidance) continue;

      const cx = originX + (ch.x + 0.5) * cellPixelSize;
      const cz = originY + (ch.z + 0.5) * cellPixelSize;

      ctx.save();
      if (ch.solved) {
        // Solved Chamber: Emerald Green Node
        ctx.beginPath();
        ctx.arc(cx, cz, Math.max(4, cellPixelSize * 0.38), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Checkmark dot
        ctx.beginPath();
        ctx.arc(cx, cz, Math.max(2, cellPixelSize * 0.16), 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
      } else if (isGuidance) {
        // Active Infinite Guidance Beacon: Pulsing cyan beacon waves
        const pulse = 1 + 0.35 * Math.sin(now * 3);
        const radius = Math.max(6, cellPixelSize * 0.55) * pulse;

        // Radiating pulse ring
        ctx.beginPath();
        ctx.arc(cx, cz, radius * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cz, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner core
        ctx.beginPath();
        ctx.arc(cx, cz, Math.max(2, cellPixelSize * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // Unsolved Chamber: Amber/Cyan Tech Marker
        const pulse = 1 + 0.2 * Math.sin(now * 2 + i);
        ctx.beginPath();
        ctx.arc(cx, cz, Math.max(4, cellPixelSize * 0.36) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Chamber number label in expanded view
        if (isExpanded && cellPixelSize > 18) {
          ctx.fillStyle = '#e0f2fe';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i + 1}`, cx, cz);
        }
      }
      ctx.restore();
    }

    // 5. Draw Player Marker & Field of View Cone
    const playerPx = originX + playerCellX * cellPixelSize;
    const playerPz = originY + playerCellZ * cellPixelSize;

    ctx.save();
    ctx.translate(playerPx, playerPz);

    // Player yaw rotation in Three.js (0 faces -Z, rotates clockwise around Y)
    // In 2D top-down (X is right, Z is down): yaw angle is -playerYaw - Math.PI/2
    const angle = -playerYaw - Math.PI / 2;
    ctx.rotate(angle);

    // Flashlight / Vision Cone
    const coneRadius = cellPixelSize * 3.5;
    const coneAngle = Math.PI * 0.35;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, coneRadius);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, coneRadius, -coneAngle / 2, coneAngle / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Directional Arrow Chevron
    const arrowSize = Math.max(6, cellPixelSize * 0.45);
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.6);
    ctx.lineTo(-arrowSize * 0.2, 0);
    ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);
    ctx.closePath();
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Core player beacon dot
    ctx.beginPath();
    ctx.arc(0, 0, arrowSize * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    // 6. Compact Radar Scanning Line & Ring Overlay
    if (!isExpanded) {
      // Outer radar border glow
      const cx = displayWidth / 2;
      const cy = displayHeight / 2;
      const radarR = Math.min(cx, cy) - 2;

      // Rotating radar sweep
      ctx.save();
      ctx.translate(cx, cy);
      const sweepAngle = now * 1.5;
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radarR);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarR, -0.4, 0);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarR, 0);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Radar range rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radarR * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radarR * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal marks
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('N', cx, 4);
      ctx.textBaseline = 'bottom';
      ctx.fillText('S', cx, displayHeight - 4);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('E', displayWidth - 10, cy);
      ctx.textAlign = 'right';
      ctx.fillText('W', 10, cy);
    }

    ctx.restore();
  }, [
    mazeData,
    playerPos,
    playerYaw,
    discoveredCells,
    chambers,
    guidanceChamberName,
    isExpanded,
    zoomLevel,
  ]);

  return (
    <>
      {/* 1. Compact HUD Minimap Radar */}
      {!isExpanded && (
        <div
          onClick={onToggleExpand}
          className="group relative cursor-pointer pointer-events-auto rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/80 p-2 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] flex flex-col gap-1.5"
          style={{ width: 176, height: 196 }}
          title="Click or press [M] to open full tactical map"
        >
          {/* Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Compass className="w-3 h-3 animate-spin text-cyan-400" />
              <span>RADAR [M]</span>
            </span>
            <span className="text-slate-300 font-semibold">{exploredPercent}%</span>
          </div>

          {/* Radar Screen Canvas */}
          <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/80 text-slate-400 group-hover:text-cyan-300 transition">
              <Maximize2 className="w-3 h-3" />
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
            <span>
              CHAMBERS: <span className="text-emerald-400 font-bold">{solvedCount}</span>/{chambers.length}
            </span>
            <span className="text-slate-500">
              {Math.round(playerPos.x)},{Math.round(playerPos.z)}
            </span>
          </div>
        </div>
      )}

      {/* 2. Expanded Full-Screen Tactical Map Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[85vh] bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
            {/* Tactical Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-mono tracking-wider text-slate-100 flex items-center gap-2">
                    <span>TACTICAL LABYRINTH SCHEMATIC</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/40">
                      LIVE TELEMETRY
                    </span>
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    Aethelgard High-Energy Experimental Facility · Sector Grid 17x17
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.0)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Reset Zoom"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={onToggleExpand}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                  title="Close Map (Esc or M)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">CLOSE [M]</span>
                </button>
              </div>
            </div>

            {/* Map Canvas Area */}
            <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

              {/* Exploration Stats Pill */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg text-xs font-mono flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-slate-400">DISCOVERED PATHS:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">{exploredPercent}%</span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg text-xs font-mono flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400">CHAMBERS SOLVED:</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    {solvedCount} / {chambers.length}
                  </span>
                </div>
              </div>

              {/* Active Guidance Alert in Map */}
              {guidanceChamberName && (
                <div className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse pointer-events-none">
                  <Radio className="w-4 h-4 text-cyan-300" />
                  <span>BEACON PROJECTED OVER: {guidanceChamberName}</span>
                </div>
              )}
            </div>

            {/* Tactical Footer & Legend */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              {/* Legend Items */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 border border-white" />
                  <span className="text-slate-300">Player Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
                  <span className="text-slate-300">Solved Chamber</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-600 border border-cyan-400" />
                  <span className="text-slate-300">Unsolved Chamber</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500 border border-teal-300" />
                  <span className="text-slate-300">Oxygen Vent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-300" />
                  <span className="text-slate-300">Suit Hazard</span>
                </div>
              </div>

              <div className="text-slate-500 text-[11px]">
                Navigate with WASD · Fog clears automatically as you explore corridors
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
