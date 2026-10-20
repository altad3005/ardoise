import { describe, expect, it } from 'vitest';
import { classNames } from './class-names.ts';

describe('classNames', () => {
  it('joins the truthy parts with a space', () => {
    expect(classNames('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns an empty string without parts', () => {
    expect(classNames()).toBe('');
  });
});
