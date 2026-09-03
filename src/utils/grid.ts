/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Obstacle } from '../types';
import { euclideanDistance } from './geometry';

export const GRID_WIDTH = 40; // 40x40 grid cells (1 cell ≈ 1 meter)
export const GRID_HEIGHT = 40;
export const CELL_SIZE_METERS = 1.0; // 1 unit = 1 meter
export const UGV_SAFETY_RADIUS = 1.4; // Safety clearance around obstacles

export function isInsideGrid(x: number, y: number): boolean {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

/**
 * Checks if a specific continuous or integer position collides with any obstacle including safety padding
 */
export function isPositionBlocked(
  point: Point,
  obstacles: Obstacle[],
  extraClearance = 0
): boolean {
  if (!isInsideGrid(point.x, point.y)) return true;

  for (const obs of obstacles) {
    const dist = euclideanDistance(point, { x: obs.x, y: obs.y });
    const effectiveRadius = obs.radius + UGV_SAFETY_RADIUS + extraClearance;
    if (dist < effectiveRadius) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the straight line between p1 and p2 has direct line of sight without hitting obstacles
 */
export function hasLineOfSight(
  p1: Point,
  p2: Point,
  obstacles: Obstacle[],
  extraClearance = 0
): boolean {
  const dist = euclideanDistance(p1, p2);
  const steps = Math.ceil(dist * 3); // 3 samples per meter
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const samplePoint: Point = {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    };
    if (isPositionBlocked(samplePoint, obstacles, extraClearance)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns occupancy cost for a cell: 0 for completely clear, >0 for near obstacles, Infinity for blocked
 */
export function getCellCost(
  x: number,
  y: number,
  obstacles: Obstacle[]
): number {
  if (!isInsideGrid(x, y)) return Infinity;

  let minDistanceToObstacle = Infinity;
  for (const obs of obstacles) {
    const dist = euclideanDistance({ x, y }, { x: obs.x, y: obs.y });
    if (dist < obs.radius + 0.5) {
      return Infinity; // Solid collision
    }
    if (dist < minDistanceToObstacle) {
      minDistanceToObstacle = dist;
    }
  }

  // Cost gradient for proximity to obstacle (discourage grazing)
  if (minDistanceToObstacle < UGV_SAFETY_RADIUS + 1.0) {
    return 1.0 + (UGV_SAFETY_RADIUS + 1.0 - minDistanceToObstacle) * 3;
  }

  return 1.0; // Base traversable ground cost
}
