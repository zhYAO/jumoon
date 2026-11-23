import { describe, expect, it, vi } from 'vitest';

vi.mock('@umijs/max', () => ({
  getLocale: () => 'en-US',
  setLocale: vi.fn(),
  getIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

import { currentLocale, localeHeaders } from '@/i18n';

describe('i18n helpers', () => {
  it('currentLocale 走 umi getLocale', () => {
    expect(currentLocale()).toBe('en-US');
  });

  it('localeHeaders 带 X-Locale', () => {
    expect(localeHeaders()).toEqual({ 'X-Locale': 'en-US' });
  });
});
