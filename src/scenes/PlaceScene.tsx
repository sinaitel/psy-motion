import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

const LINES = [
  { x1: 0, y1: 0 }, { x1: 50, y1: 0 }, { x1: 100, y1: 0 },
  { x1: 0, y1: 50 }, { x1: 100, y1: 50 },
  { x1: 0, y1: 100 }, { x1: 50, y1: 100 }, { x1: 100, y1: 100 },
];

export const PlaceScene: React.FC<Props> = ({
  durationInFrames: _durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  const lineProgress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {LINES.map((l, i) => {
          const delay = i * 6;
          const lProgress = interpolate(frame, [delay, delay + 40], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cx = l.x1 + (50 - l.x1) * lProgress;
          const cy = l.y1 + (50 - l.y1) * lProgress;

          return (
            <line key={i}
              x1={l.x1} y1={l.y1}
              x2={cx} y2={cy}
              stroke={glowColor}
              strokeWidth="0.3"
              opacity={intensity * 0.6}
            />
          );
        })}

        <circle cx="50" cy="50" r={lineProgress * 2}
          fill={glowColor} opacity={lineProgress * intensity} />
        <circle cx="50" cy="50" r={lineProgress * 5}
          fill="none" stroke={glowColor} strokeWidth="0.2"
          opacity={lineProgress * intensity * 0.3} />
      </svg>
    </div>
  );
};
