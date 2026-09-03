/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Video, Eye, ShieldAlert, CheckCircle2, Crosshair, Sparkles } from 'lucide-react';
import { UGVState, Obstacle, DetectedObstacle, VisualFeaturePoint, CameraSourceMode } from '../types';
import { degToRad } from '../utils/geometry';

interface CameraPanelProps {
  ugv: UGVState;
  obstacles: Obstacle[];
  detectedObstacles: DetectedObstacle[];
  featurePoints: VisualFeaturePoint[];
  cameraMode: CameraSourceMode;
  onCameraModeChange: (mode: CameraSourceMode) => void;
  onLog: (msg: string, type?: 'info' | 'warning' | 'error' | 'success' | 'plan') => void;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  ugv,
  detectedObstacles,
  featurePoints,
  cameraMode,
  onCameraModeChange,
  onLog,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [isMediaVideo, setIsMediaVideo] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Handle webcam toggle
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (cameraMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 360 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setWebcamActive(true);
          setWebcamError(null);
          onLog('Webcam stream connected for visual perception', 'info');
        })
        .catch((err) => {
          setWebcamError('Webcam access denied or unavailable. Reverting to simulated feed.');
          setWebcamActive(false);
          onLog(`Webcam error: ${err.message || 'Permission denied'}. Falling back to simulation.`, 'warning');
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraMode]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomMediaUrl(url);
    const isVid = file.type.startsWith('video');
    setIsMediaVideo(isVid);
    onCameraModeChange(isVid ? 'video' : 'image');
    onLog(`Custom visual input loaded: ${file.name} (${file.type})`, 'info');
  };

  // Render Loop for the Camera & Perception Overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (cameraMode === 'webcam' && videoRef.current && webcamActive) {
        // Draw real webcam video feed
        try {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
        } catch {
          drawSyntheticOutdoorScene(ctx, width, height, ugv, detectedObstacles);
        }
      } else if ((cameraMode === 'video' || cameraMode === 'image') && customMediaUrl) {
        if (isMediaVideo && videoRef.current) {
          try {
            ctx.drawImage(videoRef.current, 0, 0, width, height);
          } catch {
            drawSyntheticOutdoorScene(ctx, width, height, ugv, detectedObstacles);
          }
        } else {
          const img = new Image();
          img.src = customMediaUrl;
          if (img.complete) {
            ctx.drawImage(img, 0, 0, width, height);
          } else {
            drawSyntheticOutdoorScene(ctx, width, height, ugv, detectedObstacles);
          }
        }
      } else {
        // High-fidelity synthetic outdoor 3D viewpoint from UGV perspective
        drawSyntheticOutdoorScene(ctx, width, height, ugv, detectedObstacles);
      }

      // Draw Green Traversable Ground Mask Overlay
      drawTraversableCorridor(ctx, width, height, detectedObstacles);

      // Draw Optical Flow & Feature Points (VO tracker)
      drawFeatureTrackingPoints(ctx, width, height, featurePoints);

      // Draw AI Perception Bounding Boxes & Distance Tags
      drawPerceptionBoundingBoxes(ctx, width, height, detectedObstacles);

      // Draw Robotics HUD (Crosshairs, Horizon Pitch Indicator, Angle Heading tape)
      drawRoboticsHUD(ctx, width, height, ugv);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [ugv, detectedObstacles, featurePoints, cameraMode, webcamActive, customMediaUrl, isMediaVideo]);

  return (
    <div id="camera-panel-container" className="bg-[#0A0A0A] border border-[#222] rounded flex flex-col overflow-hidden shadow-lg">
      {/* Panel Header */}
      <div className="bg-[#111] border-b border-[#222] px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#1A1A1A] border border-[#333] text-green-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              Vision Perception Feed
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-bold">
                LIVE 60FPS
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 font-mono">Monocular Outdoor Camera & Semantic Segmentation</p>
          </div>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center gap-1 bg-[#050505] p-1 rounded border border-[#222] text-[11px] font-mono">
          <button
            id="source-sim-btn"
            onClick={() => onCameraModeChange('simulated')}
            className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
              cameraMode === 'simulated'
                ? 'bg-green-600 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Simulated 3D
          </button>
          <button
            id="source-webcam-btn"
            onClick={() => onCameraModeChange('webcam')}
            className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
              cameraMode === 'webcam'
                ? 'bg-green-600 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Webcam
          </button>
          <button
            id="source-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
              cameraMode === 'video' || cameraMode === 'image'
                ? 'bg-green-600 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Hidden media player element */}
      <video
        ref={videoRef}
        src={customMediaUrl || undefined}
        autoPlay
        playsInline
        muted
        loop
        className="hidden"
      />

      <div className="p-3.5 flex flex-col gap-3">
        {/* Camera Viewport Canvas */}
        <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-[#262626] shadow-inner">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover block"
          />

          {/* Top Status Overlays */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm border border-[#333] px-2.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 text-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
              <span>FOV: 75° | RANGE: 14.0m</span>
            </div>
            <div className="bg-black/80 backdrop-blur-sm border border-[#333] px-2.5 py-1 rounded text-[10px] font-mono text-cyan-400">
              FAST FEATURES: {featurePoints.length} PTS
            </div>
          </div>

          {/* Perception Mode Badge */}
          <div className="absolute top-2.5 right-2.5 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm border border-green-500/40 text-green-400 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold">
              VISION SENSOR ONLINE
            </div>
          </div>

          {/* Warning if Webcam Denied */}
          {webcamError && cameraMode === 'webcam' && (
            <div className="absolute inset-0 bg-[#0A0A0A]/95 flex flex-col items-center justify-center p-4 text-center">
              <ShieldAlert className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-gray-200 font-medium font-mono">{webcamError}</p>
              <button
                onClick={() => onCameraModeChange('simulated')}
                className="mt-3 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-black font-mono font-bold uppercase tracking-wider rounded text-[11px]"
              >
                Switch to Simulated 3D
              </button>
            </div>
          )}

          {/* Bottom Legend Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono bg-black/80 backdrop-blur-sm border border-[#333] px-3 py-1.5 rounded pointer-events-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500/40 border border-green-400" />
                Traversable Corridor
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-400" />
                Obstacle Hazard
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-400" />
                Uncertain Area
              </span>
            </div>
            <span className="text-gray-400">
              Tracked Objects: <strong className="text-white">{detectedObstacles.length}</strong>
            </span>
          </div>
        </div>

        {/* Detected Obstacles Quick Horizon Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-xs">
          {detectedObstacles.length === 0 ? (
            <div className="flex items-center gap-1.5 text-green-400/90 text-[11px] font-mono py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Forward corridor clear. Zero hazards inside 14m sensor cone.</span>
            </div>
          ) : (
            detectedObstacles.slice(0, 4).map((obs) => (
              <div
                key={obs.id}
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider ${
                  obs.hazardLevel === 'hazard'
                    ? 'bg-red-950/30 border-red-500/40 text-red-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}
              >
                <span className="font-bold">{obs.label}</span>
                <span className="text-gray-600">|</span>
                <span>{obs.distance}m</span>
                <span className="text-gray-600">|</span>
                <span className="text-cyan-300">{obs.direction}</span>
                <span className="text-gray-600">|</span>
                <span className="text-green-400">{obs.confidence}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Canvas Drawing Helper Functions
// ==========================================

function drawSyntheticOutdoorScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ugv: UGVState,
  detectedObstacles: DetectedObstacle[]
) {
  // Sky Gradient (Outdoor daytime horizon)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  skyGrad.addColorStop(0, '#1e293b'); // Dark slate sky
  skyGrad.addColorStop(0.6, '#334155');
  skyGrad.addColorStop(1, '#475569');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.45);

  // Distant Mountains / Horizon Silhouette
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.lineTo(w * 0.15, h * 0.38);
  ctx.lineTo(w * 0.35, h * 0.43);
  ctx.lineTo(w * 0.55, h * 0.36);
  ctx.lineTo(w * 0.8, h * 0.42);
  ctx.lineTo(w, h * 0.39);
  ctx.lineTo(w, h * 0.45);
  ctx.closePath();
  ctx.fill();

  // Ground Terrain (Sandy / Grass Outdoor Field)
  const groundGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
  groundGrad.addColorStop(0, '#2d3748'); // Horizon brown/dirt
  groundGrad.addColorStop(0.4, '#1f2937');
  groundGrad.addColorStop(1, '#111827');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  // Ground Perspective Grid Lines
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.lineWidth = 1;
  const vanishX = w / 2;
  const vanishY = h * 0.45;

  for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.2) {
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Horizontal depth lines
  for (let d = 1; d <= 6; d++) {
    const y = vanishY + Math.pow(d / 6, 2) * (h - vanishY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw 3D rendered obstacles in perspective view
  detectedObstacles.forEach((obs) => {
    const distFactor = Math.max(0.1, Math.min(1.0, 1 - (obs.distance - 1) / 14));
    const screenY = vanishY + (h - vanishY) * (1 - (obs.distance / 14));
    const screenX = w / 2 + (obs.angleDeg / 37.5) * (w / 2);

    const size = Math.max(16, 80 * distFactor);

    ctx.save();
    ctx.translate(screenX, screenY);

    if (obs.type === 'rock') {
      // Draw boulder
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.7, size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.1, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === 'tree') {
      // Draw pine tree
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-size * 0.1, -size * 0.3, size * 0.2, size * 0.6);
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.2);
      ctx.lineTo(size * 0.6, -size * 0.2);
      ctx.lineTo(-size * 0.6, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.4);
      ctx.lineTo(size * 0.45, -size * 0.6);
      ctx.lineTo(-size * 0.45, -size * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (obs.type === 'person') {
      // Draw pedestrian silhouette
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -size * 0.9, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-size * 0.18, -size * 0.7, size * 0.36, size * 0.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-size * 0.16, -size * 0.2, size * 0.14, size * 0.4);
      ctx.fillRect(size * 0.02, -size * 0.2, size * 0.14, size * 0.4);
    } else if (obs.type === 'ditch') {
      // Draw ditch hole
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Generic obstacle box
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
    }

    ctx.restore();
  });
}

function drawTraversableCorridor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  obstacles: DetectedObstacle[]
) {
  const vanishX = w / 2;
  const vanishY = h * 0.45;

  // Draw green polygon path representing traversable ground ahead
  ctx.save();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(vanishX - 35, vanishY + 15);
  ctx.lineTo(vanishX + 35, vanishY + 15);
  ctx.lineTo(w * 0.82, h);
  ctx.lineTo(w * 0.18, h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center guidance line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
  ctx.beginPath();
  ctx.moveTo(vanishX, vanishY + 15);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawFeatureTrackingPoints(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  features: VisualFeaturePoint[]
) {
  ctx.save();
  for (const feat of features) {
    const px = feat.x * w;
    const py = feat.y * h;
    const prevPx = feat.prevX * w;
    const prevPy = feat.prevY * h;

    // Optical flow vector line
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(prevPx, prevPy);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Feature point cross
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    const s = 3.5;
    ctx.beginPath();
    ctx.moveTo(px - s, py);
    ctx.lineTo(px + s, py);
    ctx.moveTo(px, py - s);
    ctx.lineTo(px, py + s);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPerceptionBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  detected: DetectedObstacle[]
) {
  const vanishX = w / 2;
  const vanishY = h * 0.45;

  detected.forEach((obs) => {
    const distFactor = Math.max(0.1, Math.min(1.0, 1 - (obs.distance - 1) / 14));
    const screenY = vanishY + (h - vanishY) * (1 - (obs.distance / 14));
    const screenX = w / 2 + (obs.angleDeg / 37.5) * (w / 2);

    const boxW = Math.max(36, 110 * distFactor);
    const boxH = Math.max(36, 120 * distFactor);
    const bx = screenX - boxW / 2;
    const by = screenY - boxH / 2;

    const isHazard = obs.hazardLevel === 'hazard';
    const color = isHazard ? '#f43f5e' : '#f59e0b';
    const bgColor = isHazard ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)';

    // Bounding Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = bgColor;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    // Corner brackets
    const bracketLen = Math.min(12, boxW * 0.3);
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(bx, by + bracketLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + bracketLen, by);
    // Top-right
    ctx.moveTo(bx + boxW - bracketLen, by);
    ctx.lineTo(bx + boxW, by);
    ctx.lineTo(bx + boxW, by + bracketLen);
    // Bottom-left
    ctx.moveTo(bx, by + boxH - bracketLen);
    ctx.lineTo(bx, by + boxH);
    ctx.lineTo(bx + bracketLen, by + boxH);
    // Bottom-right
    ctx.moveTo(bx + boxW - bracketLen, by + boxH);
    ctx.lineTo(bx + boxW, by + boxH);
    ctx.lineTo(bx + boxW, by + boxH - bracketLen);
    ctx.stroke();

    // AI Classification Label Tag
    const tagText = `${obs.label} (${obs.confidence}%)`;
    const distText = `${obs.distance}m | ${obs.direction}`;

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const tagWidth = Math.max(ctx.measureText(tagText).width, ctx.measureText(distText).width) + 12;

    ctx.fillStyle = isHazard ? 'rgba(159, 18, 57, 0.95)' : 'rgba(180, 83, 9, 0.95)';
    ctx.fillRect(bx, by - 26, tagWidth, 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by - 26, tagWidth, 24);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, bx + 6, by - 14);
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(distText, bx + 6, by - 4);
  });
}

function drawRoboticsHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ugv: UGVState
) {
  ctx.save();

  // Center Reticle
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx - 10, cy);
  ctx.moveTo(cx + 10, cy);
  ctx.lineTo(cx + 30, cy);
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(cx, cy - 10);
  ctx.moveTo(cx, cy + 10);
  ctx.lineTo(cx, cy + 30);
  ctx.stroke();

  // Heading Tape at Top
  const tapeY = 24;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, tapeY);
  ctx.lineTo(w * 0.7, tapeY);
  ctx.stroke();

  // Pointer
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(cx, tapeY + 6);
  ctx.lineTo(cx - 4, tapeY);
  ctx.lineTo(cx + 4, tapeY);
  ctx.closePath();
  ctx.fill();

  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';

  const heading = Math.round(ugv.heading);
  for (let offset = -40; offset <= 40; offset += 10) {
    const angle = (heading + offset + 360) % 360;
    const x = cx + (offset / 40) * (w * 0.2);
    ctx.fillRect(x, tapeY - 4, 1, 4);
    if (offset % 20 === 0) {
      ctx.fillText(`${angle}°`, x, tapeY - 7);
    }
  }

  ctx.restore();
}
