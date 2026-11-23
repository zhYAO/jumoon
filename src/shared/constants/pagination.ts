/** 列表分页约定（与后端 PageParams 对齐） */
export const DEFAULT_PAGE_SIZE = 20;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;

export const TABLE_PAGINATION = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSize: DEFAULT_PAGE_SIZE,
  showSizeChanger: true,
  pageSizeOptions: ['20', '50', '100'],
};
