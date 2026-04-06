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
    { type: 'pillow',    durationSec: 11, tooltip: 'Insomnie de rumination' },
    { type: 'eye',       durationSec: 10, tooltip: 'Hypervigilance nocturne' },
    { type: 'vortex',    durationSec: 12, tooltip: 'Pensée catastrophique' },
    { type: 'neurons',   durationSec: 13, tooltip: 'Réseau du mode par défaut' },
    { type: 'face',      durationSec: 10, tooltip: 'Anticipation des menaces' },
    { type: 'heartrate', durationSec: 11, tooltip: 'Activation physiologique', params: { glowColor: '#ff6b6b', intensity: 0.85 } },
    { type: 'brain',     durationSec: 14, tooltip: 'Amygdale hyperactive', params: { glowColor: '#ffb347', intensity: 0.9 } },
    { type: 'face',      durationSec: 10, tooltip: 'Mode survie' },
    { type: 'vortex',    durationSec: 9,  tooltip: 'Boucle de pensée' },
    { type: 'pillow',    durationSec: 13 },
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
