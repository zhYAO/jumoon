/**
 * i18n — 管理端唯一国际化模块（包名/目录名就是 i18n）。
 *
 * 业务用法：
 *   import { useIntl } from '@umijs/max'
 *   import { t, currentLocale, localeHeaders } from '@/i18n'
 *
 * 文案文件在 src/locales（Umi 约定入口），本目录只放约定与帮助函数。
 */
import { getIntl, getLocale, setLocale } from '@umijs/max';
import {
  defaultLocale,
  isLocale,
  localeCookie,
  localeHeader,
  umiLocaleKey,
  type Locale,
} from './config';

export {
  defaultLocale,
  isLocale,
  localeCookie,
  localeHeader,
  locales,
  type Locale,
} from './config';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function currentLocale(): Locale {
  try {
    const fromUmi = getLocale();
    if (isLocale(fromUmi)) return fromUmi;
  } catch {
    /* 非运行时（单测等） */
  }
  if (typeof window !== 'undefined') {
    const fromStorage = window.localStorage.getItem(umiLocaleKey);
    if (isLocale(fromStorage)) return fromStorage;
  }
  const fromCookie = readCookie(localeCookie);
  if (isLocale(fromCookie)) return fromCookie;
  return defaultLocale;
}

export function localeHeaders(): Record<string, string> {
  return { [localeHeader]: currentLocale() };
}

export function t(id: string, values?: Record<string, string | number>): string {
  try {
    return getIntl().formatMessage({ id }, values);
  } catch {
    return id;
  }
}

export function setAppLocale(next: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `${localeCookie}=${next};path=/;max-age=31536000;samesite=lax`;
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(umiLocaleKey, next);
  }
  try {
    setLocale(next, false);
  } catch {
    /* 插件未就绪时仍靠 cookie / localStorage + 刷新 */
  }
  window.location.reload();
}
