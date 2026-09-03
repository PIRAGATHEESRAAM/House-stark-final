/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gauge, Navigation, Compass, Route, Activity, Cpu, Radio, ShieldCheck, Zap } from 'lucide-react';
import { TelemetryData, NavigationState } from '../types';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry }) => {
  const getNavStateColor = (state: NavigationState) => {
    switch (state) {
      case 'NAVIGATING':
        return 'text-green-400 bg-green-950/30 border-green-500/40';
      case 'PLANNING':
      case 'REPLANNING':
        return 'text-amber-400 bg-amber-950/30 border-amber-500/40';
      case 'OBSTACLE_DETECTED':
        return 'text-red-400 bg-red-950/40 border-red-500/50 animate-pulse';
      case 'GOAL_REACHED':
        return 'text-green-400 bg-green-950/40 border-green-500/50 font-bold';
      default:
        return 'text-gray-400 bg-[#111] border-[#333]';
    }
  };

  return (
    <div id="telemetry-panel" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Live UGV Telemetry Dashboard</h3>
            <p className="text-[10px] text-gray-500 font-mono">Real-time Kinematics, Dead Reckoning & Navigation Metrics</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${getNavStateColor(telemetry.navigationState)}`}>
          STATE: {telemetry.navigationState}
        </div>
      </div>

      {/* Primary Robot Pose & Verification Hero Card */}
      <div className="bg-[#0D0D0D] border border-green-500/30 rounded p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
          <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-green-400" />
            CURRENT ROBOT POSE (LOCAL METRIC FRAME)
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
            LOCALIZATION CONFIDENCE: {telemetry.localizationConfidence}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-[9px] text-gray-500 block uppercase">X POSITION</span>
            <span className="text-sm font-bold text-white">{telemetry.ugvX.toFixed(2)} m</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-[9px] text-gray-500 block uppercase">Y POSITION</span>
            <span className="text-sm font-bold text-white">{telemetry.ugvY.toFixed(2)} m</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-[9px] text-gray-500 block uppercase">HEADING / YAW</span>
            <span className="text-sm font-bold text-green-400">{Math.round(telemetry.heading)}°</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-[9px] text-gray-500 block uppercase">LINEAR VELOCITY</span>
            <span className="text-sm font-bold text-cyan-400">{telemetry.speed.toFixed(2)} m/s</span>
          </div>
        </div>

        {/* Goal Arrival Telemetry Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1F1F1F] text-[10px] font-mono items-center">
          <div className="flex items-center justify-between bg-[#141414] px-2 py-1.5 rounded border border-[#262626]">
            <span className="text-gray-500">POSITION ERROR TO GOAL:</span>
            <span className={`font-bold ${telemetry.positionError <= telemetry.goalTolerance ? 'text-green-400' : 'text-amber-400'}`}>
              {telemetry.positionError.toFixed(2)} m
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#141414] px-2 py-1.5 rounded border border-[#262626]">
            <span className="text-gray-500">GOAL TOLERANCE:</span>
            <span className="text-white font-bold">{telemetry.goalTolerance.toFixed(2)} m</span>
          </div>

          <div className="flex items-center justify-between bg-[#141414] px-2 py-1.5 rounded border border-[#262626]">
            <span className="text-gray-500">VERIFICATION:</span>
            {telemetry.navigationState === 'GOAL_REACHED' || telemetry.navigationState === 'SAFE_STOP' ? (
              <span className="text-green-400 font-bold flex items-center gap-1">✓ DESTINATION REACHED</span>
            ) : telemetry.navigationState === 'NAVIGATING' ? (
              <span className="text-cyan-400 font-bold">NAVIGATING TO GOAL</span>
            ) : telemetry.navigationState === 'SAFETY_HOLD' ? (
              <span className="text-red-400 font-bold">SAFETY PAUSED</span>
            ) : (
              <span className="text-gray-400 font-bold">STANDBY</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Auxiliary Navigation Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* UGV Position */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">UGV POSITION (X, Y)</span>
          <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
            {telemetry.ugvX.toFixed(1)}m, {telemetry.ugvY.toFixed(1)}m
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Relative Local Origin</span>
        </div>

        {/* Heading */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">HEADING / YAW</span>
          <div className="text-sm font-mono font-bold text-white mt-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-green-400" />
            {Math.round(telemetry.heading)}°
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Vision Odometry</span>
        </div>

        {/* Speed */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">GROUND SPEED</span>
          <div className="text-sm font-mono font-bold text-green-400 mt-1 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            {telemetry.speed.toFixed(2)} m/s
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Nominal: 1.20 m/s</span>
        </div>

        {/* Distance Travelled */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">DIST TRAVELLED</span>
          <div className="text-sm font-mono font-bold text-indigo-400 mt-1">
            {telemetry.distanceTravelled.toFixed(1)} m
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Cumulative Dead Reckon</span>
        </div>

        {/* Distance to Goal */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">DISTANCE TO GOAL</span>
          <div className="text-sm font-mono font-bold text-amber-400 mt-1">
            {telemetry.distanceToGoal.toFixed(1)} m
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Euclidean Target B</span>
        </div>

        {/* Obstacle Count */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">HAZARDS IN CONE</span>
          <div className="text-sm font-mono font-bold text-red-400 mt-1">
            {telemetry.obstacleCount} Objects
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Camera FOV Sector</span>
        </div>

        {/* Path Length */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">PATH LENGTH / WP</span>
          <div className="text-sm font-mono font-bold text-cyan-400 mt-1">
            {telemetry.pathLength.toFixed(1)}m ({telemetry.waypointsCount} wp)
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Smoothed A* Spline</span>
        </div>

        {/* Perception FPS */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-2.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">PERCEPTION RATE</span>
          <div className="text-sm font-mono font-bold text-green-400 mt-1">
            {telemetry.perceptionFps} FPS
          </div>
          <span className="text-[9px] text-gray-600 font-mono">Latency: {telemetry.planningLatencyMs}ms</span>
        </div>
      </div>

      {/* Subsystem Status Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#222]">
        <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded text-[10px] font-mono">
          <span className="text-gray-500">GPS RECEIVER</span>
          <span className="text-red-400 font-bold">OFFLINE</span>
        </div>
        <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded text-[10px] font-mono">
          <span className="text-gray-500">NAVIGATION</span>
          <span className="text-green-400 font-bold">AUTONOMOUS</span>
        </div>
        <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded text-[10px] font-mono">
          <span className="text-gray-500">PERCEPTION AI</span>
          <span className="text-blue-400 font-bold">{telemetry.perceptionStatus}</span>
        </div>
        <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded text-[10px] font-mono">
          <span className="text-gray-500">A* PLANNER</span>
          <span className="text-indigo-400 font-bold">{telemetry.plannerStatus}</span>
        </div>
      </div>
    </div>
  );
};
