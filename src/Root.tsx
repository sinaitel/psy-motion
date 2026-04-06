import React from 'react';
import { Composition } from 'remotion';
import { PsyVideo } from './PsyVideo';
import { PsyVideoProps } from './types';
import { INTRO_DURATION_FRAMES } from './sections/Intro';
import { OUTRO_DURATION_FRAMES } from './sections/Outro';

const DEFAULT_PROPS: PsyVideoProps = {
  audioSrc: 'public/FR-Ep-22.mp3',
  lang: 'fr',
  words: ['Pensée', 'catastrophique', '—', 'ce', 'que', 'la', 'science', "n'explique", 'presque', 'jamais.'],
  scenes: [
    { type: 'face', durationSec: 12, tooltip: 'Pensée catastrophique' },
    { type: 'brain', durationSec: 14, tooltip: 'Réseau du mode par défaut' },
    { type: 'face', durationSec: 10, tooltip: 'Anticipation des menaces' },
    { type: 'brain', durationSec: 16, tooltip: 'Amygdale hyperactive', params: { glowColor: '#ffb347', intensity: 0.9 } },
    { type: 'face', durationSec: 12, tooltip: 'Mode survie' },
    { type: 'brain', durationSec: 14, tooltip: 'Câblage neuronal' },
    { type: 'face', durationSec: 15 },
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
