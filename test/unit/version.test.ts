import { describe, it, expect } from 'vitest';
import { VERSION } from '../../src/index';

describe('VERSION', () => {
  it('is a semver-shaped string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
