/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff, Radio, MapPin, Compass, ShieldCheck } from 'lucide-react';

export const OfflineModeBanner: React.FC = () => {
  return (
    <div
      id="offline-mode-indicator"
      className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg"
    >
      {/* Left: Main Offline Badge */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-[#141414] border border-[#333] text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)] flex-shrink-0">
          <WifiOff className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              OFFLINE AUTONOMOUS MODE
            </h3>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-bold">
              GPS-DENIED
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
            Core navigation simulation operates locally without requiring internet connectivity or satellite signals.
          </p>
        </div>
      </div>

      {/* Right: Explicit GPS & Network Architecture Status Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        {/* GPS */}
        <div className="bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded flex flex-col justify-center">
          <span className="text-gray-500 uppercase">GPS STATUS</span>
          <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            NOT USED
          </span>
        </div>

        {/* Internet */}
        <div className="bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded flex flex-col justify-center">
          <span className="text-gray-500 uppercase">INTERNET</span>
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            OFFLINE
          </span>
        </div>

        {/* Localization */}
        <div className="bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded flex flex-col justify-center">
          <span className="text-gray-500 uppercase">LOCALIZATION</span>
          <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            VISUAL SLAM
          </span>
        </div>

        {/* Coordinate Frame */}
        <div className="bg-[#0D0D0D] border border-[#222] px-2.5 py-1.5 rounded flex flex-col justify-center">
          <span className="text-gray-500 uppercase">POSITION</span>
          <span className="text-green-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            LOCAL (METERS)
          </span>
        </div>
      </div>
    </div>
  );
};
