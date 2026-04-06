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
    { type: 'pillow',    durationSec: 10, tooltip: 'Insomnie de rumination' },
    { type: 'clock',     durationSec: 10, tooltip: '3h47 — le temps ne passe plus' },
    { type: 'eye',       durationSec: 9,  tooltip: 'Hypervigilance nocturne' },
    { type: 'vortex',    durationSec: 11, tooltip: 'Pensée catastrophique' },
    { type: 'neurons',   durationSec: 12, tooltip: 'Réseau du mode par défaut' },
    { type: 'mirror',    durationSec: 10, tooltip: 'Le critique intérieur' },
    { type: 'face',      durationSec: 9,  tooltip: 'Anticipation des menaces' },
    { type: 'heartrate', durationSec: 10, tooltip: 'Activation physiologique', params: { glowColor: '#ff6b6b', intensity: 0.85 } },
    { type: 'breath',    durationSec: 10, tooltip: 'Hyperventilation anxieuse' },
    { type: 'brain',     durationSec: 12, tooltip: 'Amygdale hyperactive', params: { glowColor: '#ffb347', intensity: 0.9 } },
    { type: 'water',     durationSec: 11, tooltip: 'Submersion émotionnelle' },
    { type: 'vortex',    durationSec: 8,  tooltip: 'Boucle de pensée' },
    { type: 'pillow',    durationSec: 11 },
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
