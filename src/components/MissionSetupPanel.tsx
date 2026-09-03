/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Flag,
  Lock,
  Unlock,
  Crosshair,
  Route,
  Navigation,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { Point, NavigationState } from '../types';
import { euclideanDistance } from '../utils/geometry';

interface MissionSetupPanelProps {
  startPos: Point;
  goalPos: Point;
  ugvPos: Point;
  isGoalLocked: boolean;
  goalTolerance: number;
  navigationState: NavigationState;
  plannedPathLength: number;
  localizationConfidence: number;
  onLockGoal: () => void;
  onUnlockGoal: () => void;
  onClearGoal: () => void;
  onSetTolerance: (tol: number) => void;
  onStartMission: () => void;
  onSetGoalClickMode: () => void;
}

export const MissionSetupPanel: React.FC<MissionSetupPanelProps> = ({
  startPos,
  goalPos,
  ugvPos,
  isGoalLocked,
  goalTolerance,
  navigationState,
  plannedPathLength,
  localizationConfidence,
  onLockGoal,
  onUnlockGoal,
  onClearGoal,
  onSetTolerance,
  onStartMission,
  onSetGoalClickMode,
}) => {
  const directDistance = euclideanDistance(ugvPos, goalPos);
  const positionError = euclideanDistance(ugvPos, goalPos);
  const isGoalReached = navigationState === 'GOAL_REACHED' || navigationState === 'SAFE_STOP';
  const isNavigating = navigationState === 'NAVIGATING' || navigationState === 'REPLANNING';

  return (
    <div
      id="mission-setup-panel"
      className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Mission Setup & Goal Manager
              <span
                className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold border ${
                  isGoalLocked
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                }`}
              >
                {isGoalLocked ? 'GOAL LOCKED' : 'GOAL EDITABLE'}
              </span>
            </h3>
            <p className="text-[10px] text-gray-500">
              Select Point B on local map grid • Lock coordinates • Define arrival tolerance
            </p>
          </div>
        </div>

        {/* Goal Lock / Unlock Toggle Button */}
        <div className="flex items-center gap-1.5">
          {isGoalLocked ? (
            <button
              id="btn-unlock-goal"
              onClick={onUnlockGoal}
              disabled={isNavigating}
              className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-[#252525] text-amber-300 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#333] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Unlock goal to change Point B on the map"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              Edit / Unlock Goal
            </button>
          ) : (
            <button
              id="btn-lock-goal"
              onClick={onLockGoal}
              className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-500 text-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-colors cursor-pointer active:scale-95"
              title="Lock goal to prevent accidental repositioning during map interactions"
            >
              <Lock className="w-3.5 h-3.5 fill-current" />
              LOCK GOAL
            </button>
          )}
        </div>
      </div>

      {/* Coordinate & Distance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Start Point A */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">START POINT [A]</span>
          <div className="text-sm font-bold text-blue-400 mt-1">
            X: {startPos.x.toFixed(1)} m | Y: {startPos.y.toFixed(1)} m
          </div>
          <span className="text-[9px] text-gray-600">Local Origin Anchor</span>
        </div>

        {/* Goal Point B */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>DESTINATION [B]</span>
            {isGoalLocked ? (
              <Lock className="w-3 h-3 text-green-400" />
            ) : (
              <Unlock className="w-3 h-3 text-amber-400" />
            )}
          </span>
          <div className="text-sm font-bold text-green-400 mt-1">
            X: {goalPos.x.toFixed(1)} m | Y: {goalPos.y.toFixed(1)} m
          </div>
          <span className="text-[9px] text-gray-600">
            {isGoalLocked ? 'Target Pose Locked' : 'Click Map to Move'}
          </span>
        </div>

        {/* Direct Euclidean Distance */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">DIRECT DISTANCE</span>
          <div className="text-sm font-bold text-cyan-400 mt-1">
            {directDistance.toFixed(1)} m
          </div>
          <span className="text-[9px] text-gray-600">Line-of-Sight Span</span>
        </div>

        {/* Estimated A* Path Length */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">ESTIMATED PATH</span>
          <div className="text-sm font-bold text-indigo-400 mt-1">
            {plannedPathLength > 0 ? `${plannedPathLength.toFixed(1)} m` : 'Calculating...'}
          </div>
          <span className="text-[9px] text-gray-600">A* Obstacle-Free Corridor</span>
        </div>
      </div>

      {/* Goal Verification & Configurable Tolerance Sub-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0D0D0D] p-2.5 rounded border border-[#222] items-center">
        {/* Goal Tolerance Configurator */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400 uppercase">Goal Tolerance:</span>
          <div className="flex items-center gap-1">
            {[0.5, 0.8, 1.2].map((tol) => (
              <button
                key={tol}
                onClick={() => onSetTolerance(tol)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  goalTolerance === tol
                    ? 'bg-green-600 text-black shadow-sm'
                    : 'bg-[#141414] text-gray-400 hover:text-white border border-[#333]'
                }`}
              >
                {tol}m
              </button>
            ))}
          </div>
        </div>

        {/* Position Error Telemetry */}
        <div className="flex items-center justify-between sm:justify-center gap-2 border-y sm:border-y-0 sm:border-x border-[#222] py-1 sm:py-0 px-2">
          <span className="text-[10px] text-gray-400 uppercase">Position Error:</span>
          <span className={`text-xs font-bold ${positionError <= goalTolerance ? 'text-green-400' : 'text-amber-400'}`}>
            {positionError.toFixed(2)} m
          </span>
        </div>

        {/* Goal Verification Status */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[10px] text-gray-400 uppercase">Goal Status:</span>
          {isGoalReached ? (
            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-950/40 px-2 py-0.5 rounded border border-green-500/40">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              DESTINATION REACHED
            </span>
          ) : isNavigating ? (
            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/40 animate-pulse">
              <Navigation className="w-3 h-3 text-cyan-400" />
              NAVIGATING TO GOAL
            </span>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 bg-[#141414] px-2 py-0.5 rounded border border-[#333]">
              {isGoalLocked ? 'READY TO NAVIGATE' : 'POINT B EDITING'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
