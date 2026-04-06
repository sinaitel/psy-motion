import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  text: string;
  durationInFrames: number;
};

export const FloatingTooltip: React.FC<Props> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 30, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(frame, [0, 30], [10, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '22%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          padding: '10px 24px',
          border: '1px solid rgba(212,175,55,0.5)',
          background: 'rgba(0,0,0,0.75)',
          color: '#ffffff',
          fontSize: 26,
          letterSpacing: 1.5,
          fontFamily: 'sans-serif',
          boxShadow: '0 0 16px rgba(212,175,55,0.2)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
