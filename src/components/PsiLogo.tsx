import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  animateIn?: boolean;
};

export const PsiLogo: React.FC<Props> = ({ animateIn = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = animateIn
    ? spring({ frame, fps, config: { damping: 200, stiffness: 80 }, from: 0.5, to: 1 })
    : 1;

  const opacity = animateIn
    ? interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        textAlign: 'center',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 120,
          color: '#ffffff',
          fontWeight: 300,
          fontFamily: 'sans-serif',
          textShadow: [
            '0 0 20px rgba(212,175,55,0.9)',
            '0 0 40px rgba(212,175,55,0.5)',
            '0 0 80px rgba(212,175,55,0.3)',
          ].join(', '),
          lineHeight: 1,
        }}
      >
        ψ
      </span>
    </div>
  );
};
