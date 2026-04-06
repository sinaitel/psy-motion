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
