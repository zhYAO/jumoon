import { Button, Result } from 'antd';
import { history, useIntl } from '@umijs/max';

export default function NotFoundPage() {
  const { formatMessage } = useIntl();
  return (
    <Result
      status="404"
      title="404"
      subTitle={formatMessage({ id: 'layout.notFound' })}
      extra={
        <Button type="primary" onClick={() => history.push('/home')}>
          {formatMessage({ id: 'layout.backHome' })}
        </Button>
      }
    />
  );
}
