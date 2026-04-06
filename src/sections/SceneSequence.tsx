import React from 'react';
import { Sequence } from 'remotion';
import { SceneConfig } from '../types';
import { FaceScene } from '../scenes/FaceScene';
import { BrainScene } from '../scenes/BrainScene';
import { ObjectScene } from '../scenes/ObjectScene';
import { PlaceScene } from '../scenes/PlaceScene';
import { FloatingTooltip } from '../components/FloatingTooltip';
import { FollowText } from '../components/FollowText';
import { PsiLogo } from '../components/PsiLogo';
import { secToFrames } from '../utils/timing';

type Props = {
  scenes: SceneConfig[];
  fps: number;
};

const SCENE_MAP = {
  face: FaceScene,
  brain: BrainScene,
  object: ObjectScene,
  place: PlaceScene,
} as const;

export const SceneSequence: React.FC<Props> = ({ scenes, fps }) => {
  let offset = 0;

  return (
    <>
      {scenes.map((scene, i) => {
        const durationInFrames = secToFrames(scene.durationSec, fps);
        const from = offset;
        offset += durationInFrames;

        const glowColor = scene.params?.glowColor ?? '#d4af37';
        const intensity = scene.params?.intensity ?? 0.7;
        const SceneComponent = SCENE_MAP[scene.type];

        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <SceneComponent
              durationInFrames={durationInFrames}
              glowColor={glowColor}
              intensity={intensity}
            />
            <FollowText />
            <PsiLogo />
            {scene.tooltip && (
              <FloatingTooltip
                text={scene.tooltip}
                durationInFrames={durationInFrames}
              />
            )}
          </Sequence>
        );
      })}
    </>
  );
};
