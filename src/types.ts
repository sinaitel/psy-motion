export type SceneType = 'face' | 'brain' | 'object' | 'place';

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
