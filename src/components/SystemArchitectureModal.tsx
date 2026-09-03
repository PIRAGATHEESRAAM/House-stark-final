/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Network, Camera, Brain, MapPin, Eye, Route, ShieldAlert, Cpu, ArrowDown, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PipelineNode {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  description: string;
  inputs: string[];
  outputs: string[];
  hardwareRealWorld: string;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('camera');

  if (!isOpen) return null;

  const pipelineNodes: PipelineNode[] = [
    {
      id: 'camera',
      title: '1. Camera / Video Input',
      subtitle: 'Visual Sensor Stream',
      icon: Camera,
      color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/40 text-cyan-400',
      description:
        'Continuous high-framerate video feed captured by the front monocular/stereo RGB camera. Functions as the primary perceptual sensor replacing GPS satellites in dense tree canopies, canyons, or electronic warfare zones.',
      inputs: ['Raw RGB Video Stream (60 FPS, 1080p/720p)', 'Simulated Outdoor Synthetic Render'],
      outputs: ['Sequential Image Frames (t, t-1)', 'Exposure / Color Normalized Matrices'],
      hardwareRealWorld: 'ZED2i Stereo Camera / Intel RealSense D435i / Basler USB3 Vision',
    },
    {
      id: 'perception',
      title: '2. Perception AI & Segmentation',
      subtitle: 'Deep Learning Object Detection',
      icon: Brain,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400',
      description:
        'Analyzes visual frames to perform semantic segmentation separating traversable ground paths from un-navigable hazards (boulders, tree trunks, steep erosion ditches, vehicles, personnel).',
      inputs: ['Normalized Current Frame (t)'],
      outputs: ['Traversable Ground Mask (Green)', 'Bounding Boxes + Class Labels + Confidence Scores', 'Relative Polar Coordinates (r, θ)'],
      hardwareRealWorld: 'NVIDIA Jetson AGX Orin / TensorRT YOLOv8-Seg / MobileNet-V3',
    },
    {
      id: 'vo_slam',
      title: '3. Visual Odometry / SLAM',
      subtitle: 'Feature Tracking & Dead Reckoning',
      icon: Eye,
      color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/40 text-cyan-300',
      description:
        'Tracks FAST corner landmarks and Lucas-Kanade optical flow vectors across consecutive frames to compute relative vehicle pose updates (Δx, Δy, Δθ). Graph-SLAM maintains a persistent landmark database to cancel out dead reckoning drift.',
      inputs: ['Sequential Frames (t, t-1)', 'Estimated Landmarks'],
      outputs: ['Estimated Pose (X, Y, Heading)', 'Landmark Covariance Map', 'Velocity Vector (vx, vy, ω)'],
      hardwareRealWorld: 'ORB-SLAM3 / RTAB-Map / OpenVINS running on ROS 2 Node',
    },
    {
      id: 'pose_estimation',
      title: '4. Current Position Estimation',
      subtitle: 'Local Coordinate Frame State',
      icon: MapPin,
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400',
      description:
        'Fuses Visual Odometry motion estimates with SLAM landmark associations to maintain the UGV global map reference frame without needing any external GPS or satellite signals.',
      inputs: ['VO Motion Increments', 'SLAM Landmark Corrections'],
      outputs: ['State Vector [x, y, θ, v]', 'Uncertainty Ellipse'],
      hardwareRealWorld: 'Robot Localization EKF (Extended Kalman Filter) ROS2 node',
    },
    {
      id: 'path_planner',
      title: '5. A* Path Planner',
      subtitle: 'Global & Local Route Solver',
      icon: Route,
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-400',
      description:
        'Computes the minimum-cost collision-free trajectory from Point A (UGV Start) to Point B (User Goal) through discretized costmaps, factoring in safety buffer inflation margins around detected obstacles.',
      inputs: ['Current Estimated Pose (Point A)', 'Target Destination (Point B)', 'Occupancy Costmap Grid'],
      outputs: ['Smoothed Waypoint Spline', 'Path Length (m)', 'Estimated Traversal Time (s)'],
      hardwareRealWorld: 'Nav2 Planner Server (A*, SmacPlanner Hybrid-A*, Theta*)',
    },
    {
      id: 'collision_avoidance',
      title: '6. Dynamic Collision Avoidance',
      subtitle: 'Real-time Replanning Watchdog',
      icon: ShieldAlert,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-400',
      description:
        'Continuously monitors the active path against newly detected static and dynamic obstacles. If a hazard intersects the forward trajectory safety bubble, it instantly commands an emergency halt and triggers dynamic A* replanning.',
      inputs: ['Active Planned Waypoints', 'Live Perception Obstacle List (FOV range 14m)'],
      outputs: ['Trajectory Interception Alert', 'Emergency Stop Trigger', 'Replan Request Flag'],
      hardwareRealWorld: 'Nav2 Controller / Costmap Filters / Recovery Server',
    },
    {
      id: 'motor_control',
      title: '7. Motor Command Simulation',
      subtitle: 'Differential Kinematics Actuation',
      icon: Cpu,
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/40 text-indigo-400',
      description:
        'Translates desired linear velocity (v) and angular yaw rate (ω) into left and right wheel motor PWM signals and rotation directions using differential drive pure-pursuit kinematics.',
      inputs: ['Next Waypoint (wx, wy)', 'Current Heading (θ)', 'Speed Limit'],
      outputs: ['Left Motor: [Direction, PWM%]', 'Right Motor: [Direction, PWM%]', 'Simulated CAN / Serial Frames'],
      hardwareRealWorld: 'Roboteq / VESC Motor Controllers / CAN bus Transceiver',
    },
    {
      id: 'ugv_actuation',
      title: '8. UGV Platform Execution',
      subtitle: 'Physical Movement & Feedback Loop',
      icon: CheckCircle2,
      color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300',
      description:
        'The mobile robotic ground vehicle moves physically across outdoor terrain, shifting the camera perspective and completing the autonomous perception-action loop.',
      inputs: ['Dual Motor Torques / Speed'],
      outputs: ['Displaced Vehicle State', 'New Visual Frame (Loop Repeats)'],
      hardwareRealWorld: '4WD / 6WD Skid-steer Outdoor Robotic Chassis',
    },
  ];

  const selectedNode = pipelineNodes.find((n) => n.id === selectedNodeId) || pipelineNodes[0];
  const IconComponent = selectedNode.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#0A0A0A] border border-[#262626] rounded w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                End-to-End System Architecture (SIH Demonstration)
              </h2>
              <p className="text-[10px] text-gray-500 font-mono">
                Vision-Based Autonomous Navigation Pipeline in GPS-Denied Environments
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto flex-1">
          {/* Left Column: Visual Pipeline Flow */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider px-1">
              Autonomous Pipeline Flow
            </span>
            <div className="flex flex-col gap-1.5">
              {pipelineNodes.map((node, index) => {
                const NodeIcon = node.icon;
                const isSelected = node.id === selectedNodeId;
                return (
                  <React.Fragment key={node.id}>
                    <button
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`text-left p-2.5 rounded border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#141414] border-green-500 text-white shadow-md'
                          : 'bg-[#0D0D0D] border-[#222] hover:bg-[#141414] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded border bg-[#0A0A0A] border-[#333] text-green-400`}>
                          <NodeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">{node.title}</div>
                          <div className="text-[10px] text-gray-400">{node.subtitle}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-green-400' : 'text-gray-600'}`} />
                    </button>
                    {index < pipelineNodes.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Column: Node Details Inspector */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider px-1">
              Module Technical Specifications
            </span>

            <div className="bg-[#0D0D0D] border border-[#222] rounded p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-3 border-b border-[#222]">
                <div className="p-2 rounded border bg-[#141414] border-[#333] text-green-400">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{selectedNode.title}</h3>
                  <p className="text-[10px] text-green-400 font-mono">{selectedNode.subtitle}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Functional Role</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedNode.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-[#141414] p-2.5 rounded border border-[#262626]">
                  <h5 className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">Inputs</h5>
                  <ul className="text-xs text-gray-300 mt-1 list-disc list-inside space-y-1">
                    {selectedNode.inputs.map((inp, idx) => (
                      <li key={idx} className="text-[10px] font-mono leading-tight text-gray-300">{inp}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#141414] p-2.5 rounded border border-[#262626]">
                  <h5 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Outputs</h5>
                  <ul className="text-xs text-gray-300 mt-1 list-disc list-inside space-y-1">
                    {selectedNode.outputs.map((out, idx) => (
                      <li key={idx} className="text-[10px] font-mono leading-tight text-gray-300">{out}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#333] p-2.5 rounded mt-1">
                <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">
                  Hardware & Robotics Ecosystem Compatibility (ROS 2 / Real UGV Integration)
                </span>
                <p className="text-xs font-mono text-green-300 mt-1">{selectedNode.hardwareRealWorld}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050505] border-t border-[#222] flex items-center justify-between text-xs font-mono text-gray-400">
          <span>GPS Sensor: <strong className="text-red-400">OFFLINE / UNNECESSARY</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-black rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Architecture View
          </button>
        </div>
      </div>
    </div>
  );
};
