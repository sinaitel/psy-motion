import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

const NODES = [
  { id: 0, x: 50, y: 30, r: 5 },
  { id: 1, x: 30, y: 35, r: 4 },
  { id: 2, x: 70, y: 35, r: 4 },
  { id: 3, x: 22, y: 45, r: 3 },
  { id: 4, x: 78, y: 45, r: 3 },
  { id: 5, x: 35, y: 52, r: 4 },
  { id: 6, x: 65, y: 52, r: 4 },
  { id: 7, x: 50, y: 50, r: 6, isAmygdala: true },
  { id: 8, x: 25, y: 58, r: 3 },
  { id: 9, x: 75, y: 58, r: 3 },
  { id: 10, x: 40, y: 62, r: 4 },
  { id: 11, x: 60, y: 62, r: 4 },
  { id: 12, x: 50, y: 68, r: 3 },
];

const EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6],
  [3, 8], [4, 9], [5, 7], [6, 7], [5, 10], [6, 11],
  [7, 10], [7, 11], [8, 10], [9, 11], [10, 12], [11, 12],
];

export const BrainScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const edgeFrameStep = durationInFrames / EDGES.length;

  const amygdalaScale = interpolate(
    frame % 45,
    [0, 22, 45],
    [1, 1.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const nodeOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 48%, ${glowColor}18 0%, transparent 55%)`,
      }} />

      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {EDGES.map(([a, b], i) => {
          const na = NODES[a];
          const nb = NODES[b];
          const edgeStart = i * edgeFrameStep;
          const edgeOpacity = interpolate(
            frame,
            [edgeStart, edgeStart + 20, edgeStart + edgeFrameStep * 0.8, edgeStart + edgeFrameStep],
            [0.05, intensity * 0.8, intensity * 0.4, 0.05],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <line key={i}
              x1={na.x} y1={na.y}
              x2={nb.x} y2={nb.y}
              stroke={glowColor}
              strokeWidth="0.3"
              opacity={edgeOpacity}
            />
          );
        })}

        {NODES.map((n) => {
          const isAmygdala = (n as typeof n & { isAmygdala?: boolean }).isAmygdala;
          const scale = isAmygdala ? amygdalaScale : 1;
          const color = isAmygdala ? '#ffb347' : glowColor;

          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y}) scale(${scale})`}>
              <circle r={n.r * 0.4} fill={color} opacity={nodeOpacity * intensity} />
              <circle r={n.r * 0.7} fill={color} opacity={nodeOpacity * 0.2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
