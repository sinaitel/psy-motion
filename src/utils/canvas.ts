/**
 * Canvas drawing utilities — glow, particles, smoke, vignette
 */

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
  opacity: number
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color.replace(')', `,${opacity})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  color: string, glowSize: number, glowOpacity: number
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  ctx.globalAlpha = glowOpacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width: number, glowSize: number, opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawGlowBezier(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x2: number, y2: number,
  color: string, width: number, glowSize: number, opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.stroke();
  ctx.restore();
}

export type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  life: number;     // 0-1
  maxLife: number;  // frames
  born: number;     // frame born
};

export function seedParticles(count: number, w: number, h: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  // deterministic pseudo-random using seed
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };

  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand() * w,
      y: rand() * h,
      vx: (rand() - 0.5) * 0.8,
      vy: -(rand() * 1.2 + 0.3), // upward drift
      size: rand() * 3 + 1,
      life: rand(), // start at random phase
      maxLife: Math.floor(rand() * 80 + 40),
      born: Math.floor(rand() * 100),
    });
  }
  return particles;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  frame: number,
  color: string,
  intensity: number
) {
  for (const p of particles) {
    const age = (frame - p.born + 1000) % p.maxLife;
    const life = age / p.maxLife;
    const opacity = Math.sin(life * Math.PI) * intensity;
    if (opacity <= 0) continue;

    const x = p.x + p.vx * age;
    const y = p.y + p.vy * age;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = color;
    ctx.shadowBlur = p.size * 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x % ctx.canvas.width, y % ctx.canvas.height, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawSmokeLayers(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: number,
  durationInFrames: number,
  color: string,
  intensity: number
) {
  const layers = [
    { xPct: 0.42, speed: 0.6, size: 160, phase: 0 },
    { xPct: 0.50, speed: 0.4, size: 200, phase: 40 },
    { xPct: 0.58, speed: 0.7, size: 140, phase: 20 },
    { xPct: 0.46, speed: 0.5, size: 180, phase: 60 },
  ];

  for (const l of layers) {
    const f = (frame + l.phase) % durationInFrames;
    const progress = f / durationInFrames;
    const y = h * 0.85 - progress * h * 0.7;
    const opacity = Math.sin(progress * Math.PI) * 0.35 * intensity;
    if (opacity <= 0) continue;

    ctx.save();
    ctx.filter = `blur(${l.size * 0.15}px)`;
    const grad = ctx.createRadialGradient(l.xPct * w, y, 0, l.xPct * w, y, l.size);
    grad.addColorStop(0, `rgba(${hexToRgb(color)},${opacity})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(l.xPct * w, y, l.size, l.size * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
