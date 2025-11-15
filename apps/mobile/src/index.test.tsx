import { formatDate } from '@infocus/shared';

describe('Mobile App', () => {
  it('should import shared utilities', () => {
    const date = new Date('2024-01-01');
    const formatted = formatDate(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
