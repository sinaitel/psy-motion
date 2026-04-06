import React from 'react';
import { useCurrentFrame } from 'remotion';
import { computeWordTimings } from '../utils/timing';

type Props = {
  words: string[];
  lang: 'ar' | 'fr';
  fps: number;
  totalFrames: number;
  wordTimingsSec?: number[];
};

export const WordReveal: React.FC<Props> = ({
  words,
  lang,
  fps,
  totalFrames,
  wordTimingsSec,
}) => {
  const frame = useCurrentFrame();
  const timings = computeWordTimings(words, fps, totalFrames, wordTimingsSec);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '15%',
        left: 40,
        right: 40,
        textAlign: 'center',
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {words.map((word, i) => {
        const startFrame = timings[i];
        const isRevealed = frame >= startFrame;
        const isActive =
          isRevealed &&
          (i === words.length - 1 || frame < timings[i + 1]);

        return (
          <span
            key={i}
            style={{
              opacity: !isRevealed ? 0 : isActive ? 1 : 0.35,
              fontSize: 52,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: 'sans-serif',
              textShadow: isActive ? '0 0 12px rgba(212,175,55,0.6)' : 'none',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
