/**
 * ClockScene — 3:47am, time distortion, insomnia, melting clock
 * Subjective time dilation during sleepless nights
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles, drawRadialGlow,
  seedParticles, hexToRgb, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(35, 1080, 1920, 19);

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function drawClockFace(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  glowColor: string,
  intensity: number,
  frame: number
) {
  const distort = 0.04 + 0.02 * Math.sin(frame * 0.03);

  // Outer glow halo
  ctx.save();
  ctx.globalAlpha = 0.12 * intensity;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Face fill
  ctx.save();
  const fg = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
  fg.addColorStop(0, `rgba(${hexToRgb(glowColor)},${0.04 * intensity})`);
  fg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Clock rim — distorted slightly
  ctx.save();
  ctx.strokeStyle = `rgba(${hexToRgb(glowColor)},${0.6 * intensity})`;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const rimPoints = 120;
  for (let i = 0; i <= rimPoints; i++) {
    const a = (i / rimPoints) * Math.PI * 2;
    const warp = 1 + distort * Math.sin(a * 3 + frame * 0.02);
    const px = cx + Math.cos(a) * r * warp;
    const py = cy + Math.sin(a) * r * warp;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Hour ticks
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const warp = 1 + distort * Math.sin(a * 3 + frame * 0.02);
    const innerR = r * (i % 3 === 0 ? 0.82 : 0.88);
    const outerR = r * 0.94 * warp;
    ctx.globalAlpha = (i % 3 === 0 ? 0.7 : 0.4) * intensity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = i % 3 === 0 ? 10 : 5;
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
    ctx.stroke();
  }
  ctx.restore();

  // Minute ticks
  ctx.save();
  ctx.globalAlpha = 0.15 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.91, cy + Math.sin(a) * r * 0.91);
    ctx.lineTo(cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94);
    ctx.stroke();
  }
  ctx.restore();

  // Roman numerals
  ctx.save();
  ctx.font = `${Math.round(r * 0.13)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const numR = r * 0.72;
    const nx = cx + Math.cos(a) * numR;
    const ny = cy + Math.sin(a) * numR;

    // 3 and 4 melt / blur more (anxiety around 3-4am)
    const meltFactor = (i === 3 || i === 4) ? 0.6 : 1.0;
    ctx.globalAlpha = meltFactor * 0.55 * intensity;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8 / meltFactor;

    // Apply subtle vertical drip offset for melting effect
    const drip = (i === 3 || i === 4) ? Math.sin(frame * 0.02 + i) * 4 : 0;
    ctx.fillText(ROMAN[i], nx, ny + drip);
  }
  ctx.restore();
}

function drawHands(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  glowColor: string,
  intensity: number,
  frame: number
) {
  // 3:47:xx — frozen with seconds ticking painfully
  const seconds = (frame * 0.5) % 60; // each real second = 15 frames at 30fps
  const minutes = 47 + seconds / 60;
  const hours = 3 + minutes / 60;

  const hourAngle = (hours / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
  const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;

  // Hour hand — thick, short
  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.75 * intensity;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(hourAngle) * r * 0.12, cy - Math.sin(hourAngle) * r * 0.12);
  ctx.lineTo(cx + Math.cos(hourAngle) * r * 0.50, cy + Math.sin(hourAngle) * r * 0.50);
  ctx.stroke();
  ctx.restore();

  // Minute hand — long
  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.70 * intensity;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(minAngle) * r * 0.10, cy - Math.sin(minAngle) * r * 0.10);
  ctx.lineTo(cx + Math.cos(minAngle) * r * 0.70, cy + Math.sin(minAngle) * r * 0.70);
  ctx.stroke();
  ctx.restore();

  // Second hand — thin red
  ctx.save();
  ctx.strokeStyle = '#ff4422';
  ctx.shadowColor = '#ff4422';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.85 * intensity;
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(secAngle) * r * 0.22, cy - Math.sin(secAngle) * r * 0.22);
  ctx.lineTo(cx + Math.cos(secAngle) * r * 0.80, cy + Math.sin(secAngle) * r * 0.80);
  ctx.stroke();
  // Counter-balance tail
  ctx.globalAlpha = 0.4 * intensity;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - Math.cos(secAngle) * r * 0.22, cy - Math.sin(secAngle) * r * 0.22);
  ctx.stroke();
  ctx.restore();

  // Center pivot
  drawGlowCircle(ctx, cx, cy, 5, glowColor, 12, intensity * 0.8);
}

function drawMeltDrips(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  glowColor: string,
  intensity: number,
  frame: number
) {
  const dripCount = 4;
  for (let i = 0; i < dripCount; i++) {
    const baseAngle = (i / dripCount) * Math.PI * 1.2 + Math.PI * 0.4;
    const startX = cx + Math.cos(baseAngle) * r * 0.95;
    const startY = cy + Math.sin(baseAngle) * r * 0.95;
    const dripLen = 30 + i * 18 + Math.sin(frame * 0.015 + i) * 15;

    ctx.save();
    ctx.globalAlpha = 0.20 * intensity;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + Math.cos(baseAngle) * 8, startY + dripLen * 0.4,
      startX - Math.cos(baseAngle) * 4, startY + dripLen * 0.7,
      startX + Math.cos(baseAngle) * 2, startY + dripLen
    );
    ctx.stroke();

    // Drip drop
    ctx.beginPath();
    ctx.arc(startX + Math.cos(baseAngle) * 2, startY + dripLen + 5, 4 - i * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const ClockScene: React.FC<Props> = ({
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
    const cy = height * 0.46;
    const r = width * 0.32;
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04);

    drawRadialGlow(ctx, cx, cy, r * 2.5,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.09 * intensity);

    drawClockFace(ctx, cx, cy, r, glowColor, intensity, frame);
    drawMeltDrips(ctx, cx, cy, r, glowColor, intensity, frame);
    drawHands(ctx, cx, cy, r, glowColor, intensity, frame);

    // "3h47" digital readout below
    ctx.save();
    ctx.globalAlpha = 0.28 * intensity;
    ctx.font = `${Math.round(width * 0.055)}px monospace`;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    const secDisplay = String(Math.floor((frame * 0.5) % 60)).padStart(2, '0');
    ctx.fillText(`03:47:${secDisplay}`, cx, cy + r + height * 0.08);
    ctx.restore();

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.35);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
