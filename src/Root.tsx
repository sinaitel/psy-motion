import React from 'react';
import { Composition } from 'remotion';
import { PsyVideo } from './PsyVideo';
import { PsyVideoProps } from './types';
import { INTRO_DURATION_FRAMES } from './sections/Intro';
import { OUTRO_DURATION_FRAMES } from './sections/Outro';

const DEFAULT_PROPS: PsyVideoProps = {
  audioSrc: 'public/ep31.mp3',
  lang: 'fr',
  words: ['La', 'psychanalyse', 'commence', 'ici'],
  scenes: [
    { type: 'face', durationSec: 5, tooltip: 'Pensée catastrophique' },
    { type: 'brain', durationSec: 5, tooltip: 'Réseau du mode par défaut' },
    { type: 'object', durationSec: 4 },
    { type: 'place', durationSec: 4 },
  ],
};

const scenesSec = DEFAULT_PROPS.scenes.reduce((sum, s) => sum + s.durationSec, 0);
const TOTAL_FRAMES = (INTRO_DURATION_FRAMES + scenesSec * 30 + OUTRO_DURATION_FRAMES);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PsyVideo"
    component={PsyVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={DEFAULT_PROPS}
  />
);
