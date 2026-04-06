/**
 * CityScene — isolated figure standing against a night city skyline
 * Alienation, urban loneliness, disconnection from others
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(40, 1080, 1920, 103);

// Building data: [x%, width%, height%, windowCols, windowRows]
const BUILDINGS: [number, number, number, number, number][] = [
  [0.00, 0.10, 0.25, 3, 8],
  [0.08, 0.07, 0.32, 2, 10],
  [0.14, 0.09, 0.20, 3, 6],
  [0.21, 0.06, 0.38, 2, 12],
  [0.26, 0.08, 0.28, 2, 9],
  [0.32, 0.11, 0.42, 3, 14],  // tallest center-left
  [0.41, 0.07, 0.35, 2, 11],
  [0.46, 0.05, 0.22, 2, 7],
  [0.50, 0.09, 0.48, 3, 16],  // central tower
  [0.57, 0.06, 0.30, 2, 10],
  [0.62, 0.10, 0.26, 3, 8],
  [0.70, 0.08, 0.40, 2, 13],
  [0.77, 0.06, 0.22, 2, 7],
  [0.81, 0.09, 0.34, 3, 11],
  [0.88, 0.07, 0.20, 2, 6],
  [0.93, 0.08, 0.28, 2, 9],
];

function drawCitySkyline(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  const groundY = h * 0.72;

  // Sky gradient — deep urban night
  const skyG = ctx.createLinearGradient(0, 0, 0, groundY);
  skyG.addColorStop(0, '#000000');
  skyG.addColorStop(0.5, '#050508');
  skyG.addColorStop(1, `rgba(${hexToRgb(glowColor)},0.04)`);
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, w, groundY);

  // Distant city haze / light pollution
  const hazeG = ctx.createRadialGradient(w * 0.5, groundY, 0, w * 0.5, groundY, w * 0.8);
  hazeG.addColorStop(0, `rgba(${hexToRgb(glowColor)},${0.06 * intensity})`);
  hazeG.addColorStop(0.5, `rgba(${hexToRgb(glowColor)},${0.02 * intensity})`);
  hazeG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hazeG;
  ctx.fillRect(0, groundY * 0.4, w, groundY * 0.6);

  for (const [xPct, wPct, hPct, wCols, hRows] of BUILDINGS) {
    const bx = xPct * w;
    const bw = wPct * w;
    const bh = hPct * h;
    const by = groundY - bh;

    // Building silhouette fill
    ctx.fillStyle = '#050505';
    ctx.fillRect(bx, by, bw, bh);

    // Building edge glow (facing the ambient light)
    ctx.save();
    ctx.globalAlpha = 0.12 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    // Windows
    const padX = bw * 0.12;
    const padY = bh * 0.04;
    const winW = (bw - padX * 2) / wCols;
    const winH = (bh - padY * 2) / hRows;
    const winPad = winW * 0.25;

    for (let row = 0; row < hRows; row++) {
      for (let col = 0; col < wCols; col++) {
        const seed = (xPct * 1000 + row * 100 + col) | 0;
        // Some windows lit, some dark — pseudo-random
        const isLit = ((seed * 1664525 + 1013904223) & 0xffffffff) % 100 > 55;
        if (!isLit) continue;

        // Slow flicker
        const flicker = 0.85 + 0.15 * Math.sin(frame * 0.01 + seed * 0.1);
        const wx = bx + padX + col * winW + winPad * 0.5;
        const wy = by + padY + row * winH + winPad * 0.3;
        const ww = winW - winPad;
        const wh = winH - winPad * 0.6;

        // Window glow
        ctx.save();
        ctx.globalAlpha = flicker * 0.45 * intensity;
        const wg = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww);
        wg.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.9)`);
        wg.addColorStop(1, `rgba(${hexToRgb(glowColor)},0.1)`);
        ctx.fillStyle = wg;
        ctx.fillRect(wx, wy, ww, wh);
        ctx.restore();
      }
    }

    // Rooftop antenna (tall buildings)
    if (hPct > 0.35) {
      const antennaX = bx + bw / 2;
      const antennaTop = by - bw * 0.4;
      ctx.save();
      ctx.globalAlpha = 0.4 * intensity;
      ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(antennaX, by);
      ctx.lineTo(antennaX, antennaTop);
      ctx.stroke();
      // Blinking red light
      const blink = Math.sin(frame * 0.12) > 0.7 ? 1 : 0;
      if (blink) {
        ctx.globalAlpha = 0.8 * intensity;
        ctx.fillStyle = '#ff2200';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(antennaX, antennaTop, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Ground / street
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, groundY, w, h - groundY);

  // Street reflection (wet pavement)
  const refG = ctx.createLinearGradient(0, groundY, 0, groundY + h * 0.06);
  refG.addColorStop(0, `rgba(${hexToRgb(glowColor)},${0.04 * intensity})`);
  refG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = refG;
  ctx.fillRect(0, groundY, w, h * 0.06);

  // Street lamp pools
  for (let lamp = 0; lamp < 4; lamp++) {
    const lx = w * (0.12 + lamp * 0.25);
    const ly = groundY + 2;
    ctx.save();
    ctx.globalAlpha = 0.06 * intensity;
    const lampG = ctx.createRadialGradient(lx, ly, 0, lx, ly, 80);
    lampG.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.8)`);
    lampG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lampG;
    ctx.ellipse(lx, ly, 80, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Human silhouette — standing pose, hands in pockets
function drawStandingFigure(
  ctx: CanvasRenderingContext2D,
  cx: number, footY: number,
  scale: number,
  glowColor: string,
  intensity: number,
  frame: number
) {
  ctx.save();
  ctx.translate(cx, footY);
  ctx.scale(scale, scale);

  const breathe = Math.sin(frame * 0.02) * 1.5;
  const alpha = 0.92;

  // Fill — pure black silhouette
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000000';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -215 + breathe, 22, 27, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.beginPath();
  ctx.fillRect(-8, -190 + breathe, 16, 14);
  ctx.fill();

  // Torso (slim)
  ctx.beginPath();
  ctx.moveTo(-22, -178);
  ctx.bezierCurveTo(-26, -150, -24, -80, -20, -30);
  ctx.lineTo(20, -30);
  ctx.bezierCurveTo(24, -80, 26, -150, 22, -178);
  ctx.closePath();
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.moveTo(-22, -175);
  ctx.bezierCurveTo(-42, -172, -50, -165, -46, -152);
  ctx.lineTo(-22, -145);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, -175);
  ctx.bezierCurveTo(42, -172, 50, -165, 46, -152);
  ctx.lineTo(22, -145);
  ctx.closePath();
  ctx.fill();

  // Left arm — hand in pocket
  ctx.beginPath();
  ctx.moveTo(-42, -155);
  ctx.bezierCurveTo(-48, -120, -42, -70, -38, -30);
  ctx.lineTo(-30, -30);
  ctx.bezierCurveTo(-30, -55, -36, -110, -34, -152);
  ctx.closePath();
  ctx.fill();

  // Right arm — hand in pocket
  ctx.beginPath();
  ctx.moveTo(42, -155);
  ctx.bezierCurveTo(48, -120, 42, -70, 38, -30);
  ctx.lineTo(30, -30);
  ctx.bezierCurveTo(30, -55, 36, -110, 34, -152);
  ctx.closePath();
  ctx.fill();

  // Hips + trousers
  ctx.beginPath();
  ctx.moveTo(-24, -30);
  ctx.bezierCurveTo(-28, 0, -26, 60, -18, 110);
  ctx.lineTo(-10, 110);
  ctx.bezierCurveTo(-12, 60, -8, 0, 0, -30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(24, -30);
  ctx.bezierCurveTo(28, 0, 26, 60, 18, 110);
  ctx.lineTo(10, 110);
  ctx.bezierCurveTo(12, 60, 8, 0, 0, -30);
  ctx.closePath();
  ctx.fill();

  // Feet
  ctx.beginPath();
  ctx.ellipse(-15, 110, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(15, 110, 12, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Glow rim — back-lit by city
  ctx.globalAlpha = 0.25 * intensity;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  // Head rim
  ctx.beginPath();
  ctx.ellipse(0, -215 + breathe, 22, 27, 0, Math.PI * 0.6, Math.PI * 1.4);
  ctx.stroke();

  ctx.restore();
}

// Ground shadow / reflection
function drawFigureReflection(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number,
  scale: number,
  glowColor: string,
  intensity: number
) {
  ctx.save();
  ctx.globalAlpha = 0.12 * intensity;
  ctx.scale(1, -0.15);
  ctx.translate(0, -(groundY * (1 / 0.15) + groundY * 0.15));
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(cx, groundY / 0.15 - 5, 18 * scale, 60 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const CityScene: React.FC<Props> = ({
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

    const groundY = height * 0.72;
    const cx = width * 0.5;

    // Slow camera drift
    const drift = Math.sin(frame * 0.008) * 6;

    drawCitySkyline(ctx, width, height, frame, glowColor, intensity);

    // Ambient figure glow from behind (city light)
    drawRadialGlow(ctx, cx + drift, groundY - 80, 160,
      `rgb(${hexToRgb(glowColor)})`, 0.08 * intensity);

    // Figure
    drawStandingFigure(ctx, cx + drift, groundY, 1.1, glowColor, intensity, frame);

    // Foot shadow
    ctx.save();
    ctx.globalAlpha = 0.3 * intensity;
    const shadowG = ctx.createRadialGradient(cx + drift, groundY + 5, 0, cx + drift, groundY + 5, 40);
    shadowG.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.4)`);
    shadowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowG;
    ctx.ellipse(cx + drift, groundY + 5, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.35);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
