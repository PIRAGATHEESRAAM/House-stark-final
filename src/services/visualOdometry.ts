/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualFeaturePoint, VisualOdometryData, UGVState } from '../types';
import { degToRad, normalizeAngle } from '../utils/geometry';

export class VisualOdometrySimulator {
  private features: VisualFeaturePoint[] = [];
  private nextFeatureId = 1;
  private maxFeatures = 45;
  private voX = 0;
  private voY = 0;
  private voHeading = 0;
  private distanceTravelled = 0;
  private accumulatedDrift = 0;
  private lastUpdateTime = performance.now();

  constructor(initialX = 4, initialY = 35, initialHeading = 0) {
    this.reset(initialX, initialY, initialHeading);
  }

  public reset(x = 4, y = 35, heading = 0) {
    this.voX = x;
    this.voY = y;
    this.voHeading = heading;
    this.distanceTravelled = 0;
    this.accumulatedDrift = 0;
    this.features = [];
    this.lastUpdateTime = performance.now();
    this.initFeatures();
  }

  private initFeatures() {
    this.features = [];
    for (let i = 0; i < this.maxFeatures; i++) {
      this.features.push(this.createRandomFeature());
    }
  }

  private createRandomFeature(): VisualFeaturePoint {
    const x = 0.08 + Math.random() * 0.84;
    const y = 0.35 + Math.random() * 0.55; // Lower 60% of frame (ground / terrain texture)
    return {
      id: this.nextFeatureId++,
      x,
      y,
      prevX: x,
      prevY: y,
      age: 0,
      confidence: 0.8 + Math.random() * 0.2,
    };
  }

  /**
   * Updates visual odometry given actual physical change in UGV pose
   * Adds realistic optical flow displacement to feature points and small sensor noise/drift
   */
  public update(
    actualState: UGVState,
    deltaDist: number,
    deltaHeading: number,
    dt: number
  ): VisualOdometryData {
    const now = performance.now();
    const actualFps = Math.round(1000 / Math.max(1, dt * 1000));

    // Update tracked visual features
    // When moving forward, ground features expand outward and downward (optical flow divergence)
    // When turning, features shift horizontally across the screen
    const speedFactor = actualState.speed * 0.08;
    const turnFactor = (deltaHeading / 45) * 0.35;

    for (let i = this.features.length - 1; i >= 0; i--) {
      const feat = this.features[i];
      feat.prevX = feat.x;
      feat.prevY = feat.y;
      feat.age++;

      // Optical flow motion
      const centerX = 0.5;
      const dxFromCenter = feat.x - centerX;
      
      // Expansion due to forward motion
      const flowY = speedFactor * (feat.y - 0.25);
      const flowX = dxFromCenter * speedFactor * 1.5 - turnFactor;

      feat.x += flowX;
      feat.y += flowY;

      // Check if feature went out of frame or got too old
      if (feat.x < 0.04 || feat.x > 0.96 || feat.y < 0.25 || feat.y > 0.95 || feat.age > 90) {
        this.features.splice(i, 1);
      }
    }

    // Replenish lost features (simulate FAST corner detection)
    while (this.features.length < this.maxFeatures) {
      this.features.push(this.createRandomFeature());
    }

    // Add slight realistic drift to VO estimation (typical in visual-only dead reckoning)
    const driftRate = 0.015; // 1.5% drift per meter
    const noiseX = (Math.random() - 0.5) * 0.004 * deltaDist;
    const noiseY = (Math.random() - 0.5) * 0.004 * deltaDist;
    const noiseHeading = (Math.random() - 0.5) * 0.1 * deltaDist;

    const rad = degToRad(this.voHeading);
    this.voX += Math.cos(rad) * deltaDist + noiseX;
    this.voY += Math.sin(rad) * deltaDist + noiseY;
    this.voHeading = normalizeAngle(this.voHeading + deltaHeading + noiseHeading);
    this.distanceTravelled += deltaDist;
    this.accumulatedDrift += deltaDist * driftRate;

    this.lastUpdateTime = now;

    const confidence = Math.max(70, Math.min(99, Math.round(98 - this.accumulatedDrift * 3 + (this.features.length / this.maxFeatures) * 2)));

    return {
      voX: Number(this.voX.toFixed(2)),
      voY: Number(this.voY.toFixed(2)),
      voHeading: Number(this.voHeading.toFixed(1)),
      distanceTravelled: Number(this.distanceTravelled.toFixed(2)),
      trackedFeaturesCount: this.features.length,
      opticalFlowMagnitude: Number((speedFactor * 100).toFixed(1)),
      driftErrorEstimate: Number(this.accumulatedDrift.toFixed(2)),
      fps: Math.min(60, Math.max(25, actualFps)),
      status: this.features.length > 20 ? 'TRACKING' : 'SEARCHING_FEATURES',
      confidence,
    };
  }

  public getFeatures(): VisualFeaturePoint[] {
    return this.features;
  }
}
