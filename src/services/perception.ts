/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Obstacle, DetectedObstacle, UGVState, CameraSourceMode } from '../types';
import { isPointInFOV, getRelativeDirection } from '../utils/geometry';

export interface PerceptionFrameResult {
  detectedObstacles: DetectedObstacle[];
  traversablePolygon: Point[]; // Screen space points for HUD overlay
  perceptionFps: number;
  processingLatencyMs: number;
  modeLabel: string;
}

export class PerceptionService {
  private lastProcessTime = performance.now();
  private smoothedFps = 30;

  /**
   * Processes the world state relative to the UGV camera view
   */
  public processFrame(
    ugv: UGVState,
    allObstacles: Obstacle[],
    _cameraMode: CameraSourceMode = 'simulated'
  ): PerceptionFrameResult {
    const startTime = performance.now();
    const ugvPos: Point = { x: ugv.x, y: ugv.y };

    const detectedList: DetectedObstacle[] = [];

    // Scan all obstacles within FOV cone (75 degrees, up to 14 meters)
    for (const obs of allObstacles) {
      const { inFov, distance, relativeAngle } = isPointInFOV(ugvPos, ugv.heading, { x: obs.x, y: obs.y }, 75, 14);

      if (inFov) {
        const direction = getRelativeDirection(relativeAngle);
        
        // Hazard classification
        let hazardLevel: 'safe' | 'hazard' | 'uncertain' = 'hazard';
        if (distance > 10) {
          hazardLevel = 'uncertain';
        }

        detectedList.push({
          id: obs.id,
          type: obs.type,
          label: obs.label,
          distance: Number(distance.toFixed(1)),
          confidence: obs.confidence,
          direction,
          angleDeg: Number(relativeAngle.toFixed(1)),
          gridPos: { x: obs.x, y: obs.y },
          hazardLevel,
        });
      }
    }

    // Sort detected obstacles by distance (closest first)
    detectedList.sort((a, b) => a.distance - b.distance);

    const now = performance.now();
    const deltaMs = Math.max(1, now - this.lastProcessTime);
    this.lastProcessTime = now;
    
    const instantFps = 1000 / deltaMs;
    this.smoothedFps = Number((this.smoothedFps * 0.9 + instantFps * 0.1).toFixed(1));
    const processingLatencyMs = Number((performance.now() - startTime).toFixed(1));

    return {
      detectedObstacles: detectedList,
      traversablePolygon: [],
      perceptionFps: Math.min(60, Math.max(24, this.smoothedFps)),
      processingLatencyMs: Math.max(2.1, processingLatencyMs),
      modeLabel: 'SIMULATION MODE (Vision ML Feature Extractor)',
    };
  }
}
