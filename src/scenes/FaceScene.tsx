import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawSmokeLayers,
  drawParticles, seedParticles, drawGlowCircle,
  drawRadialGlow, hexToRgb, drawGlowLine,
} from '../utils/canvas';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

// Deterministic particles — same seed = same positions every render
const PARTICLES = seedParticles(80, 1080, 1920, 42);

// Ink stroke marks around figure
const INK_STROKES = [
  { x1: 0.18, y1: 0.28, x2: 0.24, y2: 0.35, w: 2 },
  { x1: 0.75, y1: 0.32, x2: 0.80, y2: 0.25, w: 1.5 },
  { x1: 0.14, y1: 0.55, x2: 0.22, y2: 0.60, w: 2.5 },
  { x1: 0.78, y1: 0.48, x2: 0.85, y2: 0.42, w: 1.5 },
  { x1: 0.20, y1: 0.70, x2: 0.15, y2: 0.78, w: 2 },
  { x1: 0.76, y1: 0.65, x2: 0.83, y2: 0.72, w: 1.5 },
  { x1: 0.30, y1: 0.22, x2: 0.26, y2: 0.18, w: 1 },
  { x1: 0.68, y1: 0.20, x2: 0.72, y2: 0.15, w: 1 },
];

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  driftY: number,
  glowColor: string,
  glowPulse: number
) {
  const cx = w / 2;
  const cy = h * 0.52 + driftY;
  const scale = w / 400;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // --- Outer skin glow layers ---
  for (let i = 3; i >= 1; i--) {
    const grad = ctx.createRadialGradient(0, -80, 0, 0, -80, 120 + i * 40);
    grad.addColorStop(0, `rgba(${hexToRgb(glowColor)},${glowPulse * 0.12 * (4 - i)})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -80, 120 + i * 40, 150 + i * 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Body shadow base ---
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.ellipse(0, 120, 85, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Legs ---
  ctx.strokeStyle = '#0f0f0f';
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-28, 220);
  ctx.bezierCurveTo(-35, 290, -40, 340, -45, 400);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, 220);
  ctx.bezierCurveTo(35, 290, 40, 340, 45, 400);
  ctx.stroke();

  // --- Arms ---
  ctx.lineWidth = 28;
  ctx.strokeStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.moveTo(-70, 20);
  ctx.bezierCurveTo(-110, 80, -120, 140, -115, 200);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 20);
  ctx.bezierCurveTo(110, 80, 120, 140, 115, 200);
  ctx.stroke();

  // --- Torso ---
  ctx.fillStyle = '#0a0a0a';
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},0.15)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-75, -10);
  ctx.bezierCurveTo(-85, 50, -80, 160, -65, 220);
  ctx.lineTo(65, 220);
  ctx.bezierCurveTo(80, 160, 85, 50, 75, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // --- Neck ---
  ctx.fillStyle = '#0c0c0c';
  ctx.beginPath();
  ctx.roundRect(-18, -30, 36, 40, 4);
  ctx.fill();

  // --- Head ---
  // Base
  ctx.fillStyle = '#111111';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 30 * glowPulse;
  ctx.beginPath();
  ctx.ellipse(0, -100, 60, 72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Skin glow on face
  const faceGrad = ctx.createRadialGradient(-15, -120, 5, 0, -100, 55);
  faceGrad.addColorStop(0, `rgba(${hexToRgb(glowColor)},${glowPulse * 0.25})`);
  faceGrad.addColorStop(0.6, `rgba(${hexToRgb(glowColor)},${glowPulse * 0.08})`);
  faceGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(0, -100, 58, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head outline ink
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.3 + glowPulse * 0.3})`;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(0, -100, 60, 72, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Eyes — wide open, staring
  ctx.fillStyle = `rgba(${hexToRgb(glowColor)},${0.6 + glowPulse * 0.4})`;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.ellipse(-20, -105, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(20, -105, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-20, -105, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(20, -105, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInkStrokes(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  for (let i = 0; i < INK_STROKES.length; i++) {
    const s = INK_STROKES[i];
    const phase = (frame + i * 13) % 120;
    const opacity = Math.sin((phase / 120) * Math.PI) * 0.5 * intensity;
    if (opacity <= 0) continue;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = s.w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x1 * w, s.y1 * h);
    ctx.lineTo(s.x2 * w, s.y2 * h);
    ctx.stroke();
    ctx.restore();
  }
}

export const FaceScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
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

    // Ambient radial glow background
    const glowPulse = 0.5 + 0.5 * Math.sin((frame / 60) * Math.PI);
    drawRadialGlow(ctx, width / 2, height * 0.45, width * 0.8,
      `rgb(${hexToRgb(glowColor)})`, glowPulse * 0.12 * intensity);

    // Volumetric smoke
    drawSmokeLayers(ctx, width, height, frame, durationInFrames, glowColor, intensity);

    // Slow drift
    const driftY = Math.sin((frame / 180) * Math.PI * 2) * 12;

    // Character
    drawCharacter(ctx, width, height, driftY, glowColor, glowPulse * intensity);

    // Ink strokes
    drawInkStrokes(ctx, width, height, frame, glowColor, intensity);

    // Particles
    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.8);

    // Vignette
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
};
