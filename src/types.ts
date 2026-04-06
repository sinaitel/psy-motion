export type SceneType = 'face' | 'brain' | 'object' | 'place' | 'eye' | 'neurons' | 'heartrate' | 'vortex' | 'pillow';

export type SceneConfig = {
  type: SceneType;
  durationSec: number;
  tooltip?: string;
  params?: {
    glowColor?: string;
    intensity?: number;
  };
};

export type PsyVideoProps = {
  audioSrc: string;
  scenes: SceneConfig[];
  words: string[];
  lang: 'ar' | 'fr';
  wordTimings?: number[];
};
