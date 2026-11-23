import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import {
  getProductModule,
  getPrototypeRole,
  getPrototypeRoleMeta,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Paragraph, Text, Title } = Typography;

const FLOW = [
  { name: '项目管理', note: '第一期', path: '/campaigns' },
  { name: '合作管理', note: '第一期', path: '/cooperations' },
  { name: '财务管理', note: '第一期', path: '/finance' },
  { name: '看板', note: '第一期', path: '/analytics' },
];

export default function ProductModulePage() {
  const module = getProductModule(history.location.pathname);
  const role = getPrototypeRole();
  const roleMeta = getPrototypeRoleMeta(role);
  const isPhaseOne = module?.phase === 'phase1';

  if (!module) {
    return (
      <PageContainer title="未找到模块">
        <Empty description="该路径不是一期业务模块" />
        <Button type="primary" onClick={() => history.push('/home')}>
          回工作台
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={module.title}
      subTitle={module.description}
      tags={<Tag color={isPhaseOne ? 'green' : 'default'}>{isPhaseOne ? '第一期' : '后续预留'}</Tag>}
    >
      <Alert
        className={styles.roleAlert}
        type="info"
        showIcon
        message={`当前演示身份：${roleMeta.label}`}
        description="一期侧边栏只有六个模块；身份不同，看到的数据不同。"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Title level={4}>业务链路</Title>
          <Paragraph type="secondary">占位页已下线；请从侧边栏进入正式模块。</Paragraph>
          <Space wrap>
            {FLOW.map((item) => (
              <Button
                key={item.path}
                icon={<ArrowRightOutlined />}
                onClick={() => history.push(item.path)}
              >
                {item.name}
              </Button>
            ))}
          </Space>
        </Col>
        <Col xs={24} md={10}>
          <div className={styles.metaCard}>
            <Text type="secondary">状态</Text>
            <div style={{ marginTop: 8 }}>
              {isPhaseOne ? <CheckCircleOutlined /> : <ClockCircleOutlined />}{' '}
              {isPhaseOne ? '一期可用' : '后续再做'}
            </div>
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
}
