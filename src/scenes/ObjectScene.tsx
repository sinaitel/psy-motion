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

const PARTICLES = seedParticles(60, 1080, 1920, 77);

function drawIcosahedron(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  radius: number,
  rotation: number,
  glowColor: string,
  intensity: number
) {
  const sides = 20;
  const innerR = radius * 0.55;

  // Outer rings (3 tilted)
  for (let ring = 0; ring < 3; ring++) {
    const tilt = ring * (Math.PI / 3) + rotation;
    const ringOpacity = 0.4 + 0.3 * Math.sin(rotation * 2 + ring);

    ctx.save();
    ctx.globalAlpha = ringOpacity * intensity;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = cx + radius * Math.cos(angle) * Math.cos(tilt);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Internal structure — lines from center to ring
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + rotation * 0.7;
    const ox = cx + innerR * Math.cos(angle);
    const oy = cy + innerR * Math.sin(angle);
    const spokeOpacity = (0.3 + 0.3 * Math.sin(rotation * 3 + i)) * intensity;

    ctx.save();
    ctx.globalAlpha = spokeOpacity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.restore();
  }

  // Center core
  drawGlowCircle(ctx, cx, cy, 8, glowColor, 30, intensity);
  drawGlowCircle(ctx, cx, cy, 3, '#ffffff', 10, intensity * 0.8);

  // Ink fragments orbiting
  const fragCount = 8;
  for (let i = 0; i < fragCount; i++) {
    const angle = (i / fragCount) * Math.PI * 2 + rotation * 1.5;
    const dist = radius * (0.8 + 0.3 * Math.sin(rotation * 2 + i));
    const fx = cx + dist * Math.cos(angle);
    const fy = cy + dist * Math.sin(angle);
    const fOpacity = (0.4 + 0.4 * Math.sin(rotation + i * 0.8)) * intensity;

    ctx.save();
    ctx.globalAlpha = fOpacity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 20 * Math.cos(angle + Math.PI / 2), fy + 20 * Math.sin(angle + Math.PI / 2));
    ctx.stroke();
    ctx.restore();
  }
}

export const ObjectScene: React.FC<Props> = ({
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

    const rotation = (frame / durationInFrames) * Math.PI * 2;
    const pulse = 0.5 + 0.5 * Math.sin((frame / 40) * Math.PI);

    drawRadialGlow(ctx, width / 2, height * 0.48, width * 0.6,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.15 * intensity);

    drawIcosahedron(ctx, width / 2, height * 0.48, width * 0.28, rotation, glowColor, intensity);

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.7);
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
