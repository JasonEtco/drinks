import { describe, it, expect } from 'vitest';
import TinderPage from '../pages/TinderPage';

describe('TinderPage', () => {
  it('should be a valid React component', () => {
    expect(TinderPage).toBeDefined();
    expect(typeof TinderPage).toBe('function');
  });

  it('should export the component properly', () => {
    expect(TinderPage.name).toBe('TinderPage');
  });
});