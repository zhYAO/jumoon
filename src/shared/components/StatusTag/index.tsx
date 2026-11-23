import { Tag } from 'antd';
import { useIntl } from '@umijs/max';
import { STATUS } from '@/shared/constants/status';

type Props = {
  value?: number;
};

/** 通用启停状态标签 */
export function StatusTag({ value }: Props) {
  const { formatMessage } = useIntl();
  if (value === STATUS.ENABLE) {
    return <Tag color="success">{formatMessage({ id: 'common.enabled' })}</Tag>;
  }
  if (value === STATUS.DISABLE) {
    return <Tag>{formatMessage({ id: 'common.disabled' })}</Tag>;
  }
  return <Tag>{formatMessage({ id: 'common.empty' })}</Tag>;
}
