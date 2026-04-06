import React, { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import {
  clearCanvas, drawVignette, drawGlowCircle,
  drawGlowBezier, drawParticles, seedParticles,
  hexToRgb, drawRadialGlow,
} from '../utils/canvas';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

// 60 nodes in brain shape (normalised 0-1)
const NODES = [
  // Top
  { x: 0.50, y: 0.22 }, { x: 0.38, y: 0.24 }, { x: 0.62, y: 0.24 },
  { x: 0.28, y: 0.29 }, { x: 0.72, y: 0.29 },
  // Upper mid
  { x: 0.20, y: 0.35 }, { x: 0.34, y: 0.32 }, { x: 0.50, y: 0.30 }, { x: 0.66, y: 0.32 }, { x: 0.80, y: 0.35 },
  // Mid
  { x: 0.16, y: 0.42 }, { x: 0.28, y: 0.40 }, { x: 0.40, y: 0.38 }, { x: 0.50, y: 0.37 },
  { x: 0.60, y: 0.38 }, { x: 0.72, y: 0.40 }, { x: 0.84, y: 0.42 },
  // Center — amygdala zone
  { x: 0.42, y: 0.48, isAmygdala: true }, { x: 0.58, y: 0.48, isAmygdala: true },
  { x: 0.50, y: 0.46 },
  // Lower mid
  { x: 0.18, y: 0.50 }, { x: 0.30, y: 0.48 }, { x: 0.70, y: 0.48 }, { x: 0.82, y: 0.50 },
  { x: 0.38, y: 0.54 }, { x: 0.50, y: 0.53 }, { x: 0.62, y: 0.54 },
  // Lower
  { x: 0.22, y: 0.58 }, { x: 0.34, y: 0.58 }, { x: 0.50, y: 0.59 }, { x: 0.66, y: 0.58 }, { x: 0.78, y: 0.58 },
  { x: 0.28, y: 0.64 }, { x: 0.40, y: 0.64 }, { x: 0.50, y: 0.65 }, { x: 0.60, y: 0.64 }, { x: 0.72, y: 0.64 },
  // Bottom
  { x: 0.36, y: 0.70 }, { x: 0.50, y: 0.72 }, { x: 0.64, y: 0.70 },
  { x: 0.43, y: 0.76 }, { x: 0.57, y: 0.76 },
];

// Connections between nearby nodes
const EDGES: [number, number][] = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const dx = NODES[i].x - NODES[j].x;
    const dy = NODES[i].y - NODES[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.14) EDGES.push([i, j]);
  }
}

const PARTICLES = seedParticles(60, 1080, 1920, 99);

function drawBrainBackground(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  glowColor: string,
  pulse: number,
  intensity: number
) {
  // Multi-layer ambient glow at brain center
  const cx = w / 2;
  const cy = h * 0.48;
  for (let i = 3; i >= 1; i--) {
    drawRadialGlow(ctx, cx, cy, w * 0.5 * i * 0.4,
      `rgb(${hexToRgb(glowColor)})`, pulse * 0.07 * intensity * (4 - i));
  }
}

function getElectricPoint(
  x1: number, y1: number, x2: number, y2: number, t: number
): { x: number; y: number } {
  // Point along bezier at parameter t (simplified linear for spark)
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
}

export const BrainScene: React.FC<Props> = ({
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

    const pulse = 0.5 + 0.5 * Math.sin((frame / 45) * Math.PI);
    const amygdalaPulse = 0.5 + 0.5 * Math.sin((frame / 22) * Math.PI);

    drawBrainBackground(ctx, width, height, glowColor, pulse, intensity);

    // === EDGES ===
    const edgeCyclePeriod = durationInFrames / EDGES.length;

    for (let i = 0; i < EDGES.length; i++) {
      const [a, b] = EDGES[i];
      const na = NODES[a];
      const nb = NODES[b];

      const x1 = na.x * width;
      const y1 = na.y * height;
      const x2 = nb.x * width;
      const y2 = nb.y * height;

      // Control points for bezier (slight curve)
      const mx = (x1 + x2) / 2 + (Math.random() * 20 - 10);
      const my = (y1 + y2) / 2 + (Math.random() * 20 - 10);

      // Base dim connection
      ctx.save();
      ctx.globalAlpha = 0.06 * intensity;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
      ctx.restore();

      // Animated pulse along edge
      const edgePhase = (frame - i * edgeCyclePeriod * 0.1) / durationInFrames;
      const edgeActive = (Math.sin(edgePhase * Math.PI * 6 + i) + 1) / 2;
      if (edgeActive > 0.3) {
        const opacity = (edgeActive - 0.3) / 0.7 * intensity * 0.7;
        drawGlowBezier(ctx, x1, y1, mx, my, mx, my, x2, y2,
          glowColor, 1.5, 12, opacity);
      }
    }

    // === ELECTRICITY SPARK — travels along edges ===
    const sparkEdgeIdx = Math.floor((frame * 0.3) % EDGES.length);
    const sparkT = ((frame * 0.3) % 1);
    const [sa, sb] = EDGES[sparkEdgeIdx] ?? [0, 1];
    const ns = NODES[sa];
    const ne = NODES[sb];
    const spark = getElectricPoint(ns.x * width, ns.y * height, ne.x * width, ne.y * height, sparkT);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === NODES ===
    for (const n of NODES) {
      const isAmygdala = (n as typeof n & { isAmygdala?: boolean }).isAmygdala;
      const nx = n.x * width;
      const ny = n.y * height;

      if (isAmygdala) {
        // Amygdala — amber, large, pulsing shockwaves
        const ambColor = '#ffb347';
        // Shockwaves
        for (let r = 1; r <= 3; r++) {
          const waveProgress = ((frame * 0.8 + r * 20) % 60) / 60;
          const waveR = 20 + waveProgress * 80;
          const waveOpacity = (1 - waveProgress) * 0.4 * intensity;
          ctx.save();
          ctx.globalAlpha = waveOpacity;
          ctx.strokeStyle = ambColor;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = ambColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(nx, ny, waveR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        drawGlowCircle(ctx, nx, ny, 8 + amygdalaPulse * 4, ambColor, 30, intensity);
        drawGlowCircle(ctx, nx, ny, 4, '#ffffff', 10, amygdalaPulse * intensity);
      } else {
        // Regular node
        const nodeOpacity = 0.5 + 0.5 * Math.sin((frame / 30 + n.x * 10) * Math.PI);
        drawGlowCircle(ctx, nx, ny, 4, glowColor, 16, nodeOpacity * intensity * 0.8);
        drawGlowCircle(ctx, nx, ny, 2, '#ffffff', 4, nodeOpacity * intensity * 0.4);
      }
    }

    // Floating particles
    drawParticles(ctx, PARTICLES, frame, glowColor, intensity * 0.5);

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
