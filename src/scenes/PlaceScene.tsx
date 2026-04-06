import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawGlowCircle,
  drawParticles, seedParticles, hexToRgb, drawRadialGlow,
} from '../utils/canvas';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

const PARTICLES = seedParticles(50, 1080, 1920, 55);

// Architectural vanishing point lines
const PERSP_LINES = [
  // Left wall
  { sx: 0.0, sy: 0.0 }, { sx: 0.0, sy: 0.2 }, { sx: 0.0, sy: 0.4 },
  { sx: 0.0, sy: 0.6 }, { sx: 0.0, sy: 0.8 }, { sx: 0.0, sy: 1.0 },
  // Right wall
  { sx: 1.0, sy: 0.0 }, { sx: 1.0, sy: 0.2 }, { sx: 1.0, sy: 0.4 },
  { sx: 1.0, sy: 0.6 }, { sx: 1.0, sy: 0.8 }, { sx: 1.0, sy: 1.0 },
  // Top
  { sx: 0.2, sy: 0.0 }, { sx: 0.4, sy: 0.0 }, { sx: 0.6, sy: 0.0 }, { sx: 0.8, sy: 0.0 },
  // Bottom
  { sx: 0.2, sy: 1.0 }, { sx: 0.4, sy: 1.0 }, { sx: 0.6, sy: 1.0 }, { sx: 0.8, sy: 1.0 },
];

export const PlaceScene: React.FC<Props> = ({
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

    const vpx = width / 2;
    const vpy = height * 0.48;
    const pulse = 0.5 + 0.5 * Math.sin((frame / 50) * Math.PI);

    // Vanishing point glow
    drawRadialGlow(ctx, vpx, vpy, width * 0.4,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.25 * intensity);
    drawGlowCircle(ctx, vpx, vpy, 4 + pulse * 4, glowColor, 30, intensity);

    // Perspective lines — drawn progressively
    for (let i = 0; i < PERSP_LINES.length; i++) {
      const l = PERSP_LINES[i];
      const delay = i * 3;
      const progress = Math.min(1, Math.max(0, (frame - delay) / 50));
      if (progress <= 0) continue;

      const sx = l.sx * width;
      const sy = l.sy * height;
      const ex = vpx + (sx - vpx) * (1 - progress);
      const ey = vpy + (sy - vpy) * (1 - progress);

      const linePulse = 0.3 + 0.4 * Math.sin((frame / 40 + i * 0.5) * Math.PI);
      const opacity = linePulse * intensity * 0.6;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }

    // Horizontal floor/ceiling grid lines
    const gridLines = 8;
    for (let i = 1; i < gridLines; i++) {
      const y = (i / gridLines) * height;
      const gridProgress = Math.min(1, Math.max(0, (frame - i * 5) / 40));
      if (gridProgress <= 0) continue;

      const halfWidth = (width / 2) * gridProgress;
      const opacity = 0.15 * intensity * (1 - Math.abs(y / height - 0.5) * 1.5);
      if (opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(vpx - halfWidth, y);
      ctx.lineTo(vpx + halfWidth, y);
      ctx.stroke();
      ctx.restore();
    }

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.6);
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
