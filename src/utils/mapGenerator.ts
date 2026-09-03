/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Obstacle, ObstacleType } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, isPositionBlocked } from './grid';
import { euclideanDistance } from './geometry';

const OBSTACLE_TYPES: { type: ObstacleType; label: string; minRadius: number; maxRadius: number; baseConfidence: number }[] = [
  { type: 'rock', label: 'Boulder / Rock', minRadius: 0.8, maxRadius: 1.6, baseConfidence: 94 },
  { type: 'tree', label: 'Pine / Oak Tree', minRadius: 1.0, maxRadius: 1.8, baseConfidence: 96 },
  { type: 'ditch', label: 'Terrain Ditch / Hazard', minRadius: 1.2, maxRadius: 2.2, baseConfidence: 89 },
  { type: 'vehicle', label: 'Abandoned Vehicle', minRadius: 1.8, maxRadius: 2.5, baseConfidence: 98 },
  { type: 'person', label: 'Pedestrian / Surveyor', minRadius: 0.6, maxRadius: 1.0, baseConfidence: 92 },
];

export interface MapEnvironment {
  startPos: Point;
  goalPos: Point;
  obstacles: Obstacle[];
  name: string;
}

export function generateOutdoorEnvironment(
  preset: 'rocky_pass' | 'dense_forest' | 'open_trail' | 'sih_demo' = 'sih_demo',
  obstacleCount = 18
): MapEnvironment {
  const startPos: Point = { x: 4, y: 35 };
  const goalPos: Point = { x: 35, y: 5 };
  const obstacles: Obstacle[] = [];

  // Helper to safely place obstacle avoiding start and goal
  const tryAddObstacle = (
    x: number,
    y: number,
    typeObj: typeof OBSTACLE_TYPES[number],
    radius?: number,
    isDynamic = false
  ) => {
    const rad = radius || (typeObj.minRadius + Math.random() * (typeObj.maxRadius - typeObj.minRadius));
    
    // Check clearance to start and goal
    if (euclideanDistance({ x, y }, startPos) < rad + 3.0) return false;
    if (euclideanDistance({ x, y }, goalPos) < rad + 3.0) return false;

    // Check overlap with existing obstacles
    for (const existing of obstacles) {
      if (euclideanDistance({ x, y }, { x: existing.x, y: existing.y }) < rad + existing.radius + 1.2) {
        return false;
      }
    }

    const obs: Obstacle = {
      id: `obs_${obstacles.length + 1}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      radius: Number(rad.toFixed(1)),
      type: typeObj.type,
      label: typeObj.label,
      confidence: Math.floor(typeObj.baseConfidence + (Math.random() * 6 - 3)),
      isDynamic,
    };
    obstacles.push(obs);
    return true;
  };

  if (preset === 'sih_demo') {
    // Curated layout with clear corridors and an ideal location for dynamic obstacle demonstration
    const seedPositions = [
      { x: 12, y: 30, typeIndex: 0 }, // Rock
      { x: 8, y: 22, typeIndex: 1 },  // Tree
      { x: 16, y: 24, typeIndex: 0 }, // Rock
      { x: 22, y: 28, typeIndex: 2 }, // Ditch
      { x: 28, y: 24, typeIndex: 1 }, // Tree
      { x: 14, y: 14, typeIndex: 1 }, // Tree
      { x: 20, y: 16, typeIndex: 3 }, // Vehicle
      { x: 28, y: 12, typeIndex: 0 }, // Rock
      { x: 10, y: 10, typeIndex: 2 }, // Ditch
      { x: 30, y: 18, typeIndex: 4 }, // Person
      { x: 6, y: 14, typeIndex: 1 },  // Tree
      { x: 32, y: 30, typeIndex: 0 }, // Rock
      { x: 24, y: 6, typeIndex: 1 },  // Tree
      { x: 18, y: 36, typeIndex: 0 }, // Rock
    ];

    for (const item of seedPositions) {
      tryAddObstacle(item.x, item.y, OBSTACLE_TYPES[item.typeIndex]);
    }
  } else {
    // Procedural generation based on count
    let attempts = 0;
    while (obstacles.length < obstacleCount && attempts < 200) {
      attempts++;
      const x = 3 + Math.random() * (GRID_WIDTH - 6);
      const y = 3 + Math.random() * (GRID_HEIGHT - 6);
      const typeIndex = Math.floor(Math.random() * OBSTACLE_TYPES.length);
      tryAddObstacle(x, y, OBSTACLE_TYPES[typeIndex]);
    }
  }

  return {
    startPos,
    goalPos,
    obstacles,
    name: preset === 'sih_demo' ? 'SIH Demo Course (GPS-Denied Outdoor Terrain)' : 'Procedural Outdoor Map',
  };
}

/**
 * Spawns a dynamic obstacle in front of the UGV along its forward heading or active path
 */
export function spawnDynamicObstacleInFront(
  ugvPos: Point,
  headingDeg: number,
  distanceAhead = 4.5
): Obstacle {
  const rad = (headingDeg * Math.PI) / 180;
  const targetX = Math.max(2, Math.min(GRID_WIDTH - 2, ugvPos.x + Math.cos(rad) * distanceAhead));
  const targetY = Math.max(2, Math.min(GRID_HEIGHT - 2, ugvPos.y + Math.sin(rad) * distanceAhead));

  const dynamicTypes = [
    { type: 'rock' as ObstacleType, label: 'Fallen Rock / Boulder', baseConfidence: 94 },
    { type: 'person' as ObstacleType, label: 'Crossing Person / Wildlife', baseConfidence: 91 },
    { type: 'ditch' as ObstacleType, label: 'Sudden Erosion Ditch', baseConfidence: 88 },
  ];
  const chosen = dynamicTypes[Math.floor(Math.random() * dynamicTypes.length)];

  return {
    id: `dyn_obs_${Date.now()}`,
    x: Number(targetX.toFixed(1)),
    y: Number(targetY.toFixed(1)),
    radius: 1.4,
    type: chosen.type,
    label: `[DYNAMIC] ${chosen.label}`,
    confidence: chosen.baseConfidence,
    isDynamic: true,
  };
}
