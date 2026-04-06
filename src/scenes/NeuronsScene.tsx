/**
 * NeuronsScene — close-up neural firing with dendrites, axons, synapses
 * Electric propagation, burst effects
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, seedParticles,
  drawParticles, hexToRgb, drawRadialGlow, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(80, 1080, 1920, 17);

// Neuron cell bodies (soma)
const SOMAS = [
  { x: 0.50, y: 0.35 },
  { x: 0.22, y: 0.50 },
  { x: 0.78, y: 0.48 },
  { x: 0.42, y: 0.65 },
  { x: 0.62, y: 0.68 },
  { x: 0.30, y: 0.28 },
  { x: 0.70, y: 0.30 },
];

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  glowColor: string,
  firing: number, // 0-1
  intensity: number
) {
  // Soma glow
  const somaG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
  somaG.addColorStop(0, `rgba(${hexToRgb(glowColor)},${firing * intensity * 0.5})`);
  somaG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = somaG;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Cell body
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20 * firing;
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.4 + firing * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Inner nucleus
  drawGlowCircle(ctx, cx, cy, r * 0.4, glowColor, 15 * firing, (0.5 + firing * 0.5) * intensity);
}

function drawDendrites(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  somaIdx: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  // Each soma has 5-7 dendrite branches
  const branchCount = 5 + (somaIdx % 3);
  const baseAngle = (somaIdx * 137.5 * Math.PI) / 180; // golden angle spacing

  for (let b = 0; b < branchCount; b++) {
    const angle = baseAngle + (b / branchCount) * Math.PI * 2;
    const len = (100 + somaIdx * 20 + b * 15);
    const waveFreq = (somaIdx * 3 + b * 7 + frame * 0.02);

    // Dendrite main branch
    const endX = cx + Math.cos(angle) * len;
    const endY = cy + Math.sin(angle) * len;
    const cp1x = cx + Math.cos(angle + 0.3) * len * 0.5;
    const cp1y = cy + Math.sin(angle + 0.3) * len * 0.5;

    const travelProgress = ((frame * 1.5 + somaIdx * 30 + b * 10) % 90) / 90;
    const opacity = (0.15 + 0.15 * Math.sin(waveFreq)) * intensity;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
    ctx.stroke();

    // Sub-branches
    const subCount = 2 + (b % 2);
    for (let s = 0; s < subCount; s++) {
      const subAngle = angle + (s - subCount / 2) * 0.5;
      const subLen = len * 0.35;
      const subStartT = 0.55 + s * 0.1;
      const sx = cx + Math.cos(angle) * len * subStartT;
      const sy = cy + Math.sin(angle) * len * subStartT;
      const ex = sx + Math.cos(subAngle) * subLen;
      const ey = sy + Math.sin(subAngle) * subLen;

      ctx.globalAlpha = opacity * 0.6;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();

    // Traveling signal pulse
    if (travelProgress < 1) {
      const px = cx + (endX - cx) * travelProgress;
      const py = cy + (endY - cy) * travelProgress;
      drawGlowCircle(ctx, px, py, 3, '#ffffff', 20, travelProgress < 0.8 ? intensity : 0);
    }
  }
}

function drawAxon(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  w: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const x1 = from.x * w;
  const y1 = from.y * h;
  const x2 = to.x * w;
  const y2 = to.y * h;
  const mx = (x1 + x2) / 2 + (to.y - from.y) * w * 0.15;
  const my = (y1 + y2) / 2 - (to.x - from.x) * h * 0.15;

  // Action potential traveling along axon
  const signalT = ((frame * 0.8) % 60) / 60;

  // Base axon line
  ctx.save();
  ctx.globalAlpha = 0.12 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();

  // Signal pulse
  ctx.globalAlpha = (1 - Math.abs(signalT - 0.5) * 2) * intensity;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const pLen = 0.12;
  const t1 = Math.max(0, signalT - pLen);
  const t2 = Math.min(1, signalT + pLen);
  // Approximate bezier point
  const bx = (t: number) => (1-t)*(1-t)*x1 + 2*(1-t)*t*mx + t*t*x2;
  const by = (t: number) => (1-t)*(1-t)*y1 + 2*(1-t)*t*my + t*t*y2;
  ctx.moveTo(bx(t1), by(t1));
  for (let s = 0; s <= 10; s++) {
    const tt = t1 + (t2 - t1) * (s / 10);
    ctx.lineTo(bx(tt), by(tt));
  }
  ctx.stroke();
  ctx.restore();

  // Synapse at end
  const sx2 = bx(1);
  const sy2 = by(1);
  drawGlowCircle(ctx, sx2, sy2, 5, glowColor, 15, 0.3 * intensity);
}

export const NeuronsScene: React.FC<Props> = ({
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

    const pulse = 0.5 + 0.5 * Math.sin((frame / 40) * Math.PI);

    // Ambient
    drawRadialGlow(ctx, width / 2, height * 0.48, width * 0.7,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.08 * intensity);

    // Axons between somas
    const axonPairs = [[0,1],[0,2],[1,3],[2,4],[3,4],[1,5],[2,6],[5,6],[5,0],[6,0]];
    for (const [a, b] of axonPairs) {
      drawAxon(ctx, SOMAS[a], SOMAS[b], width, height, frame + a * 15, glowColor, intensity);
    }

    // Dendrites + somas
    for (let i = 0; i < SOMAS.length; i++) {
      const s = SOMAS[i];
      const cx = s.x * width;
      const cy = s.y * height;
      const firing = 0.4 + 0.6 * Math.sin((frame / 30 + i * 1.3) * Math.PI);

      drawDendrites(ctx, cx, cy, width, height, i, frame, glowColor, intensity);
      drawNeuron(ctx, cx, cy, 18, glowColor, firing, intensity);
    }

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.6);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
