/**
 * VortexScene — psychological spiral, intrusive thought loop
 * Hypnotic golden vortex pulling inward
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(60, 1080, 1920, 77);

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const rotSpeed = frame * 0.018;
  const spiralCount = 4; // number of arms
  const maxRadius = Math.min(cx, cy) * 0.85;
  const turns = 5; // how many turns in each arm

  for (let arm = 0; arm < spiralCount; arm++) {
    const armAngleOffset = (arm / spiralCount) * Math.PI * 2;

    ctx.save();
    ctx.beginPath();

    const steps = 300;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps; // 0 → 1 (center → edge)
      const angle = armAngleOffset + rotSpeed + t * turns * Math.PI * 2;
      const r = t * maxRadius;

      // Warp radius with subtle wave
      const warpR = r * (1 + 0.04 * Math.sin(t * 20 + frame * 0.05 + arm));
      const px = cx + Math.cos(angle) * warpR;
      const py = cy + Math.sin(angle) * warpR;

      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    // Opacity fades toward edge
    const fade = 0.5 + 0.5 * Math.sin(frame * 0.04 + arm * 1.5);
    ctx.globalAlpha = fade * 0.3 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawSpiralRings(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const rings = 9;
  const maxR = Math.min(cx, cy) * 0.82;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.06);

  for (let i = 1; i <= rings; i++) {
    const t = i / rings;
    // Rings pulse inward
    const inwardPhase = ((t + frame * 0.008) % 1);
    const r = (1 - inwardPhase) * maxR;
    if (r < 2) continue;

    const opacity = inwardPhase * (1 - inwardPhase) * 4 * 0.25 * intensity;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * (1 - t);
    ctx.lineWidth = 1 + (1 - t) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Center vortex core
  const coreR = 8 + pulse * 12;
  drawGlowCircle(ctx, cx, cy, coreR, glowColor, 40, intensity);
  drawGlowCircle(ctx, cx, cy, coreR * 0.4, '#ffffff', 20, intensity * 0.8);
}

function drawParticleVortex(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const count = 40;
  for (let i = 0; i < count; i++) {
    // Pseudo-deterministic
    const seed = i * 137.508;
    const initAngle = (seed % (Math.PI * 2));
    const initR = 50 + (seed % 400);
    const speed = 0.008 + (i % 7) * 0.003;

    const angle = initAngle + frame * speed * (1 + initR * 0.001);
    // Spiral inward over time
    const rDecay = (initR - (frame * 0.5 + i * 3) % initR);
    const r = Math.max(4, rDecay);

    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    const alpha = (r / 400) * 0.5 * intensity;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, py, 2 + (1 - r / 400) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDistortionLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const lineCount = 24;
  for (let i = 0; i < lineCount; i++) {
    const baseAngle = (i / lineCount) * Math.PI * 2;
    const wave = 0.1 * Math.sin(frame * 0.05 + i * 0.7);
    const angle = baseAngle + wave;

    const innerR = 10;
    const outerR = (120 + i * 18) * (0.85 + 0.15 * Math.sin(frame * 0.04 + i));

    ctx.save();
    ctx.globalAlpha = 0.06 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
    ctx.restore();
  }
}

export const VortexScene: React.FC<Props> = ({
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

    const cx = width / 2;
    const cy = height * 0.48;
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.05);

    // Deep ambient
    drawRadialGlow(ctx, cx, cy, width * 0.9,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.12 * intensity);

    drawDistortionLines(ctx, cx, cy, frame, glowColor, intensity);
    drawSpiral(ctx, cx, cy, frame, glowColor, intensity);
    drawSpiralRings(ctx, cx, cy, frame, glowColor, intensity);
    drawParticleVortex(ctx, cx, cy, frame, glowColor, intensity);

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.4);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
