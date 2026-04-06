import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { PsyVideoProps } from './types';
import { Intro, INTRO_DURATION_FRAMES } from './sections/Intro';
import { SceneSequence } from './sections/SceneSequence';
import { Outro, OUTRO_DURATION_FRAMES } from './sections/Outro';
import { WordReveal } from './components/WordReveal';

export const PsyVideo: React.FC<PsyVideoProps> = ({
  audioSrc,
  scenes,
  words,
  lang,
  wordTimings,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  const scenesTotalFrames = durationInFrames - INTRO_DURATION_FRAMES - OUTRO_DURATION_FRAMES;
  const outroFrom = durationInFrames - OUTRO_DURATION_FRAMES;

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      <Audio src={staticFile(audioSrc.replace('public/', ''))} />

      <Sequence from={0} durationInFrames={INTRO_DURATION_FRAMES}>
        <Intro />
      </Sequence>

      <Sequence from={INTRO_DURATION_FRAMES} durationInFrames={scenesTotalFrames}>
        <SceneSequence scenes={scenes} fps={fps} />
      </Sequence>

      <Sequence from={INTRO_DURATION_FRAMES} durationInFrames={scenesTotalFrames}>
        <WordReveal
          words={words}
          lang={lang}
          fps={fps}
          totalFrames={scenesTotalFrames}
          wordTimingsSec={wordTimings}
        />
      </Sequence>

      <Sequence from={outroFrom} durationInFrames={OUTRO_DURATION_FRAMES}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
