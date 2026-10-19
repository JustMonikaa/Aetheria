import React, { useState } from 'react';
import { PATHS } from '../data/pathsData';
import { PathType } from '../types/game';
import { X, BookOpen, Compass, Atom, HeartPulse } from 'lucide-react';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'paths' | 'physics' | 'survival'>('paths');

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none cursor-default pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-100 my-auto max-h-[90vh] cursor-default pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold font-mono tracking-tight text-white uppercase">
              Aetheria Archive Codex
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('paths')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'paths'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>THE EIGHT COSMIC PATHS</span>
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'physics'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>PHYSICS DIRECTIVES</span>
          </button>
          <button
            onClick={() => setActiveTab('survival')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'survival'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>SURVIVAL PROTOCOLS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'paths' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(PATHS) as PathType[]).map((pKey) => {
                const path = PATHS[pKey];
                return (
                  <div
                    key={pKey}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center p-1"
                        style={{ backgroundColor: `${path.color}22`, color: path.accent }}
                        dangerouslySetInnerHTML={{ __html: path.iconSvg }}
                      />
                      <span className="font-bold text-sm" style={{ color: path.accent }}>
                        {path.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 italic">
                      {path.motto}
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {path.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">1. Universal Gravitation</span>
                <p className="text-slate-300 mt-1">
                  F = G · (m₁ · m₂) / r² — Force is proportional to product of masses and inversely proportional to squared separation. G = 6.674×10⁻¹¹ N·m²/kg².
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">2. Surface Gravity Acceleration</span>
                <p className="text-slate-300 mt-1">
                  g = G · M / R² — Determines the freefall acceleration experienced on a celestial sphere of mass M and radius R.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">3. Orbital Gravitational Potential Energy</span>
                <p className="text-slate-300 mt-1">
                  U = - (G · M · m) / r — Deep space potential well relative to infinite separation (always negative in bound orbit).
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">4. Near-Earth Potential Energy</span>
                <p className="text-slate-300 mt-1">
                  U = m · g · h — Mechanical potential energy of mass m lifted height h in uniform gravitational field g (9.81 m/s²).
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">5. Density of Matter</span>
                <p className="text-slate-300 mt-1">
                  ρ = m / V — Compactness of mass per cubic meter. Grade-5 Titanium has ρ = 4,500 kg/m³, Gold has ρ = 19,300 kg/m³.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">6. Hydrostatic Pressure (Barometer, Manometer, Sphygmomanometer)</span>
                <p className="text-slate-300 mt-1">
                  P = ρ · g · h — Liquid column pressure head. Standard 760 mmHg mercury column corresponds to 101.3 kPa; systolic blood pressure 120 mmHg corresponds to 16.0 kPa.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">7. Pascal’s Principle</span>
                <p className="text-slate-300 mt-1">
                  F₁ / A₁ = F₂ / A₂ — Pressure applied to an enclosed incompressible fluid is transmitted equally to all surfaces, generating hydraulic multiplication.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-sky-400">8. Archimedes’ Principle</span>
                <p className="text-slate-300 mt-1">
                  F_b = ρ_fluid · V_submerged · g — Any object submerged in a fluid experiences an upward buoyant force equal to the weight of displaced fluid. Displaced volume ΔV = m / ρ.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'survival' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-sky-400 font-mono">Oxygen & Life Support</span>
                <p className="text-slate-300 leading-relaxed">
                  Your environmental suit consumes oxygen steadily over time. Sprinting (holding Shift) increases oxygen consumption rate by 100%. Rejuvenate your suit by stepping onto illuminated green Oxygen Vents located across maze junctions.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-emerald-400 font-mono">Suit Stability & Sanity</span>
                <p className="text-slate-300 leading-relaxed">
                  Avoid standing inside amber steam vents and red anomalous gravity fields. If your stability drops to zero, the suit seals will fail.
                </p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                <span className="font-bold text-amber-400 font-mono">Path Alignment Mechanics</span>
                <p className="text-slate-300 leading-relaxed">
                  Every decision matters: calculating without errors feeds Erudition; swift sprinting feeds Hunt; nurturing life support feeds Abundance; taking high-entropy risks feeds Destruction; archiving logs feeds Remembrance; and balancing resources feeds Equilibrium.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
