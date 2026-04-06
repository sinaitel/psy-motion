/**
 * WaterScene — figure sinking underwater, light rays from surface
 * Drowning in thoughts, overwhelm, emotional saturation
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(55, 1080, 1920, 88);
const BUBBLE_SEEDS = Array.from({ length: 18 }, (_, i) => i * 53 + 7);

function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  w: number, surfaceY: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  // Animated undulating surface line
  ctx.save();
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.4 * intensity})`;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const wave1 = Math.sin((x / w) * Math.PI * 6 + frame * 0.06) * 12;
    const wave2 = Math.sin((x / w) * Math.PI * 10 + frame * 0.04 + 1) * 6;
    const y = surfaceY + wave1 + wave2;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Secondary wave (highlight)
  ctx.shadowBlur = 6;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.25 * intensity;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const wave1 = Math.sin((x / w) * Math.PI * 7 + frame * 0.055 + 0.5) * 9;
    const wave2 = Math.sin((x / w) * Math.PI * 12 + frame * 0.035) * 4;
    const y = surfaceY + 8 + wave1 + wave2;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLightRays(
  ctx: CanvasRenderingContext2D,
  w: number, surfaceY: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const rayCount = 7;

  for (let i = 0; i < rayCount; i++) {
    const baseX = w * (0.15 + (i / (rayCount - 1)) * 0.7);
    const spreadX = baseX + (Math.sin(frame * 0.02 + i * 0.8) * 30);
    const rayLen = h * (0.45 + 0.1 * Math.sin(frame * 0.015 + i));
    const flicker = 0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3);

    const lg = ctx.createLinearGradient(spreadX, surfaceY, baseX + (spreadX - baseX) * 0.3, surfaceY + rayLen);
    lg.addColorStop(0, `rgba(${hexToRgb(glowColor)},${0.22 * flicker * intensity})`);
    lg.addColorStop(0.6, `rgba(${hexToRgb(glowColor)},${0.08 * intensity})`);
    lg.addColorStop(1, 'rgba(0,0,0,0)');

    const rayW = 20 + i * 8;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(spreadX - rayW / 2, surfaceY);
    ctx.lineTo(spreadX + rayW / 2, surfaceY);
    ctx.lineTo(baseX + (spreadX - baseX) * 0.3 + rayW * 2, surfaceY + rayLen);
    ctx.lineTo(baseX + (spreadX - baseX) * 0.3 - rayW * 2, surfaceY + rayLen);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawBubbles(
  ctx: CanvasRenderingContext2D,
  cx: number, bottomY: number, topY: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  for (let i = 0; i < BUBBLE_SEEDS.length; i++) {
    const seed = BUBBLE_SEEDS[i];
    const period = 80 + (seed % 60);
    const t = ((frame + seed % period) % period) / period;
    const x = cx + (seed % 200 - 100) + Math.sin(t * Math.PI * 3 + i) * 20;
    const y = bottomY - t * (bottomY - topY * 0.95);
    const r = 3 + (seed % 5);
    const opacity = Math.sin(t * Math.PI) * 0.4 * intensity;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},0.7)`;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    // Bubble highlight
    ctx.globalAlpha = opacity * 0.5;
    ctx.fillStyle = `rgba(255,255,255,0.2)`;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSinkingFigure(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  frame: number,
  durationInFrames: number,
  glowColor: string,
  intensity: number
) {
  // Figure slowly sinks deeper
  const sinkOffset = (frame / durationInFrames) * 80;
  const fcy = cy + sinkOffset;
  const slow = Math.sin(frame * 0.015) * 4;

  ctx.save();
  ctx.translate(cx + slow, fcy);

  // Figure opacity — fades as sinks
  const depth = sinkOffset / 80;
  const figOpacity = (0.5 - depth * 0.2) * intensity;
  ctx.globalAlpha = figOpacity;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.fillStyle = `rgba(${hexToRgb(glowColor)},0.06)`;

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -140, 30, 38, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Torso — arms spread (cruciform/surrender)
  ctx.beginPath();
  ctx.moveTo(0, -104);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Arms spread wide floating upward
  const armDrift = Math.sin(frame * 0.02) * 8;
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.bezierCurveTo(-30, -95 + armDrift, -70, -90 + armDrift, -110, -70 + armDrift);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.bezierCurveTo(30, -95 + armDrift, 70, -90 + armDrift, 110, -70 + armDrift);
  ctx.stroke();

  // Legs drifting
  const legDrift = Math.sin(frame * 0.018 + 1) * 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-15, 50, -20 + legDrift, 90, -12, 130);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(15, 50, 20 - legDrift, 90, 12, 130);
  ctx.stroke();

  // Hair floating up
  ctx.globalAlpha = figOpacity * 0.5;
  for (let h = 0; h < 6; h++) {
    const hx = -20 + h * 8;
    const hy = -175;
    const floatY = -30 - Math.sin(frame * 0.025 + h) * 18;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.bezierCurveTo(hx - 8, hy + floatY * 0.4, hx + 4, hy + floatY * 0.7, hx - 2, hy + floatY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawUnderwaterAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  surfaceY: number,
  glowColor: string,
  intensity: number
) {
  // Deep water tint — very subtle blue-dark
  const waterG = ctx.createLinearGradient(0, surfaceY, 0, h);
  waterG.addColorStop(0, `rgba(0,10,30,0.12)`);
  waterG.addColorStop(1, `rgba(0,0,10,0.45)`);
  ctx.fillStyle = waterG;
  ctx.fillRect(0, surfaceY, w, h - surfaceY);
}

export const WaterScene: React.FC<Props> = ({
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
    const surfaceY = height * 0.22;
    const figureY = height * 0.50;

    // Above water — faint ambient
    drawRadialGlow(ctx, cx, surfaceY * 0.5, width * 0.5,
      `rgb(${hexToRgb(glowColor)})`, 0.06 * intensity);

    // Underwater atmosphere
    drawUnderwaterAtmosphere(ctx, width, height, surfaceY, glowColor, intensity);

    // Light rays penetrating from surface
    drawLightRays(ctx, width, surfaceY, height, frame, glowColor, intensity);

    // Surface waves
    drawWaterSurface(ctx, width, surfaceY, frame, glowColor, intensity);

    // Bubbles rising
    drawBubbles(ctx, cx, figureY + 200, surfaceY, frame, glowColor, intensity);

    // Figure sinking
    drawSinkingFigure(ctx, cx, figureY, frame, durationInFrames, glowColor, intensity);

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.3);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
