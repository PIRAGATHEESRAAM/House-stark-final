/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavigationState =
  | 'IDLE'
  | 'MAP_INIT'
  | 'GOAL_SET'
  | 'GOAL_LOCKED'
  | 'PLANNING'
  | 'NAVIGATING'
  | 'OBSTACLE_DETECTED'
  | 'REPLANNING'
  | 'SAFETY_HOLD'
  | 'GOAL_VERIFICATION'
  | 'GOAL_REACHED'
  | 'SAFE_STOP'
  | 'ERROR';

export type ObstacleType = 'rock' | 'tree' | 'ditch' | 'vehicle' | 'person' | 'debris';

export interface Point {
  x: number; // Local map coordinate in meters (0.0 to 40.0)
  y: number; // Local map coordinate in meters (0.0 to 40.0)
}

export interface Obstacle {
  id: string;
  x: number; // Local map coordinate in meters
  y: number;
  radius: number; // radius in meters
  type: ObstacleType;
  label: string;
  isDynamic?: boolean;
  confidence: number; // 0 to 100%
  velocity?: { vx: number; vy: number };
}

export interface DetectedObstacle {
  id: string;
  type: ObstacleType;
  label: string;
  distance: number; // in meters
  confidence: number; // in %
  direction: 'Front' | 'Front-Left' | 'Front-Right' | 'Left' | 'Right';
  angleDeg: number;
  gridPos: Point;
  hazardLevel: 'safe' | 'hazard' | 'uncertain';
}

export interface UGVState {
  x: number; // Local coordinate X in meters
  y: number; // Local coordinate Y in meters
  heading: number; // in degrees (0 = East, 90 = South, 180 = West, 270 = North)
  speed: number; // m/s
  targetSpeed: number;
  distanceTravelled: number; // meters
  batteryLevel: number; // %
  localizationConfidence: number; // 0 to 100%
}

export interface VisualOdometryData {
  voX: number; // Estimated X (meters)
  voY: number; // Estimated Y (meters)
  voHeading: number; // Estimated heading (degrees)
  distanceTravelled: number;
  trackedFeaturesCount: number;
  opticalFlowMagnitude: number;
  driftErrorEstimate: number; // in meters
  fps: number;
  status: 'TRACKING' | 'SEARCHING_FEATURES' | 'DEGRADED';
  confidence: number; // %
}

export interface SLAMLandmark {
  id: string;
  x: number; // meters
  y: number; // meters
  type: ObstacleType;
  observedCount: number;
  uncertaintyRadius: number; // meters
  lastSeenTimestamp: number;
}

export interface MotorCommand {
  leftMotor: {
    direction: 'FORWARD' | 'REVERSE' | 'STOP';
    speedPercent: number;
  };
  rightMotor: {
    direction: 'FORWARD' | 'REVERSE' | 'STOP';
    speedPercent: number;
  };
  command: 'FORWARD' | 'REVERSE' | 'LEFT' | 'RIGHT' | 'STOP';
}

export interface MissionSetupData {
  startPos: Point;
  goalPos: Point;
  directDistance: number; // meters
  estimatedPathLength: number; // meters
  isGoalLocked: boolean;
  goalTolerance: number; // meters (e.g. 0.5m)
  positionError: number; // meters
  goalVerificationConfidence: number; // %
  status: 'UNSET' | 'SELECTED' | 'LOCKED' | 'NAVIGATING' | 'REACHED';
}

export interface TelemetryData {
  ugvX: number;
  ugvY: number;
  heading: number;
  speed: number;
  distanceTravelled: number;
  distanceToGoal: number;
  positionError: number;
  obstacleCount: number;
  pathLength: number;
  waypointsCount: number;
  currentWaypointIndex: number;
  navigationState: NavigationState;
  fps: number;
  perceptionStatus: 'ACTIVE' | 'CALIBRATING' | 'PAUSED' | 'SAFETY_HOLD';
  plannerStatus: 'IDLE' | 'COMPUTING' | 'ACTIVE' | 'REPLANNING';
  gpsStatus: 'NOT USED';
  internetStatus: 'DISCONNECTED / OFFLINE';
  localizationType: 'VISUAL SLAM';
  coordinatesType: 'LOCAL MAP (METERS)';
  localizationConfidence: number;
  planningLatencyMs: number;
  perceptionFps: number;
  navigationSuccessRate: number;
  goalTolerance: number;
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'plan';
}

export type CameraSourceMode = 'simulated' | 'webcam' | 'video' | 'image';

export interface VisualFeaturePoint {
  id: number;
  x: number; // normalized 0..1 in camera frame
  y: number;
  prevX: number;
  prevY: number;
  age: number;
  confidence: number;
}
