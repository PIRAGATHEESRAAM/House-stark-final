/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu, ArrowRight, Layers, Camera, Network, Route, Gauge, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const HardwareIntegrationSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const stackLayers = [
    {
      title: 'Camera / Sensor Input',
      simulated: 'Simulated Synthetic Monocular 3D / Browser MediaStream Video',
      hardware: 'Intel RealSense D435i / Stereolabs ZED 2i / FLIR BFS-U3 (60 FPS RGB-D)',
      icon: Camera,
      badge: 'Perception Layer',
    },
    {
      title: 'ROS 2 Sensor Interface',
      simulated: 'Simulated Event Bus & Frame Processor Service',
      hardware: 'ROS 2 Humble / Iron sensor_msgs/Image & sensor_msgs/Imu pub/sub topics',
      icon: Network,
      badge: 'Middleware',
    },
    {
      title: 'Visual SLAM / Odometry',
      simulated: 'Feature Tracker + Graph SLAM Simulation Loop',
      hardware: 'RTAB-Map / ORB-SLAM3 / OpenVINS ROS 2 Node (EKF Fused odometry)',
      icon: Layers,
      badge: 'State Estimation',
    },
    {
      title: 'Navigation Stack',
      simulated: 'Dynamic A* Planner with Safety Costmap Inflation',
      hardware: 'Nav2 (Navigation 2) Costmap_2d + SmacPlanner / DWB Local Planner',
      icon: Route,
      badge: 'Planning & Control',
    },
    {
      title: 'Motor Controller & Actuators',
      simulated: 'Differential Kinematics Simulator (PWM % Left/Right)',
      hardware: 'Roboteq SDC2160 / VESC Dual Speed Controllers over CAN Bus / RS-485',
      icon: Gauge,
      badge: 'Actuation',
    },
  ];

  return (
    <div
      id="hardware-integration-ready"
      className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                HARDWARE INTEGRATION READY ARCHITECTURE
              </h3>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                ROS 2 COMPLIANT
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              Modular pipeline designed for rapid deployment onto physical UGV platforms
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>{isOpen ? 'Hide Hardware Specs' : 'View Hardware Specs'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* High-level Flow Row */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {stackLayers.map((layer, idx) => {
          const Icon = layer.icon;
          return (
            <div
              key={idx}
              className="bg-[#0D0D0D] border border-[#222] p-2.5 rounded flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-500 font-bold">STAGE 0{idx + 1}</span>
                <span className="text-[8px] text-green-400 bg-green-950/40 px-1.5 py-0.5 rounded border border-green-500/30">
                  {layer.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 my-2">
                <Icon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase truncate">{layer.title}</span>
              </div>
              <div className="text-[9px] text-gray-400 border-t border-[#222] pt-1">
                <span className="text-gray-500">Target:</span> {layer.hardware.split('/')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Specs Drawer */}
      {isOpen && (
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#222]">
          <div className="flex items-center justify-between px-2 text-[10px] text-gray-400">
            <span className="font-bold text-cyan-400 uppercase">CURRENT SOFTWARE SIMULATION</span>
            <span className="font-bold text-green-400 uppercase">FUTURE PHYSICAL HARDWARE INTEGRATION</span>
          </div>

          <div className="space-y-2">
            {stackLayers.map((layer, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-[#0D0D0D] p-2.5 rounded border border-[#222] items-center text-xs"
              >
                <div className="md:col-span-3 font-bold text-white uppercase text-[11px] flex items-center gap-2">
                  <span className="text-gray-500">0{idx + 1}.</span> {layer.title}
                </div>

                <div className="md:col-span-4 text-[10px] text-gray-400 bg-[#141414] p-2 rounded border border-[#262626]">
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">Simulation Implementation:</span>
                  {layer.simulated}
                </div>

                <div className="md:col-span-5 text-[10px] text-green-300 bg-[#141414] p-2 rounded border border-green-900/40">
                  <span className="text-green-500 block uppercase font-bold text-[9px]">Physical Hardware Target:</span>
                  {layer.hardware}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#111] p-2.5 rounded border border-[#333] text-[10px] text-gray-400 flex items-center justify-between flex-wrap gap-2 mt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>Architecture is directly portable to an on-vehicle NVIDIA Jetson AGX Orin with ROS 2 Humble.</span>
            </div>
            <span className="text-gray-500">ZERO CLOUD DEPENDENCY • 100% EMBEDDED COMPUTE</span>
          </div>
        </div>
      )}
    </div>
  );
};
