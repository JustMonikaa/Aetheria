import { ChamberNode, MazeCell, PhysicsProblem } from '../types/game';
import { generateAllProblems } from '../physics/questionsData';

export interface MazeData {
  width: number;
  height: number;
  cellSize: number;
  cells: MazeCell[][];
  chambers: ChamberNode[];
  startPos: { x: number; z: number };
  oxygenVents: { x: number; z: number }[];
  hazards: { x: number; z: number; type: 'steam' | 'gravity_anomaly' }[];
  dataLogs: { x: number; z: number; title: string; content: string }[];
}

export function generateMaze(width = 17, height = 17, cellSize = 6): MazeData {
  const problems = generateAllProblems();

  // Initialize cells
  const cells: MazeCell[][] = [];
  for (let z = 0; z < height; z++) {
    cells[z] = [];
    for (let x = 0; x < width; x++) {
      cells[z][x] = {
        x,
        z,
        walls: { north: true, south: true, east: true, west: true },
      };
    }
  }

  // Pre-designate Chamber positions (10 chambers for 10 problems)
  // We keep chambers spaced out across the 17x17 grid
  const chamberCoords = [
    { x: 3, z: 3 },
    { x: 8, z: 2 },
    { x: 13, z: 3 },
    { x: 14, z: 8 },
    { x: 13, z: 13 },
    { x: 8, z: 14 },
    { x: 3, z: 13 },
    { x: 2, z: 8 },
    { x: 6, z: 7 },
    { x: 10, z: 9 },
  ];

  const chambers: ChamberNode[] = [];
  for (let i = 0; i < problems.length; i++) {
    const coord = chamberCoords[i % chamberCoords.length];
    const prob = problems[i];
    cells[coord.z][coord.x].isChamber = true;
    cells[coord.z][coord.x].chamberId = prob.id;

    chambers.push({
      id: prob.id,
      topicId: prob.topicId,
      name: prob.chamberName,
      x: coord.x,
      z: coord.z,
      solved: false,
      active: i === 0, // start with first chamber active
      problem: prob,
    });
  }

  // Carve maze corridors using recursive backtracker with loop injection
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const stack: { x: number; z: number }[] = [];

  // Start carving from (1, 1)
  let current = { x: 1, z: 1 };
  visited[current.z][current.x] = true;

  const getUnvisitedNeighbors = (x: number, z: number) => {
    const neighbors: { x: number; z: number; dir: 'north' | 'south' | 'east' | 'west' }[] = [];
    if (z > 0 && !visited[z - 1][x]) neighbors.push({ x, z: z - 1, dir: 'north' });
    if (z < height - 1 && !visited[z + 1][x]) neighbors.push({ x, z: z + 1, dir: 'south' });
    if (x < width - 1 && !visited[z][x + 1]) neighbors.push({ x: x + 1, z, dir: 'east' });
    if (x > 0 && !visited[z][x - 1]) neighbors.push({ x: x - 1, z, dir: 'west' });
    return neighbors;
  };

  const removeWallBetween = (c1: { x: number; z: number }, c2: { x: number; z: number }, dir: string) => {
    if (dir === 'north') {
      cells[c1.z][c1.x].walls.north = false;
      cells[c2.z][c2.x].walls.south = false;
    } else if (dir === 'south') {
      cells[c1.z][c1.x].walls.south = false;
      cells[c2.z][c2.x].walls.north = false;
    } else if (dir === 'east') {
      cells[c1.z][c1.x].walls.east = false;
      cells[c2.z][c2.x].walls.west = false;
    } else if (dir === 'west') {
      cells[c1.z][c1.x].walls.west = false;
      cells[c2.z][c2.x].walls.east = false;
    }
  };

  let visitedCount = 1;
  const totalCells = width * height;

  while (visitedCount < totalCells) {
    const neighbors = getUnvisitedNeighbors(current.x, current.z);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWallBetween(current, next, next.dir);
      stack.push(current);
      current = { x: next.x, z: next.z };
      visited[current.z][current.x] = true;
      visitedCount++;
    } else if (stack.length > 0) {
      current = stack.pop()!;
    } else {
      // Find an unvisited cell adjacent to a visited cell
      let found = false;
      for (let z = 0; z < height && !found; z++) {
        for (let x = 0; x < width && !found; x++) {
          if (!visited[z][x]) {
            current = { x, z };
            visited[z][x] = true;
            visitedCount++;
            found = true;
          }
        }
      }
    }
  }

  // Add 15% random loops to ensure corridors have multiple paths and navigation is pleasant
  for (let z = 1; z < height - 1; z++) {
    for (let x = 1; x < width - 1; x++) {
      if (Math.random() < 0.15) {
        if (cells[z][x].walls.north && !cells[z - 1][x].isChamber) {
          cells[z][x].walls.north = false;
          cells[z - 1][x].walls.south = false;
        }
      }
      if (Math.random() < 0.15) {
        if (cells[z][x].walls.east && !cells[z][x + 1].isChamber) {
          cells[z][x].walls.east = false;
          cells[z][x + 1].walls.west = false;
        }
      }
    }
  }

  // Ensure each chamber has at least 2 open entry doorways
  for (const chamber of chambers) {
    const cx = chamber.x;
    const cz = chamber.z;
    if (cz > 0) {
      cells[cz][cx].walls.north = false;
      cells[cz - 1][cx].walls.south = false;
    }
    if (cz < height - 1) {
      cells[cz][cx].walls.south = false;
      cells[cz + 1][cx].walls.north = false;
    }
    if (cx > 0) {
      cells[cz][cx].walls.west = false;
      cells[cz][cx - 1].walls.east = false;
    }
    if (cx < width - 1) {
      cells[cz][cx].walls.east = false;
      cells[cz][cx + 1].walls.west = false;
    }
  }

  // Place Oxygen Vents in 6 strategic junction cells
  const oxygenVents = [
    { x: 1, z: 4 },
    { x: 8, z: 8 },
    { x: 15, z: 4 },
    { x: 4, z: 15 },
    { x: 12, z: 15 },
    { x: 15, z: 11 },
  ];
  for (const vent of oxygenVents) {
    if (cells[vent.z] && cells[vent.z][vent.x] && !cells[vent.z][vent.x].isChamber) {
      cells[vent.z][vent.x].hasOxygenVent = true;
    }
  }

  // Place Hazards (Steam vents & gravity anomalies)
  const hazards: { x: number; z: number; type: 'steam' | 'gravity_anomaly' }[] = [
    { x: 5, z: 2, type: 'steam' },
    { x: 11, z: 5, type: 'gravity_anomaly' },
    { x: 14, z: 10, type: 'steam' },
    { x: 9, z: 12, type: 'gravity_anomaly' },
    { x: 2, z: 11, type: 'steam' },
    { x: 7, z: 4, type: 'gravity_anomaly' },
  ];
  for (const h of hazards) {
    if (cells[h.z] && cells[h.z][h.x] && !cells[h.z][h.x].isChamber) {
      cells[h.z][h.x].hasHazard = true;
    }
  }

  // Place Data Logs
  const dataLogs = [
    {
      x: 2,
      z: 2,
      title: 'Architect Journal: Entry 01 - The Geometric Labyrinth',
      content:
        'We built this sanctuary not as a prison, but as a proving ground. Every corridor is calibrated to the universal constants. Those who master the equations of mass and fluid may walk alongside the Aeons.',
    },
    {
      x: 14,
      z: 2,
      title: 'Maintenance Note: Hydrostatic Leakage',
      content:
        'Pressure seals in Sector 06 are weeping mercury. Keep your atmospheric gauge calibrated. If you feel a sudden ear popping, inspect the Torricellian column immediately.',
    },
    {
      x: 14,
      z: 14,
      title: 'Astronomical Dispatch: The Singularity Tether',
      content:
        'Gravitational potential wells are not cages—they are cosmic trampolines. Compute your energy well before firing transfer burns, or you will drift forever beyond the outer rim.',
    },
    {
      x: 2,
      z: 14,
      title: 'Medical Officer Warning: Arterial Vitals',
      content:
        'Suspended animation requires continuous arterial pressure telemetry. 120 mmHg is more than a clinical standard; in SI units, it is the exact barrier between life and cryogenic collapse.',
    },
    {
      x: 8,
      z: 6,
      title: 'Philosophical Fragment: The Eightfold Alignments',
      content:
        'Knowledge without action is dust; power without calculation is ruin. When you stand before the altars, consider not only the answer, but the intent of your choice.',
    },
  ];
  for (const log of dataLogs) {
    if (cells[log.z] && cells[log.z][log.x] && !cells[log.z][log.x].isChamber) {
      cells[log.z][log.x].hasDataLog = true;
      cells[log.z][log.x].dataLogText = log.content;
    }
  }

  return {
    width,
    height,
    cellSize,
    cells,
    chambers,
    startPos: { x: 1, z: 1 },
    oxygenVents,
    hazards,
    dataLogs,
  };
}
