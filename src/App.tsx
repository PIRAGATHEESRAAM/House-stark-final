/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Compass,
  Radio,
  Eye,
  Route,
  Activity,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Network,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  UGVState,
  Point,
  Obstacle,
  DetectedObstacle,
  SLAMLandmark,
  VisualFeaturePoint,
  VisualOdometryData,
  MotorCommand,
  TelemetryData,
  EventLogItem,
  NavigationState,
  CameraSourceMode,
} from './types';
import { generateOutdoorEnvironment, spawnDynamicObstacleInFront } from './utils/mapGenerator';
import { planAStarPath, isPathObstructed } from './services/pathPlanner';
import { VisualOdometrySimulator } from './services/visualOdometry';
import { SLAMSimulator } from './services/slamSimulation';
import { PerceptionService } from './services/perception';
import { angleBetween, angleDifference, euclideanDistance, normalizeAngle } from './utils/geometry';

// UI Components
import { CameraPanel } from './components/CameraPanel';
import { MapPanel } from './components/MapPanel';
import { TelemetryPanel } from './components/TelemetryPanel';
import { VisualOdometryPanel } from './components/VisualOdometryPanel';
import { MotorCommandPanel } from './components/MotorCommandPanel';
import { PerceptionPanel } from './components/PerceptionPanel';
import { EventLog } from './components/EventLog';
import { Controls } from './components/Controls';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { AlgorithmPanel } from './components/AlgorithmPanel';
import { OfflineModeBanner } from './components/OfflineModeBanner';
import { MissionSetupPanel } from './components/MissionSetupPanel';
import { StateMachineTracker } from './components/StateMachineTracker';
import { HowItWorksPanel } from './components/HowItWorksPanel';
import { HardwareIntegrationSection } from './components/HardwareIntegrationSection';
import { JudgePresentationModal } from './components/JudgePresentationModal';

export default function App() {
  // Navigation & World State
  const [startPos, setStartPos] = useState<Point>({ x: 4, y: 35 });
  const [goalPos, setGoalPos] = useState<Point>({ x: 35, y: 5 });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [plannedPath, setPlannedPath] = useState<Point[]>([]);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [trajectory, setTrajectory] = useState<Point[]>([]);
  const [navigationState, setNavigationState] = useState<NavigationState>('IDLE');
  const [isGoalLocked, setIsGoalLocked] = useState<boolean>(true);
  const [goalTolerance, setGoalTolerance] = useState<number>(0.5);

  // UGV Kinematic State
  const [ugv, setUgv] = useState<UGVState>({
    x: 4,
    y: 35,
    heading: 0,
    speed: 0,
    targetSpeed: 1.2,
    distanceTravelled: 0,
    batteryLevel: 98,
    localizationConfidence: 96,
  });

  // Services State
  const [detectedObstacles, setDetectedObstacles] = useState<DetectedObstacle[]>([]);
  const [landmarks, setLandmarks] = useState<SLAMLandmark[]>([]);
  const [featurePoints, setFeaturePoints] = useState<VisualFeaturePoint[]>([]);
  const [cameraMode, setCameraMode] = useState<CameraSourceMode>('simulated');
  const [voData, setVoData] = useState<VisualOdometryData>({
    voX: 4,
    voY: 35,
    voHeading: 0,
    distanceTravelled: 0,
    trackedFeaturesCount: 35,
    opticalFlowMagnitude: 0,
    driftErrorEstimate: 0,
    fps: 60,
    status: 'TRACKING',
    confidence: 96,
  });

  // Motor Commands
  const [motorCommand, setMotorCommand] = useState<MotorCommand>({
    leftMotor: { direction: 'STOP', speedPercent: 0 },
    rightMotor: { direction: 'STOP', speedPercent: 0 },
    command: 'STOP',
  });

  // Telemetry & Logs
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    ugvX: 4,
    ugvY: 35,
    heading: 0,
    speed: 0,
    distanceTravelled: 0,
    distanceToGoal: 44.5,
    positionError: 44.5,
    obstacleCount: 0,
    pathLength: 0,
    waypointsCount: 0,
    currentWaypointIndex: 0,
    navigationState: 'IDLE',
    fps: 60,
    perceptionStatus: 'ACTIVE',
    plannerStatus: 'IDLE',
    gpsStatus: 'NOT USED',
    internetStatus: 'DISCONNECTED / OFFLINE',
    localizationType: 'VISUAL SLAM',
    coordinatesType: 'LOCAL MAP (METERS)',
    localizationConfidence: 96,
    planningLatencyMs: 3.4,
    perceptionFps: 60,
    navigationSuccessRate: 98.4,
    goalTolerance: 0.5,
  });

  const [logs, setLogs] = useState<EventLogItem[]>([]);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);

  // Modals
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);

  // Service Singletons Refs
  const voSimulatorRef = useRef<VisualOdometrySimulator>(new VisualOdometrySimulator(4, 35, 0));
  const slamSimulatorRef = useRef<SLAMSimulator>(new SLAMSimulator());
  const perceptionServiceRef = useRef<PerceptionService>(new PerceptionService());
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());

  // Logging Helper
  const addLog = useCallback((message: string, type: EventLogItem['type'] = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: timeStr,
        message,
        type,
      },
    ]);
  }, []);

  // Initialize Default Environment
  useEffect(() => {
    const env = generateOutdoorEnvironment('sih_demo');
    setStartPos(env.startPos);
    setGoalPos(env.goalPos);
    setObstacles(env.obstacles);

    const initialHeading = angleBetween(env.startPos, env.goalPos);
    setUgv({
      x: env.startPos.x,
      y: env.startPos.y,
      heading: initialHeading,
      speed: 0,
      targetSpeed: 1.2,
      distanceTravelled: 0,
      batteryLevel: 98,
      localizationConfidence: 96,
    });

    voSimulatorRef.current.reset(env.startPos.x, env.startPos.y, initialHeading);
    slamSimulatorRef.current.reset(env.startPos);

    // Initial Path Plan
    const result = planAStarPath(env.startPos, env.goalPos, env.obstacles);
    if (result.success) {
      setPlannedPath(result.smoothedPath);
      setCurrentWaypointIdx(0);
    }

    addLog('System initialized in GPS-Denied Autonomous Mode', 'info');
    addLog('GPS status: NOT USED • Operating entirely on Visual Odometry & Graph SLAM', 'info');
    addLog('Outdoor environment loaded with natural rocks, tree trunks and terrain hazards', 'info');
    addLog(`Destination Point B locked at (${env.goalPos.x}m, ${env.goalPos.y}m)`, 'plan');
    addLog(`Initial A* route computed (Length: ${result.pathLength}m, ${result.waypointCount} waypoints)`, 'plan');
  }, [addLog]);

  // Recalculate A* Path
  const recalculatePath = useCallback(
    (start: Point, goal: Point, currentObs: Obstacle[]) => {
      setTelemetry((prev) => ({ ...prev, plannerStatus: 'COMPUTING' }));
      const result = planAStarPath(start, goal, currentObs);
      if (result.success) {
        setPlannedPath(result.smoothedPath);
        setCurrentWaypointIdx(0);
        setTelemetry((prev) => ({
          ...prev,
          pathLength: result.pathLength,
          waypointsCount: result.waypointCount,
          planningLatencyMs: result.computeTimeMs,
          plannerStatus: 'ACTIVE',
        }));
        return result;
      } else {
        addLog('A* path planning failed: No collision-free route found', 'error');
        setNavigationState('ERROR');
        return result;
      }
    },
    [addLog]
  );

  // Set Goal (Point B) interactively
  const handleSetGoal = (pt: Point) => {
    setGoalPos(pt);
    addLog(`Point B selected: (${pt.x}m, ${pt.y}m)`, 'info');
    const result = recalculatePath({ x: ugv.x, y: ugv.y }, pt, obstacles);
    if (result.success) {
      addLog(`Collision-free path generated to Point B (Length: ${result.pathLength}m)`, 'plan');
    }
  };

  const handleLockGoal = () => {
    setIsGoalLocked(true);
    addLog(`Point B goal locked at (${goalPos.x}m, ${goalPos.y}m)`, 'success');
  };

  const handleUnlockGoal = () => {
    setIsGoalLocked(false);
    addLog('Point B goal unlocked: Click on map to reposition destination coordinate', 'warning');
  };

  const handleClearGoal = () => {
    setIsGoalLocked(false);
    setPlannedPath([]);
    addLog('Goal cleared. Please select Point B on the local grid.', 'warning');
  };

  // Add Manual Obstacle
  const handleAddObstacleAt = (pt: Point) => {
    const newObs: Obstacle = {
      id: `obs_manual_${Date.now()}`,
      x: pt.x,
      y: pt.y,
      radius: 1.4,
      type: 'rock',
      label: 'Manual Hazard Obstacle',
      confidence: 93,
    };
    const updated = [...obstacles, newObs];
    setObstacles(updated);
    addLog(`Obstacle placed at (${pt.x}m, ${pt.y}m)`, 'warning');

    if (navigationState === 'NAVIGATING') {
      const obstruction = isPathObstructed(plannedPath, currentWaypointIdx, updated);
      if (obstruction.isObstructed) {
        handleTriggerReplanning(updated);
      }
    } else {
      recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, updated);
    }
  };

  // Add Dynamic Obstacle In Front
  const handleAddObstacleInFront = () => {
    const dynObs = spawnDynamicObstacleInFront({ x: ugv.x, y: ugv.y }, ugv.heading, 4.5);
    const updated = [...obstacles, dynObs];
    setObstacles(updated);
    addLog(`DYNAMIC OBSTACLE DETECTED directly in path: ${dynObs.label}`, 'warning');

    if (navigationState === 'NAVIGATING') {
      handleTriggerReplanning(updated);
    } else {
      recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, updated);
    }
  };

  // Inject Person / Dynamic Obstacle (Automatic Bypass)
  const handleInjectPerson = () => {
    const headingRad = (ugv.heading * Math.PI) / 180;
    const px = Math.max(2, Math.min(38, ugv.x + Math.cos(headingRad) * 4.2));
    const py = Math.max(2, Math.min(38, ugv.y + Math.sin(headingRad) * 4.2));

    const person: Obstacle = {
      id: `person_${Date.now()}`,
      x: Number(px.toFixed(1)),
      y: Number(py.toFixed(1)),
      radius: 0.8,
      type: 'person',
      label: 'Pedestrian / Human',
      confidence: 97,
      isDynamic: true,
    };

    const updated = [...obstacles, person];
    setObstacles(updated);

    addLog(`HUMAN DETECTED in forward path at (${person.x}m, ${person.y}m) - AUTOMATIC BYPASS ENGAGED`, 'warning');
    addLog('Autonomous Dynamic Replan: Calculating safe clearance route around human...', 'plan');

    if (navigationState === 'NAVIGATING') {
      handleTriggerReplanning(updated);
    } else {
      recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, updated);
    }
  };

  // Dynamic Replanning Sequence (Auto-bypasses obstacles and humans seamlessly)
  const handleTriggerReplanning = (currentObs: Obstacle[]) => {
    setNavigationState('OBSTACLE_DETECTED');
    setUgv((prev) => ({ ...prev, speed: Math.min(0.4, prev.speed) }));

    const obstruction = isPathObstructed(plannedPath, currentWaypointIdx, currentObs);
    const isPerson = obstruction.conflictingObstacle?.type === 'person';

    if (isPerson) {
      addLog('Human detected directly in trajectory corridor', 'warning');
      addLog('AUTOMATIC HUMAN BYPASS: Computing safe margin detour...', 'plan');
    } else {
      addLog('Obstacle detected in forward path', 'warning');
      addLog('DYNAMIC REPLANNING: Computing alternative corridor...', 'plan');
    }

    setTimeout(() => {
      setNavigationState('REPLANNING');
      const replanResult = planAStarPath({ x: ugv.x, y: ugv.y }, goalPos, currentObs);

      if (replanResult.success) {
        setPlannedPath(replanResult.smoothedPath);
        setCurrentWaypointIdx(0);
        addLog(`NEW SAFE ROUTE GENERATED (Length: ${replanResult.pathLength}m, Waypoints: ${replanResult.waypointCount})`, 'success');
        addLog('Continuing autonomous navigation seamlessly without operator intervention', 'info');
        setNavigationState('NAVIGATING');
      } else {
        addLog('Replanning failed: No viable alternative corridor found', 'error');
        setNavigationState('ERROR');
      }
    }, 450);
  };

  // Navigation Control Actions
  const handleStart = () => {
    if (navigationState === 'NAVIGATING') return;
    if (plannedPath.length === 0) {
      recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, obstacles);
    }
    setIsGoalLocked(true);
    setNavigationState('NAVIGATING');
    addLog('UGV navigation started in autonomous mode', 'info');
  };

  const handlePause = () => {
    setNavigationState('IDLE');
    setUgv((prev) => ({ ...prev, speed: 0 }));
    setMotorCommand({
      leftMotor: { direction: 'STOP', speedPercent: 0 },
      rightMotor: { direction: 'STOP', speedPercent: 0 },
      command: 'STOP',
    });
    addLog('Navigation paused by operator', 'info');
  };

  const handleStop = () => {
    setNavigationState('IDLE');
    setUgv((prev) => ({ ...prev, speed: 0 }));
    setMotorCommand({
      leftMotor: { direction: 'STOP', speedPercent: 0 },
      rightMotor: { direction: 'STOP', speedPercent: 0 },
      command: 'STOP',
    });
    addLog('Navigation stopped and halted', 'warning');
  };

  const handleReset = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    setIsDemoActive(false);
    setNavigationState('IDLE');

    const env = generateOutdoorEnvironment('sih_demo');
    setStartPos(env.startPos);
    setGoalPos(env.goalPos);
    setObstacles(env.obstacles);
    setTrajectory([]);

    const initialHeading = angleBetween(env.startPos, env.goalPos);
    setUgv({
      x: env.startPos.x,
      y: env.startPos.y,
      heading: initialHeading,
      speed: 0,
      targetSpeed: 1.2,
      distanceTravelled: 0,
      batteryLevel: 98,
      localizationConfidence: 96,
    });

    voSimulatorRef.current.reset(env.startPos.x, env.startPos.y, initialHeading);
    slamSimulatorRef.current.reset(env.startPos);

    const result = planAStarPath(env.startPos, env.goalPos, env.obstacles);
    if (result.success) {
      setPlannedPath(result.smoothedPath);
      setCurrentWaypointIdx(0);
    }

    setMotorCommand({
      leftMotor: { direction: 'STOP', speedPercent: 0 },
      rightMotor: { direction: 'STOP', speedPercent: 0 },
      command: 'STOP',
    });

    addLog('Simulation reset to initial state at Point A', 'info');
  };

  // Step Single Frame
  const handleStep = () => {
    if (navigationState !== 'NAVIGATING' && plannedPath.length > 0) {
      setNavigationState('NAVIGATING');
      setTimeout(() => {
        setNavigationState('IDLE');
        setUgv((prev) => ({ ...prev, speed: 0 }));
        setMotorCommand({
          leftMotor: { direction: 'STOP', speedPercent: 0 },
          rightMotor: { direction: 'STOP', speedPercent: 0 },
          command: 'STOP',
        });
      }, 150);
      addLog('Advanced simulation by 1 step', 'info');
    }
  };

  const handleGenerateMap = () => {
    handleReset();
    addLog('New outdoor terrain environment generated', 'info');
  };

  const handleRandomObstacles = () => {
    const env = generateOutdoorEnvironment('open_trail', 20);
    setObstacles(env.obstacles);
    addLog('Random obstacle distribution scattered across map', 'info');
    recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, env.obstacles);
  };

  const handleClearMap = () => {
    setObstacles([]);
    addLog('All obstacles cleared from environment', 'info');
    recalculatePath({ x: ugv.x, y: ugv.y }, goalPos, []);
  };

  // Demo Mode (1-Click SIH End-to-End Sequence)
  const handleRunDemoMode = () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    setIsDemoActive(true);
    handleReset();

    addLog('----------------------------------------------------', 'info');
    addLog('SIH DEMONSTRATION MODE INITIATED', 'plan');
    addLog('1. Terrain generated without GPS availability', 'info');
    addLog('2. Point A established as Start origin', 'info');
    addLog('3. Point B established as Goal destination', 'info');
    addLog('4. Visual Perception active, identifying boulders, trees & ditches', 'info');
    addLog('5. A* planner computing initial collision-free path', 'plan');

    setTimeout(() => {
      setNavigationState('NAVIGATING');
      addLog('6. UGV begins autonomous trajectory navigation', 'info');

      demoTimerRef.current = setTimeout(() => {
        addLog('7. Simulating dynamic hazard event: Boulder slides into path!', 'warning');
        handleAddObstacleInFront();
      }, 3200);
    }, 800);
  };

  // ==========================================
  // Main Real-Time Simulation Loop
  // ==========================================
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      // 1. Perception Update
      const perceptionResult = perceptionServiceRef.current.processFrame(ugv, obstacles, cameraMode);
      setDetectedObstacles(perceptionResult.detectedObstacles);

      // 2. SLAM Landmark & Occupancy Update
      slamSimulatorRef.current.update(ugv, obstacles);
      setLandmarks(slamSimulatorRef.current.getLandmarks());
      setTrajectory(slamSimulatorRef.current.getTrajectory());

      // 3. Navigation Movement Controller
      if (navigationState === 'NAVIGATING' && plannedPath.length > 0) {
        let targetWaypoint = plannedPath[currentWaypointIdx];

        const distToWp = euclideanDistance({ x: ugv.x, y: ugv.y }, targetWaypoint);
        if (distToWp < 0.7 && currentWaypointIdx < plannedPath.length - 1) {
          setCurrentWaypointIdx((prev) => prev + 1);
          targetWaypoint = plannedPath[Math.min(plannedPath.length - 1, currentWaypointIdx + 1)];
        }

        const distToGoal = euclideanDistance({ x: ugv.x, y: ugv.y }, goalPos);

        // Goal Reached Detection (with tolerance check)
        if (distToGoal <= goalTolerance && voData.confidence >= 80) {
          setNavigationState('GOAL_REACHED');
          setUgv((prev) => ({ ...prev, speed: 0 }));
          setMotorCommand({
            leftMotor: { direction: 'STOP', speedPercent: 0 },
            rightMotor: { direction: 'STOP', speedPercent: 0 },
            command: 'STOP',
          });
          addLog(`GOAL VERIFICATION: Position Error = ${distToGoal.toFixed(2)}m <= ${goalTolerance}m (Confidence: ${voData.confidence}%)`, 'success');
          addLog('GOAL REACHED - NAVIGATION SUCCESSFUL', 'success');
          addLog('UGV successfully navigated from Point A to Point B in GPS-denied outdoor environment.', 'success');
          if (isDemoActive) {
            setIsDemoActive(false);
          }
        } else {
          // Compute heading steer
          const desiredHeading = angleBetween({ x: ugv.x, y: ugv.y }, targetWaypoint);
          const headingDiff = angleDifference(desiredHeading, ugv.heading);

          const maxTurnRate = 80;
          const turnStep = Math.max(-maxTurnRate * dt, Math.min(maxTurnRate * dt, headingDiff));
          const newHeading = normalizeAngle(ugv.heading + turnStep);

          const isSharpTurn = Math.abs(headingDiff) > 35;
          const targetSpeed = isSharpTurn ? 0.5 : 1.2;
          const speedStep = 1.8 * dt;
          const newSpeed = Math.min(targetSpeed, ugv.speed + speedStep);

          const rad = (newHeading * Math.PI) / 180;
          const deltaDist = newSpeed * dt;
          const newX = ugv.x + Math.cos(rad) * deltaDist;
          const newY = ugv.y + Math.sin(rad) * deltaDist;

          // Update UGV state
          setUgv((prev) => ({
            ...prev,
            x: Number(newX.toFixed(3)),
            y: Number(newY.toFixed(3)),
            heading: Number(newHeading.toFixed(2)),
            speed: Number(newSpeed.toFixed(2)),
            distanceTravelled: prev.distanceTravelled + deltaDist,
            batteryLevel: Math.max(10, prev.batteryLevel - dt * 0.01),
            localizationConfidence: voData.confidence,
          }));

          // 4. Visual Odometry Update
          const voResult = voSimulatorRef.current.update(ugv, deltaDist, turnStep, dt);
          setVoData(voResult);
          setFeaturePoints([...voSimulatorRef.current.getFeatures()]);

          // 5. Differential Motor Simulation Update
          let leftDir: MotorCommand['leftMotor']['direction'] = 'FORWARD';
          let rightDir: MotorCommand['rightMotor']['direction'] = 'FORWARD';
          let leftSpeed = 75;
          let rightSpeed = 75;
          let command: MotorCommand['command'] = 'FORWARD';

          if (headingDiff < -10) {
            leftSpeed = 45;
            rightSpeed = 85;
            command = 'LEFT';
          } else if (headingDiff > 10) {
            leftSpeed = 85;
            rightSpeed = 45;
            command = 'RIGHT';
          }

          setMotorCommand({
            leftMotor: { direction: leftDir, speedPercent: leftSpeed },
            rightMotor: { direction: rightDir, speedPercent: rightSpeed },
            command,
          });

          // 6. Dynamic Obstacle Proximity Check
          const obstruction = isPathObstructed(plannedPath, currentWaypointIdx, obstacles);
          if (obstruction.isObstructed) {
            handleTriggerReplanning(obstacles);
          }
        }
      } else {
        setFeaturePoints([...voSimulatorRef.current.getFeatures()]);
      }

      // Update Telemetry
      const distToGoal = euclideanDistance({ x: ugv.x, y: ugv.y }, goalPos);
      setTelemetry((prev) => ({
        ...prev,
        ugvX: ugv.x,
        ugvY: ugv.y,
        heading: ugv.heading,
        speed: ugv.speed,
        distanceTravelled: ugv.distanceTravelled,
        distanceToGoal: distToGoal,
        positionError: distToGoal,
        obstacleCount: perceptionResult.detectedObstacles.length,
        navigationState,
        localizationConfidence: voData.confidence,
        goalTolerance,
        fps: Math.round(1 / Math.max(0.001, dt)),
        perceptionFps: perceptionResult.perceptionFps,
        perceptionStatus: navigationState === 'SAFETY_HOLD' ? 'SAFETY_HOLD' : 'ACTIVE',
      }));

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [navigationState, plannedPath, currentWaypointIdx, ugv, obstacles, goalPos, cameraMode, isDemoActive, goalTolerance, voData.confidence]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col dot-grid-pattern selection:bg-green-500 selection:text-black">
      {/* Outer Enclosure Frame */}
      <div className="flex-1 flex flex-col border-4 border-[#1A1A1A] m-1 sm:m-2 rounded-lg overflow-hidden bg-[#050505]">
        {/* Top Header Bar */}
        <header className="border-b border-[#222] bg-[#0A0A0A] sticky top-0 z-40 px-3 sm:px-5 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#141414] border border-[#333] text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white font-mono uppercase">
                    UGV-NAV <span className="text-green-500">X1</span>
                  </h1>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-bold">
                    SIH PROTOTYPE
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-gray-500">
                    // GPS-DENIED AUTONOMOUS NAVIGATION
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">
                  Vision Perception • Optical Flow Odometry • SLAM • Dynamic A* Replanning
                </p>
              </div>
            </div>

            {/* Subsystem Real-Time Status Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              {/* GPS Status */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#262626] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">GPS: NOT USED</span>
              </div>

              {/* Navigation Status */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#262626]">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-green-400">NAV: AUTONOMOUS</span>
              </div>

              {/* Perception Status */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#262626]">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">PERCEPTION: ACTIVE</span>
              </div>

              {/* System Stability Badge */}
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-green-950/20 border border-green-500/30 text-green-400 text-[10px] uppercase font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                SYS STABLE
              </div>

              {/* Navigation Header Action Modals */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-[#333]">
                <button
                  onClick={() => setIsJudgeModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#222] text-amber-400 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-500/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Judge View
                </button>

                <button
                  onClick={() => setIsArchModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-[#252525] text-[#E0E0E0] hover:text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#333]"
                >
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  Architecture
                </button>

                <button
                  onClick={() => setIsAlgoModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-[#252525] text-[#E0E0E0] hover:text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#333]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-green-400" />
                  Algorithms
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
          {/* 1. Offline Autonomous Mode Banner */}
          <OfflineModeBanner />

          {/* 2. Mission Setup & Goal Manager Panel */}
          <MissionSetupPanel
            startPos={startPos}
            goalPos={goalPos}
            ugvPos={{ x: ugv.x, y: ugv.y }}
            isGoalLocked={isGoalLocked}
            goalTolerance={goalTolerance}
            navigationState={navigationState}
            plannedPathLength={telemetry.pathLength}
            localizationConfidence={voData.confidence}
            onLockGoal={handleLockGoal}
            onUnlockGoal={handleUnlockGoal}
            onClearGoal={handleClearGoal}
            onSetTolerance={(tol) => setGoalTolerance(tol)}
            onStartMission={handleStart}
            onSetGoalClickMode={() => {}}
          />

          {/* 3. Mission State Machine Flow Tracker */}
          <StateMachineTracker
            navigationState={navigationState}
            isGoalLocked={isGoalLocked}
          />

          {/* 4. Simulation Execution Controls */}
          <Controls
            navigationState={navigationState}
            onStart={handleStart}
            onPause={handlePause}
            onStop={handleStop}
            onReset={handleReset}
            onStep={handleStep}
            onGenerateMap={handleGenerateMap}
            onRandomObstacles={handleRandomObstacles}
            onAddObstacleInFront={handleAddObstacleInFront}
            onInjectPerson={handleInjectPerson}
            onClearMap={handleClearMap}
            onRunDemoMode={handleRunDemoMode}
            onOpenArchitecture={() => setIsArchModalOpen(true)}
            onOpenJudgeMode={() => setIsJudgeModalOpen(true)}
            isDemoActive={isDemoActive}
          />

          {/* 6. Primary Operational Grid: Camera Panel & 2D SLAM Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Camera / Vision Perception Viewport */}
            <CameraPanel
              ugv={ugv}
              obstacles={obstacles}
              detectedObstacles={detectedObstacles}
              featurePoints={featurePoints}
              cameraMode={cameraMode}
              onCameraModeChange={setCameraMode}
              onLog={addLog}
            />

            {/* 2D SLAM Grid Navigation Map with Exploration & Scale */}
            <MapPanel
              ugv={ugv}
              startPos={startPos}
              goalPos={goalPos}
              plannedPath={plannedPath}
              trajectory={trajectory}
              obstacles={obstacles}
              landmarks={landmarks}
              navigationState={navigationState}
              isGoalLocked={isGoalLocked}
              goalTolerance={goalTolerance}
              localizationConfidence={voData.confidence}
              exploredCells={slamSimulatorRef.current.getExploredCells()}
              onSetGoal={handleSetGoal}
              onAddObstacleAt={handleAddObstacleAt}
              onUnlockGoal={handleUnlockGoal}
              onLockGoal={handleLockGoal}
              onLog={addLog}
            />
          </div>

          {/* 7. Full Telemetry & Current Robot Pose Verification */}
          <TelemetryPanel telemetry={telemetry} />

          {/* 8. Secondary Grid: Visual Odometry, Differential Motor Controller, Perception Targets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visual Odometry Simulation */}
            <VisualOdometryPanel voData={voData} actualUGV={ugv} />

            {/* Simulated Motor Commands */}
            <MotorCommandPanel motorCommand={motorCommand} />

            {/* Perception Detected Targets List */}
            <PerceptionPanel detectedObstacles={detectedObstacles} />
          </div>

          {/* 9. Hardware-Integration Ready Architecture Section */}
          <HardwareIntegrationSection />

          {/* 10. Expandable How It Works Technical Explanation Panel */}
          <HowItWorksPanel />

          {/* 11. Chronological Event Terminal Log */}
          <EventLog logs={logs} onClearLogs={() => setLogs([])} />
        </main>

        {/* Modals */}
        <SystemArchitectureModal isOpen={isArchModalOpen} onClose={() => setIsArchModalOpen(false)} />
        <AlgorithmPanel isOpen={isAlgoModalOpen} onClose={() => setIsAlgoModalOpen(false)} />
        <JudgePresentationModal
          isOpen={isJudgeModalOpen}
          onClose={() => setIsJudgeModalOpen(false)}
          telemetry={telemetry}
          isGoalLocked={isGoalLocked}
          onStartDemo={() => {
            setIsJudgeModalOpen(false);
            handleRunDemoMode();
          }}
        />

        {/* Footer */}
        <footer className="border-t border-[#222] bg-[#050505] py-2.5 px-4 flex items-center justify-between flex-wrap gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" />
            <span>SIH SOFTWARE PROTOTYPE // GPS-DENIED UGV AUTONOMOUS NAVIGATION</span>
          </div>
          <div className="flex items-center gap-4">
            <span>OPTICAL FLOW VO</span>
            <span className="text-gray-700">•</span>
            <span>GRAPH SLAM</span>
            <span className="text-gray-700">•</span>
            <span>A* PLANNER</span>
            <span className="text-gray-700">•</span>
            <span className="text-green-400">STATUS: NOMINAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
