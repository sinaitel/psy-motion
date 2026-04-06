# psy-motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un template Remotion qui génère des vidéos 9:16 pour @the.psychoanalyst — scènes SVG animées (face, brain, object, place), texte mot-par-mot, floating tooltips, audio MP3 fourni.

**Architecture:** Composition principale `PsyVideo` composée de 3 sections (`Intro` / `SceneSequence` / `Outro`) + overlay `WordReveal`. Chaque scène est un composant React autonome rendu frame-par-frame. Props injectées via fichier JSON au CLI.

**Tech Stack:** Remotion 4, React 18, TypeScript, Vite (bundler interne Remotion), Vitest (tests utilitaires)

---

## File Map

| Fichier | Responsabilité |
|---|---|
| `src/types.ts` | Types partagés (SceneConfig, PsyVideoProps) |
| `src/index.ts` | registerRoot |
| `src/Root.tsx` | Déclaration `<Composition>` |
| `src/PsyVideo.tsx` | Composition principale — assemble sections + overlay |
| `src/sections/Intro.tsx` | ψ animé (3s) |
| `src/sections/SceneSequence.tsx` | Itère scenes[], délègue, injecte FloatingTooltip |
| `src/sections/Outro.tsx` | Icônes sociales + fade noir (3s) |
| `src/scenes/FaceScene.tsx` | Silhouette ink + fragments + fumée |
| `src/scenes/BrainScene.tsx` | Réseau neurones SVG animé |
| `src/scenes/ObjectScene.tsx` | Forme géométrique flottante |
| `src/scenes/PlaceScene.tsx` | Lignes de perspective animées |
| `src/components/PsiLogo.tsx` | ψ lumineux réutilisable |
| `src/components/FollowText.tsx` | Texte fixe haut |
| `src/components/WordReveal.tsx` | Révélation mot par mot |
| `src/components/FloatingTooltip.tsx` | Annotation flottante |
| `src/utils/timing.ts` | Calcul wordTimings auto + conversions frames/sec |
| `src/utils/timing.test.ts` | Tests Vitest pour timing utils |
| `public/ep31.json` | Props exemple pour test render |
| `remotion.config.ts` | Config Remotion |

---

## Task 1 — Setup projet Remotion

**Files:**
- Create: `package.json`
- Create: `remotion.config.ts`
- Create: `tsconfig.json`

- [ ] **Step 1: Initialiser le projet**

```bash
cd /Users/ax22102/Documents/GitHub/psy-motion
npm init -y
npm install remotion @remotion/cli react react-dom
npm install -D typescript @types/react @types/react-dom vitest
```

- [ ] **Step 2: Créer `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Créer `remotion.config.ts`**

```ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
```

- [ ] **Step 4: Créer `package.json` scripts**

Modifier `package.json` pour ajouter :
```json
{
  "scripts": {
    "studio": "remotion studio",
    "render": "remotion render",
    "test": "vitest run"
  }
}
```

- [ ] **Step 5: Créer dossiers**

```bash
mkdir -p src/sections src/scenes src/components src/utils public out
```

- [ ] **Step 6: Commit**

```bash
git init
echo "node_modules/\nout/\n.remotion/" > .gitignore
git add .
git commit -m "chore: setup Remotion project"
```

---

## Task 2 — Types + utilitaires timing

**Files:**
- Create: `src/types.ts`
- Create: `src/utils/timing.ts`
- Create: `src/utils/timing.test.ts`

- [ ] **Step 1: Écrire les tests timing**

```ts
// src/utils/timing.test.ts
import { describe, it, expect } from 'vitest';
import { computeWordTimings, secToFrames, framesToSec } from './timing';

describe('secToFrames', () => {
  it('converts seconds to frames at 30fps', () => {
    expect(secToFrames(1, 30)).toBe(30);
    expect(secToFrames(3, 30)).toBe(90);
    expect(secToFrames(0.5, 30)).toBe(15);
  });
});

describe('framesToSec', () => {
  it('converts frames to seconds at 30fps', () => {
    expect(framesToSec(30, 30)).toBe(1);
    expect(framesToSec(90, 30)).toBe(3);
  });
});

describe('computeWordTimings', () => {
  it('distributes words evenly when no timings provided', () => {
    const timings = computeWordTimings(['a', 'b', 'c'], 30, 90);
    expect(timings).toHaveLength(3);
    expect(timings[0]).toBe(0);
    expect(timings[1]).toBe(30);
    expect(timings[2]).toBe(60);
  });

  it('converts provided second-timings to frames', () => {
    const timings = computeWordTimings(['a', 'b'], 30, 60, [0, 1]);
    expect(timings[0]).toBe(0);
    expect(timings[1]).toBe(30);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
npm test
```
Expected: FAIL — `Cannot find module './timing'`

- [ ] **Step 3: Créer `src/types.ts`**

```ts
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
```

- [ ] **Step 4: Créer `src/utils/timing.ts`**

```ts
export function secToFrames(sec: number, fps: number): number {
  return Math.round(sec * fps);
}

export function framesToSec(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Retourne les frame-offsets (depuis frame 0 de la section WordReveal)
 * pour chaque mot. Si wordTimingsSec est fourni, convertit en frames.
 * Sinon, répartit uniformément sur totalFrames.
 */
export function computeWordTimings(
  words: string[],
  fps: number,
  totalFrames: number,
  wordTimingsSec?: number[]
): number[] {
  if (wordTimingsSec && wordTimingsSec.length === words.length) {
    return wordTimingsSec.map((s) => secToFrames(s, fps));
  }
  const step = Math.floor(totalFrames / words.length);
  return words.map((_, i) => i * step);
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
npm test
```
Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/utils/
git commit -m "feat: types and timing utilities"
```

---

## Task 3 — Composants de base (PsiLogo, FollowText)

**Files:**
- Create: `src/components/PsiLogo.tsx`
- Create: `src/components/FollowText.tsx`

- [ ] **Step 1: Créer `src/components/PsiLogo.tsx`**

```tsx
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

type Props = {
  animateIn?: boolean; // true = spring d'entrée, false = statique
};

export const PsiLogo: React.FC<Props> = ({ animateIn = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = animateIn
    ? spring({ frame, fps, config: { damping: 200, stiffness: 80 }, from: 0.5, to: 1 })
    : 1;

  const opacity = animateIn
    ? interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        textAlign: 'center',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 120,
          color: '#ffffff',
          fontWeight: 300,
          textShadow: [
            '0 0 20px rgba(212,175,55,0.9)',
            '0 0 40px rgba(212,175,55,0.5)',
            '0 0 80px rgba(212,175,55,0.3)',
          ].join(', '),
          lineHeight: 1,
        }}
      >
        ψ
      </span>
    </div>
  );
};
```

- [ ] **Step 2: Créer `src/components/FollowText.tsx`**

```tsx
export const FollowText: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 28,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 22,
      letterSpacing: 4,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'sans-serif',
      fontWeight: 400,
    }}
  >
    follow the psychoanalyst
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PsiLogo.tsx src/components/FollowText.tsx
git commit -m "feat: PsiLogo and FollowText components"
```

---

## Task 4 — FloatingTooltip

**Files:**
- Create: `src/components/FloatingTooltip.tsx`

- [ ] **Step 1: Créer `src/components/FloatingTooltip.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  text: string;
  durationInFrames: number;
};

export const FloatingTooltip: React.FC<Props> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 30, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(frame, [0, 30], [10, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '22%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          padding: '10px 24px',
          border: '1px solid rgba(212,175,55,0.5)',
          background: 'rgba(0,0,0,0.75)',
          color: '#ffffff',
          fontSize: 26,
          letterSpacing: 1.5,
          fontFamily: 'sans-serif',
          boxShadow: '0 0 16px rgba(212,175,55,0.2)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FloatingTooltip.tsx
git commit -m "feat: FloatingTooltip component"
```

---

## Task 5 — WordReveal

**Files:**
- Create: `src/components/WordReveal.tsx`

- [ ] **Step 1: Créer `src/components/WordReveal.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';
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
        const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        // mot actif = dernier mot révélé
        const isActive = frame >= startFrame && (i === words.length - 1 || frame < timings[i + 1]);

        return (
          <span
            key={i}
            style={{
              opacity: frame < startFrame ? 0 : isActive ? 1 : 0.35,
              fontSize: 52,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: 'sans-serif',
              textShadow: isActive ? '0 0 12px rgba(212,175,55,0.6)' : 'none',
              transition: 'none',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WordReveal.tsx
git commit -m "feat: WordReveal component"
```

---

## Task 6 — Intro section

**Files:**
- Create: `src/sections/Intro.tsx`

- [ ] **Step 1: Créer `src/sections/Intro.tsx`**

```tsx
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { PsiLogo } from '../components/PsiLogo';
import { FollowText } from '../components/FollowText';

// Durée : 90 frames (3s à 30fps)
export const INTRO_DURATION_FRAMES = 90;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade out sur les 15 dernières frames
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
```

- [ ] **Step 2: Commit**

```bash
git add src/sections/Intro.tsx
git commit -m "feat: Intro section with animated PsiLogo"
```

---

## Task 7 — Outro section

**Files:**
- Create: `src/sections/Outro.tsx`

- [ ] **Step 1: Créer `src/sections/Outro.tsx`**

```tsx
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Durée : 90 frames (3s à 30fps)
export const OUTRO_DURATION_FRAMES = 90;

const ICONS = [
  { label: 'Subscribe', path: 'M10 15l5.19-3L10 9v6zm11.56-7.83...' },
  { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85...' },
  { label: 'YouTube', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77...' },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(0,0,0,${bgOpacity})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
      }}
    >
      {ICONS.map((icon, i) => {
        const delay = i * 12;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 180, stiffness: 100 },
          from: 0,
          to: 1,
        });
        const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={icon.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.6)',
                background: 'rgba(212,175,55,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
              }}
            >
              <span style={{ fontSize: 32, color: '#d4af37' }}>
                {icon.label === 'Subscribe' ? '▶' : icon.label === 'Instagram' ? '◈' : '▷'}
              </span>
            </div>
            <span
              style={{
                fontSize: 22,
                color: 'rgba(212,175,55,0.8)',
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
              }}
            >
              {icon.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/sections/Outro.tsx
git commit -m "feat: Outro section with social icons"
```

---

## Task 8 — FaceScene

**Files:**
- Create: `src/scenes/FaceScene.tsx`

- [ ] **Step 1: Créer `src/scenes/FaceScene.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

// Points pseudo-aléatoires pour les particules (seed fixe = rendu déterministe)
const PARTICLES = [
  { x: 28, y: 22, size: 3, delay: 0, period: 90 },
  { x: 65, y: 18, size: 2, delay: 15, period: 110 },
  { x: 20, y: 45, size: 4, delay: 5, period: 80 },
  { x: 75, y: 38, size: 2, delay: 30, period: 100 },
  { x: 35, y: 68, size: 3, delay: 10, period: 95 },
  { x: 62, y: 72, size: 2, delay: 20, period: 85 },
  { x: 48, y: 15, size: 3, delay: 40, period: 105 },
  { x: 82, y: 55, size: 2, delay: 8, period: 92 },
];

export const FaceScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  // Slow drift vertical
  const driftY = interpolate(
    frame % 180,
    [0, 90, 180],
    [0, -8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Glow pulse
  const glowOpacity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.4 * intensity, intensity, 0.4 * intensity],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      {/* Fond radial or */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 42%, ${glowColor}22 0%, transparent 60%)`,
        }}
      />

      {/* Fumée montante */}
      {[0, 1, 2].map((i) => {
        const smokeFrame = (frame + i * 60) % durationInFrames;
        const smokeY = interpolate(smokeFrame, [0, durationInFrames], [0, -300]);
        const smokeOpacity = interpolate(
          smokeFrame,
          [0, durationInFrames * 0.3, durationInFrames * 0.8, durationInFrames],
          [0, 0.4 * intensity, 0.3 * intensity, 0]
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 180,
              left: `${38 + i * 8}%`,
              width: 120 + i * 20,
              height: 200 + i * 30,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${glowColor}30 0%, transparent 70%)`,
              opacity: smokeOpacity,
              transform: `translateY(${smokeY}px) translateX(-50%)`,
            }}
          />
        );
      })}

      {/* Silhouette humaine SVG */}
      <svg
        viewBox="0 0 200 400"
        style={{
          position: 'absolute',
          left: '50%',
          top: '28%',
          transform: `translateX(-50%) translateY(${driftY}px)`,
          width: 340,
          height: 680,
          opacity: 0.92,
        }}
      >
        {/* Halo peau */}
        <ellipse cx="100" cy="70" rx="55" ry="65"
          fill="none" stroke={glowColor} strokeWidth="0.5" opacity={glowOpacity * 0.6} />
        <ellipse cx="100" cy="70" rx="65" ry="75"
          fill="none" stroke={glowColor} strokeWidth="0.3" opacity={glowOpacity * 0.3} />

        {/* Tête */}
        <ellipse cx="100" cy="65" rx="38" ry="42" fill="#111111" stroke={glowColor} strokeWidth="0.8" opacity="0.95" />

        {/* Cou */}
        <rect x="88" y="103" width="24" height="20" fill="#0d0d0d" />

        {/* Corps */}
        <path d="M55 125 Q55 115 100 115 Q145 115 145 125 L152 260 Q100 270 48 260 Z"
          fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="0.6" opacity="0.95" />

        {/* Bras gauche */}
        <path d="M55 135 Q40 180 35 230" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* Bras droit */}
        <path d="M145 135 Q160 180 165 230" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* Jambes */}
        <line x1="75" y1="258" x2="65" y2="398" stroke="#141414" strokeWidth="18" strokeLinecap="round" />
        <line x1="125" y1="258" x2="135" y2="398" stroke="#141414" strokeWidth="18" strokeLinecap="round" />
      </svg>

      {/* Particules flottantes */}
      {PARTICLES.map((p, i) => {
        const pFrame = (frame + p.delay) % p.period;
        const pOpacity = interpolate(pFrame, [0, p.period * 0.2, p.period * 0.8, p.period], [0, intensity, intensity * 0.7, 0]);
        const pY = interpolate(pFrame, [0, p.period], [0, -20]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: glowColor,
              opacity: pOpacity,
              transform: `translateY(${pY}px)`,
              boxShadow: `0 0 ${p.size * 3}px ${glowColor}`,
            }}
          />
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/FaceScene.tsx
git commit -m "feat: FaceScene with silhouette, particles, smoke"
```

---

## Task 9 — BrainScene

**Files:**
- Create: `src/scenes/BrainScene.tsx`

- [ ] **Step 1: Créer `src/scenes/BrainScene.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

// Nœuds disposés approximativement en forme de cerveau (coordonnées en %)
const NODES = [
  { id: 0, x: 50, y: 30, r: 5 },   // sommet
  { id: 1, x: 30, y: 35, r: 4 },
  { id: 2, x: 70, y: 35, r: 4 },
  { id: 3, x: 22, y: 45, r: 3 },
  { id: 4, x: 78, y: 45, r: 3 },
  { id: 5, x: 35, y: 52, r: 4 },
  { id: 6, x: 65, y: 52, r: 4 },
  { id: 7, x: 50, y: 50, r: 6, isAmygdala: true }, // amygdale
  { id: 8, x: 25, y: 58, r: 3 },
  { id: 9, x: 75, y: 58, r: 3 },
  { id: 10, x: 40, y: 62, r: 4 },
  { id: 11, x: 60, y: 62, r: 4 },
  { id: 12, x: 50, y: 68, r: 3 },
];

const EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6],
  [3, 8], [4, 9], [5, 7], [6, 7], [5, 10], [6, 11],
  [7, 10], [7, 11], [8, 10], [9, 11], [10, 12], [11, 12],
];

export const BrainScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  // Chaque edge s'illumine en séquence (cycle sur la durée totale)
  const edgeFrameStep = durationInFrames / EDGES.length;

  // Pulse amygdale
  const amygdalaScale = interpolate(
    frame % 45,
    [0, 22, 45],
    [1, 1.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      {/* Fond radial */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 48%, ${glowColor}18 0%, transparent 55%)`,
      }} />

      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const na = NODES[a];
          const nb = NODES[b];
          const edgeStart = i * edgeFrameStep;
          const edgeOpacity = interpolate(
            frame,
            [edgeStart, edgeStart + 20, edgeStart + edgeFrameStep * 0.8, edgeStart + edgeFrameStep],
            [0.05, intensity * 0.8, intensity * 0.4, 0.05],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <line
              key={i}
              x1={na.x} y1={na.y}
              x2={nb.x} y2={nb.y}
              stroke={glowColor}
              strokeWidth="0.3"
              opacity={edgeOpacity}
            />
          );
        })}

        {/* Nœuds */}
        {NODES.map((n) => {
          const nodeOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
          const scale = (n as any).isAmygdala ? amygdalaScale : 1;
          const color = (n as any).isAmygdala ? '#ffb347' : glowColor;

          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y}) scale(${scale})`}>
              <circle r={n.r * 0.4} fill={color} opacity={nodeOpacity * intensity} />
              <circle r={n.r * 0.7} fill={color} opacity={nodeOpacity * 0.2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BrainScene.tsx
git commit -m "feat: BrainScene with neural network animation"
```

---

## Task 10 — ObjectScene + PlaceScene

**Files:**
- Create: `src/scenes/ObjectScene.tsx`
- Create: `src/scenes/PlaceScene.tsx`

- [ ] **Step 1: Créer `src/scenes/ObjectScene.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

export const ObjectScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  const rotation = interpolate(frame, [0, durationInFrames], [0, 360]);

  // Points d'un dodécaèdre approximé en 2D
  const sides = 12;
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    return { x: 50 + 28 * Math.cos(angle), y: 50 + 28 * Math.sin(angle) };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Éclats d'encre
  const SPLATS = [
    { x: 20, y: 25, len: 35, angle: -30 },
    { x: 75, y: 30, len: 28, angle: 45 },
    { x: 15, y: 65, len: 40, angle: 15 },
    { x: 80, y: 70, len: 32, angle: -55 },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${glowColor}20 0%, transparent 55%)`,
      }} />

      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Éclats */}
        {SPLATS.map((s, i) => {
          const sOpacity = interpolate((frame + i * 20) % 90, [0, 10, 70, 90], [0, intensity * 0.6, intensity * 0.3, 0]);
          const rad = (s.angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={s.x} y1={s.y}
              x2={s.x + s.len * Math.cos(rad)} y2={s.y + s.len * Math.sin(rad)}
              stroke={glowColor} strokeWidth="0.3" opacity={sOpacity} strokeLinecap="round"
            />
          );
        })}

        {/* Forme principale */}
        <g transform={`rotate(${rotation}, 50, 50)`}>
          <polygon
            points={polygonPoints}
            fill="none"
            stroke={glowColor}
            strokeWidth="0.5"
            opacity={intensity}
          />
          {/* Lignes internes vers le centre */}
          {points.filter((_, i) => i % 3 === 0).map((p, i) => (
            <line key={i} x1={50} y1={50} x2={p.x} y2={p.y}
              stroke={glowColor} strokeWidth="0.2" opacity={intensity * 0.3} />
          ))}
          <circle cx="50" cy="50" r="3" fill={glowColor} opacity={intensity} />
        </g>
      </svg>
    </div>
  );
};
```

- [ ] **Step 2: Créer `src/scenes/PlaceScene.tsx`**

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

type Props = {
  durationInFrames: number;
  glowColor?: string;
  intensity?: number;
};

export const PlaceScene: React.FC<Props> = ({
  durationInFrames,
  glowColor = '#d4af37',
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();

  // Lignes de perspective convergeant vers le centre (50, 50)
  const LINES = [
    { x1: 0, y1: 0 }, { x1: 50, y1: 0 }, { x1: 100, y1: 0 },
    { x1: 0, y1: 50 }, { x1: 100, y1: 50 },
    { x1: 0, y1: 100 }, { x1: 50, y1: 100 }, { x1: 100, y1: 100 },
  ];

  const lineProgress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {LINES.map((l, i) => {
          const delay = i * 6;
          const lProgress = interpolate(frame, [delay, delay + 40], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const cx = l.x1 + (50 - l.x1) * lProgress;
          const cy = l.y1 + (50 - l.y1) * lProgress;

          return (
            <line key={i}
              x1={l.x1} y1={l.y1}
              x2={cx} y2={cy}
              stroke={glowColor}
              strokeWidth="0.3"
              opacity={intensity * 0.6}
            />
          );
        })}

        {/* Point de fuite central */}
        <circle cx="50" cy="50" r={lineProgress * 2}
          fill={glowColor} opacity={lineProgress * intensity} />
        <circle cx="50" cy="50" r={lineProgress * 5}
          fill="none" stroke={glowColor} strokeWidth="0.2"
          opacity={lineProgress * intensity * 0.3} />
      </svg>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ObjectScene.tsx src/scenes/PlaceScene.tsx
git commit -m "feat: ObjectScene and PlaceScene"
```

---

## Task 11 — SceneSequence

**Files:**
- Create: `src/sections/SceneSequence.tsx`

- [ ] **Step 1: Créer `src/sections/SceneSequence.tsx`**

```tsx
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

        const SceneComponent = {
          face: FaceScene,
          brain: BrainScene,
          object: ObjectScene,
          place: PlaceScene,
        }[scene.type];

        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            {/* Scène */}
            <SceneComponent
              durationInFrames={durationInFrames}
              glowColor={glowColor}
              intensity={intensity}
            />

            {/* Éléments de marque fixes sur chaque scène */}
            <FollowText />
            <PsiLogo />

            {/* Tooltip optionnel */}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/sections/SceneSequence.tsx
git commit -m "feat: SceneSequence orchestrator"
```

---

## Task 12 — PsyVideo + Root + Entry point

**Files:**
- Create: `src/PsyVideo.tsx`
- Create: `src/Root.tsx`
- Create: `src/index.ts`

- [ ] **Step 1: Créer `src/PsyVideo.tsx`**

```tsx
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from 'remotion';
import { PsyVideoProps } from './types';
import { Intro, INTRO_DURATION_FRAMES } from './sections/Intro';
import { SceneSequence } from './sections/SceneSequence';
import { Outro, OUTRO_DURATION_FRAMES } from './sections/Outro';
import { WordReveal } from './components/WordReveal';
import { secToFrames } from './utils/timing';

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
      {/* Audio */}
      <Audio src={audioSrc} />

      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DURATION_FRAMES}>
        <Intro />
      </Sequence>

      {/* Scènes */}
      <Sequence from={INTRO_DURATION_FRAMES} durationInFrames={scenesTotalFrames}>
        <SceneSequence scenes={scenes} fps={fps} />
      </Sequence>

      {/* WordReveal — overlay sur les scènes */}
      <Sequence from={INTRO_DURATION_FRAMES} durationInFrames={scenesTotalFrames}>
        <WordReveal
          words={words}
          lang={lang}
          fps={fps}
          totalFrames={scenesTotalFrames}
          wordTimingsSec={wordTimings}
        />
      </Sequence>

      {/* Outro */}
      <Sequence from={outroFrom} durationInFrames={OUTRO_DURATION_FRAMES}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Créer `src/Root.tsx`**

```tsx
import { Composition } from 'remotion';
import { PsyVideo } from './PsyVideo';
import { PsyVideoProps } from './types';

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

const TOTAL_SEC =
  3 + // intro
  DEFAULT_PROPS.scenes.reduce((sum, s) => sum + s.durationSec, 0) +
  3; // outro

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PsyVideo"
    component={PsyVideo}
    durationInFrames={TOTAL_SEC * 30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={DEFAULT_PROPS}
  />
);
```

- [ ] **Step 3: Créer `src/index.ts`**

```ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
```

- [ ] **Step 4: Commit**

```bash
git add src/PsyVideo.tsx src/Root.tsx src/index.ts
git commit -m "feat: PsyVideo composition and Root"
```

---

## Task 13 — Props exemple EP31 + test render

**Files:**
- Create: `public/ep31.json`

- [ ] **Step 1: Créer `public/ep31.json`**

```json
{
  "audioSrc": "public/ep31.mp3",
  "lang": "ar",
  "words": ["لماذا", "تشعر", "أن", "حياتك", "فيلم", "وأنت", "البطل؟"],
  "scenes": [
    { "type": "face", "durationSec": 6, "tooltip": "Pensée catastrophique" },
    { "type": "brain", "durationSec": 5, "tooltip": "Réseau du mode par défaut" },
    { "type": "face", "durationSec": 5, "tooltip": "Anticipation des menaces" },
    { "type": "brain", "durationSec": 5, "tooltip": "Amygdale hyperactive" },
    { "type": "face", "durationSec": 6 }
  ]
}
```

Note: placer un fichier `ep31.mp3` dans `public/` avant de lancer le render. Pour le studio, un fichier audio factice suffit.

- [ ] **Step 2: Lancer le studio pour vérification visuelle**

```bash
npm run studio
```

Ouvrir `http://localhost:3000` — vérifier :
- Intro : ψ anime avec spring, glow or
- Scènes : FaceScene visible avec silhouette + particules + fumée
- BrainScene : réseau de nœuds avec pathways animés
- WordReveal : mots apparaissent en séquence en bas
- FloatingTooltip : annotation flottante sur les scènes qui en ont une
- Outro : icônes sociales en staggered spring

- [ ] **Step 3: Render test (optionnel, nécessite ep31.mp3)**

```bash
npx remotion render PsyVideo out/ep31-test.mp4 --props='@public/ep31.json'
```

Expected: fichier `out/ep31-test.mp4` généré sans erreur

- [ ] **Step 4: Commit final**

```bash
git add public/ep31.json
git commit -m "feat: EP31 example props — psy-motion template complete"
```

---

## Self-Review

**Spec coverage :**
- ✅ Format 9:16 1080×1920 30fps → Root.tsx
- ✅ Style visuel noir/or → tous les composants
- ✅ Intro ψ animé 3s → Intro.tsx
- ✅ SceneSequence → SceneSequence.tsx
- ✅ Outro icônes sociales → Outro.tsx
- ✅ FaceScene (silhouette + fragments + fumée) → FaceScene.tsx
- ✅ BrainScene (réseau neurones + amygdale) → BrainScene.tsx
- ✅ ObjectScene + PlaceScene → Task 10
- ✅ WordReveal mot par mot → WordReveal.tsx
- ✅ FloatingTooltip → FloatingTooltip.tsx
- ✅ RTL/LTR → WordReveal prop `lang`
- ✅ Props JSON + CLI render → Task 13
- ✅ Types cohérents dans tous les fichiers

**Types consistants :** `SceneConfig`, `PsyVideoProps`, `SceneType` définis en Task 2 et utilisés identiquement dans PsyVideo, Root, SceneSequence.

**Aucun placeholder.**
