# psy-motion — Design Spec
Date: 2026-04-06
Project: @the.psychoanalyst — Remotion video pipeline

---

## Objectif

Produire des vidéos psychanalytiques longues (3–5 min) pour la chaîne @the.psychoanalyst, entièrement générées avec Remotion (React). Pas d'assets vidéo/image externes — toutes les scènes sont des animations construites en code (SVG, Canvas, CSS). L'audio est un fichier MP3 fourni par l'utilisateur.

---

## Format

| Paramètre | Valeur |
|---|---|
| Ratio | 9:16 vertical |
| Résolution | 1080 × 1920 |
| FPS | 30 |
| Durée | ~3–5 min (configurable) |
| Langues | AR (RTL) / FR (LTR) |

---

## Style visuel (guide @the.psychoanalyst)

- Fond pitch black (`#000000`)
- Palette : noir, gris foncé, or/gold (`#d4af37`)
- Lumière froide en bas, chaude or en haut/centre
- Atmosphère dark manga, ink sketch texture
- Pas de motifs sur la peau, pas de bleu froid
- Pas de bordures, pas de watermark

---

## Architecture du projet

```
psy-motion/
├── src/
│   ├── index.ts                  ← registerRoot
│   ├── Root.tsx                  ← déclaration <Composition>
│   ├── PsyVideo.tsx              ← composition principale
│   ├── sections/
│   │   ├── Intro.tsx             ← ψ animé sur fond noir (3s)
│   │   ├── SceneSequence.tsx     ← itère sur scenes[], délègue au bon composant
│   │   └── Outro.tsx             ← icônes sociales + fade noir (3s)
│   ├── scenes/
│   │   ├── FaceScene.tsx         ← silhouette ink + glow bioluminescent peau
│   │   ├── BrainScene.tsx        ← réseau de neurones SVG + pathways animés
│   │   ├── ObjectScene.tsx       ← forme géométrique flottante stylisée
│   │   └── PlaceScene.tsx        ← lignes architecturales abstraites
│   ├── components/
│   │   ├── PsiLogo.tsx           ← ψ lumineux, glow or, réutilisable
│   │   ├── FollowText.tsx        ← "follow the psychoanalyst" fixe haut centré
│   │   ├── WordReveal.tsx        ← révélation mot par mot en bas
│   │   └── FloatingTooltip.tsx   ← annotation flottante (ex: "Amygdale hyperactive")
│   └── types.ts                  ← types partagés
├── public/                       ← fichiers audio uniquement
└── remotion.config.ts
```

---

## Types

```ts
// src/types.ts

export type SceneType = 'face' | 'brain' | 'object' | 'place';

export type SceneConfig = {
  type: SceneType;
  durationSec: number;
  tooltip?: string;           // annotation flottante optionnelle
  params?: {
    glowColor?: string;       // défaut: '#d4af37'
    intensity?: number;       // 0–1, défaut: 0.7
  };
};

export type PsyVideoProps = {
  audioSrc: string;           // chemin vers le fichier MP3
  scenes: SceneConfig[];      // séquence de scènes
  words: string[];            // texte découpé en mots
  lang: 'ar' | 'fr';         // détermine direction RTL/LTR
  wordTimings?: number[];     // timestamps en secondes (optionnel, sinon réparti uniformément)
};
```

---

## Composition principale

```
PsyVideo (durationInFrames = durationSec * fps)
├── <Audio src={audioSrc} />
├── <FollowText />                   (toujours visible)
├── <Intro />                        frames 0 → 90 (3s)
├── <SceneSequence scenes={scenes} /> frames 90 → end-60
└── <Outro />                        frames end-60 → end
    + <WordReveal words={words} ... /> (overlay global, frames 90 → end-60)
```

---

## Sections

### Intro (3s)
- Fond noir absolu
- ψ apparaît avec spring() depuis opacity 0, scale 0.5 → 1
- Glow or pulsant (interpolate opacity 0.4 → 1 → 0.4, loop)
- Fade out vers scène 1

### SceneSequence
- Itère sur `scenes[]`, calcule l'offset de chaque scène
- Délègue au composant correspondant via un switch sur `type`
- Chaque scène reçoit : `frame` local, `durationInFrames`, `params`
- `<FloatingTooltip>` injecté si `tooltip` défini (fade in à 30f, fade out à durationInFrames - 20f)

### Outro (3s)
- Fade progressif vers noir
- Icônes sociales (Subscribe, Instagram, YouTube) en or bioluminescent
- Animation : apparition staggerée avec spring()

---

## Scène-types

### FaceScene
- Silhouette humaine (SVG ink manga) centrée
- Halo bioluminescent sur la peau (radial gradient animé)
- Particules/fragments or flottants autour (positions pseudo-aléatoires par seed)
- Fumée/brume montante depuis le bas
- Slow drift : légère translation Y oscillante (±8px, interpolate cycle long)

### BrainScene
- Réseau de ~30 nœuds SVG disposés en forme de cerveau
- Pathways (lignes) entre nœuds qui s'illuminent en séquence (interpolate opacity)
- Nœud "amygdale" pulse en amber plus fort
- Fond : radial gradient or subtil au centre

### ObjectScene
- Forme géométrique abstraite (dodécaèdre, sphère fragmentée) en SVG
- Rotation lente continue
- Éclats d'encre autour
- Paramétrable via `params`

### PlaceScene
- Lignes de perspective qui convergent vers un point de fuite central
- Lignes tracées progressivement (interpolate strokeDashoffset)
- Ambiance architecturale / urbaine abstraite

---

## Composants réutilisables

### PsiLogo
- Caractère ψ en blanc
- text-shadow : glow or multi-couches
- Position : 30% du haut, centré horizontalement

### FollowText
- "follow the psychoanalyst"
- Font : uppercase, letter-spacing large, 12–14px
- Blanc, opacity 0.7
- Position : top 10px, centré

### WordReveal
- Reçoit `words[]` et `wordTimings[]` (ou calcul automatique)
- Chaque mot fade in (interpolate 0→1, 8 frames) à son timestamp
- Mot actif : blanc, opacity 1 — mots passés : opacity 0.3
- Position : bottom 15%, centré, RTL si `lang === 'ar'`
- Font : bold, 28–32px

### FloatingTooltip
- Texte avec bordure fine (`border: 1px solid rgba(212,175,55,0.5)`)
- Fond semi-transparent (`rgba(0,0,0,0.7)`)
- Glow subtil or
- Position : 25% du haut, centré
- Animation : fade in (frames 0→30), stable, fade out (frames end-20→end)

---

## Render CLI

```bash
# Render depuis un fichier JSON de props
npx remotion render PsyVideo out/EP31.mp4 --props='@public/ep31.json'

# Exemple de props JSON (public/ep31.json)
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

# Preview interactif
npx remotion studio
```

---

## Intégration future (psychoanalyst-api)

Quand le template est validé, le pipeline devient :
1. `psychoanalyst-api` génère `episode.json` depuis la DB
2. Appel `POST /render` déclenche `remotion render`
3. Vidéo stockée et accessible via le dashboard

---

## Contraintes absolues (guide visuel)

- No extra elements
- No borders (hors FloatingTooltip intentionnel)
- No watermark
- No patterns on skin
- No em dash
