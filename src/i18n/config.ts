/**
 * 管理端 i18n 常量。文案在 src/locales，由 Umi locale 插件加载。
 */
export const locales = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-CN';
export const localeCookie = 'jumoon-locale';
export const localeHeader = 'X-Locale';
export const umiLocaleKey = 'umi_locale';

export function isLocale(value?: string | null): value is Locale {
  return locales.includes(value as Locale);
}
