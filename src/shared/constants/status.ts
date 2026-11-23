/** 与后端约定：0 正常 / 1 停用 */
export const STATUS = {
  ENABLE: 0,
  DISABLE: 1,
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];

export function statusValueEnum(text: (id: string) => string) {
  return {
    [STATUS.ENABLE]: { text: text('common.enabled'), status: 'Success' as const },
    [STATUS.DISABLE]: { text: text('common.disabled'), status: 'Default' as const },
  };
}

/** @deprecated 使用 statusValueEnum；保留给未迁页面的静态默认 */
export const STATUS_VALUE_ENUM = {
  [STATUS.ENABLE]: { text: '正常', status: 'Success' as const },
  [STATUS.DISABLE]: { text: '停用', status: 'Default' as const },
};

