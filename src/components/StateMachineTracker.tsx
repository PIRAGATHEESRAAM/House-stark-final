/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Circle,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Navigation,
  Flag,
  ShieldAlert,
  Play,
  Lock,
  Pause,
  ArrowRight,
} from 'lucide-react';
import { NavigationState } from '../types';

interface StateMachineTrackerProps {
  navigationState: NavigationState;
  isGoalLocked: boolean;
}

interface StateStep {
  id: string;
  label: string;
  subLabel: string;
  activeMatch: (state: NavigationState, locked: boolean) => boolean;
  passedMatch: (state: NavigationState, locked: boolean) => boolean;
}

export const StateMachineTracker: React.FC<StateMachineTrackerProps> = ({
  navigationState,
  isGoalLocked,
}) => {
  const steps: StateStep[] = [
    {
      id: 'idle',
      label: 'IDLE / MAP INIT',
      subLabel: 'Visual SLAM Ready',
      activeMatch: (st) => st === 'IDLE' || st === 'MAP_INIT',
      passedMatch: (st) => st !== 'IDLE' && st !== 'MAP_INIT',
    },
    {
      id: 'goal_locked',
      label: 'GOAL LOCKED',
      subLabel: 'Point B Established',
      activeMatch: (st, locked) => (st === 'IDLE' || st === 'GOAL_SET' || st === 'GOAL_LOCKED') && locked,
      passedMatch: (st) => st === 'NAVIGATING' || st === 'OBSTACLE_DETECTED' || st === 'REPLANNING' || st === 'GOAL_VERIFICATION' || st === 'GOAL_REACHED' || st === 'SAFE_STOP',
    },
    {
      id: 'navigating',
      label: 'NAVIGATION',
      subLabel: 'Pure Pursuit VO Track',
      activeMatch: (st) => st === 'NAVIGATING' || st === 'PLANNING',
      passedMatch: (st) => st === 'GOAL_VERIFICATION' || st === 'GOAL_REACHED' || st === 'SAFE_STOP',
    },
    {
      id: 'hazard_replan',
      label: 'OBSTACLE / HUMAN AVOID',
      subLabel: 'Auto Dynamic A* Replan',
      activeMatch: (st) => st === 'OBSTACLE_DETECTED' || st === 'REPLANNING',
      passedMatch: (st) => st === 'GOAL_VERIFICATION' || st === 'GOAL_REACHED' || st === 'SAFE_STOP',
    },
    {
      id: 'goal_verification',
      label: 'GOAL VERIFICATION',
      subLabel: 'Pose Error < Tolerance',
      activeMatch: (st) => st === 'GOAL_VERIFICATION',
      passedMatch: (st) => st === 'GOAL_REACHED' || st === 'SAFE_STOP',
    },
    {
      id: 'goal_reached',
      label: 'GOAL REACHED / SAFE STOP',
      subLabel: 'Mission Success',
      activeMatch: (st) => st === 'GOAL_REACHED' || st === 'SAFE_STOP',
      passedMatch: (st) => false,
    },
  ];

  const isSafetyHold = navigationState === 'SAFETY_HOLD';

  return (
    <div
      id="state-machine-tracker"
      className="bg-[#0A0A0A] border border-[#222] rounded p-3 flex flex-col gap-2 shadow-lg font-mono"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          Mission Autonomous State Machine
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-gray-500">CURRENT STATE:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded uppercase ${
              isSafetyHold
                ? 'bg-red-950/60 text-red-400 border border-red-500/50 animate-pulse'
                : navigationState === 'GOAL_REACHED'
                ? 'bg-green-950/60 text-green-400 border border-green-500/50'
                : navigationState === 'NAVIGATING'
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/50'
                : 'bg-[#141414] text-gray-300 border border-[#333]'
            }`}
          >
            {navigationState}
          </span>
        </div>
      </div>

      {/* State Machine Flow Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1">
        {steps.map((step, idx) => {
          const isActive = step.activeMatch(navigationState, isGoalLocked);
          const isPassed = step.passedMatch(navigationState, isGoalLocked);

          return (
            <div
              key={step.id}
              className={`p-2 rounded border flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-green-950/30 border-green-500/70 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : isPassed
                  ? 'bg-[#0D0D0D] border-green-900/40 text-gray-400'
                  : 'bg-[#0A0A0A] border-[#222] text-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-500">0{idx + 1}</span>
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                ) : isPassed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-gray-700" />
                )}
              </div>
              <div className="mt-1">
                <div
                  className={`text-[10px] font-bold uppercase tracking-tight truncate ${
                    isActive ? 'text-white' : isPassed ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[8px] text-gray-500 truncate">{step.subLabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* If Safety Hold is active, display safety hold branch */}
      {isSafetyHold && (
        <div className="bg-red-950/40 border border-red-500/50 p-2 rounded flex items-center justify-between text-xs text-red-300 mt-1 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              SAFETY HOLD BRANCH ACTIVE: NAVIGATION INTERRUPTED
            </span>
          </div>
          <span className="text-[10px] text-red-200">Person Detected in Forward Path • Zero Torque Applied</span>
        </div>
      )}
    </div>
  );
};
