/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, Square, RotateCcw, Shuffle, Plus, Sparkles, Map, AlertOctagon } from 'lucide-react';
import { NavigationState } from '../types';

interface ControlsProps {
  navigationState: NavigationState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onStep: () => void;
  onGenerateMap: () => void;
  onRandomObstacles: () => void;
  onAddObstacleInFront: () => void;
  onInjectPerson: () => void;
  onClearMap: () => void;
  onRunDemoMode: () => void;
  onOpenArchitecture: () => void;
  onOpenJudgeMode: () => void;
  isDemoActive: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  navigationState,
  onStart,
  onPause,
  onStop,
  onReset,
  onStep,
  onGenerateMap,
  onRandomObstacles,
  onAddObstacleInFront,
  onInjectPerson,
  onClearMap,
  onRunDemoMode,
  onOpenArchitecture,
  onOpenJudgeMode,
  isDemoActive,
}) => {
  const isNavigating = navigationState === 'NAVIGATING' || navigationState === 'REPLANNING';

  return (
    <div id="controls-panel" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Top Demo & Presentation Mode Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#0D0D0D] p-3 rounded border border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#141414] text-green-400 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              SIH Autonomous Demonstration Suite
              {isDemoActive && (
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-green-500 text-black font-bold animate-pulse">
                  DEMO RUNNING
                </span>
              )}
            </h4>
            <p className="text-[11px] text-gray-400 font-mono">
              Automated end-to-end mission with dynamic obstacle injection & live A* replanning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-judge-mode"
            onClick={onOpenJudgeMode}
            className="px-3.5 py-2 bg-[#181818] hover:bg-[#222] text-amber-400 hover:text-white font-bold rounded text-[11px] flex items-center gap-1.5 border border-amber-500/40 shadow-sm transition-all cursor-pointer font-mono uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            JUDGE / DEMO VIEW
          </button>

          <button
            id="btn-demo-mode"
            onClick={onRunDemoMode}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all active:scale-95 cursor-pointer font-mono uppercase tracking-widest"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            RUN AUTO DEMO
          </button>
        </div>
      </div>

      {/* Main Navigation Execution Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Start / Resume */}
        <button
          id="btn-start-nav"
          onClick={onStart}
          disabled={isNavigating}
          className={`px-3 py-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
            isNavigating
              ? 'bg-[#141414] text-gray-600 border border-[#222] cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_12px_rgba(34,197,94,0.3)] cursor-pointer active:scale-95'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          START
        </button>

        {/* Pause */}
        <button
          id="btn-pause-nav"
          onClick={onPause}
          disabled={!isNavigating}
          className={`px-3 py-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
            !isNavigating
              ? 'bg-[#141414] text-gray-600 border border-[#222] cursor-not-allowed'
              : 'border border-[#444] text-white hover:bg-[#222] cursor-pointer active:scale-95'
          }`}
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          PAUSE
        </button>

        {/* Step Simulation */}
        <button
          id="btn-step-nav"
          onClick={onStep}
          className="px-3 py-2.5 rounded bg-[#111] hover:bg-[#1A1A1A] text-cyan-400 hover:text-white text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 border border-[#262626] cursor-pointer active:scale-95 transition-all"
          title="Advances simulation by a single tick for granular inspection"
        >
          STEP (1 TICK)
        </button>

        {/* Stop */}
        <button
          id="btn-stop-nav"
          onClick={onStop}
          className="px-3 py-2.5 rounded border border-red-900/60 bg-red-950/30 hover:bg-red-900/40 text-red-400 text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(239,68,68,0.2)] cursor-pointer active:scale-95 transition-all"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          STOP
        </button>

        {/* Reset */}
        <button
          id="btn-reset-nav"
          onClick={onReset}
          className="px-3 py-2.5 rounded bg-[#111] hover:bg-[#1A1A1A] text-gray-300 hover:text-white text-[11px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 border border-[#262626] cursor-pointer active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET
        </button>
      </div>

      {/* Map & Obstacle Modification Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#222]">
        <button
          id="btn-generate-map"
          onClick={onGenerateMap}
          className="px-3 py-2 rounded bg-[#0D0D0D] hover:bg-[#1A1A1A] border border-[#222] text-gray-300 hover:text-white text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Map className="w-3.5 h-3.5 text-cyan-400" />
          Generate Map
        </button>

        <button
          id="btn-random-obs"
          onClick={onRandomObstacles}
          className="px-3 py-2 rounded bg-[#0D0D0D] hover:bg-[#1A1A1A] border border-[#222] text-gray-300 hover:text-white text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          Random Obstacles
        </button>

        <button
          id="btn-add-dynamic-obs"
          onClick={onAddObstacleInFront}
          className="px-3 py-2 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Spawns a dynamic obstacle right in the forward path of the UGV"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          Inject Hazard (Replan)
        </button>

        <button
          id="btn-inject-person"
          onClick={onInjectPerson}
          className="px-3 py-2 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Spawns a human/pedestrian in path - UGV automatically detects and bypasses without manual intervention"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          Inject Human (Auto Bypass)
        </button>
      </div>
    </div>
  );
};
