/**
 * EyeScene — extreme close-up of a human eye
 * Iris detail, bioluminescent glow, tear, slow drift
 */
import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawParticles,
  seedParticles, hexToRgb, drawRadialGlow, drawGlowCircle,
} from '../utils/canvas';

type Props = { durationInFrames: number; glowColor?: string; intensity?: number };

const PARTICLES = seedParticles(60, 1080, 1920, 123);

function drawEye(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  scale: number,
  glowColor: string,
  pulse: number,
  blinkPhase: number,
  intensity: number,
  frame: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const lidH = 180 * blinkPhase; // blink

  // === SCLERA (white of eye) ===
  ctx.fillStyle = '#0d0d0d';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(-400, 0);
  ctx.bezierCurveTo(-300, -150, 300, -150, 400, 0);
  ctx.bezierCurveTo(300, 150, -300, 150, -400, 0);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Sclera bioluminescent tint
  const sclG = ctx.createRadialGradient(0, 0, 100, 0, 0, 380);
  sclG.addColorStop(0, `rgba(${hexToRgb(glowColor)},${pulse * 0.05 * intensity})`);
  sclG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sclG;
  ctx.beginPath();
  ctx.moveTo(-380, 0);
  ctx.bezierCurveTo(-280, -140, 280, -140, 380, 0);
  ctx.bezierCurveTo(280, 140, -280, 140, -380, 0);
  ctx.fill();

  // === IRIS ===
  // Base
  const irisG = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
  irisG.addColorStop(0, '#050505');
  irisG.addColorStop(0.35, '#0a0a0a');
  irisG.addColorStop(0.65, `rgba(${hexToRgb(glowColor)},${0.12 * intensity})`);
  irisG.addColorStop(0.85, `rgba(${hexToRgb(glowColor)},${0.08 * intensity})`);
  irisG.addColorStop(1, '#030303');
  ctx.fillStyle = irisG;
  ctx.beginPath();
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.fill();

  // Iris fiber lines (radial spokes)
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const fiberOpacity = (0.08 + 0.06 * Math.sin(angle * 7 + pulse * 2)) * intensity;
    ctx.save();
    ctx.globalAlpha = fiberOpacity;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 42, Math.sin(angle) * 42);
    ctx.lineTo(Math.cos(angle) * 132, Math.sin(angle) * 132);
    ctx.stroke();
    ctx.restore();
  }

  // Iris glow ring
  ctx.save();
  ctx.globalAlpha = pulse * intensity * 0.7;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner ring
  ctx.save();
  ctx.globalAlpha = pulse * intensity * 0.4;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // === PUPIL ===
  const pupilR = 42 + pulse * 8; // dilates with pulse
  const pupG = ctx.createRadialGradient(0, 0, 0, 0, 0, pupilR);
  pupG.addColorStop(0, '#000000');
  pupG.addColorStop(0.7, '#020202');
  pupG.addColorStop(1, '#050505');
  ctx.fillStyle = pupG;
  ctx.beginPath();
  ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
  ctx.fill();

  // Pupil reflection
  ctx.fillStyle = `rgba(${hexToRgb(glowColor)},${pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(-12, -14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(-12, -14, 5, 0, Math.PI * 2);
  ctx.fill();

  // === EYELIDS ===
  ctx.fillStyle = '#030303';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 20;
  // Upper lid
  ctx.beginPath();
  ctx.moveTo(-420, -200);
  ctx.lineTo(420, -200);
  ctx.lineTo(420, -lidH);
  ctx.bezierCurveTo(300, -(lidH + 160), -300, -(lidH + 160), -420, -lidH);
  ctx.closePath();
  ctx.fill();
  // Lower lid
  ctx.beginPath();
  ctx.moveTo(-420, 200);
  ctx.lineTo(420, 200);
  ctx.lineTo(420, lidH);
  ctx.bezierCurveTo(300, lidH + 150, -300, lidH + 150, -420, lidH);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eyelid glow edge
  ctx.save();
  ctx.globalAlpha = 0.3 + pulse * 0.2;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-400, -lidH);
  ctx.bezierCurveTo(-280, -(lidH + 148), 280, -(lidH + 148), 400, -lidH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-400, lidH);
  ctx.bezierCurveTo(-280, lidH + 138, 280, lidH + 138, 400, lidH);
  ctx.stroke();
  ctx.restore();

  // === TEAR ===
  const tearProgress = ((frame ?? 0) % 120) / 120;
  if (tearProgress < 0.7) {
    const ty = -lidH + 50 + tearProgress * 200;
    ctx.save();
    ctx.globalAlpha = tearProgress * 0.6 * intensity;
    ctx.fillStyle = `rgba(${hexToRgb(glowColor)},0.4)`;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(180, ty, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export const EyeScene: React.FC<Props> = ({
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

    const pulse = 0.5 + 0.5 * Math.sin((frame / 60) * Math.PI);
    const blinkPhase = 1 - Math.max(0, Math.sin((frame / 8) * Math.PI) > 0.95 ? 1 : 0); // rare blink
    const drift = Math.sin((frame / 150) * Math.PI * 2);
    const zoom = 1 + (frame / durationInFrames) * 0.08;

    drawRadialGlow(ctx, width / 2, height * 0.48, width * 0.6,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.1 * intensity);

    drawEye(ctx,
      width / 2 + drift * 6,
      height * 0.48 + drift * 4,
      zoom * (width / 900),
      glowColor, pulse, blinkPhase, intensity, frame
    );

    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.5);
    drawVignette(ctx, width, height);

  }, [frame, width, height, durationInFrames, glowColor, intensity]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ position: 'absolute', inset: 0 }} />
  );
};
