/**
 * CityWalkScene — silhouette walking alone through city at night
 * Walking cycle, rumination in motion, urban isolation
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(35, 1080, 1920, 121);

// ─── City background (reused logic, slightly varied layout) ─────────────────
const BLDGS: [number, number, number][] = [
  [0.00, 0.08, 0.20], [0.07, 0.06, 0.30], [0.12, 0.10, 0.18],
  [0.20, 0.07, 0.38], [0.26, 0.09, 0.25], [0.33, 0.12, 0.44],
  [0.43, 0.06, 0.32], [0.48, 0.10, 0.50], [0.56, 0.07, 0.28],
  [0.62, 0.09, 0.22], [0.69, 0.08, 0.38], [0.75, 0.06, 0.18],
  [0.80, 0.10, 0.30], [0.88, 0.07, 0.24], [0.93, 0.08, 0.16],
];

function drawCity(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const groundY = h * 0.74;

  // Sky
  const skyG = ctx.createLinearGradient(0, 0, 0, groundY);
  skyG.addColorStop(0, '#000000');
  skyG.addColorStop(1, `rgba(${hexToRgb(glowColor)},0.03)`);
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, w, groundY);

  // Fog layer at horizon
  const fogG = ctx.createLinearGradient(0, groundY * 0.65, 0, groundY);
  fogG.addColorStop(0, 'rgba(0,0,0,0)');
  fogG.addColorStop(1, `rgba(${hexToRgb(glowColor)},${0.05 * intensity})`);
  ctx.fillStyle = fogG;
  ctx.fillRect(0, groundY * 0.65, w, groundY * 0.35);

  for (const [xPct, wPct, hPct] of BLDGS) {
    const bx = xPct * w;
    const bw = wPct * w;
    const bh = hPct * h;
    const by = groundY - bh;

    ctx.fillStyle = '#040404';
    ctx.fillRect(bx, by, bw, bh);

    // Silhouette edge
    ctx.save();
    ctx.globalAlpha = 0.08 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 0.4;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    // Lit windows (sparse)
    const cols = Math.max(2, Math.round(bw / 22));
    const rows = Math.max(3, Math.round(bh / 28));
    const pwx = bw / cols;
    const pwy = bh / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wseed = (xPct * 9999 + r * 77 + c * 13) | 0;
        const isLit = ((wseed * 1664525 + 1013904223) >>> 0) % 100 > 62;
        if (!isLit) continue;
        const flicker = 0.8 + 0.2 * Math.sin(frame * 0.013 + wseed * 0.07);
        ctx.save();
        ctx.globalAlpha = flicker * 0.4 * intensity;
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 4;
        ctx.fillRect(bx + c * pwx + 3, by + r * pwy + 4, pwx - 6, pwy - 6);
        ctx.restore();
      }
    }
  }

  // Street
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, groundY, w, h - groundY);

  // Street centre line (perspective)
  ctx.save();
  ctx.globalAlpha = 0.06 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([30, 40]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, groundY + 2);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Pavement glow line
  ctx.save();
  ctx.globalAlpha = 0.10 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
  ctx.restore();
}

// ─── Walking cycle ───────────────────────────────────────────────────────────
function getWalkAngles(t: number) {
  // t = normalized walk cycle 0→1
  const legSwing = Math.sin(t * Math.PI * 2) * 0.35;
  const armSwing = -legSwing * 0.7;
  const bodyBob = Math.abs(Math.sin(t * Math.PI * 2)) * 4;
  return { legSwing, armSwing, bodyBob };
}

function drawWalkingFigure(
  ctx: CanvasRenderingContext2D,
  cx: number, footY: number,
  scale: number,
  glowColor: string,
  intensity: number,
  frame: number
) {
  const walkCycle = (frame % 30) / 30;
  const { legSwing, armSwing, bodyBob } = getWalkAngles(walkCycle);
  const bob = bodyBob;

  ctx.save();
  ctx.translate(cx, footY - bob);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.95;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 22;

  // Head (slight forward tilt when walking)
  ctx.save();
  ctx.translate(2, 0); // slight forward lean
  ctx.beginPath();
  ctx.ellipse(0, -210, 21, 26, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck
  ctx.fillRect(-7, -186, 14, 14);

  // Torso (slight lean)
  ctx.save();
  ctx.rotate(0.04);
  ctx.beginPath();
  ctx.moveTo(-20, -174);
  ctx.bezierCurveTo(-24, -140, -20, -80, -18, -30);
  ctx.lineTo(18, -30);
  ctx.bezierCurveTo(20, -80, 24, -140, 20, -174);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Left arm (swings forward with right leg)
  ctx.save();
  ctx.translate(-24, -165);
  ctx.rotate(-armSwing);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-8, 30, -10, 70, -8, 100);
  ctx.bezierCurveTo(-2, 100, 4, 100, 8, 100);
  ctx.bezierCurveTo(6, 70, 4, 30, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(24, -165);
  ctx.rotate(armSwing);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(8, 30, 10, 70, 8, 100);
  ctx.bezierCurveTo(2, 100, -4, 100, -8, 100);
  ctx.bezierCurveTo(-6, 70, -4, 30, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Hip block
  ctx.beginPath();
  ctx.moveTo(-20, -30);
  ctx.lineTo(20, -30);
  ctx.lineTo(22, 10);
  ctx.lineTo(-22, 10);
  ctx.closePath();
  ctx.fill();

  // Left leg (swings back)
  ctx.save();
  ctx.translate(-10, 10);
  ctx.rotate(-legSwing);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-8, 40, -10, 80, -6, 120);
  ctx.bezierCurveTo(0, 120, 6, 120, 12, 120);
  ctx.bezierCurveTo(8, 80, 4, 40, 0, 0);
  ctx.closePath();
  ctx.fill();
  // Foot
  ctx.beginPath();
  ctx.ellipse(-4, 120, 14, 5, -0.3 + legSwing * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right leg (swings forward)
  ctx.save();
  ctx.translate(10, 10);
  ctx.rotate(legSwing);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(8, 40, 10, 80, 6, 120);
  ctx.bezierCurveTo(0, 120, -6, 120, -12, 120);
  ctx.bezierCurveTo(-8, 80, -4, 40, 0, 0);
  ctx.closePath();
  ctx.fill();
  // Foot
  ctx.beginPath();
  ctx.ellipse(4, 120, 14, 5, 0.3 - legSwing * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Rim light (city from behind)
  ctx.globalAlpha = 0.20 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -210, 21, 26, 0.05, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.restore();
}

function drawFootstepGlow(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  // Each step leaves a brief glow
  const stepFrame = frame % 15;
  const stepSide = Math.floor(frame / 15) % 2 === 0 ? -1 : 1;
  if (stepFrame < 8) {
    const stepX = cx + stepSide * 12;
    const fade = (8 - stepFrame) / 8;
    ctx.save();
    ctx.globalAlpha = fade * 0.25 * intensity;
    const sg = ctx.createRadialGradient(stepX, groundY, 0, stepX, groundY, 20);
    sg.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.8)`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.ellipse(stepX, groundY + 2, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const CityWalkScene: React.FC<Props> = ({
  durationInFrames, glowColor = '#d4af37', intensity = 0.7,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas(ctx, width, height);

    const groundY = height * 0.74;
    // Figure stays center but city scrolls slightly (parallax)
    const parallax = (frame * 0.8) % width;

    ctx.save();
    ctx.translate(-parallax * 0.04, 0);
    drawCity(ctx, width + 80, height, frame, glowColor, intensity);
    ctx.restore();

    const cx = width * 0.5;

    // Ambient glow around figure
    drawRadialGlow(ctx, cx, groundY - 80, 180,
      `rgb(${hexToRgb(glowColor)})`, 0.07 * intensity);

    drawFootstepGlow(ctx, cx, groundY, frame, glowColor, intensity);
    drawWalkingFigure(ctx, cx, groundY, 1.05, glowColor, intensity, frame);

    // Ground shadow
    ctx.save();
    ctx.globalAlpha = 0.25 * intensity;
    const shG = ctx.createRadialGradient(cx, groundY + 5, 0, cx, groundY + 5, 45);
    shG.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.5)`);
    shG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shG;
    ctx.ellipse(cx, groundY + 5, 45, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.3);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
