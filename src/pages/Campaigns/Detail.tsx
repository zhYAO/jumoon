import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo } from 'react';
import {
  buildCampaignLedger,
  moneyText,
  pctText,
} from '@/domains/product/campaignLedger';
import type { CampaignStatus } from '@/domains/product/mockTypes';
import { useMockStore } from '@/domains/product/mockStore';
import { campaignsForRole, canCreateCampaign } from '@/domains/product/permissions';
import {
  canRoleSeeModule,
  getPrototypeRole,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Text, Title } = Typography;

function statusTag(status: CampaignStatus) {
  const config = {
    draft: { color: 'default', text: '草稿' },
    active: { color: 'processing', text: '执行中' },
    closed: { color: 'success', text: '已结束' },
  }[status];
  return <Tag color={config.color}>{config.text}</Tag>;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = getPrototypeRole();
  const allowCreate = canCreateCampaign(role);
  const showMoney = role !== 'operator' && role !== 'owner';
  const { campaigns, cooperations, payments } = useMockStore();

  const visibleCampaigns = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );

  const campaign = useMemo(
    () => visibleCampaigns.find((c) => c.id === id),
    [visibleCampaigns, id],
  );

  useEffect(() => {
    if (!canRoleSeeModule(role, '/campaigns')) {
      history.replace('/home');
      return;
    }
    if (!id) {
      message.warning('项目不存在');
      history.replace('/campaigns');
      return;
    }
    if (!campaign) {
      message.warning('无权查看该项目，或项目不存在');
      history.replace('/campaigns');
    }
  }, [role, id, campaign]);

  if (!campaign) {
    return null;
  }

  const ledger = buildCampaignLedger(campaign, cooperations, payments);
  const cur = campaign.currency;
  const projectCoops = cooperations.filter((c) => c.campaignId === campaign.id);
  const projectPays = payments.filter((p) => p.campaignId === campaign.id);
  const progressPercent = ledger.targetCreators
    ? Math.min(100, Math.round((ledger.confirmedCreators / ledger.targetCreators) * 100))
    : 0;

  return (
    <PageContainer
      className={styles.page}
      title={campaign.name}
      subTitle={`${campaign.id} · ${campaign.clientBrand || '客户待补充'} · ${ledger.stageLabel}`}
      tags={statusTag(campaign.status)}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/campaigns')}>
            返回列表
          </Button>
          {allowCreate && campaign.status === 'draft' && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => history.push(`/campaigns?edit=${campaign.id}`)}
            >
              继续编辑
            </Button>
          )}
        </Space>
      }
    >
      <div className={styles.workbench}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="项目经营账"
          description="当前成本 = 已确认合作金额合计（没付款也算进成本）。已付款只表示这些成本付到哪一步。"
        />

        <div className={styles.ledgerGrid}>
          {showMoney && (
            <>
              <div>
                <span>{ledger.clientMoneyLabel}</span>
                <strong>
                  {ledger.clientMoney == null && campaign.budgetType === 'open'
                    ? '开放·待结算'
                    : moneyText(ledger.clientMoney, cur)}
                </strong>
              </div>
              <div>
                <span>目标成本</span>
                <strong>{moneyText(campaign.targetCost, cur)}</strong>
              </div>
            </>
          )}
          <div>
            <span>当前成本（已确认合作）</span>
            <strong>{moneyText(ledger.projectCost, cur)}</strong>
          </div>
          <div>
            <span>成本余额</span>
            <strong>{moneyText(ledger.costRemain, cur)}</strong>
          </div>
          {showMoney && (
            <>
              <div>
                <span>预计利润</span>
                <strong>
                  {ledger.expectedProfit == null
                    ? '待客户结算确认'
                    : moneyText(ledger.expectedProfit, cur)}
                </strong>
              </div>
              <div>
                <span>利润率</span>
                <strong>{pctText(ledger.profitRate)}</strong>
              </div>
            </>
          )}
          <div>
            <span>已付款</span>
            <strong>{moneyText(ledger.paidAmount, cur)}</strong>
          </div>
          <div>
            <span>待付款</span>
            <strong>{moneyText(ledger.unpaidAmount, cur)}</strong>
          </div>
        </div>

        <div className={styles.progressBand}>
          <div>
            <Text type="secondary">名额进度</Text>
            <Title level={4} style={{ margin: '4px 0' }}>
              {ledger.confirmedCreators} / {ledger.targetCreators || '—'}
            </Title>
            <Text>还差 {ledger.creatorGap} 人</Text>
          </div>
          <Progress type="circle" percent={progressPercent} size={72} />
          <div>
            <Text type="secondary">成本占用</Text>
            <Title level={4} style={{ margin: '4px 0' }}>
              {pctText(ledger.costUsageRate)}
            </Title>
            <Space wrap>
              {ledger.risks.map((r) => (
                <Tag key={r} color="warning">
                  {r}
                </Tag>
              ))}
            </Space>
          </div>
        </div>

        <section className={styles.listSection}>
          <Title level={5} style={{ marginTop: 0 }}>
            要求摘要
          </Title>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="市场 / 平台">
              {(campaign.markets || []).join('、') || '—'} /{' '}
              {(campaign.platforms || []).join('、') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Brief">{campaign.brief || '未填写'}</Descriptions.Item>
            <Descriptions.Item label="达人要求">
              {campaign.creatorRequirements || '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人 / 运营">
              {campaign.projectOwner} · {(campaign.operators || []).join('、') || '未分配'}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <section className={styles.listSection}>
          <Title level={5} style={{ marginTop: 0 }}>
            本项目合作（成本明细）
          </Title>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={projectCoops}
            locale={{ emptyText: '尚无已确认合作' }}
            columns={[
              { title: '达人', dataIndex: 'creatorName' },
              { title: '运营', dataIndex: 'operator', width: 80 },
              {
                title: '合作成本',
                render: (_, r) => moneyText(r.creatorTotal, cur),
              },
              ...(showMoney
                ? [
                    {
                      title: '对客报价',
                      render: (_: unknown, r: { clientQuote: number }) =>
                        moneyText(r.clientQuote, cur),
                    },
                  ]
                : []),
            ]}
          />
        </section>

        <section className={styles.listSection}>
          <Title level={5} style={{ marginTop: 0 }}>
            本项目付款
          </Title>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={projectPays}
            locale={{ emptyText: '尚无付款' }}
            columns={[
              { title: '申请号', dataIndex: 'id', width: 90 },
              { title: '达人', dataIndex: 'creatorName' },
              {
                title: '金额',
                render: (_, r) => moneyText(r.amount, cur),
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: (s: string) => s,
              },
            ]}
          />
        </section>
      </div>
    </PageContainer>
  );
}
