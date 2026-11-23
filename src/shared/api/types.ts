/** 后端统一响应（对齐芋道 CommonResult） */
export type ApiResult<T = unknown> = {
  code: number;
  data: T;
  msg: string;
};

export type PageResult<T> = {
  list: T[];
  total: number;
};

export type PageQuery = {
  pageNo?: number;
  pageSize?: number;
};
