/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Compass, MapPin, Flag, Target, Crosshair, RefreshCw, Plus, Layers, Eye } from 'lucide-react';
import { Point, Obstacle, UGVState, SLAMLandmark, NavigationState } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, UGV_SAFETY_RADIUS } from '../utils/grid';
import { degToRad } from '../utils/geometry';

interface MapPanelProps {
  ugv: UGVState;
  startPos: Point;
  goalPos: Point;
  plannedPath: Point[];
  trajectory: Point[];
  obstacles: Obstacle[];
  landmarks: SLAMLandmark[];
  navigationState: NavigationState;
  isGoalLocked: boolean;
  goalTolerance: number;
  localizationConfidence: number;
  exploredCells?: Uint8Array;
  onSetGoal: (pt: Point) => void;
  onAddObstacleAt: (pt: Point) => void;
  onUnlockGoal?: () => void;
  onLockGoal?: () => void;
  onLog: (msg: string, type?: 'info' | 'warning' | 'error' | 'success' | 'plan') => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  ugv,
  startPos,
  goalPos,
  plannedPath,
  trajectory,
  obstacles,
  landmarks,
  navigationState,
  isGoalLocked,
  goalTolerance,
  localizationConfidence,
  exploredCells,
  onSetGoal,
  onAddObstacleAt,
  onUnlockGoal,
  onLockGoal,
  onLog,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clickMode, setClickMode] = useState<'goal' | 'obstacle'>('goal');
  const [showFovCone, setShowFovCone] = useState(true);
  const [showSlamLandmarks, setShowSlamLandmarks] = useState(true);
  const [showSafetyRadius, setShowSafetyRadius] = useState(true);
  const [showExploredMask, setShowExploredMask] = useState(true);

  // Handle click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = GRID_WIDTH / rect.width;
    const scaleY = GRID_HEIGHT / rect.height;

    const gridX = Math.max(1, Math.min(GRID_WIDTH - 1, Number((clientX * scaleX).toFixed(1))));
    const gridY = Math.max(1, Math.min(GRID_HEIGHT - 1, Number((clientY * scaleY).toFixed(1))));

    if (clickMode === 'goal') {
      if (isGoalLocked) {
        onLog(`Goal is currently LOCKED at (${goalPos.x}m, ${goalPos.y}m). Press 'Unlock Goal' to reposition.`, 'warning');
        return;
      }
      onSetGoal({ x: gridX, y: gridY });
      onLog(`Point B (Goal) selected at local coordinates: (${gridX}m, ${gridY}m)`, 'plan');
    } else {
      onAddObstacleAt({ x: gridX, y: gridY });
      onLog(`Manual obstacle placed at local coordinates: (${gridX}m, ${gridY}m)`, 'warning');
    }
  };

  // Render 2D SLAM-style Grid Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cellPx = w / GRID_WIDTH;

      ctx.clearRect(0, 0, w, h);

      // 1. Background Unexplored / Fog of War Grid
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);

      // Subtle Unexplored Hatching Pattern
      ctx.strokeStyle = 'rgba(20, 28, 45, 0.5)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= GRID_WIDTH; x += 2) {
        ctx.beginPath();
        ctx.moveTo(x * cellPx, 0);
        ctx.lineTo(x * cellPx, h);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellPx);
        ctx.lineTo(w, y * cellPx);
        ctx.stroke();
      }

      // 2. Draw Explored Area (SLAM Visual Footprint)
      if (showExploredMask && exploredCells) {
        ctx.fillStyle = 'rgba(10, 25, 35, 0.85)';
        for (let gy = 0; gy < GRID_HEIGHT; gy++) {
          for (let gx = 0; gx < GRID_WIDTH; gx++) {
            if (exploredCells[gy * GRID_WIDTH + gx] === 1) {
              ctx.fillRect(gx * cellPx, gy * cellPx, cellPx, cellPx);
            }
          }
        }

        // Inner Explored Grid lines
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.lineWidth = 0.5;
        for (let gy = 0; gy < GRID_HEIGHT; gy++) {
          for (let gx = 0; gx < GRID_WIDTH; gx++) {
            if (exploredCells[gy * GRID_WIDTH + gx] === 1) {
              ctx.strokeRect(gx * cellPx, gy * cellPx, cellPx, cellPx);
            }
          }
        }
      }

      // 5-meter major axis grid markings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_WIDTH; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x * cellPx, 0);
        ctx.lineTo(x * cellPx, h);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellPx);
        ctx.lineTo(w, y * cellPx);
        ctx.stroke();
      }

      // Metric Ticks & Labels along edges
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.textAlign = 'center';
      for (let x = 0; x <= GRID_WIDTH; x += 10) {
        ctx.fillText(`${x}m`, x * cellPx, h - 3);
      }
      ctx.textAlign = 'left';
      for (let y = 10; y <= GRID_HEIGHT; y += 10) {
        ctx.fillText(`${y}m`, 4, y * cellPx - 2);
      }

      // 3. Draw Obstacles (with safety inflation rings)
      obstacles.forEach((obs) => {
        const ox = obs.x * cellPx;
        const oy = obs.y * cellPx;
        const oRadiusPx = obs.radius * cellPx;

        // Safety Clearance Inflation Margin
        if (showSafetyRadius) {
          ctx.strokeStyle = obs.isDynamic ? 'rgba(239, 68, 68, 0.45)' : 'rgba(244, 63, 94, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ox, oy, (obs.radius + UGV_SAFETY_RADIUS) * cellPx, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Obstacle Body
        drawObstacle2D(ctx, obs, ox, oy, oRadiusPx);
      });

      // 4. Draw SLAM Discovered Landmarks
      if (showSlamLandmarks) {
        landmarks.forEach((lm) => {
          const lx = lm.x * cellPx;
          const ly = lm.y * cellPx;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(lx, ly, lm.uncertaintyRadius * cellPx * 3.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 5. Draw Actual Trajectory (Gold trace)
      if (trajectory.length > 1) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(trajectory[0].x * cellPx, trajectory[0].y * cellPx);
        for (let i = 1; i < trajectory.length; i++) {
          ctx.lineTo(trajectory[i].x * cellPx, trajectory[i].y * cellPx);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 6. Draw Planned A* Path (Cyan dashed spline)
      if (plannedPath.length > 1) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(plannedPath[0].x * cellPx, plannedPath[0].y * cellPx);
        for (let i = 1; i < plannedPath.length; i++) {
          ctx.lineTo(plannedPath[i].x * cellPx, plannedPath[i].y * cellPx);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // Draw Waypoint dots
        plannedPath.forEach((pt, idx) => {
          if (idx > 0 && idx < plannedPath.length - 1) {
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath();
            ctx.arc(pt.x * cellPx, pt.y * cellPx, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 7. Draw Point A (Start)
      const ax = startPos.x * cellPx;
      const ay = startPos.y * cellPx;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('A', ax, ay + 3);

      // 8. Draw Point B (Goal) with Arrival Tolerance & Lock Ring
      const bx = goalPos.x * cellPx;
      const by = goalPos.y * cellPx;
      const tolRadiusPx = goalTolerance * cellPx;

      // Goal Tolerance Radius Circle
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(8, tolRadiusPx), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing Outer Goal Ring
      const pulse = 10 + Math.sin(performance.now() * 0.005) * 3;
      ctx.strokeStyle = isGoalLocked ? 'rgba(34, 197, 94, 0.8)' : 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Goal Center Marker
      ctx.fillStyle = isGoalLocked ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('B', bx, by + 3);

      // 9. Draw UGV Visual Perception FOV Cone
      const ugvPxX = ugv.x * cellPx;
      const ugvPxY = ugv.y * cellPx;
      const headingRad = degToRad(ugv.heading);

      if (showFovCone) {
        const fovHalfRad = degToRad(75 / 2);
        const fovRangePx = 14 * cellPx;

        ctx.save();
        const fovGrad = ctx.createRadialGradient(ugvPxX, ugvPxY, 5, ugvPxX, ugvPxY, fovRangePx);
        fovGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        fovGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
        fovGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        ctx.fillStyle = fovGrad;

        ctx.beginPath();
        ctx.moveTo(ugvPxX, ugvPxY);
        ctx.arc(ugvPxX, ugvPxY, fovRangePx, headingRad - fovHalfRad, headingRad + fovHalfRad);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 10. Draw Top-down UGV Chassis
      drawUGVTopDown(ctx, ugvPxX, ugvPxY, headingRad, navigationState);

      // 11. Draw 5-Meter Scale Bar in Bottom Right
      const scaleBarWidthPx = 5 * cellPx;
      const barX = w - scaleBarWidthPx - 14;
      const barY = h - 18;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 4, barY - 12, scaleBarWidthPx + 8, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + scaleBarWidthPx, barY);
      ctx.moveTo(barX, barY - 4);
      ctx.lineTo(barX, barY + 4);
      ctx.moveTo(barX + scaleBarWidthPx, barY - 4);
      ctx.lineTo(barX + scaleBarWidthPx, barY + 4);
      ctx.stroke();
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('5 METERS', barX + scaleBarWidthPx / 2, barY - 4);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    ugv,
    startPos,
    goalPos,
    plannedPath,
    trajectory,
    obstacles,
    landmarks,
    navigationState,
    isGoalLocked,
    goalTolerance,
    exploredCells,
    showFovCone,
    showSlamLandmarks,
    showSafetyRadius,
    showExploredMask,
  ]);

  return (
    <div id="map-panel-container" className="bg-[#0A0A0A] border border-[#222] rounded flex flex-col overflow-hidden shadow-lg">
      {/* Header with Coordinates & Mode Switcher */}
      <div className="bg-[#111] border-b border-[#222] px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#1A1A1A] border border-[#333] text-green-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              2D SLAM Navigation Map
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-bold">
                GRID 40M × 40M
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 font-mono">Real-time Path Spline, SLAM Landmarks & Obstacle Map</p>
          </div>
        </div>

        {/* Action Toggle (Goal vs Obstacle placement) */}
        <div className="flex items-center gap-1 bg-[#050505] p-1 rounded border border-[#222] text-[11px] font-mono">
          <button
            id="click-goal-mode-btn"
            onClick={() => setClickMode('goal')}
            className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
              clickMode === 'goal'
                ? 'bg-green-600 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Click anywhere on the map to place Goal (Point B)"
          >
            <Flag className="w-3 h-3" />
            Set Goal (B)
          </button>
          <button
            id="click-obs-mode-btn"
            onClick={() => setClickMode('obstacle')}
            className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
              clickMode === 'obstacle'
                ? 'bg-red-600 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Click anywhere on the map to add an obstacle"
          >
            <Plus className="w-3 h-3" />
            Add Obstacle
          </button>
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-3">
        {/* Canvas Map Viewport */}
        <div
          ref={containerRef}
          className="relative aspect-square w-full rounded overflow-hidden bg-black border border-[#262626] shadow-inner cursor-crosshair"
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            onClick={handleCanvasClick}
            className="w-full h-full block"
          />

          {/* Top-Left Coordinate HUD */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-sm border border-[#333] px-2.5 py-0.5 rounded text-[10px] font-mono text-gray-200 shadow-md">
              <span className="text-blue-400 font-bold">START [A]:</span> ({startPos.x}m, {startPos.y}m)
            </div>
            <div className="bg-black/85 backdrop-blur-sm border border-[#333] px-2.5 py-0.5 rounded text-[10px] font-mono text-gray-200 shadow-md">
              <span className="text-green-400 font-bold">GOAL [B]:</span> ({goalPos.x}m, {goalPos.y}m)
            </div>
          </div>

          {/* Top-Right SLAM Simulation Badge */}
          <div className="absolute top-2.5 right-2.5 pointer-events-none">
            <div className="bg-black/90 backdrop-blur-sm border border-green-500/40 text-green-400 px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-wider font-bold shadow-md flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>SLAM: ACTIVE</span>
              </div>
              <span className="text-[8px] text-gray-400 font-normal">CONFIDENCE: {localizationConfidence}%</span>
            </div>
          </div>

          {/* Dynamic Obstacle Alert Banner if Detected */}
          {navigationState === 'OBSTACLE_DETECTED' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/95 border-2 border-red-500 text-red-100 px-4 py-2.5 rounded shadow-2xl backdrop-blur-md text-center animate-pulse pointer-events-none z-20 font-mono">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                DYNAMIC OBSTACLE DETECTED
              </div>
              <div className="text-xs font-semibold mt-0.5">HALTING UGV & INITIATING REPLAN...</div>
            </div>
          )}

          {navigationState === 'REPLANNING' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-950/95 border-2 border-amber-500 text-amber-100 px-4 py-2.5 rounded shadow-2xl backdrop-blur-md text-center pointer-events-none z-20 font-mono">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                A* RE-PLANNING IN PROGRESS
              </div>
              <div className="text-xs font-semibold mt-0.5">COMPUTING COLLISION-FREE ROUTE...</div>
            </div>
          )}

          {navigationState === 'GOAL_VERIFICATION' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-950/95 border-2 border-cyan-500 text-cyan-100 px-5 py-3 rounded shadow-2xl backdrop-blur-md text-center pointer-events-none z-20 font-mono animate-pulse">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                VERIFYING GOAL POSE ARRIVAL...
              </div>
              <div className="text-[11px] font-semibold mt-0.5 text-gray-200">Error &lt; {goalTolerance}m • Testing SLAM Confidence</div>
            </div>
          )}

          {navigationState === 'GOAL_REACHED' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-950/95 border-2 border-green-500 text-green-100 px-5 py-3 rounded shadow-2xl backdrop-blur-md text-center pointer-events-none z-20 font-mono">
              <div className="text-xs font-bold uppercase tracking-wider text-green-300">
                GOAL REACHED - MISSION SUCCESSFUL
              </div>
              <div className="text-[11px] font-semibold mt-0.5 text-gray-200">Point B reached safely with 0% GPS dependence</div>
            </div>
          )}

          {/* Layer Controls in Bottom Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono bg-black/90 backdrop-blur-sm border border-[#333] px-3 py-1.5 rounded pointer-events-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showExploredMask}
                  onChange={(e) => setShowExploredMask(e.target.checked)}
                  className="rounded border-[#444] text-green-500 focus:ring-0 bg-[#111]"
                />
                <span>Exploration Mask</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showFovCone}
                  onChange={(e) => setShowFovCone(e.target.checked)}
                  className="rounded border-[#444] text-green-500 focus:ring-0 bg-[#111]"
                />
                <span>Vision FOV (75°)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showSlamLandmarks}
                  onChange={(e) => setShowSlamLandmarks(e.target.checked)}
                  className="rounded border-[#444] text-green-500 focus:ring-0 bg-[#111]"
                />
                <span>SLAM Landmarks</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={showSafetyRadius}
                  onChange={(e) => setShowSafetyRadius(e.target.checked)}
                  className="rounded border-[#444] text-green-500 focus:ring-0 bg-[#111]"
                />
                <span>Safety Margin ({UGV_SAFETY_RADIUS}m)</span>
              </label>
            </div>

            <div className="text-gray-400 flex items-center gap-2">
              <span>CLICK: <strong className="text-green-400 uppercase">{clickMode === 'goal' ? (isGoalLocked ? 'Goal Locked' : 'Set Goal (B)') : 'Place Obstacle'}</strong></span>
            </div>
          </div>
        </div>

        {/* Embedded SLAM Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[9px] font-mono bg-[#0D0D0D] border border-[#222] p-2 rounded">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">SLAM STATUS:</span>
            <span className="text-green-400 font-bold">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">LOCALIZATION:</span>
            <span className="text-cyan-400 font-bold">TRACKING</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">GPS:</span>
            <span className="text-red-400 font-bold">NOT USED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">MAP:</span>
            <span className="text-green-400 font-bold">LOCAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">CONFIDENCE:</span>
            <span className="text-cyan-300 font-bold">{localizationConfidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2D Map Helper Functions
// ==========================================

function drawObstacle2D(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  ox: number,
  oy: number,
  radPx: number
) {
  ctx.save();
  ctx.translate(ox, oy);

  if (obs.type === 'rock') {
    // Boulder
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(-radPx * 0.25, -radPx * 0.25, radPx * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.type === 'tree') {
    // Tree top-down (Foliage green circle with concentric rings)
    ctx.fillStyle = '#065f46';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(0, 0, radPx * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.type === 'ditch') {
    // Hole / Ditch
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (obs.type === 'person') {
    // Person (Yellow circle with shoulder bar)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, radPx * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Default hazard block
    ctx.fillStyle = obs.isDynamic ? '#ef4444' : '#dc2626';
    ctx.fillRect(-radPx, -radPx, radPx * 2, radPx * 2);
  }

  // If dynamic obstacle, draw pulsing ring
  if (obs.isDynamic) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, radPx * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawUGVTopDown(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headingRad: number,
  navState: NavigationState
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(headingRad);

  const ugvLength = 18;
  const ugvWidth = 14;

  // Wheel tracks (Left & Right)
  ctx.fillStyle = '#1e293b';
  // Left wheel
  ctx.fillRect(-ugvLength / 2, -ugvWidth / 2 - 2, ugvLength, 3);
  // Right wheel
  ctx.fillRect(-ugvLength / 2, ugvWidth / 2 - 1, ugvLength, 3);

  // Main Chassis (Color changes with navigation status)
  let chassisColor = '#38bdf8';
  if (navState === 'OBSTACLE_DETECTED') chassisColor = '#f43f5e';
  else if (navState === 'REPLANNING') chassisColor = '#f59e0b';
  else if (navState === 'GOAL_REACHED') chassisColor = '#10b981';

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = chassisColor;
  ctx.lineWidth = 2;
  ctx.fillRect(-ugvLength / 2, -ugvWidth / 2, ugvLength, ugvWidth);
  ctx.strokeRect(-ugvLength / 2, -ugvWidth / 2, ugvLength, ugvWidth);

  // Front camera sensor dome
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(ugvLength / 2 - 2, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Heading Arrow on roof
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-ugvLength / 4, 0);
  ctx.lineTo(ugvLength / 3, 0);
  ctx.lineTo(ugvLength / 3 - 4, -3);
  ctx.moveTo(ugvLength / 3, 0);
  ctx.lineTo(ugvLength / 3 - 4, 3);
  ctx.stroke();

  ctx.restore();
}
