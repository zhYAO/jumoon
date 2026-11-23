import { useIntl } from '@umijs/max';
import { isLocale, setAppLocale, type Locale } from '@/i18n';

export function LanguageSwitcher() {
  const intl = useIntl();
  const locale: Locale = isLocale(intl.locale) ? intl.locale : 'zh-CN';

  function select(next: Locale) {
    if (next === locale) return;
    setAppLocale(next);
  }

  return (
    <div
      className="jumoon-language-switcher"
      role="group"
      aria-label={intl.formatMessage({ id: 'language.label' })}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={locale === 'zh-CN' ? 'is-active' : ''}
        aria-pressed={locale === 'zh-CN'}
        onClick={() => select('zh-CN')}
      >
        中文
      </button>
      <button
        type="button"
        className={locale === 'en-US' ? 'is-active' : ''}
        aria-pressed={locale === 'en-US'}
        onClick={() => select('en-US')}
      >
        EN
      </button>
    </div>
  );
}
