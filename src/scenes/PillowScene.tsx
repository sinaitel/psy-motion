/**
 * PillowScene — figure lying awake at night, insomnia, rumination
 * Dark bedroom, glowing eyes, thought fragments drifting
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow,
  drawGlowCircle, drawSmokeLayers,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(70, 1080, 1920, 33);

// Thought fragments — words drifting upward
const THOUGHT_WORDS = [
  'pourquoi ?', 'et si…', 'demain', 'je rate tout',
  'ça va mal', 'trop tard', 'personne', 'seul',
  'j\'aurais dû', 'encore',
];

function drawBedroom(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  glowColor: string,
  pulse: number,
  intensity: number
) {
  // Ceiling
  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, w, h * 0.25);

  // Far wall
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, h * 0.25, w, h * 0.45);

  // Floor / bed shadow
  ctx.fillStyle = '#040404';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Window — faint cold light from outside
  const winW = w * 0.22;
  const winH = h * 0.20;
  const winX = w * 0.72;
  const winY = h * 0.08;

  const winG = ctx.createRadialGradient(winX + winW / 2, winY + winH / 2, 4,
    winX + winW / 2, winY + winH / 2, winW);
  winG.addColorStop(0, `rgba(180,200,255,${0.04 * intensity})`);
  winG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = winG;
  ctx.fillRect(winX - winW * 0.2, winY - winH * 0.2, winW * 1.4, winH * 1.4);

  // Window frame
  ctx.save();
  ctx.globalAlpha = 0.08 * intensity;
  ctx.strokeStyle = '#aac0ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(winX, winY, winW, winH);
  // Cross
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, winY + winH);
  ctx.moveTo(winX, winY + winH / 2);
  ctx.lineTo(winX + winW, winY + winH / 2);
  ctx.stroke();
  ctx.restore();

  // Clock on wall
  const clockX = w * 0.18;
  const clockY = h * 0.15;
  const clockR = w * 0.04;
  ctx.save();
  ctx.globalAlpha = 0.12 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2);
  ctx.stroke();
  // Hour/minute hands (3:47am)
  const hourAngle = (3 / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = (47 / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(hourAngle) * clockR * 0.5, clockY + Math.sin(hourAngle) * clockR * 0.5);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(minAngle) * clockR * 0.75, clockY + Math.sin(minAngle) * clockR * 0.75);
  ctx.stroke();
  ctx.restore();
}

function drawFigure(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  glowColor: string,
  pulse: number,
  frame: number,
  intensity: number
) {
  const figY = h * 0.62;
  const cx = w * 0.5;

  // Pillow
  ctx.save();
  ctx.fillStyle = '#111111';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(cx, figY + h * 0.06, w * 0.28, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pillow highlight edge
  ctx.globalAlpha = 0.12 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, figY + h * 0.06, w * 0.28, h * 0.06, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Body under covers (lying flat)
  ctx.save();
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.35, figY + h * 0.08);
  ctx.bezierCurveTo(cx - w * 0.35, figY + h * 0.20, cx + w * 0.38, figY + h * 0.20, cx + w * 0.38, figY + h * 0.08);
  ctx.bezierCurveTo(cx + w * 0.38, figY + h * 0.05, cx - w * 0.35, figY + h * 0.05, cx - w * 0.35, figY + h * 0.08);
  ctx.fill();

  // Cover fold / crease glow
  ctx.globalAlpha = 0.08 * intensity;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.30, figY + h * 0.10);
  ctx.bezierCurveTo(cx - w * 0.10, figY + h * 0.13, cx + w * 0.10, figY + h * 0.12, cx + w * 0.30, figY + h * 0.09);
  ctx.stroke();
  ctx.restore();

  // Head silhouette
  ctx.save();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.04, figY - h * 0.02, w * 0.09, h * 0.075, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eyes — open, glowing slightly
  const eyeY = figY - h * 0.015;
  const eyeSpacing = w * 0.038;
  for (const side of [-1, 1]) {
    const ex = cx - w * 0.04 + side * eyeSpacing;

    // Eye white (dark)
    ctx.save();
    ctx.fillStyle = '#0c0c0c';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, w * 0.018, h * 0.01, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Iris glow
    ctx.save();
    ctx.globalAlpha = (0.3 + pulse * 0.25) * intensity;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ex, eyeY, w * 0.009, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Pupil
    drawGlowCircle(ctx, ex, eyeY, 3, glowColor, 8, pulse * intensity * 0.5);
  }

  // Tear — occasional
  const tearFrame = (frame + 60) % 150;
  if (tearFrame < 80) {
    const tearX = cx - w * 0.04 - eyeSpacing * 0.5;
    const tearY = eyeY + (tearFrame / 80) * h * 0.04;
    ctx.save();
    ctx.globalAlpha = Math.sin((tearFrame / 80) * Math.PI) * 0.5 * intensity;
    ctx.fillStyle = `rgba(${hexToRgb(glowColor)},0.5)`;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(tearX, tearY, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawThoughtFragments(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: number,
  glowColor: string,
  intensity: number
) {
  for (let i = 0; i < THOUGHT_WORDS.length; i++) {
    const seed = i * 73 + 11;
    const startX = w * (0.1 + (seed % 80) / 100);
    const period = 200 + (seed % 100);
    const phaseOffset = (seed % period);
    const t = ((frame + phaseOffset) % period) / period;

    // Float upward
    const y = h * 0.58 - t * h * 0.45;
    const opacity = Math.sin(t * Math.PI) * 0.4 * intensity;
    if (opacity <= 0) continue;

    const drift = Math.sin((frame * 0.02) + i) * 20;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${Math.round(w * 0.022)}px serif`;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left';
    ctx.fillText(THOUGHT_WORDS[i], startX + drift, y);
    ctx.restore();
  }
}

export const PillowScene: React.FC<Props> = ({
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

    const pulse = 0.5 + 0.5 * Math.sin((frame / 70) * Math.PI);

    drawBedroom(ctx, width, height, glowColor, pulse, intensity);

    // Faint glow above the figure — intrusive thoughts emanating
    drawRadialGlow(ctx, width / 2, height * 0.42, width * 0.55,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.07 * intensity);

    drawSmokeLayers(ctx, width, height, frame, durationInFrames, glowColor, intensity * 0.4);
    drawThoughtFragments(ctx, width, height, frame, glowColor, intensity);
    drawFigure(ctx, width, height, glowColor, pulse, frame, intensity);

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.35);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
