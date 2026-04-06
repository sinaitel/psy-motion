import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const OUTRO_DURATION_FRAMES = 90;

const ICONS = [
  { label: 'Subscribe', symbol: '▶' },
  { label: 'Instagram', symbol: '◈' },
  { label: 'YouTube', symbol: '▷' },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(0,0,0,${bgOpacity})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
      }}
    >
      {ICONS.map((icon, i) => {
        const delay = i * 12;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 180, stiffness: 100 },
          from: 0,
          to: 1,
        });
        const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={icon.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.6)',
                background: 'rgba(212,175,55,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
              }}
            >
              <span style={{ fontSize: 32, color: '#d4af37' }}>{icon.symbol}</span>
            </div>
            <span
              style={{
                fontSize: 22,
                color: 'rgba(212,175,55,0.8)',
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
              }}
            >
              {icon.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
