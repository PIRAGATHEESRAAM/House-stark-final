/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Obstacle } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, getCellCost, hasLineOfSight, isInsideGrid } from '../utils/grid';
import { euclideanDistance } from '../utils/geometry';

export interface PathPlanningResult {
  path: Point[];
  smoothedPath: Point[];
  pathLength: number; // in meters
  estimatedTimeSec: number;
  waypointCount: number;
  computeTimeMs: number;
  success: boolean;
  exploredNodesCount: number;
}

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // g + h
  parent: Node | null;
}

const NEIGHBOR_OFFSETS = [
  { dx: 1, dy: 0, cost: 1.0 },
  { dx: -1, dy: 0, cost: 1.0 },
  { dx: 0, dy: 1, cost: 1.0 },
  { dx: 0, dy: -1, cost: 1.0 },
  { dx: 1, dy: 1, cost: Math.SQRT2 },
  { dx: 1, dy: -1, cost: Math.SQRT2 },
  { dx: -1, dy: 1, cost: Math.SQRT2 },
  { dx: -1, dy: -1, cost: Math.SQRT2 },
];

/**
 * Executes full 8-directional A* algorithm on obstacle map
 */
export function planAStarPath(
  start: Point,
  goal: Point,
  obstacles: Obstacle[],
  nominalSpeedMps = 1.2
): PathPlanningResult {
  const startTime = performance.now();

  const startX = Math.round(start.x);
  const startY = Math.round(start.y);
  const goalX = Math.round(goal.x);
  const goalY = Math.round(goal.y);

  if (!isInsideGrid(startX, startY) || !isInsideGrid(goalX, goalY)) {
    return {
      path: [],
      smoothedPath: [],
      pathLength: 0,
      estimatedTimeSec: 0,
      waypointCount: 0,
      computeTimeMs: performance.now() - startTime,
      success: false,
      exploredNodesCount: 0,
    };
  }

  const openSet: Node[] = [];
  const closedSet = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const gScores = new Float32Array(GRID_WIDTH * GRID_HEIGHT).fill(Infinity);

  const getIdx = (x: number, y: number) => y * GRID_WIDTH + x;

  const startNode: Node = {
    x: startX,
    y: startY,
    g: 0,
    h: euclideanDistance({ x: startX, y: startY }, { x: goalX, y: goalY }),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  openSet.push(startNode);
  gScores[getIdx(startX, startY)] = 0;

  let goalNode: Node | null = null;
  let exploredCount = 0;

  while (openSet.length > 0) {
    // Find node with lowest f-score
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openSet.splice(lowestIdx, 1)[0];
    const currentIdx = getIdx(current.x, current.y);
    closedSet[currentIdx] = 1;
    exploredCount++;

    // Goal check (exact match or within 1.0m)
    if (
      (current.x === goalX && current.y === goalY) ||
      euclideanDistance({ x: current.x, y: current.y }, { x: goalX, y: goalY }) <= 1.0
    ) {
      goalNode = current;
      break;
    }

    for (const offset of NEIGHBOR_OFFSETS) {
      const nx = current.x + offset.dx;
      const ny = current.y + offset.dy;

      if (!isInsideGrid(nx, ny)) continue;
      const nIdx = getIdx(nx, ny);
      if (closedSet[nIdx]) continue;

      const cellCost = getCellCost(nx, ny, obstacles);
      if (cellCost === Infinity) continue; // blocked

      // Corner cutting check for diagonal moves
      if (offset.dx !== 0 && offset.dy !== 0) {
        const cost1 = getCellCost(current.x + offset.dx, current.y, obstacles);
        const cost2 = getCellCost(current.x, current.y + offset.dy, obstacles);
        if (cost1 === Infinity || cost2 === Infinity) continue;
      }

      const tentativeG = current.g + offset.cost * cellCost;

      if (tentativeG < gScores[nIdx]) {
        gScores[nIdx] = tentativeG;
        const h = euclideanDistance({ x: nx, y: ny }, { x: goalX, y: goalY });
        const neighborNode: Node = {
          x: nx,
          y: ny,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };

        const existingOpenIdx = openSet.findIndex((n) => n.x === nx && n.y === ny);
        if (existingOpenIdx >= 0) {
          openSet[existingOpenIdx] = neighborNode;
        } else {
          openSet.push(neighborNode);
        }
      }
    }
  }

  const computeTimeMs = Number((performance.now() - startTime).toFixed(2));

  if (!goalNode) {
    return {
      path: [],
      smoothedPath: [],
      pathLength: 0,
      estimatedTimeSec: 0,
      waypointCount: 0,
      computeTimeMs,
      success: false,
      exploredNodesCount: exploredCount,
    };
  }

  // Reconstruct raw grid path
  const rawPath: Point[] = [];
  let curr: Node | null = goalNode;
  while (curr) {
    rawPath.push({ x: curr.x, y: curr.y });
    curr = curr.parent;
  }
  rawPath.reverse();

  // Ensure start & goal exact coordinates are at ends
  if (rawPath.length > 0) {
    rawPath[0] = { x: start.x, y: start.y };
    rawPath[rawPath.length - 1] = { x: goal.x, y: goal.y };
  }

  // Path smoothing (string pulling shortcut algorithm)
  const smoothed = smoothPath(rawPath, obstacles);

  // Compute total path length
  let length = 0;
  for (let i = 0; i < smoothed.length - 1; i++) {
    length += euclideanDistance(smoothed[i], smoothed[i + 1]);
  }

  return {
    path: rawPath,
    smoothedPath: smoothed,
    pathLength: Number(length.toFixed(1)),
    estimatedTimeSec: Number((length / nominalSpeedMps).toFixed(1)),
    waypointCount: smoothed.length,
    computeTimeMs,
    success: true,
    exploredNodesCount: exploredCount,
  };
}

/**
 * Smooths raw A* path using line-of-sight shortcutting
 */
export function smoothPath(path: Point[], obstacles: Obstacle[]): Point[] {
  if (path.length <= 2) return [...path];

  const smoothed: Point[] = [path[0]];
  let currentIndex = 0;

  while (currentIndex < path.length - 1) {
    let furthestVisible = currentIndex + 1;

    for (let checkIdx = path.length - 1; checkIdx > currentIndex; checkIdx--) {
      if (hasLineOfSight(path[currentIndex], path[checkIdx], obstacles, 0.2)) {
        furthestVisible = checkIdx;
        break;
      }
    }

    smoothed.push(path[furthestVisible]);
    currentIndex = furthestVisible;
  }

  return smoothed;
}

/**
 * Checks if the upcoming planned path has been intercepted by any obstacle
 */
export function isPathObstructed(
  path: Point[],
  fromIndex: number,
  obstacles: Obstacle[]
): { isObstructed: boolean; obstructedWaypointIndex: number; conflictingObstacle?: Obstacle } {
  if (!path || path.length === 0 || fromIndex >= path.length) {
    return { isObstructed: false, obstructedWaypointIndex: -1 };
  }

  for (let i = fromIndex; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    // Check line segment
    const segmentDist = euclideanDistance(p1, p2);
    const samples = Math.max(2, Math.ceil(segmentDist * 4));
    
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const pt: Point = {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      };

      for (const obs of obstacles) {
        const d = euclideanDistance(pt, { x: obs.x, y: obs.y });
        if (d < obs.radius + 1.1) {
          return { isObstructed: true, obstructedWaypointIndex: i, conflictingObstacle: obs };
        }
      }
    }
  }

  return { isObstructed: false, obstructedWaypointIndex: -1 };
}
