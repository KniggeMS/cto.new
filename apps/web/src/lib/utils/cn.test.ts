import { cn } from './cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'disabled')).toBe('base active');
  });

  it('handles tailwind merge conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});
