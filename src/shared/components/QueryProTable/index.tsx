import type { ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { TABLE_PAGINATION } from '@/shared/constants/pagination';
import type { ProTableQueryParams, ProTableRequestResult } from '@/shared/hooks/useProTableRequest';

type Params = Record<string, any> | ProTableQueryParams;

export type QueryProTableProps<
  T extends Record<string, any>,
  U extends Params = Params,
> = Omit<ProTableProps<T, U>, 'request' | 'pagination'> & {
  /** 统一分页 request；可用 useProTableRequest 生成 */
  request: (params: U) => Promise<ProTableRequestResult<T>>;
  /** 默认 TABLE_PAGINATION；传 false 关闭分页（树表等） */
  pagination?: ProTableProps<T, U>['pagination'];
};

/**
 * 分页查询表格：统一默认每页 20、页码切换、搜索 label。
 * 业务页只关心 columns / request / 工具栏。
 */
export function QueryProTable<T extends Record<string, any>, U extends Params = Params>(
  props: QueryProTableProps<T, U>,
) {
  const { pagination, search, options, rowKey, request, ...rest } = props;

  const mergedPagination =
    pagination === false
      ? false
      : {
          ...TABLE_PAGINATION,
          ...(pagination && typeof pagination === 'object' ? pagination : {}),
        };

  const mergedSearch =
    search === false
      ? false
      : {
          labelWidth: 'auto' as const,
          ...(search && typeof search === 'object' ? search : {}),
        };

  const mergedOptions =
    options === false
      ? false
      : {
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
          ...(options && typeof options === 'object' ? options : {}),
        };

  return (
    <ProTable<T, U>
      {...rest}
      rowKey={rowKey ?? 'id'}
      request={request}
      options={mergedOptions}
      search={mergedSearch}
      pagination={mergedPagination}
    />
  );
}
