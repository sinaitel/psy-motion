import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PsiLogo } from '../components/PsiLogo';
import { FollowText } from '../components/FollowText';

export const INTRO_DURATION_FRAMES = 90;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [INTRO_DURATION_FRAMES - 15, INTRO_DURATION_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000', opacity }}>
      <FollowText />
      <PsiLogo animateIn />
    </div>
  );
};
