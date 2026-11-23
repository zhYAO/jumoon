# i18n 模块（web-frontend）

包名 / 目录：`src/i18n`。全管理端只有这一处国际化模块。

## 用法

```ts
import { useIntl } from '@umijs/max';
import { t, currentLocale, localeHeaders } from '@/i18n';

const { formatMessage } = useIntl();
formatMessage({ id: 'auth.login' });
t('common.save');
```

文案在 `src/locales/{zh-CN,en-US}/*.ts`，由 Umi locale 插件加载。`common` / `auth` 等是分包，不是独立模块。

切换语言会写 cookie `jumoon-locale`，请求头带 `X-Locale`，与后端 `app/i18n` 对齐。

菜单名来自后端配置，不走前端 locale。
