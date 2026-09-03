/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point } from '../types';

export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function euclideanDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const rad = Math.atan2(dy, dx);
  return normalizeAngle(radToDeg(rad));
}

export function angleDifference(targetAngle: number, currentAngle: number): number {
  let diff = (targetAngle - currentAngle + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Check if a point is within the camera's FOV cone
 * @param observerPos Position of UGV
 * @param observerHeading Heading angle in degrees
 * @param targetPos Target position
 * @param fovDegrees Total field of view (e.g. 70 deg)
 * @param maxRange Max detection range in meters/units
 */
export function isPointInFOV(
  observerPos: Point,
  observerHeading: number,
  targetPos: Point,
  fovDegrees = 75,
  maxRange = 14
): { inFov: boolean; distance: number; relativeAngle: number } {
  const dist = euclideanDistance(observerPos, targetPos);
  if (dist > maxRange) {
    return { inFov: false, distance: dist, relativeAngle: 0 };
  }

  const angleToTarget = angleBetween(observerPos, targetPos);
  const relAngle = angleDifference(angleToTarget, observerHeading);

  const halfFov = fovDegrees / 2;
  const inFov = Math.abs(relAngle) <= halfFov;

  return { inFov, distance: dist, relativeAngle: relAngle };
}

/**
 * Get human-readable relative direction based on relative angle
 */
export function getRelativeDirection(
  relativeAngleDeg: number
): 'Front' | 'Front-Left' | 'Front-Right' | 'Left' | 'Right' {
  if (Math.abs(relativeAngleDeg) <= 15) {
    return 'Front';
  } else if (relativeAngleDeg < -15 && relativeAngleDeg >= -45) {
    return 'Front-Left';
  } else if (relativeAngleDeg > 15 && relativeAngleDeg <= 45) {
    return 'Front-Right';
  } else if (relativeAngleDeg < -45) {
    return 'Left';
  } else {
    return 'Right';
  }
}
