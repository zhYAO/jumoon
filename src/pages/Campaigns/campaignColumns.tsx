import { history } from '@umijs/max';
import { Button, Space, Tag, Typography, type TableColumnsType } from 'antd';
import { moneyText, pctText, type CampaignLedger } from '@/domains/product/campaignLedger';
import type { CampaignStatus, PrototypeCampaign } from '@/domains/product/mockTypes';
import styles from './index.less';

const { Text } = Typography;

function statusTag(status: CampaignStatus) {
  const config = {
    draft: { color: 'default', text: '草稿' },
    active: { color: 'processing', text: '执行中' },
    closed: { color: 'success', text: '已结束' },
  }[status];
  return <Tag color={config.color}>{config.text}</Tag>;
}

export function getCampaignColumns(
  showMoney: boolean,
  onEdit?: (campaign: PrototypeCampaign) => void,
): TableColumnsType<CampaignLedger> {
  const nameCol = {
    title: 'Campaign',
    key: 'campaign',
    width: 220,
    fixed: 'left' as const,
    render: (_: unknown, row: CampaignLedger) => (
      <button
        className={styles.campaignLink}
        type="button"
        onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
      >
        <strong>{row.campaign.name}</strong>
        <span>
          {row.campaign.id} · {row.campaign.clientBrand || '客户待补充'}
        </span>
      </button>
    ),
  };

  const opsCols = [
    nameCol,
    {
      title: '进度',
      key: 'progress',
      width: 160,
      render: (_: unknown, row: CampaignLedger) => (
        <div className={styles.moneyCell}>
          <strong>
            {row.confirmedCreators}/{row.targetCreators || '—'}
          </strong>
          <small>还差 {row.creatorGap}</small>
        </div>
      ),
    },
    {
      title: '目标成本',
      key: 'target',
      width: 120,
      render: (_: unknown, row: CampaignLedger) =>
        moneyText(row.campaign.targetCost, row.campaign.currency),
    },
    {
      title: '已使用成本',
      key: 'used',
      width: 120,
      render: (_: unknown, row: CampaignLedger) => (
        <div className={styles.moneyCell}>
          <strong>{moneyText(row.projectCost, row.campaign.currency)}</strong>
          <small>{pctText(row.costUsageRate)} 占用</small>
        </div>
      ),
    },
    {
      title: '剩余成本',
      key: 'remain',
      width: 110,
      render: (_: unknown, row: CampaignLedger) => moneyText(row.costRemain, row.campaign.currency),
    },
    {
      title: '当前阶段',
      key: 'stage',
      width: 130,
      render: (_: unknown, row: CampaignLedger) => row.stageLabel,
    },
    {
      title: '截止',
      key: 'end',
      width: 110,
      render: (_: unknown, row: CampaignLedger) => row.campaign.endDate || '—',
    },
    {
      title: '下一步',
      key: 'next',
      fixed: 'right' as const,
      width: 120,
      render: (_: unknown, row: CampaignLedger) => (
        <Button
          type="link"
          size="small"
          onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
        >
          进入项目
        </Button>
      ),
    },
  ];

  const bizCols = [
    nameCol,
    {
      title: '状态',
      width: 90,
      render: (_: unknown, row: CampaignLedger) => statusTag(row.campaign.status),
    },
    {
      title: '项目进度',
      width: 150,
      render: (_: unknown, row: CampaignLedger) => (
        <div className={styles.moneyCell}>
          <strong>{row.progressLabel}</strong>
          <small>{row.stageLabel}</small>
        </div>
      ),
    },
    {
      title: '客户预算',
      width: 120,
      render: (_: unknown, row: CampaignLedger) =>
        row.campaign.budgetType === 'open' && row.clientMoney == null
          ? '开放预算'
          : moneyText(row.clientMoney, row.campaign.currency),
    },
    {
      title: '目标成本',
      width: 110,
      render: (_: unknown, row: CampaignLedger) =>
        moneyText(row.campaign.targetCost, row.campaign.currency),
    },
    {
      title: '当前成本',
      width: 110,
      render: (_: unknown, row: CampaignLedger) => (
        <div className={styles.moneyCell}>
          <strong>{moneyText(row.projectCost, row.campaign.currency)}</strong>
          <small>已确认合作</small>
        </div>
      ),
    },
    {
      title: '成本使用率',
      width: 100,
      render: (_: unknown, row: CampaignLedger) => pctText(row.costUsageRate),
    },
    {
      title: '预计利润',
      width: 110,
      render: (_: unknown, row: CampaignLedger) =>
        row.expectedProfit == null
          ? '待结算确认'
          : moneyText(row.expectedProfit, row.campaign.currency),
    },
    {
      title: '利润率',
      width: 80,
      render: (_: unknown, row: CampaignLedger) => pctText(row.profitRate),
    },
    {
      title: '已付 / 待付',
      width: 140,
      render: (_: unknown, row: CampaignLedger) => (
        <div className={styles.moneyCell}>
          <strong>{moneyText(row.paidAmount, row.campaign.currency)}</strong>
          <small>待付 {moneyText(row.unpaidAmount, row.campaign.currency)}</small>
        </div>
      ),
    },
    {
      title: '结算月',
      width: 90,
      render: (_: unknown, row: CampaignLedger) => row.campaign.settlementMonth || '—',
    },
    {
      title: '负责人',
      width: 90,
      render: (_: unknown, row: CampaignLedger) => row.campaign.projectOwner,
    },
    {
      title: '风险',
      width: 160,
      render: (_: unknown, row: CampaignLedger) =>
        row.risks.length ? (
          <Space size={[4, 4]} wrap>
            {row.risks.slice(0, 3).map((r) => (
              <Tag key={r} color={r.includes('超') || r.includes('亏') ? 'error' : 'warning'}>
                {r}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: '下一步',
      key: 'next',
      fixed: 'right' as const,
      width: 130,
      render: (_: unknown, row: CampaignLedger) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => history.push(`/campaigns/${row.campaign.id}`)}
          >
            进入项目
          </Button>
          {onEdit && row.campaign.status === 'draft' && (
            <Button type="link" size="small" onClick={() => onEdit(row.campaign)}>
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return showMoney ? bizCols : opsCols;
}
