/**
 * HeartRateScene — ECG monitor, heartbeat pulse, anatomical heart glow
 * Emotional intensity, anxiety, stress
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(50, 1080, 1920, 99);

// ECG waveform shape: one heartbeat cycle (normalized 0→1 x, arbitrary y)
const ECG_POINTS: [number, number][] = [
  [0.00,  0.00],
  [0.10,  0.00],
  [0.13, -0.04],
  [0.15,  0.04],
  [0.17, -0.02],
  [0.20,  0.00],
  [0.22, -0.01],
  [0.25,  0.85],  // R peak
  [0.28, -0.35],  // S trough
  [0.32,  0.00],
  [0.38,  0.00],
  [0.42,  0.12],  // T wave
  [0.48,  0.14],
  [0.54,  0.12],
  [0.60,  0.00],
  [1.00,  0.00],
];

function sampleEcg(t: number): number {
  // t in [0,1], returns y
  for (let i = 0; i < ECG_POINTS.length - 1; i++) {
    const [x0, y0] = ECG_POINTS[i];
    const [x1, y1] = ECG_POINTS[i + 1];
    if (t >= x0 && t <= x1) {
      const u = (t - x0) / (x1 - x0);
      return y0 + (y1 - y0) * u;
    }
  }
  return 0;
}

function drawEcgLine(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  lineWidth: number, lineHeight: number,
  scrollOffset: number,
  frame: number,
  glowColor: string,
  intensity: number,
) {
  const cycles = 3; // cycles visible at once
  const totalPoints = 200;

  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Draw trailing history (fading)
  for (let trail = 2; trail >= 0; trail--) {
    ctx.globalAlpha = (0.3 - trail * 0.08) * intensity;
    ctx.shadowBlur = 8 + trail * 4;

    ctx.beginPath();
    for (let p = 0; p <= totalPoints; p++) {
      const xFrac = p / totalPoints;
      const tInCycle = ((xFrac * cycles) + scrollOffset) % 1;
      const yVal = sampleEcg(tInCycle);
      const px = cx - lineWidth / 2 + xFrac * lineWidth;
      const py = cy - yVal * lineHeight + trail * 3;
      if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Draw main line with progress cut (leading edge)
  const progressX = (frame % 90) / 90;
  ctx.globalAlpha = intensity;
  ctx.shadowBlur = 22;
  ctx.lineWidth = 3;
  ctx.beginPath();
  let started = false;
  for (let p = 0; p <= totalPoints; p++) {
    const xFrac = p / totalPoints;
    if (xFrac > progressX) break;
    const tInCycle = ((xFrac * cycles) + scrollOffset) % 1;
    const yVal = sampleEcg(tInCycle);
    const px = cx - lineWidth / 2 + xFrac * lineWidth;
    const py = cy - yVal * lineHeight;
    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Leading dot
  if (progressX > 0) {
    const tHead = ((progressX * cycles) + scrollOffset) % 1;
    const yHead = sampleEcg(tHead);
    const headX = cx - lineWidth / 2 + progressX * lineWidth;
    const headY = cy - yHead * lineHeight;
    ctx.globalAlpha = 1;
    drawGlowCircle(ctx, headX, headY, 6, '#ffffff', 30, intensity);
  }

  ctx.restore();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  glowColor: string,
  beat: number, // 0-1, pulse
  intensity: number
) {
  const s = size * (1 + beat * 0.08);

  // Outer glow
  const g = ctx.createRadialGradient(cx, cy - s * 0.1, s * 0.1, cx, cy - s * 0.1, s * 2.2);
  g.addColorStop(0, `rgba(${hexToRgb(glowColor)},${beat * 0.35 * intensity})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Heart path
  ctx.save();
  ctx.translate(cx, cy - s * 0.1);
  ctx.scale(s / 100, s / 100);

  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-5, 20, -40, 10, -40, -10);
  ctx.bezierCurveTo(-40, -40, -10, -50, 0, -30);
  ctx.bezierCurveTo(10, -50, 40, -40, 40, -10);
  ctx.bezierCurveTo(40, 10, 5, 20, 0, 30);
  ctx.closePath();

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 30 * beat;
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.4 + beat * 0.5})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Fill
  const hg = ctx.createRadialGradient(-10, -15, 5, 0, 0, 50);
  hg.addColorStop(0, `rgba(${hexToRgb(glowColor)},${beat * 0.15 * intensity})`);
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fill();

  ctx.restore();
}

function drawGridLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  glowColor: string,
  intensity: number
) {
  ctx.save();
  ctx.globalAlpha = 0.06 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 0.5;

  const cols = 12;
  const rows = 8;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;

  for (let c = 0; c <= cols; c++) {
    const x = x0 + (c / cols) * w;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = y0 + (r / rows) * h;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
  }
  ctx.restore();
}

export const HeartRateScene: React.FC<Props> = ({
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

    // Heart beat: sharp attack, slow decay
    const beatCycle = frame % 30;
    const beat = beatCycle < 6
      ? beatCycle / 6
      : Math.max(0, 1 - (beatCycle - 6) / 24);

    const scrollOffset = (frame * 0.018) % 1;

    drawRadialGlow(ctx, width / 2, height * 0.35, width * 0.5,
      `rgb(${hexToRgb(glowColor)})`, beat * 0.15 * intensity);

    // ECG grid background
    drawGridLines(ctx, width / 2, height * 0.62, width * 0.88, height * 0.28, glowColor, intensity);

    // ECG line
    drawEcgLine(ctx,
      width / 2, height * 0.62,
      width * 0.88, height * 0.22,
      scrollOffset, frame,
      glowColor, intensity
    );

    // Anatomical heart above
    drawHeart(ctx, width / 2, height * 0.32, 90, glowColor, beat, intensity);

    // BPM readout
    ctx.save();
    ctx.globalAlpha = 0.5 * intensity;
    ctx.font = `bold ${Math.round(width * 0.06)}px monospace`;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.textAlign = 'right';
    ctx.fillText(`${72 + Math.round(beat * 12)} BPM`, width * 0.88, height * 0.55);
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.5);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
