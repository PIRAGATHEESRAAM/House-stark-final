/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  WifiOff,
  Radio,
  Layers,
  Route,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Sparkles,
  X,
  Play,
  Activity,
  Cpu,
} from 'lucide-react';
import { TelemetryData, NavigationState } from '../types';

interface JudgePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryData;
  isGoalLocked: boolean;
  onStartDemo: () => void;
}

export const JudgePresentationModal: React.FC<JudgePresentationModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  isGoalLocked,
  onStartDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#0A0A0A] border border-[#262626] rounded w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#141414] border border-green-500/40 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                GPS-DENIED VISION-BASED AUTONOMOUS UGV NAVIGATION
              </h2>
              <p className="text-[11px] text-green-400 font-mono">
                Executive Hackathon & Judge Presentation Overview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#141414] hover:bg-[#222] text-gray-400 hover:text-white border border-[#333] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 text-xs">
          {/* Key Indicators 8-Card Grid */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
              System Core Architectural Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* GPS */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">GPS SATELLITE</span>
                <div className="text-sm font-bold text-red-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  NOT USED
                </div>
                <span className="text-[8px] text-gray-600">Zero Global Lat/Long</span>
              </div>

              {/* Internet */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">CONNECTIVITY</span>
                <div className="text-sm font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  OFFLINE
                </div>
                <span className="text-[8px] text-gray-600">100% Onboard Compute</span>
              </div>

              {/* Localization */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">LOCALIZATION</span>
                <div className="text-sm font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  VISUAL SLAM
                </div>
                <span className="text-[8px] text-gray-600">Optical Flow + Features</span>
              </div>

              {/* Map */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">MAP REFERENCE</span>
                <div className="text-sm font-bold text-green-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  LOCAL (METERS)
                </div>
                <span className="text-[8px] text-gray-600">Metric Coordinate Frame</span>
              </div>

              {/* Path Planner */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">PATH PLANNER</span>
                <div className="text-sm font-bold text-indigo-400 mt-1">
                  A* (SMOOTHED)
                </div>
                <span className="text-[8px] text-gray-600">Sub-5ms Latency</span>
              </div>

              {/* Obstacle Avoidance */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">OBSTACLE AVOID</span>
                <div className="text-sm font-bold text-rose-400 mt-1">
                  DYNAMIC REPLAN
                </div>
                <span className="text-[8px] text-gray-600">14m Perception Cone</span>
              </div>

              {/* Goal Status */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">GOAL POINT B</span>
                <div className="text-sm font-bold text-green-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-green-400" />
                  {isGoalLocked ? 'LOCKED' : 'SELECTED'}
                </div>
                <span className="text-[8px] text-gray-600">Local Destination</span>
              </div>

              {/* Mission State */}
              <div className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between">
                <span className="text-[9px] text-gray-500 uppercase">MISSION STATE</span>
                <div className="text-sm font-bold text-white mt-1 uppercase truncate">
                  {telemetry.navigationState}
                </div>
                <span className="text-[8px] text-gray-600">Autonomous Execution</span>
              </div>
            </div>
          </div>

          {/* Key Value Proposition & Problem Statement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#0D0D0D] border border-[#222] p-3.5 rounded flex flex-col gap-2">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                The Operational Problem
              </h3>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Conventional UGVs fail completely in dense forests, mountainous ravines, subterranean shafts, and contested electronic warfare environments where GPS signals are either jammed, spoofed, or physically attenuated.
              </p>
            </div>

            <div className="bg-[#0D0D0D] border border-[#222] p-3.5 rounded flex flex-col gap-2">
              <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                Our Proposed Solution
              </h3>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                A 100% onboard, monocular vision-based autonomy stack combining Optical Flow Visual Odometry, Real-time Graph SLAM, and Autonomous Dynamic A* Replanning with seamless human bypass — operating purely on local metric coordinates.
              </p>
            </div>
          </div>

          {/* Real-time Pose & Arrival Verification Snapshot */}
          <div className="bg-[#0D0D0D] border border-[#222] p-3.5 rounded flex flex-col gap-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Live Telemetry & Mathematical Goal Verification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="bg-[#141414] p-2 rounded border border-[#262626]">
                <span className="text-gray-500 block">CURRENT ROBOT POSE</span>
                <span className="font-bold text-white">X: {telemetry.ugvX.toFixed(2)}m, Y: {telemetry.ugvY.toFixed(2)}m</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626]">
                <span className="text-gray-500 block">DISTANCE TO GOAL</span>
                <span className="font-bold text-amber-400">{telemetry.distanceToGoal.toFixed(2)} m</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626]">
                <span className="text-gray-500 block">LOCALIZATION CONFIDENCE</span>
                <span className="font-bold text-green-400">{telemetry.localizationConfidence}%</span>
              </div>
              <div className="bg-[#141414] p-2 rounded border border-[#262626]">
                <span className="text-gray-500 block">GOAL ARRIVAL CRITERION</span>
                <span className="font-bold text-cyan-400">Error ≤ {telemetry.goalTolerance}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050505] border-t border-[#222] flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[10px] text-gray-500">
            SIH SOFTWARE DEMONSTRATION PROTOTYPE
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onStartDemo();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-wider rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Live Demonstration
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-[#141414] hover:bg-[#222] border border-[#333] text-gray-300 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
