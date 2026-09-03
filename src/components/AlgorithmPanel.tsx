/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Code2, Eye, Route, ShieldAlert, Cpu, Layers, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface AlgorithmPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlgorithmItem {
  id: string;
  name: string;
  category: string;
  purpose: string;
  input: string;
  output: string;
  role: string;
  math: string;
  codeSnippet: string;
}

export const AlgorithmPanel: React.FC<AlgorithmPanelProps> = ({ isOpen, onClose }) => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('astar');

  if (!isOpen) return null;

  const algorithms: AlgorithmItem[] = [
    {
      id: 'astar',
      name: 'A* (A-Star) Path Planning',
      category: 'Path Planning & Graph Search',
      purpose:
        'Computes the mathematically optimal collision-free path across the 2D discretized grid from Point A to Point B.',
      input: 'Current UGV Pose (Point A), Target Coordinates (Point B), 2D Occupancy Costmap with obstacle inflations.',
      output: 'Ordered sequence of waypoints {w0, w1, ..., wn} with minimum total travel cost.',
      role: 'Acts as the primary route planner, guiding the UGV through clear corridors while maintaining safety margins from rocks, trees, and ditches.',
      math: 'f(n) = g(n) + h(n), \\quad h(n) = \\sqrt{(x_n - x_{goal})^2 + (y_n - y_{goal})^2}',
      codeSnippet: `// 8-Directional Costed A* Step
const tentativeG = current.g + stepCost * cellCost(neighbor);
if (tentativeG < gScore[neighbor]) {
  gScore[neighbor] = tentativeG;
  fScore[neighbor] = tentativeG + euclideanDistance(neighbor, goal);
  openSet.push(neighbor);
}`,
    },
    {
      id: 'visual_odometry',
      name: 'Lucas-Kanade Optical Flow (Visual Odometry)',
      category: 'Motion Estimation / Dead Reckoning',
      purpose:
        'Estimates differential vehicle translation (Δx, Δy) and yaw rotation (Δθ) across consecutive camera frames without GPS.',
      input: 'Image frame I(t-1), Image frame I(t), FAST corner feature points.',
      output: '2D displacement vector [Δx, Δy] and heading increment Δθ.',
      role: 'Provides high-frequency dead-reckoning position updates between SLAM landmark loop closures.',
      math: 'I_x u + I_y v + I_t = 0 \\implies \\begin{bmatrix} u \\\\ v \\end{bmatrix} = (A^T A)^{-1} A^T b',
      codeSnippet: `// Feature tracking displacement
const flowX = speed * (feat.x - 0.5) - (deltaHeading / 45) * 0.35;
const flowY = speed * (feat.y - 0.25);
feat.x += flowX;
feat.y += flowY;`,
    },
    {
      id: 'slam',
      name: 'SLAM (Simultaneous Localization & Mapping)',
      category: 'State Estimation',
      purpose:
        'Constructs an occupancy map of the GPS-denied environment while simultaneously keeping track of the UGV location within that map.',
      input: 'Visual Odometry pose estimates, detected obstacle landmarks within 75° camera FOV.',
      output: 'Consistent global coordinate frame, landmark positions with covariance uncertainty, vehicle trajectory.',
      role: 'Cancels out cumulative visual dead-reckoning drift through landmark observation covariance reduction.',
      math: 'P_{k|k} = (I - K_k H_k) P_{k|k-1}, \\quad \\mu_{k|k} = \\mu_{k|k-1} + K_k (z_k - h(\\mu_{k|k-1}))',
      codeSnippet: `// Landmark covariance update
if (landmarkExists) {
  lm.observedCount++;
  lm.uncertaintyRadius = Math.max(0.12, lm.uncertaintyRadius * 0.95);
}`,
    },
    {
      id: 'segmentation',
      name: 'Semantic Path Segmentation & Obstacle Detection',
      category: 'Computer Vision / Deep Learning',
      purpose:
        'Classifies every pixel/region in the camera feed into Traversable Ground (Green), Hazard Obstacle (Red), or Uncertain Area (Yellow).',
      input: 'Single monocular RGB frame (640x360).',
      output: 'Class labels (Rock, Tree, Ditch, Vehicle, Person), bounding boxes, distance estimates in meters.',
      role: 'Serves as the eyes of the UGV, transforming raw pixel intensities into spatial obstacle coordinates.',
      math: '\\text{IoU} = \\frac{\\text{Area of Overlap}}{\\text{Area of Union}}, \\quad \\text{Confidence} = P(\\text{Class} | \\text{Object})',
      codeSnippet: `// Camera FOV obstacle projection
const { inFov, distance, relativeAngle } = isPointInFOV(ugvPos, ugvHeading, obsPos, 75, 14);
if (inFov) {
  detectedList.push({ label: obs.label, distance, direction, confidence: obs.confidence });
}`,
    },
    {
      id: 'dynamic_replanning',
      name: 'Dynamic Reactive Replanning & Safety Inflation',
      category: 'Control & Collision Avoidance',
      purpose:
        'Monitors active planned waypoints against newly appeared obstacles and dynamically generates safe alternative paths on the fly.',
      input: 'Active planned path spline, live obstacle positions, safety clearance radius (1.4m).',
      output: 'Immediate HALT trigger, invalidated waypoint slice, recalculated collision-free route.',
      role: 'Guarantees vehicle safety when unpredictable moving hazards (fallen rocks, pedestrians, animals) block the pre-calculated path.',
      math: 'R_{\\text{effective}} = R_{\\text{obstacle}} + R_{\\text{ugv\\_safety}} + \\epsilon',
      codeSnippet: `// Dynamic path blockage check
if (isPathObstructed(activePath, currentWaypointIdx, obstacles)) {
  ugv.halt();
  triggerEvent("DYNAMIC OBSTACLE DETECTED -> REPLANNING");
  newPath = planAStarPath(currentUGVPos, goalPoint, obstacles);
}`,
    },
  ];

  const selectedAlgo = algorithms.find((a) => a.id === selectedAlgoId) || algorithms[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#0A0A0A] border border-[#262626] rounded w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Core Autonomous Navigation Algorithms & Mathematical Formulations
              </h2>
              <p className="text-[10px] text-gray-500 font-mono">
                Mathematical Foundations of GPS-Denied Vision Robotics (SIH Demonstration)
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

        {/* Modal Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto flex-1">
          {/* Algorithm List Navigation */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider px-1">
              Algorithm Catalog
            </span>
            <div className="flex flex-col gap-1.5">
              {algorithms.map((algo) => {
                const isSelected = algo.id === selectedAlgoId;
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgoId(algo.id)}
                    className={`text-left p-3 rounded border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#141414] border-green-500 text-white shadow-md'
                        : 'bg-[#0D0D0D] border-[#222] hover:bg-[#141414] text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase">{algo.name}</div>
                      <div className="text-[10px] text-green-400 font-mono mt-0.5">{algo.category}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-green-400' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Algorithm In-Depth Specification */}
          <div className="md:col-span-8 flex flex-col gap-3">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider px-1">
              Mathematical & Algorithmic Breakdown
            </span>

            <div className="bg-[#0D0D0D] border border-[#222] rounded p-4 flex flex-col gap-3">
              <div className="pb-2 border-b border-[#222]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{selectedAlgo.name}</h3>
                <span className="text-[10px] font-mono text-green-400">{selectedAlgo.category}</span>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Purpose</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedAlgo.purpose}</p>
              </div>

              {/* Role */}
              <div>
                <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Role in System</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedAlgo.role}</p>
              </div>

              {/* I/O Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#141414] p-2.5 rounded border border-[#262626]">
                  <h5 className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">Input</h5>
                  <p className="text-xs text-gray-300 mt-1">{selectedAlgo.input}</p>
                </div>
                <div className="bg-[#141414] p-2.5 rounded border border-[#262626]">
                  <h5 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Output</h5>
                  <p className="text-xs text-gray-300 mt-1">{selectedAlgo.output}</p>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="bg-[#141414] p-3 rounded border border-[#262626]">
                <h5 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  Mathematical Formulation
                </h5>
                <div className="mt-1.5 p-2 bg-black rounded border border-[#333] font-mono text-xs text-indigo-300">
                  <code>{selectedAlgo.math}</code>
                </div>
              </div>

              {/* Code Implementation */}
              <div className="bg-[#141414] p-3 rounded border border-[#262626]">
                <h5 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Algorithm Implementation Snippet
                </h5>
                <pre className="mt-1.5 p-2.5 bg-black rounded border border-[#333] font-mono text-[11px] text-green-400 overflow-x-auto">
                  {selectedAlgo.codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050505] border-t border-[#222] flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Target Architecture: <strong className="text-green-400">Outdoor UGV ROS2 / TypeScript Simulation</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-black rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Algorithms View
          </button>
        </div>
      </div>
    </div>
  );
};
