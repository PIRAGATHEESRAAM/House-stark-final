/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, ArrowUpCircle, ArrowDownCircle, StopCircle, RotateCcw, RotateCw } from 'lucide-react';
import { MotorCommand } from '../types';

interface MotorCommandPanelProps {
  motorCommand: MotorCommand;
}

export const MotorCommandPanel: React.FC<MotorCommandPanelProps> = ({ motorCommand }) => {
  const getCommandBadge = (cmd: MotorCommand['command']) => {
    switch (cmd) {
      case 'FORWARD':
        return { label: 'FORWARD', bg: 'bg-green-950/40 text-green-400 border-green-500/40', icon: ArrowUpCircle };
      case 'REVERSE':
        return { label: 'REVERSE', bg: 'bg-amber-950/40 text-amber-400 border-amber-500/40', icon: ArrowDownCircle };
      case 'LEFT':
        return { label: 'PIVOT LEFT', bg: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40', icon: RotateCcw };
      case 'RIGHT':
        return { label: 'PIVOT RIGHT', bg: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40', icon: RotateCw };
      case 'STOP':
      default:
        return { label: 'HALTED / STOP', bg: 'bg-red-950/40 text-red-400 border-red-500/40', icon: StopCircle };
    }
  };

  const badge = getCommandBadge(motorCommand.command);
  const Icon = badge.icon;

  return (
    <div id="motor-panel" className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Differential Motor Controller</h3>
            <p className="text-[10px] text-gray-500 font-mono">Actuator PWM & H-Bridge Direction Signals</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${badge.bg}`}>
          <Icon className="w-3.5 h-3.5" />
          {badge.label}
        </div>
      </div>

      {/* Left and Right Motors Dual Card */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left Motor Card */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-wider">LEFT ACTUATOR</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A1A] text-gray-400 border border-[#333]">
              PWM 1
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500 text-[10px]">DIR:</span>
            <span className="font-bold text-green-400">{motorCommand.leftMotor.direction}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500 text-[10px]">DUTY:</span>
            <span className="font-bold text-cyan-400">{motorCommand.leftMotor.speedPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden mt-1 border border-[#333]">
            <div
              className="bg-green-500 h-full transition-all duration-150"
              style={{ width: `${motorCommand.leftMotor.speedPercent}%` }}
            />
          </div>
        </div>

        {/* Right Motor Card */}
        <div className="bg-[#0D0D0D] border border-[#222] rounded p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-wider">RIGHT ACTUATOR</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A1A] text-gray-400 border border-[#333]">
              PWM 2
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500 text-[10px]">DIR:</span>
            <span className="font-bold text-green-400">{motorCommand.rightMotor.direction}</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500 text-[10px]">DUTY:</span>
            <span className="font-bold text-cyan-400">{motorCommand.rightMotor.speedPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden mt-1 border border-[#333]">
            <div
              className="bg-green-500 h-full transition-all duration-150"
              style={{ width: `${motorCommand.rightMotor.speedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
