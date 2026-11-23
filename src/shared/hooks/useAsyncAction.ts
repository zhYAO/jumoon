import { useCallback, useState } from 'react';
import { message } from 'antd';
import { t } from '@/i18n';
import { isApiError } from '@/shared/api/client';

/** 统一异步提交：loading + 成功/失败提示。失败已 toast，不再向上抛，避免开发红屏。 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (fn: () => Promise<unknown>, successText?: string) => {
    setLoading(true);
    try {
      await fn();
      if (successText) message.success(successText);
      return true;
    } catch (e: any) {
      if (!isApiError(e)) {
        message.error(e?.message || t('common.failed'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, run };
}
