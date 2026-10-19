import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameScreen, PathType, PlayerStats, ChamberNode } from './types/game';
import { generateMaze, MazeData } from './game/mazeGenerator';
import { MazeSceneManager } from './game/sceneManager';
import { soundEngine } from './audio/soundEngine';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { ApparatusModal } from './components/ApparatusModal';
import { ApotheosisScreen } from './components/ApotheosisScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { CodexModal } from './components/CodexModal';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title');
  const [dominantPath, setDominantPath] = useState<PathType>('Erudition');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showCodex, setShowCodex] = useState<boolean>(false);

  // Maze & World Data
  const [mazeData, setMazeData] = useState<MazeData>(() => generateMaze(17, 17, 6));
  const [activeChamberId, setActiveChamberId] = useState<string | null>('prob-1');
  const [nearChamber, setNearChamber] = useState<ChamberNode | null>(null);
  const [nearChamberIds, setNearChamberIds] = useState<string[]>([]);
  const [nearDataLogText, setNearDataLogText] = useState<string | null>(null);
  const [inOxygenVent, setInOxygenVent] = useState<boolean>(false);
  const [gameOverCause, setGameOverCause] = useState<'oxygen' | 'stability'>('oxygen');

  // Guidance light column state when player takes too long to find next chamber
  const [guidanceChamberName, setGuidanceChamberName] = useState<string | null>(null);
  const timeSeekingChamberRef = useRef<number>(0);

  // Player Transform (x, z, yaw) & Minimap Fog-of-War Discovery
  const [playerTransform, setPlayerTransform] = useState<{ x: number; z: number; yaw: number }>(() => ({
    x: mazeData.startPos.x * mazeData.cellSize + mazeData.cellSize / 2,
    z: mazeData.startPos.z * mazeData.cellSize + mazeData.cellSize / 2,
    yaw: 0,
  }));
  const [discoveredCells, setDiscoveredCells] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const sx = mazeData.startPos.x;
    const sz = mazeData.startPos.z;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = sx + dx;
        const nz = sz + dz;
        if (nx >= 0 && nx < mazeData.width && nz >= 0 && nz < mazeData.height) {
          initial.add(`${nx},${nz}`);
        }
      }
    }
    return initial;
  });
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Currently open apparatus modal
  const [inspectingChamber, setInspectingChamber] = useState<ChamberNode | null>(null);

  // Player Stats & Telemetry
  const [stats, setStats] = useState<PlayerStats>({
    oxygen: 100,
    stability: 100,
    flashlightBattery: 100,
    sprintStamina: 100,
    distanceTraveled: 0,
    puzzlesSolved: 0,
    totalPuzzles: 10,
    mistakesCount: 0,
    timeElapsed: 0,
    speedrunScore: 0,
    logsCollected: 0,
    chambersExplored: 1,
    hazardEncounters: 0,
    pathScores: {
      Erudition: 10,
      Destruction: 0,
      Abundance: 0,
      Hunt: 0,
      Remembrance: 0,
      Elation: 0,
      Nihility: 0,
      Equilibrium: 5,
    },
  });

  // Flashlight state from scene manager
  const [flashlightOn, setFlashlightOn] = useState<boolean>(true);

  // Canvas container ref
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<MazeSceneManager | null>(null);

  // Calculate dominant path based on accumulated path scores
  const recalculateDominantPath = useCallback((currentScores: Record<PathType, number>) => {
    let bestPath: PathType = 'Erudition';
    let maxScore = -1;
    (Object.keys(currentScores) as PathType[]).forEach((p) => {
      if (currentScores[p] > maxScore) {
        maxScore = currentScores[p];
        bestPath = p;
      }
    });
    setDominantPath(bestPath);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateThemeForPath(bestPath);
    }
  }, []);

  // Update Player Stats from Scene Manager per tick
  const handleStatsUpdate = useCallback(
    (delta: { distance: number; staminaDelta: number; oxygenDrain: number; batteryDrain: number }) => {
      setStats((prev) => {
        const nextO2 = Math.max(0, prev.oxygen - delta.oxygenDrain);
        const nextBattery = Math.max(0, prev.flashlightBattery - delta.batteryDrain);
        const nextStamina = Math.max(0, Math.min(100, prev.sprintStamina + delta.staminaDelta));
        const nextDist = prev.distanceTraveled + delta.distance;

        // Hunt points for rapid distance traveled
        const huntDelta = delta.distance > 0.1 ? 0.05 : 0;
        // Abundance points for maintaining high life support
        const abundanceDelta = prev.oxygen > 80 ? 0.02 : 0;

        const updatedScores = {
          ...prev.pathScores,
          Hunt: prev.pathScores.Hunt + huntDelta,
          Abundance: prev.pathScores.Abundance + abundanceDelta,
        };

        // Check death condition
        if (nextO2 <= 0) {
          setGameOverCause('oxygen');
          setScreen('game_over');
          soundEngine.playOxygenWarning();
        }

        return {
          ...prev,
          oxygen: nextO2,
          flashlightBattery: nextBattery,
          sprintStamina: nextStamina,
          distanceTraveled: nextDist,
          pathScores: updatedScores,
        };
      });
    },
    []
  );

  // Proximity Callbacks
  const handleNearChamber = useCallback(
    (chamberId: string | null) => {
      if (!chamberId) {
        setNearChamber(null);
        return;
      }
      const ch = mazeData.chambers.find((c) => c.id === chamberId);
      setNearChamber(ch || null);

      // If player reaches an unsolved chamber and guidance beacon was active, extinguish beacon and reset search timer
      if (ch && !ch.solved && guidanceChamberName) {
        setGuidanceChamberName(null);
        sceneManagerRef.current?.setGuidanceChamber(null);
        timeSeekingChamberRef.current = 0;
      }
    },
    [mazeData, guidanceChamberName]
  );

  const handleNearChambersList = useCallback((ids: string[]) => {
    setNearChamberIds(ids);
  }, []);

  const handleNearDataLog = useCallback((text: string | null) => {
    setNearDataLogText(text);
    if (text) {
      setStats((prev) => ({
        ...prev,
        logsCollected: prev.logsCollected + 1,
        pathScores: {
          ...prev.pathScores,
          Remembrance: prev.pathScores.Remembrance + 0.05,
        },
      }));
    }
  }, []);

  const handleEnterHazard = useCallback((type: 'steam' | 'gravity_anomaly') => {
    setStats((prev) => {
      const damage = type === 'steam' ? 0.4 : 0.8;
      const nextStability = Math.max(0, prev.stability - damage);

      // Destruction & Nihility gain from courting hazards
      const updatedScores = {
        ...prev.pathScores,
        Destruction: prev.pathScores.Destruction + 0.1,
        Nihility: prev.pathScores.Nihility + 0.05,
      };

      if (nextStability <= 0) {
        setGameOverCause('stability');
        setScreen('game_over');
        soundEngine.playError();
      }

      return {
        ...prev,
        stability: nextStability,
        hazardEncounters: prev.hazardEncounters + 1,
        pathScores: updatedScores,
      };
    });
  }, []);

  const handleOxygenRecharge = useCallback(() => {
    setInOxygenVent(true);
    setStats((prev) => {
      const nextO2 = Math.min(100, prev.oxygen + 0.4);
      const nextStability = Math.min(100, prev.stability + 0.2);
      return {
        ...prev,
        oxygen: nextO2,
        stability: nextStability,
        pathScores: {
          ...prev.pathScores,
          Abundance: prev.pathScores.Abundance + 0.08,
          Equilibrium: prev.pathScores.Equilibrium + 0.04,
        },
      };
    });
  }, []);

  const handleToggleFlashlight = useCallback(() => {
    setFlashlightOn((prev) => {
      const next = !prev;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.flashlightOn = next;
        if (sceneManagerRef.current['flashlight']) {
          sceneManagerRef.current['flashlight'].visible = next;
        }
      }
      soundEngine.playFlashlightClick(next);
      return next;
    });
  }, []);

  const handleVirtualMove = useCallback((x: number, z: number, sprint: boolean) => {
    sceneManagerRef.current?.setVirtualMovement(x, z, sprint);
  }, []);

  const handleVirtualLook = useCallback((dx: number, dy: number) => {
    sceneManagerRef.current?.rotateCamera(dx, dy);
  }, []);

  const handlePlayerTransform = useCallback(
    (pos: { x: number; z: number }, yaw: number) => {
      setPlayerTransform({ x: pos.x, z: pos.z, yaw });

      const cx = Math.floor(pos.x / mazeData.cellSize);
      const cz = Math.floor(pos.z / mazeData.cellSize);

      setDiscoveredCells((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (let dz = -2; dz <= 2; dz++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = cx + dx;
            const nz = cz + dz;
            if (nx >= 0 && nx < mazeData.width && nz >= 0 && nz < mazeData.height) {
              if (Math.hypot(dx, dz) <= 2.5) {
                const key = `${nx},${nz}`;
                if (!next.has(key)) {
                  next.add(key);
                  changed = true;
                }
              }
            }
          }
        }
        return changed ? next : prev;
      });
    },
    [mazeData]
  );

  const handleToggleMapExpand = useCallback(() => {
    setIsMapExpanded((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setModalOpen(next);
      return next;
    });
  }, []);

  // Keep callbacks stable in a ref so MazeSceneManager is not disposed and recreated on state updates
  const callbacksRef = useRef({
    handleNearChamber,
    handleNearChambersList,
    handleNearDataLog,
    handleEnterHazard,
    handleOxygenRecharge,
    handleStatsUpdate,
    handlePlayerTransform,
  });

  useEffect(() => {
    callbacksRef.current = {
      handleNearChamber,
      handleNearChambersList,
      handleNearDataLog,
      handleEnterHazard,
      handleOxygenRecharge,
      handleStatsUpdate,
      handlePlayerTransform,
    };
  });

  // Initialize Scene Manager once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const manager = new MazeSceneManager(canvasMountRef.current, mazeData, {
      onNearChamber: (ch) => callbacksRef.current.handleNearChamber(ch),
      onNearChambersList: (ids) => callbacksRef.current.handleNearChambersList(ids),
      onNearDataLog: (txt) => callbacksRef.current.handleNearDataLog(txt),
      onEnterHazard: (type) => callbacksRef.current.handleEnterHazard(type),
      onOxygenRecharge: () => callbacksRef.current.handleOxygenRecharge(),
      onStatsUpdate: (d) => callbacksRef.current.handleStatsUpdate(d),
      onPlayerTransform: (pos, yaw) => callbacksRef.current.handlePlayerTransform(pos, yaw),
    });

    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mission timer tick
  useEffect(() => {
    if (screen !== 'playing') return;

    const timer = setInterval(() => {
      timeSeekingChamberRef.current += 1;

      // If the player is taking too long to find the next chamber (35s), show a column of light from a random unsolved chamber
      if (timeSeekingChamberRef.current >= 35 && !guidanceChamberName) {
        const unsolved = mazeData.chambers.filter((c) => !c.solved);
        if (unsolved.length > 0) {
          const target = unsolved[Math.floor(Math.random() * unsolved.length)];
          setGuidanceChamberName(target.name);
          sceneManagerRef.current?.setGuidanceChamber(target.id);
        }
      }

      setStats((prev) => {
        const nextTime = prev.timeElapsed + 1;
        // Equilibrium bonus if oxygen and stability are close to each other
        const balance = Math.abs(prev.oxygen - prev.stability) < 15 ? 0.2 : 0;
        return {
          ...prev,
          timeElapsed: nextTime,
          pathScores: {
            ...prev.pathScores,
            Equilibrium: prev.pathScores.Equilibrium + balance,
          },
        };
      });
      // Reset oxygen vent visual after tick
      setInOxygenVent(false);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, guidanceChamberName, mazeData.chambers]);

  // Synchronize screen state with sceneManager camera mode
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isTitleScreen = screen === 'title';
    }
  }, [screen]);

  // Synchronize modal state so mouse pointer is immediately released and visible
  const isAnyModalOpen = inspectingChamber !== null || showCodex || isMapExpanded || screen !== 'playing';
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setModalOpen(isAnyModalOpen);
    }
  }, [isAnyModalOpen]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in calculator
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (screen === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleStartGame();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (e.code === 'KeyE' || key === 'e') {
        if (nearChamber && !inspectingChamber) {
          e.preventDefault();
          soundEngine.playInteract();
          sceneManagerRef.current?.setModalOpen(true);
          setInspectingChamber(nearChamber);
        }
      } else if (e.code === 'Escape') {
        if (inspectingChamber) {
          setInspectingChamber(null);
        } else if (showCodex) {
          setShowCodex(false);
        } else if (isMapExpanded) {
          setIsMapExpanded(false);
          sceneManagerRef.current?.setModalOpen(false);
        }
      } else if (e.code === 'KeyM' || key === 'm') {
        e.preventDefault();
        handleToggleMapExpand();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        setShowCodex((prev) => {
          const next = !prev;
          sceneManagerRef.current?.setModalOpen(next);
          return next;
        });
      } else if (e.code === 'KeyF' || key === 'f') {
        e.preventDefault();
        setFlashlightOn((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, nearChamber, inspectingChamber, showCodex, isMapExpanded, handleToggleMapExpand]);

  const handleStartGame = () => {
    soundEngine.startAmbient(dominantPath);
    soundEngine.playInteract();
    setScreen('playing');
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // When player solves problem and chooses narrative reaction
  const handleSolveAndResolve = (choiceId: string, path: PathType, points: number) => {
    if (!inspectingChamber) return;

    const chamberId = inspectingChamber.id;

    // Clear guidance beam and reset seeking timer when a chamber is solved
    setGuidanceChamberName(null);
    sceneManagerRef.current?.setGuidanceChamber(null);
    timeSeekingChamberRef.current = 0;

    // Update chamber status
    const updatedChambers = mazeData.chambers.map((c) => {
      if (c.id === chamberId) {
        return { ...c, solved: true };
      }
      return c;
    });

    setMazeData((prev) => ({
      ...prev,
      chambers: updatedChambers,
    }));

    if (sceneManagerRef.current) {
      sceneManagerRef.current.setChamberSolved(chamberId);
    }

    // Award path affinity & restore survival resources
    setStats((prev) => {
      const nextSolved = prev.puzzlesSolved + 1;

      // Behavioral path scoring: heavily weighted by player's actual actions and physics problem-solving
      const eruditionGain = prev.mistakesCount === 0 ? 8 : 2;
      const huntGain = (prev.timeElapsed / (nextSolved || 1)) < 45 ? 6 : 1;
      const abundanceGain = prev.oxygen > 75 ? 6 : 1;
      const equilibriumGain = Math.abs(prev.oxygen - prev.stability) < 15 ? 6 : 1;
      const destructionGain = prev.hazardEncounters > 0 ? 5 : 0;
      const remembranceGain = prev.logsCollected > 0 ? 6 : 0;
      const elationGain = prev.mistakesCount > 1 ? 6 : 0;
      const nihilityGain = (prev.timeElapsed / (nextSolved || 1)) > 60 ? 5 : 0;

      const nextScores: Record<PathType, number> = {
        ...prev.pathScores,
        Erudition: prev.pathScores.Erudition + eruditionGain,
        Hunt: prev.pathScores.Hunt + huntGain,
        Abundance: prev.pathScores.Abundance + abundanceGain,
        Equilibrium: prev.pathScores.Equilibrium + equilibriumGain,
        Destruction: prev.pathScores.Destruction + destructionGain,
        Remembrance: prev.pathScores.Remembrance + remembranceGain,
        Elation: prev.pathScores.Elation + elationGain,
        Nihility: prev.pathScores.Nihility + nihilityGain,
        // Narrative choice provides a subtle 1 pt affinity alignment
        [path]: (prev.pathScores[path] || 0) + points,
      };

      // Bonus oxygen and stability reward for solving
      const nextO2 = Math.min(100, prev.oxygen + 20);
      const nextStability = Math.min(100, prev.stability + 20);

      recalculateDominantPath(nextScores);

      // Check if all 10 puzzles are solved -> APOTHEOSIS!
      if (nextSolved >= mazeData.chambers.length) {
        setTimeout(() => {
          setScreen('apotheosis');
        }, 600);
      }

      return {
        ...prev,
        puzzlesSolved: nextSolved,
        oxygen: nextO2,
        stability: nextStability,
        pathScores: nextScores,
      };
    });

    // Set next chamber active
    const nextUnsolved = updatedChambers.find((c) => !c.solved);
    setActiveChamberId(nextUnsolved ? nextUnsolved.id : null);
    setInspectingChamber(null);
  };

  const handleRecordMistake = () => {
    setStats((prev) => ({
      ...prev,
      mistakesCount: prev.mistakesCount + 1,
      // Mistakes feed Elation (unorthodox trial) or Destruction
      pathScores: {
        ...prev.pathScores,
        Elation: prev.pathScores.Elation + 4,
        Destruction: prev.pathScores.Destruction + 2,
      },
    }));
  };

  const handleRestart = () => {
    const newMaze = generateMaze(17, 17, 6);
    setMazeData(newMaze);
    sceneManagerRef.current?.resetForNewGame(newMaze);
    sceneManagerRef.current?.setGuidanceChamber(null);
    setGuidanceChamberName(null);
    timeSeekingChamberRef.current = 0;
    setNearChamberIds([]);
    setActiveChamberId('prob-1');
    setNearChamber(null);
    setNearDataLogText(null);
    setInspectingChamber(null);
    setDominantPath('Erudition');

    const startX = newMaze.startPos.x * newMaze.cellSize + newMaze.cellSize / 2;
    const startZ = newMaze.startPos.z * newMaze.cellSize + newMaze.cellSize / 2;
    setPlayerTransform({ x: startX, z: startZ, yaw: 0 });
    const initialDiscovered = new Set<string>();
    const sx = newMaze.startPos.x;
    const sz = newMaze.startPos.z;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = sx + dx;
        const nz = sz + dz;
        if (nx >= 0 && nx < newMaze.width && nz >= 0 && nz < newMaze.height) {
          initialDiscovered.add(`${nx},${nz}`);
        }
      }
    }
    setDiscoveredCells(initialDiscovered);
    setIsMapExpanded(false);

    setStats({
      oxygen: 100,
      stability: 100,
      flashlightBattery: 100,
      sprintStamina: 100,
      distanceTraveled: 0,
      puzzlesSolved: 0,
      totalPuzzles: 10,
      mistakesCount: 0,
      timeElapsed: 0,
      speedrunScore: 0,
      logsCollected: 0,
      chambersExplored: 1,
      hazardEncounters: 0,
      pathScores: {
        Erudition: 10,
        Destruction: 0,
        Abundance: 0,
        Hunt: 0,
        Remembrance: 0,
        Elation: 0,
        Nihility: 0,
        Equilibrium: 5,
      },
    });
    setScreen('title');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Viewport Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Title Screen Overlay */}
      {screen === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenCodex={() => {
            if (document.pointerLockElement) {
              try {
                document.exitPointerLock?.();
              } catch {
                // ignore
              }
            }
            setShowCodex(true);
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {screen === 'playing' && (
        <HUD
          stats={stats}
          dominantPath={dominantPath}
          chambers={mazeData.chambers}
          activeChamberId={activeChamberId}
          nearChamber={nearChamber}
          nearChamberIds={nearChamberIds}
          nearDataLogText={nearDataLogText}
          inOxygenVent={inOxygenVent}
          flashlightOn={flashlightOn}
          guidanceChamberName={guidanceChamberName}
          isMuted={isMuted}
          mazeData={mazeData}
          playerPos={{ x: playerTransform.x, z: playerTransform.z }}
          playerYaw={playerTransform.yaw}
          discoveredCells={discoveredCells}
          isMapExpanded={isMapExpanded}
          onToggleMapExpand={handleToggleMapExpand}
          onToggleMute={handleToggleMute}
          onOpenApparatus={() => {
            if (document.pointerLockElement) {
              try {
                document.exitPointerLock?.();
              } catch {
                // ignore
              }
            }
            // Disallow interaction with already solved chambers
            if (nearChamber && !nearChamber.solved) {
              setInspectingChamber(nearChamber);
            }
          }}
          onOpenCodex={() => {
            if (document.pointerLockElement) {
              try {
                document.exitPointerLock?.();
              } catch {
                // ignore
              }
            }
            setShowCodex(true);
          }}
          onToggleFlashlight={handleToggleFlashlight}
          onVirtualMove={handleVirtualMove}
          onVirtualLook={handleVirtualLook}
        />
      )}

      {/* Physics Chamber Apparatus Altar Modal */}
      {inspectingChamber && (
        <ApparatusModal
          problem={inspectingChamber.problem}
          dominantPath={dominantPath}
          onSolveAndResolve={handleSolveAndResolve}
          onClose={() => setInspectingChamber(null)}
          onRecordMistake={handleRecordMistake}
        />
      )}

      {/* Archive & Physics Codex Modal */}
      {showCodex && <CodexModal onClose={() => setShowCodex(false)} />}

      {/* Game Over Modal */}
      {screen === 'game_over' && (
        <GameOverScreen
          stats={stats}
          dominantPath={dominantPath}
          cause={gameOverCause}
          onRestart={handleRestart}
        />
      )}

      {/* Apotheosis Final Ascension Screen */}
      {screen === 'apotheosis' && (
        <ApotheosisScreen
          stats={stats}
          dominantPath={dominantPath}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
