/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { DetectedObstacle } from '../types';

interface PerceptionPanelProps {
  detectedObstacles: DetectedObstacle[];
}

export const PerceptionPanel: React.FC<PerceptionPanelProps> = ({ detectedObstacles }) => {
  return (
    <div id="perception-detail-panel" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Perception Target Catalog</h3>
            <p className="text-[10px] text-gray-500 font-mono">Outdoor Hazard Segmentation & Relative Range</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-[#050505] px-2 py-0.5 rounded border border-[#262626] font-bold uppercase">
          {detectedObstacles.length} IN CONE
        </span>
      </div>

      {/* Obstacles List */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
        {detectedObstacles.length === 0 ? (
          <div className="bg-[#0D0D0D] rounded p-4 text-center border border-[#222]">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs text-gray-300 font-medium font-mono uppercase tracking-wider">Trajectory Corridor Clear</p>
            <p className="text-[10px] text-gray-600 font-mono mt-0.5">No obstacles inside 75° camera sensor cone</p>
          </div>
        ) : (
          detectedObstacles.map((obs) => (
            <div
              key={obs.id}
              className={`p-2.5 rounded border text-xs font-mono flex items-center justify-between gap-2 transition-all ${
                obs.hazardLevel === 'hazard'
                  ? 'bg-red-950/30 border-red-500/40 text-red-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {obs.hazardLevel === 'hazard' ? (
                  <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-white uppercase">{obs.label}</div>
                  <div className="text-[10px] text-gray-400">
                    Pos: ({obs.gridPos.x}m, {obs.gridPos.y}m) | Angle: {obs.angleDeg}°
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-cyan-300 font-bold">{obs.distance} m</div>
                <div className="text-[10px] text-gray-400">
                  <span className="text-amber-300 font-semibold">{obs.direction}</span> ({obs.confidence}%)
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
