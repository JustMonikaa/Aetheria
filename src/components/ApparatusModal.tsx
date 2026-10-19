import React, { useState } from 'react';
import { PhysicsProblem, PathType } from '../types/game';
import { PATHS } from '../data/pathsData';
import { soundEngine } from '../audio/soundEngine';
import {
  CheckCircle,
  XCircle,
  Calculator,
  Compass,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface ApparatusModalProps {
  problem: PhysicsProblem;
  dominantPath: PathType;
  onSolveAndResolve: (narrativeChoiceId: string, path: PathType, points: number) => void;
  onClose: () => void;
  onRecordMistake: () => void;
}

export const ApparatusModal: React.FC<ApparatusModalProps> = ({
  problem,
  dominantPath,
  onSolveAndResolve,
  onClose,
  onRecordMistake,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCalculatedCorrect, setIsCalculatedCorrect] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; correct: boolean } | null>(null);

  // Built-in scientific calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Randomize choices on mount so the correct answer is not always in slot A
  const [shuffledOptions] = useState(() => {
    const arr = [...problem.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // Narrative step
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string | null>(null);

  const activePathTheme = PATHS[dominantPath];

  const handleVerifyOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    const opt = shuffledOptions.find((o) => o.id === optionId);
    if (!opt) return;

    if (opt.isCorrect) {
      setIsCalculatedCorrect(true);
      setFeedbackMsg({ text: `Calibrated: ${opt.explanation}`, correct: true });
      soundEngine.playSuccess();

      // Sound triggers based on topic apparatus
      if (problem.apparatusType.includes('beaker') || problem.apparatusType.includes('buoyancy')) {
        soundEngine.playWaterSplash();
      } else if (problem.apparatusType.includes('pascal') || problem.apparatusType.includes('manometer')) {
        soundEngine.playHydraulicHiss();
      }
    } else {
      setIsCalculatedCorrect(false);
      setFeedbackMsg({ text: `Deviation detected: ${opt.explanation}`, correct: false });
      soundEngine.playError();
      onRecordMistake();
    }
  };

  const handleEvaluateCalc = () => {
    try {
      // Safe math evaluation with JS Math functions
      const sanitized = calcInput
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');

      // Restrict characters to numbers, basic math operators, parentheses, and Math library
      if (!/^[0-9+\-*/().\s*eE,]|Math\.[a-z]+$/i.test(sanitized)) {
        setCalcResult('Syntax Error');
        return;
      }
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${sanitized})`)();
      setCalcResult(Number(res).toPrecision(6));
    } catch {
      setCalcResult('Error');
    }
  };

  const handleCommitNarrative = () => {
    if (!selectedNarrativeId) return;
    const choice = problem.narrativeChoices.find((c) => c.id === selectedNarrativeId);
    if (!choice) return;

    soundEngine.playInteract();
    // Narrative choice grants a subtle 1 pt affinity; player in-game actions & accuracy determine dominant Path
    onSolveAndResolve(choice.id, choice.pathAffinity, 1);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto cursor-default pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-950 border rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-slate-100 my-auto cursor-default pointer-events-auto"
        style={{
          borderColor: activePathTheme.color,
          boxShadow: `0 0 35px ${activePathTheme.glow}`,
        }}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 text-xs font-mono font-bold rounded uppercase tracking-wider text-slate-900"
                style={{ backgroundColor: activePathTheme.accent }}
              >
                Chamber {problem.topicNumber}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                {problem.topicTitle}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{problem.chamberName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sky-400 transition"
              title="Toggle Scientific Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>CALCULATOR</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              ESC / CLOSE
            </button>
          </div>
        </div>

        {/* Narrative Context Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed font-sans">{problem.narrativeContext}</p>
        </div>

        {/* Embedded Calculator Drawer (if toggled) */}
        {showCalculator && (
          <div className="p-4 bg-slate-900 border border-sky-500/40 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-sky-400">
              <span className="flex items-center gap-1">
                <Calculator className="w-3 h-3" /> Field Arithmetic Module
              </span>
              <span>Units: SI (N, m, kg, Pa, J)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEvaluateCalc()}
                placeholder="e.g. 13595 * 9.807 * 0.742 or (6.674e-11 * 4.2e5 * 2.8e4) / (150^2)"
                className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-100 rounded-lg focus:outline-none focus:border-sky-400"
              />
              <button
                onClick={handleEvaluateCalc}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded-lg transition"
              >
                COMPUTE
              </button>
            </div>
            {calcResult !== null && (
              <div className="text-sm font-mono flex items-center justify-between px-3 py-1.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Output:</span>
                <span className="font-bold text-sky-300">{calcResult}</span>
              </div>
            )}
          </div>
        )}

        {/* Physical Variables & Problem Formulation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Physical Formula & Real-World Variables */}
          <div className="md:col-span-1 p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Governing Equation
            </span>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono text-sky-400 font-bold text-base">
              {problem.formula}
            </div>

            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mt-2">
              Measured In-Situ Variables
            </span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {Object.entries(problem.variables).map(([name, val]) => (
                <div key={name} className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">{name}:</span>
                  <span className="text-slate-200 font-semibold">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Columns: Statement & Options / Narrative Choice */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Problem Statement */}
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Physics Calibration Prompt
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{problem.problemStatement}</p>
            </div>

            {/* Step 1: Physics Calculation Multiple Choice */}
            {!isCalculatedCorrect ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Select Calibrated Calculation Result:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shuffledOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVerifyOption(opt.id)}
                        className={`p-3 text-left rounded-xl border font-mono text-xs transition flex flex-col gap-1 cursor-pointer ${
                          selectedOptionId === opt.id
                            ? opt.isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-rose-950/60 border-rose-500 text-rose-200'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-cyan-300">
                              {letter}
                            </span>
                            <span>{opt.label}</span>
                          </span>
                          {selectedOptionId === opt.id &&
                            (opt.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Immediate Feedback */}
                {feedbackMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 border ${
                      feedbackMsg.correct
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                    }`}
                  >
                    {feedbackMsg.correct ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Reactive Narrative Decision & Path Alignment */
              <div className="flex flex-col gap-3 p-4 bg-slate-900/90 border border-emerald-500/50 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  PHYSICS RESOLVED — SELECT REACTION INTENT & SECTOR DIRECTIVE
                </div>
                <p className="text-xs text-slate-300">
                  How will you apply this calculation to resolve the sector anomaly? Your operational approach will attune your cosmic destiny.
                </p>

                <div className="flex flex-col gap-2 mt-1">
                  {problem.narrativeChoices.map((choice, idx) => {
                    const isSelected = selectedNarrativeId === choice.id;

                    return (
                      <button
                        key={choice.id}
                        onClick={() => setSelectedNarrativeId(choice.id)}
                        className={`p-3 text-left rounded-xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-2 border-cyan-400 text-slate-100 shadow-lg'
                            : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase tracking-wider bg-slate-900 border border-slate-700 text-cyan-300">
                              Sector Directive {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Operational Directive
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 font-sans mt-0.5">{choice.text}</p>
                          {isSelected && (
                            <p className="text-[11px] text-cyan-300/80 italic mt-1 font-mono">
                              &ldquo;{choice.consequence}&rdquo;
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected ? 'translate-x-1 text-white' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleCommitNarrative}
                  disabled={!selectedNarrativeId}
                  className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                >
                  <Compass className="w-4 h-4" />
                  <span>COMMIT ALIGNMENT & UNLOCK CONDUIT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
