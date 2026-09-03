/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Obstacle, SLAMLandmark, UGVState } from '../types';
import { isPointInFOV } from '../utils/geometry';
import { GRID_WIDTH, GRID_HEIGHT } from '../utils/grid';

export class SLAMSimulator {
  private landmarks: Map<string, SLAMLandmark> = new Map();
  private trajectory: Point[] = [];
  private exploredCells: Uint8Array = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

  constructor() {
    this.reset();
  }

  public reset(startPos?: Point) {
    this.landmarks.clear();
    this.trajectory = [];
    this.exploredCells.fill(0);
    if (startPos) {
      // Initialize small explored bubble around robot start position
      for (let y = Math.max(0, startPos.y - 4); y <= Math.min(GRID_HEIGHT - 1, startPos.y + 4); y++) {
        for (let x = Math.max(0, startPos.x - 4); x <= Math.min(GRID_WIDTH - 1, startPos.x + 4); x++) {
          if (Math.hypot(x - startPos.x, y - startPos.y) <= 4.5) {
            this.exploredCells[y * GRID_WIDTH + x] = 1;
          }
        }
      }
    }
  }

  /**
   * Updates SLAM state based on current UGV pose and all physical obstacles in world
   */
  public update(ugv: UGVState, obstacles: Obstacle[]) {
    const currentPos: Point = { x: ugv.x, y: ugv.y };

    // Record trajectory
    if (this.trajectory.length === 0) {
      this.trajectory.push({ ...currentPos });
    } else {
      const last = this.trajectory[this.trajectory.length - 1];
      const dist = Math.hypot(currentPos.x - last.x, currentPos.y - last.y);
      if (dist > 0.4) {
        this.trajectory.push({ ...currentPos });
      }
    }

    // Update explored occupancy grid along camera FOV cone
    this.updateExploredArea(currentPos, ugv.heading);

    // Detect obstacles within FOV and update SLAM landmark database
    for (const obs of obstacles) {
      const { inFov, distance } = isPointInFOV(currentPos, ugv.heading, { x: obs.x, y: obs.y }, 75, 14);

      if (inFov) {
        if (!this.landmarks.has(obs.id)) {
          // New landmark registered
          this.landmarks.set(obs.id, {
            id: obs.id,
            x: obs.x,
            y: obs.y,
            type: obs.type,
            observedCount: 1,
            uncertaintyRadius: Math.max(0.2, distance * 0.08),
            lastSeenTimestamp: Date.now(),
          });
        } else {
          // Landmark re-observed (SLAM measurement update reduces uncertainty)
          const lm = this.landmarks.get(obs.id)!;
          lm.observedCount++;
          // Simulated Kalman Filter covariance reduction
          lm.uncertaintyRadius = Math.max(0.12, lm.uncertaintyRadius * 0.95);
          lm.lastSeenTimestamp = Date.now();
        }
      }
    }
  }

  private updateExploredArea(pos: Point, headingDeg: number) {
    const headingRad = (headingDeg * Math.PI) / 180;
    const fovHalfRad = (75 / 2) * (Math.PI / 180);
    const maxRange = 13;

    const startX = Math.max(0, Math.floor(pos.x - maxRange));
    const endX = Math.min(GRID_WIDTH - 1, Math.ceil(pos.x + maxRange));
    const startY = Math.max(0, Math.floor(pos.y - maxRange));
    const endY = Math.min(GRID_HEIGHT - 1, Math.ceil(pos.y + maxRange));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= maxRange) {
          const angle = Math.atan2(dy, dx);
          let diff = angle - headingRad;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;

          if (Math.abs(diff) <= fovHalfRad) {
            this.exploredCells[y * GRID_WIDTH + x] = 1;
          }
        }
      }
    }
  }

  public getLandmarks(): SLAMLandmark[] {
    return Array.from(this.landmarks.values());
  }

  public getTrajectory(): Point[] {
    return this.trajectory;
  }

  public isCellExplored(x: number, y: number): boolean {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
    return this.exploredCells[y * GRID_WIDTH + x] === 1;
  }

  public getExploredCells(): Uint8Array {
    return this.exploredCells;
  }
}
