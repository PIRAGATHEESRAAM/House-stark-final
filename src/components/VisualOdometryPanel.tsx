/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, Activity, Cpu, Disc, Sparkles } from 'lucide-react';
import { VisualOdometryData, UGVState } from '../types';

interface VisualOdometryPanelProps {
  voData: VisualOdometryData;
  actualUGV: UGVState;
}

export const VisualOdometryPanel: React.FC<VisualOdometryPanelProps> = ({ voData, actualUGV }) => {
  return (
    <div id="visual-odometry-panel" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Visual Odometry Pipeline</h3>
            <p className="text-[10px] text-gray-500 font-mono">Lucas-Kanade Optical Flow Motion Estimator</p>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-[9px] uppercase font-bold tracking-wider">
          VO ENGINE
        </div>
      </div>

      {/* Main Core Display as requested */}
      <div className="bg-[#0D0D0D] border border-[#222] rounded p-3">
        <div className="text-[10px] font-mono text-green-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>VISUAL ODOMETRY TELEMETRY</span>
          <span className="text-[9px] text-green-400 bg-green-950/40 px-1.5 py-0.5 rounded border border-green-500/30 font-bold">
            {voData.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">ESTIMATED X:</span>
            <span className="text-xs font-bold text-white">{voData.voX.toFixed(1)} m</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">ESTIMATED Y:</span>
            <span className="text-xs font-bold text-white">{voData.voY.toFixed(1)} m</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">HEADING:</span>
            <span className="text-xs font-bold text-cyan-400">{Math.round(voData.voHeading)}°</span>
          </div>

          <div className="bg-[#141414] p-2 rounded border border-[#262626]">
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">DIST TRAVELLED:</span>
            <span className="text-xs font-bold text-indigo-400">{voData.distanceTravelled.toFixed(1)} m</span>
          </div>
        </div>
      </div>

      {/* Feature Tracking & Drift Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="bg-[#0D0D0D] p-2.5 rounded border border-[#222] flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">TRACKED CORNERS</span>
            <span className="text-xs font-bold text-cyan-400">{voData.trackedFeaturesCount} FAST Pts</span>
          </div>
          <Sparkles className="w-4 h-4 text-cyan-400/60" />
        </div>

        <div className="bg-[#0D0D0D] p-2.5 rounded border border-[#222] flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">OPTICAL FLOW MAG</span>
            <span className="text-xs font-bold text-green-400">{voData.opticalFlowMagnitude} px/f</span>
          </div>
          <Activity className="w-4 h-4 text-green-400/60" />
        </div>

        <div className="bg-[#0D0D0D] p-2.5 rounded border border-[#222] flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-[9px] uppercase tracking-wider block">ESTIMATED DRIFT</span>
            <span className="text-xs font-bold text-amber-400">{voData.driftErrorEstimate} m (corr)</span>
          </div>
          <Disc className="w-4 h-4 text-amber-400/60" />
        </div>
      </div>
    </div>
  );
};
