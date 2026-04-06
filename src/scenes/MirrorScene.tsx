/**
 * MirrorScene — figure face-to-face with their reflection
 * The mirror self is darker, distorted — inner critic, double bind
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow,
  drawGlowCircle, drawGlowLine,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(45, 1080, 1920, 61);

function drawFigureSilhouette(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number,
  scale: number,
  glowColor: string,
  intensity: number,
  mirrored: boolean,
  frame: number,
  isDark: boolean
) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(mirrored ? -scale : scale, scale);

  const breathe = Math.sin(frame * 0.025) * 2;
  const bodyColor = isDark
    ? `rgba(${hexToRgb(glowColor)},${0.08 * intensity})`
    : `rgba(${hexToRgb(glowColor)},${0.15 * intensity})`;
  const strokeColor = isDark
    ? `rgba(${hexToRgb(glowColor)},${0.3 * intensity})`
    : `rgba(${hexToRgb(glowColor)},${0.55 * intensity})`;

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -220 + breathe, 38, 46, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = strokeColor;
  ctx.shadowColor = isDark ? '#330000' : glowColor;
  ctx.shadowBlur = isDark ? 4 : 14;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Neck
  ctx.beginPath();
  ctx.moveTo(-10, -176 + breathe);
  ctx.lineTo(10, -176 + breathe);
  ctx.lineTo(12, -158);
  ctx.lineTo(-12, -158);
  ctx.closePath();
  ctx.fill();

  // Shoulders + torso
  ctx.beginPath();
  ctx.moveTo(-68, -148);
  ctx.bezierCurveTo(-72, -120, -70, -40, -60, 20);
  ctx.lineTo(-28, 20);
  ctx.lineTo(-20, -148);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(68, -148);
  ctx.bezierCurveTo(72, -120, 70, -40, 60, 20);
  ctx.lineTo(28, 20);
  ctx.lineTo(20, -148);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Torso center
  ctx.beginPath();
  ctx.moveTo(-20, -148);
  ctx.lineTo(20, -148);
  ctx.lineTo(28, 20);
  ctx.lineTo(-28, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Arms hanging
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  // Left arm
  ctx.beginPath();
  ctx.moveTo(-62, -130);
  ctx.bezierCurveTo(-80, -50, -76, 40, -70, 80);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(62, -130);
  ctx.bezierCurveTo(80, -50, 76, 40, 70, 80);
  ctx.stroke();

  // Legs
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-18, 20);
  ctx.bezierCurveTo(-20, 100, -22, 180, -18, 220);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, 20);
  ctx.bezierCurveTo(20, 100, 22, 180, 18, 220);
  ctx.stroke();

  // Feet
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, 220);
  ctx.lineTo(mirrored ? 10 : -38, 228);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, 220);
  ctx.lineTo(mirrored ? 42 : -10, 228);
  ctx.stroke();

  // Eye glow
  const eyeGlowOpacity = isDark ? 0.6 * intensity : 0.3 * intensity;
  ctx.globalAlpha = eyeGlowOpacity;
  ctx.shadowColor = isDark ? '#ff3300' : glowColor;
  ctx.shadowBlur = isDark ? 20 : 10;
  ctx.fillStyle = isDark ? '#ff2200' : glowColor;
  ctx.beginPath();
  ctx.ellipse(-12, -226 + breathe, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, -226 + breathe, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMirrorFrame(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  glowColor: string,
  frame: number,
  intensity: number
) {
  const mw = w * 0.38;
  const mh = h * 0.55;
  const mx = cx - mw / 2;
  const my = cy - mh / 2;

  // Mirror surface — very subtle reflection color
  ctx.save();
  ctx.globalAlpha = 0.04 * intensity;
  ctx.fillStyle = glowColor;
  ctx.fillRect(mx, my, mw, mh);
  ctx.restore();

  // Mirror shimmer
  const shimmer = 0.3 + 0.2 * Math.sin(frame * 0.04);
  const sg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
  sg.addColorStop(0, 'rgba(0,0,0,0)');
  sg.addColorStop(0.45, `rgba(${hexToRgb(glowColor)},${shimmer * 0.12 * intensity})`);
  sg.addColorStop(0.55, `rgba(255,255,255,${shimmer * 0.06 * intensity})`);
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(mx, my, mw, mh);

  // Frame glow edges
  ctx.save();
  ctx.globalAlpha = 0.55 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, mw, mh);

  // Corner ornaments
  const cs = 18;
  for (const [ex, ey] of [[mx, my], [mx + mw, my], [mx, my + mh], [mx + mw, my + mh]] as [number, number][]) {
    const sx = ex === mx ? 1 : -1;
    const sy = ey === my ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(ex + sx * cs, ey);
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex, ey + sy * cs);
    ctx.stroke();
  }
  ctx.restore();

  // Crack in the mirror — psychological fracture
  const crackProgress = Math.min(1, frame / (30 * 4));
  if (crackProgress > 0) {
    ctx.save();
    ctx.globalAlpha = crackProgress * 0.35 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 0.8;

    // Main crack
    ctx.beginPath();
    ctx.moveTo(cx, my + mh * 0.2);
    ctx.lineTo(cx - mw * 0.05, my + mh * 0.45);
    ctx.lineTo(cx + mw * 0.08, my + mh * 0.65);
    ctx.lineTo(cx - mw * 0.02, my + mh * 0.85);
    ctx.stroke();

    // Fissures
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(cx - mw * 0.05, my + mh * 0.45);
    ctx.lineTo(cx - mw * 0.15, my + mh * 0.38);
    ctx.moveTo(cx + mw * 0.08, my + mh * 0.65);
    ctx.lineTo(cx + mw * 0.18, my + mh * 0.58);
    ctx.stroke();
    ctx.restore();
  }
}

export const MirrorScene: React.FC<Props> = ({
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
    const cy = height / 2;
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04);

    // Ambient
    drawRadialGlow(ctx, cx, cy, width * 0.6,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.08 * intensity);

    // Floor line
    const floorY = height * 0.72;
    drawGlowLine(ctx, 0, floorY, width, floorY, glowColor, 0.5, 8, 0.1 * intensity);

    // Mirror
    drawMirrorFrame(ctx, cx, cy * 0.95, width, height, glowColor, frame, intensity);

    // Left figure — "real" self, standing back from mirror
    drawFigureSilhouette(ctx, cx - width * 0.22, floorY, 0.72,
      glowColor, intensity, false, frame, false);

    // Right figure — reflection, darker
    drawFigureSilhouette(ctx, cx + width * 0.22, floorY, 0.72,
      glowColor, intensity, true, frame + 5, true);

    // Ground shadows
    ctx.save();
    ctx.globalAlpha = 0.25 * intensity;
    const leftShadow = ctx.createRadialGradient(cx - width * 0.22, floorY + 10, 0, cx - width * 0.22, floorY + 10, 60);
    leftShadow.addColorStop(0, `rgba(${hexToRgb(glowColor)},0.3)`);
    leftShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leftShadow;
    ctx.ellipse(cx - width * 0.22, floorY + 10, 60, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.45);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
