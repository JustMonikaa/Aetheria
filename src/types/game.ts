export type PathType =
  | 'Erudition'
  | 'Destruction'
  | 'Abundance'
  | 'Hunt'
  | 'Remembrance'
  | 'Elation'
  | 'Nihility'
  | 'Equilibrium';

export interface PathInfo {
  id: PathType;
  name: string;
  title: string;
  color: string;
  accent: string;
  glow: string;
  bgDark: string;
  description: string;
  motto: string;
  epilogue: string;
  iconSvg: string;
}

export type TopicId =
  | 'newton_gravitation'
  | 'gravity_acceleration'
  | 'orbital_gpe'
  | 'near_earth_gpe'
  | 'density'
  | 'barometer'
  | 'manometer'
  | 'sphygmomanometer'
  | 'pascal_principle'
  | 'archimedes_buoyancy'
  | 'archimedes_displacement';

export interface PhysicsProblem {
  id: string;
  topicId: TopicId;
  topicNumber: string;
  topicTitle: string;
  chamberName: string;
  narrativeContext: string;
  problemStatement: string;
  formula: string;
  variables: Record<string, string | number>;
  correctValue: number;
  tolerance: number; // e.g. 0.05 for 5%
  unit: string;
  options: {
    id: string;
    label: string;
    value: number;
    explanation: string;
    isCorrect: boolean;
  }[];
  narrativeChoices: {
    id: string;
    text: string;
    pathAffinity: PathType;
    affinityPoints: number;
    consequence: string;
  }[];
  apparatusType:
    | 'orrery_gravity'
    | 'planetary_orbit'
    | 'gravity_potential'
    | 'drop_tower'
    | 'density_beaker'
    | 'barometer_tube'
    | 'manometer_tube'
    | 'sphygmomanometer_arm'
    | 'pascal_press'
    | 'buoyancy_tank'
    | 'displacement_beaker';
  apparatusParams: Record<string, number | string | boolean>;
}

export interface PlayerStats {
  oxygen: number; // 0 - 100
  stability: number; // 0 - 100 (sanity/suit pressure)
  flashlightBattery: number; // 0 - 100
  sprintStamina: number; // 0 - 100
  distanceTraveled: number;
  puzzlesSolved: number;
  totalPuzzles: number;
  mistakesCount: number;
  timeElapsed: number; // in seconds
  speedrunScore: number;
  logsCollected: number;
  chambersExplored: number;
  hazardEncounters: number;
  pathScores: Record<PathType, number>;
}

export interface ChamberNode {
  id: string;
  topicId: TopicId;
  name: string;
  x: number;
  z: number;
  solved: boolean;
  active: boolean;
  problem: PhysicsProblem;
}

export interface MazeCell {
  x: number;
  z: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
  isChamber?: boolean;
  chamberId?: string;
  isStart?: boolean;
  isEnd?: boolean;
  hasOxygenVent?: boolean;
  hasHazard?: boolean;
  hasDataLog?: boolean;
  dataLogText?: string;
}

export type GameScreen =
  | 'title'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'apotheosis';
