import {
  ArrowRightOutlined,
  BarChartOutlined,
  IdcardOutlined,
  ProjectOutlined,
  SolutionOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { useMemo } from 'react';
import { useMockStore } from '@/domains/product/mockStore';
import {
  campaignsForRole,
  cooperationsForRole,
  creatorsForRole,
  paymentsForRole,
} from '@/domains/product/permissions';
import {
  canRoleSeeModule,
  defaultFinancePathForRole,
  getPrototypeRole,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';

export type PhaseOneFlowKey =
  | 'campaigns'
  | 'creators'
  | 'cooperations'
  | 'payments'
  | 'analytics';

export function PhaseOneFlow({ active }: { active: PhaseOneFlowKey }) {
  const role = getPrototypeRole();
  const { campaigns, creators, cooperations, payments } = useMockStore();

  const visibleCampaigns = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );
  const visibleCooperations = useMemo(
    () => cooperationsForRole(cooperations, campaigns, role, payments),
    [campaigns, cooperations, payments, role],
  );
  const visibleCreators = useMemo(
    () => creatorsForRole(creators, role),
    [creators, role],
  );
  const visiblePayments = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const steps = [
    {
      key: 'campaigns' as const,
      title: 'Campaign',
      note: `${visibleCampaigns.filter((item) => item.status === 'active').length} 个执行中`,
      path: '/campaigns',
      permissionPath: '/campaigns',
      icon: <ProjectOutlined />,
    },
    {
      key: 'creators' as const,
      title: '达人档案',
      note: `${visibleCreators.length} 位可用`,
      path: '/creators',
      permissionPath: '/creators',
      icon: <IdcardOutlined />,
    },
    {
      key: 'cooperations' as const,
      title: '合作记录',
      note: `${visibleCooperations.length} 笔合作`,
      path: '/cooperations',
      permissionPath: '/cooperations',
      icon: <SolutionOutlined />,
    },
    {
      key: 'payments' as const,
      title: role === 'finance' ? '付款审批' : '付款处理',
      note: `${visiblePayments.length} 笔申请`,
      path: defaultFinancePathForRole(role),
      permissionPath: '/finance',
      icon: <WalletOutlined />,
    },
    {
      key: 'analytics' as const,
      title: '看板汇总',
      note: '自动回写',
      path: '/analytics',
      permissionPath: '/analytics',
      icon: <BarChartOutlined />,
    },
  ].filter((step) => canRoleSeeModule(role, step.permissionPath));

  return (
    <section className={styles.flowBar} aria-label="第一期业务流程">
      <div className={styles.flowHeading}>
        <div>
          <span>第一期业务链</span>
          <strong>数据从左向右自动关联</strong>
        </div>
        <small>点击任一步可直接进入对应工作区</small>
      </div>
      <div className={styles.flowSteps}>
        {steps.map((step, index) => (
          <div className={styles.stepWrap} key={step.key}>
            <button
              type="button"
              className={`${styles.step} ${active === step.key ? styles.active : ''}`}
              aria-current={active === step.key ? 'step' : undefined}
              onClick={() => history.push(step.path)}
            >
              <span className={styles.stepIcon}>{step.icon}</span>
              <span className={styles.stepCopy}>
                <strong>{step.title}</strong>
                <small>{step.note}</small>
              </span>
            </button>
            {index < steps.length - 1 && <ArrowRightOutlined className={styles.arrow} />}
          </div>
        ))}
      </div>
    </section>
  );
}
