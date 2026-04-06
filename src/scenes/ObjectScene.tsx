import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

const SPLATS = [
  { x: 20, y: 25, len: 35, angle: -30 },
  { x: 75, y: 30, len: 28, angle: 45 },
  { x: 15, y: 65, len: 40, angle: 15 },
  { x: 80, y: 70, len: 32, angle: -55 },
];

export const ObjectScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, durationInFrames], [0, 360]);

  const sides = 12;
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    return { x: 50 + 28 * Math.cos(angle), y: 50 + 28 * Math.sin(angle) };
  });
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${glowColor}20 0%, transparent 55%)`,
      }} />

      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {SPLATS.map((s, i) => {
          const sOpacity = interpolate(
            (frame + i * 20) % 90,
            [0, 10, 70, 90],
            [0, intensity * 0.6, intensity * 0.3, 0]
          );
          const rad = (s.angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={s.x} y1={s.y}
              x2={s.x + s.len * Math.cos(rad)} y2={s.y + s.len * Math.sin(rad)}
              stroke={glowColor} strokeWidth="0.3" opacity={sOpacity} strokeLinecap="round"
            />
          );
        })}

        <g transform={`rotate(${rotation}, 50, 50)`}>
          <polygon
            points={polygonPoints}
            fill="none"
            stroke={glowColor}
            strokeWidth="0.5"
            opacity={intensity}
          />
          {points.filter((_, i) => i % 3 === 0).map((p, i) => (
            <line key={i} x1={50} y1={50} x2={p.x} y2={p.y}
              stroke={glowColor} strokeWidth="0.2" opacity={intensity * 0.3} />
          ))}
          <circle cx="50" cy="50" r="3" fill={glowColor} opacity={intensity} />
        </g>
      </svg>
    </div>
  );
};
