import { useAccess } from '@umijs/max';
import type { ReactNode } from 'react';

type Props = {
  /** access.ts 返回的 key，如 canUserCreate */
  accessKey: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * 功能权限闸门：无权限时不渲染 children（或渲染 fallback）。
 * 真正安全边界仍在后端 permission 校验。
 */
export function Permission({ accessKey, children, fallback = null }: Props) {
  const access = useAccess() as Record<string, boolean>;
  if (!access?.[accessKey]) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
