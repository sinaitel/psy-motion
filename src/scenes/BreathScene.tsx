/**
 * BreathScene — anatomical lungs with breath cycle, alveoli, CO2/O2 exchange
 * Shallow breathing, hyperventilation, anxiety response
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles, drawRadialGlow,
  seedParticles, hexToRgb, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(40, 1080, 1920, 55);

// Breathing cycle: anxious = shorter period (panic ~25f), relaxed ~70f
function getBreathPhase(frame: number): number {
  // Irregular anxious breathing: fast bursts then brief pause
  const cycle = 40; // frames per full breath
  const t = (frame % cycle) / cycle;
  if (t < 0.35) return t / 0.35;           // inhale
  if (t < 0.50) return 1 - (t - 0.35) / 0.15; // exhale fast
  if (t < 0.65) return 0;                   // pause
  if (t < 0.80) return (t - 0.65) / 0.15;  // second micro-inhale
  return 1 - (t - 0.80) / 0.20;            // slow exhale
}

function drawLung(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  side: -1 | 1, // -1 left, 1 right
  expand: number, // 0-1
  glowColor: string,
  intensity: number
) {
  const w = (100 + expand * 28) * (side === -1 ? 1 : 1);
  const h = 200 + expand * 35;

  ctx.save();
  ctx.translate(cx, cy);

  // Lung outer fill
  const lg = ctx.createRadialGradient(side * 20, -h * 0.15, 10, side * 30, 0, h * 0.7);
  lg.addColorStop(0, `rgba(${hexToRgb(glowColor)},${(0.06 + expand * 0.06) * intensity})`);
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg;

  // Lung shape (asymmetric blob)
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20 * (0.4 + expand * 0.6);
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${(0.35 + expand * 0.25) * intensity})`;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  if (side === -1) {
    ctx.moveTo(-10, -h * 0.42);
    ctx.bezierCurveTo(-w * 0.2, -h * 0.55, -w * 0.75, -h * 0.4, -w * 0.8, -h * 0.05);
    ctx.bezierCurveTo(-w * 0.82, h * 0.3, -w * 0.6, h * 0.42, -w * 0.25, h * 0.46);
    ctx.bezierCurveTo(-w * 0.05, h * 0.48, 0, h * 0.3, 0, h * 0.1);
    ctx.bezierCurveTo(0, -h * 0.1, -8, -h * 0.3, -10, -h * 0.42);
  } else {
    ctx.moveTo(10, -h * 0.42);
    ctx.bezierCurveTo(w * 0.2, -h * 0.55, w * 0.75, -h * 0.4, w * 0.8, -h * 0.05);
    ctx.bezierCurveTo(w * 0.82, h * 0.3, w * 0.6, h * 0.42, w * 0.25, h * 0.46);
    ctx.bezierCurveTo(w * 0.05, h * 0.48, 0, h * 0.3, 0, h * 0.1);
    ctx.bezierCurveTo(0, -h * 0.1, 8, -h * 0.3, 10, -h * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lobe division line
  ctx.globalAlpha = 0.15 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 0.8;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  if (side === -1) {
    ctx.moveTo(-w * 0.15, h * 0.1);
    ctx.bezierCurveTo(-w * 0.5, h * 0.0, -w * 0.7, h * 0.15, -w * 0.65, h * 0.35);
  } else {
    ctx.moveTo(w * 0.15, h * 0.1);
    ctx.bezierCurveTo(w * 0.5, h * 0.0, w * 0.7, h * 0.15, w * 0.65, h * 0.35);
  }
  ctx.stroke();

  ctx.restore();
}

function drawTrachea(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number, bottomY: number,
  glowColor: string, intensity: number, expand: number
) {
  ctx.save();
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.5 * intensity})`;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 7 + expand * 2;
  ctx.lineCap = 'round';

  // Trachea
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, bottomY);
  ctx.stroke();

  // Bronchi split
  ctx.lineWidth = 5 + expand * 1.5;
  const splitY = bottomY + 10;
  ctx.beginPath();
  ctx.moveTo(cx, splitY);
  ctx.bezierCurveTo(cx - 10, splitY + 20, cx - 60, splitY + 30, cx - 90, splitY + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, splitY);
  ctx.bezierCurveTo(cx + 10, splitY + 20, cx + 60, splitY + 30, cx + 90, splitY + 20);
  ctx.stroke();

  // Cartilage rings on trachea
  ctx.globalAlpha = 0.18 * intensity;
  ctx.lineWidth = 1;
  const rings = 8;
  const trLen = bottomY - topY;
  for (let i = 0; i < rings; i++) {
    const ry = topY + (i / rings) * trLen;
    ctx.beginPath();
    ctx.arc(cx, ry, 6, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAlveoli(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  side: -1 | 1,
  frame: number,
  glowColor: string,
  intensity: number,
  expand: number
) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const seed = i * 97 + (side === -1 ? 0 : 500);
    const ax = cx + side * (40 + (seed % 60));
    const ay = cy - 60 + (seed % 140);
    const r = 5 + expand * 2.5;
    const pulse = 0.4 + 0.6 * Math.sin(frame * 0.08 + i * 0.6);

    ctx.save();
    ctx.globalAlpha = pulse * 0.25 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBreathParticles(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number,
  frame: number,
  glowColor: string,
  intensity: number,
  isExhale: boolean
) {
  // O2 in / CO2 out particles
  const count = 6;
  for (let i = 0; i < count; i++) {
    const seed = i * 41;
    const t = ((frame * 0.04 + i * 0.18) % 1);
    const x = cx + (seed % 40 - 20);
    const y = isExhale
      ? topY - t * 120
      : topY + 20 - t * 80;

    const opacity = Math.sin(t * Math.PI) * 0.7 * intensity;
    const r = 4;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = isExhale ? '#88aaff' : glowColor;
    ctx.shadowColor = isExhale ? '#88aaff' : glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * Math.PI * 3 + i) * 8, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const BreathScene: React.FC<Props> = ({
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
    const cy = height * 0.52;
    const expand = getBreathPhase(frame);
    const isExhale = (frame % 40) > 20;

    // Ambient glow
    drawRadialGlow(ctx, cx, cy, width * 0.6,
      `rgb(${hexToRgb(glowColor)})`, expand * 0.10 * intensity);

    // Lungs
    drawLung(ctx, cx - width * 0.14, cy, -1, expand, glowColor, intensity);
    drawLung(ctx, cx + width * 0.14, cy, 1, expand, glowColor, intensity);

    // Trachea + bronchi
    drawTrachea(ctx, cx, cy - height * 0.22, cy - height * 0.16, glowColor, intensity, expand);

    // Alveoli
    drawAlveoli(ctx, cx - width * 0.14, cy, -1, frame, glowColor, intensity, expand);
    drawAlveoli(ctx, cx + width * 0.14, cy, 1, frame, glowColor, intensity, expand);

    // Breath particles
    drawBreathParticles(ctx, cx, cy - height * 0.25, frame, glowColor, intensity, isExhale);

    // BPM / breath rate label
    const breathRate = 18; // /min — anxious
    ctx.save();
    ctx.globalAlpha = 0.35 * intensity;
    ctx.font = `${Math.round(width * 0.04)}px monospace`;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(`${breathRate} resp/min`, cx, cy + height * 0.32);
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.4);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
