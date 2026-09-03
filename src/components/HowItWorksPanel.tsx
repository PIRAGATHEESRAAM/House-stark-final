/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Compass, MapPin, Eye, Route, ShieldAlert, Cpu } from 'lucide-react';

export const HowItWorksPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = [
    {
      icon: Compass,
      title: 'Why GPS is Not Required',
      description:
        'The system uses local map coordinates (measured in metric offsets X/Y from the deployment origin) and onboard visual localization rather than global satellite coordinates (latitude/longitude). This allows complete operational independence in forests, mountain ravines, dense tunnels, urban canyons, or electronic warfare GPS-denied environments.',
    },
    {
      icon: Eye,
      title: 'How the Local Map is Created & Expanded',
      description:
        'The robot utilizes continuous monocular/stereo visual observations and Visual SLAM (Simultaneous Localization and Mapping). As the UGV traverses forward, previously unseen terrain inside its 75° camera FOV is progressively integrated into the local occupancy grid. Key landmark features are observed and tracked across frames to maintain an accurate spatial memory without relying on pre-existing satellite maps.',
    },
    {
      icon: MapPin,
      title: 'How Point B (Destination) is Selected & Navigated',
      description:
        'The operator designates a destination coordinate (Point B) on the local mission grid. Because the camera has a limited visual range (14m), the robot does not need to see the final destination immediately. Instead, the A* planner generates a metric path through known and newly discovered traversable cells, updating the route as new terrain is revealed.',
    },
    {
      icon: Route,
      title: 'How the Robot Knows it Reached Point B',
      description:
        'Goal verification is computed mathematically from the estimated robot pose relative to the stored goal pose. The system calculates the Euclidean position error: Position Error = √((x_robot - x_goal)² + (y_robot - y_goal)²). When this error drops below the configured goal tolerance (e.g., 0.50m) and the Visual SLAM localization confidence exceeds 85%, the goal status is confirmed and the UGV executes a controlled safe stop.',
    },
    {
      icon: ShieldAlert,
      title: 'How Obstacles & Human Hazards are Handled',
      description:
        'The onboard perception pipeline continuously scans the forward 14m field of view for natural obstacles (boulders, trees, ditches) as well as humans and field personnel. When any obstacle or person is identified in the path, the UGV automatically detects them, dynamically calculates a safe bypass trajectory using real-time A* replanning, and seamlessly navigates around them without requiring operator intervention or manual resume commands.',
    },
    {
      icon: Cpu,
      title: 'What Happens if Localization Becomes Unreliable',
      description:
        'If visual feature count falls below acceptable tracking thresholds (e.g., dense dust, sudden blackout, or featureless terrain), the localization confidence drops. The autonomous watchdog engages a fail-safe Safety Hold, commanding zero motor velocity to prevent dead reckoning drift until visual tracking is re-established.',
    },
  ];

  return (
    <div
      id="how-it-works-panel"
      className="bg-[#0A0A0A] border border-[#222] rounded p-3.5 flex flex-col gap-3 shadow-lg font-mono"
    >
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#141414] border border-[#333] text-green-400 group-hover:border-green-500 transition-colors">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Technical Principles & How It Works
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#141414] text-green-400 border border-[#333]">
                DOCUMENTATION
              </span>
            </h3>
            <p className="text-[10px] text-gray-500">
              Core concepts of vision-based GPS-denied autonomous UGV navigation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-white transition-colors">
          <span className="text-[10px] uppercase font-bold">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-[#222]">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="bg-[#0D0D0D] border border-[#222] rounded p-3 flex flex-col gap-2 hover:border-[#333] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#141414] border border-[#333] text-green-400">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight">{sec.title}</h4>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{sec.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
