import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

const PARTICLES = [
  { x: 28, y: 22, size: 3, delay: 0, period: 90 },
  { x: 65, y: 18, size: 2, delay: 15, period: 110 },
  { x: 20, y: 45, size: 4, delay: 5, period: 80 },
  { x: 75, y: 38, size: 2, delay: 30, period: 100 },
  { x: 35, y: 68, size: 3, delay: 10, period: 95 },
  { x: 62, y: 72, size: 2, delay: 20, period: 85 },
  { x: 48, y: 15, size: 3, delay: 40, period: 105 },
  { x: 82, y: 55, size: 2, delay: 8, period: 92 },
];

export const FaceScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  const driftY = interpolate(
    frame % 180,
    [0, 90, 180],
    [0, -8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const glowOpacity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.4 * intensity, intensity, 0.4 * intensity],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      {/* Fond radial or */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 42%, ${glowColor}22 0%, transparent 60%)`,
        }}
      />

      {/* Fumée montante */}
      {[0, 1, 2].map((i) => {
        const smokeFrame = (frame + i * 60) % durationInFrames;
        const smokeY = interpolate(smokeFrame, [0, durationInFrames], [0, -300]);
        const smokeOpacity = interpolate(
          smokeFrame,
          [0, durationInFrames * 0.3, durationInFrames * 0.8, durationInFrames],
          [0, 0.4 * intensity, 0.3 * intensity, 0]
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 180,
              left: `${38 + i * 8}%`,
              width: 120 + i * 20,
              height: 200 + i * 30,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${glowColor}30 0%, transparent 70%)`,
              opacity: smokeOpacity,
              transform: `translateY(${smokeY}px) translateX(-50%)`,
            }}
          />
        );
      })}

      {/* Silhouette humaine SVG */}
      <svg
        viewBox="0 0 200 400"
        style={{
          position: 'absolute',
          left: '50%',
          top: '28%',
          transform: `translateX(-50%) translateY(${driftY}px)`,
          width: 340,
          height: 680,
          opacity: 0.92,
        }}
      >
        {/* Halos peau */}
        <ellipse cx="100" cy="70" rx="55" ry="65"
          fill="none" stroke={glowColor} strokeWidth="0.5" opacity={glowOpacity * 0.6} />
        <ellipse cx="100" cy="70" rx="65" ry="75"
          fill="none" stroke={glowColor} strokeWidth="0.3" opacity={glowOpacity * 0.3} />

        {/* Tête */}
        <ellipse cx="100" cy="65" rx="38" ry="42"
          fill="#111111" stroke={glowColor} strokeWidth="0.8" opacity="0.95" />

        {/* Cou */}
        <rect x="88" y="103" width="24" height="20" fill="#0d0d0d" />

        {/* Corps */}
        <path d="M55 125 Q55 115 100 115 Q145 115 145 125 L152 260 Q100 270 48 260 Z"
          fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="0.6" opacity="0.95" />

        {/* Bras */}
        <path d="M55 135 Q40 180 35 230" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M145 135 Q160 180 165 230" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* Jambes */}
        <line x1="75" y1="258" x2="65" y2="398" stroke="#141414" strokeWidth="18" strokeLinecap="round" />
        <line x1="125" y1="258" x2="135" y2="398" stroke="#141414" strokeWidth="18" strokeLinecap="round" />
      </svg>

      {/* Particules flottantes */}
      {PARTICLES.map((p, i) => {
        const pFrame = (frame + p.delay) % p.period;
        const pOpacity = interpolate(
          pFrame,
          [0, p.period * 0.2, p.period * 0.8, p.period],
          [0, intensity, intensity * 0.7, 0]
        );
        const pY = interpolate(pFrame, [0, p.period], [0, -20]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: glowColor,
              opacity: pOpacity,
              transform: `translateY(${pY}px)`,
              boxShadow: `0 0 ${p.size * 3}px ${glowColor}`,
            }}
          />
        );
      })}
    </div>
  );
};
