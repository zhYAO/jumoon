import {
  PlusOutlined,
  ProjectOutlined,
  SolutionOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';
import {
  baseChartOption,
  DemoChart,
  moneyTooltip,
} from '@/domains/product/charts/DemoChart';
import { CHART_COLORS, ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import { useMockStore } from '@/domains/product/mockStore';
import {
  campaignsForRole,
  canCreateCampaign,
  canReviewPayment,
  paymentsForRole,
  cooperationsForRole,
} from '@/domains/product/permissions';
import {
  getPrototypeRole,
  getPrototypeRoleMeta,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Text, Title } = Typography;

function money(v?: number, currency = 'USD') {
  if (v == null) return '-';
  return `${currency} ${v.toLocaleString('en-US')}`;
}

export default function HomePage() {
  const role = getPrototypeRole();
  const roleMeta = getPrototypeRoleMeta(role);
  const me = ROLE_CURRENT_USER[role];
  const { campaigns, cooperations, payments } = useMockStore();

  const myCampaigns = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );
  const myCoops = useMemo(
    () => cooperationsForRole(cooperations, campaigns, role, payments),
    [campaigns, cooperations, payments, role],
  );
  const myPays = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const draftCount = myCampaigns.filter((c) => c.status === 'draft').length;
  const activeCount = myCampaigns.filter((c) => c.status === 'active').length;
  const targetSum = myCampaigns.reduce((s, c) => s + (c.targetCost || 0), 0);
  const coopCost = myCoops.reduce((s, c) => s + c.creatorTotal, 0);
  const pendingPays = myPays.filter((p) => p.status === 'pending');
  const approvedPays = myPays.filter((p) => p.status === 'approved');
  const paidSum = myPays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const quoteSum = myCoops.reduce((s, c) => s + c.clientQuote, 0);
  const profit = quoteSum - coopCost;

  const budgetPie = useMemo(() => {
    const fixed = myCampaigns.filter((c) => c.budgetType === 'fixed').length;
    const open = myCampaigns.filter((c) => c.budgetType === 'open').length;
    if (!fixed && !open) return null;
    return baseChartOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: [
            { name: '固定预算', value: fixed },
            { name: '开放预算', value: open },
          ],
          label: { formatter: '{b}\n{c}' },
        },
      ],
    });
  }, [myCampaigns]);

  const targetBar = useMemo(() => {
    const rows = myCampaigns.filter((c) => c.targetCost).slice(0, 6);
    if (!rows.length) return null;
    return baseChartOption({
      xAxis: { type: 'category', data: rows.map((c) => c.name.slice(0, 12)), axisLabel: { rotate: 20 } },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: rows.map((c) => c.targetCost),
          itemStyle: { color: CHART_COLORS.primary, borderRadius: [4, 4, 0, 0] },
          tooltip: { valueFormatter: (v) => moneyTooltip(Number(v)) },
        },
      ],
    });
  }, [myCampaigns]);

  const burnBar = useMemo(() => {
    const rows = myCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => ({
        name: c.name.slice(0, 12),
        cost: cooperations
          .filter((co) => co.campaignId === c.id)
          .reduce((s, co) => s + co.creatorTotal, 0),
        target: c.targetCost || 0,
      }))
      .filter((r) => r.cost > 0 || r.target > 0)
      .slice(0, 6);
    if (!rows.length) return null;
    return baseChartOption({
      legend: { data: ['已发生成本', '内部目标'] },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: rows.map((r) => r.name) },
      series: [
        { name: '已发生成本', type: 'bar', data: rows.map((r) => r.cost), itemStyle: { color: CHART_COLORS.warning } },
        { name: '内部目标', type: 'bar', data: rows.map((r) => r.target), itemStyle: { color: CHART_COLORS.muted } },
      ],
    });
  }, [cooperations, myCampaigns]);

  const payPie = useMemo(() => {
    const groups = [
      { name: '待审核', value: myPays.filter((p) => p.status === 'pending').length },
      { name: '已通过', value: myPays.filter((p) => p.status === 'approved').length },
      { name: '已付款', value: myPays.filter((p) => p.status === 'paid').length },
      { name: '驳回/补充', value: myPays.filter((p) => ['rejected', 'need_info'].includes(p.status)).length },
    ].filter((g) => g.value > 0);
    if (!groups.length) return null;
    return baseChartOption({
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: ['42%', '68%'], data: groups, label: { formatter: '{b} {c}' } }],
    });
  }, [myPays]);

  const paidMonthBar = useMemo(() => {
    const map: Record<string, number> = {};
    myPays
      .filter((p) => p.status === 'paid')
      .forEach((p) => {
        const m = p.updatedAt.slice(0, 7);
        map[m] = (map[m] || 0) + p.amount;
      });
    const keys = Object.keys(map).sort();
    if (!keys.length) return null;
    return baseChartOption({
      xAxis: { type: 'category', data: keys },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: keys.map((k) => map[k]),
          itemStyle: { color: CHART_COLORS.success, borderRadius: [4, 4, 0, 0] },
        },
      ],
    });
  }, [myPays]);

  const trendCombo = useMemo(() => {
    const months = Array.from(new Set(myCampaigns.map((c) => c.settlementMonth).filter(Boolean))).sort();
    if (!months.length) return null;
    const cost = months.map((m) =>
      myCoops
        .filter((c) => campaigns.find((x) => x.id === c.campaignId)?.settlementMonth === m)
        .reduce((s, c) => s + c.creatorTotal, 0),
    );
    const paid = months.map((m) =>
      myPays
        .filter((p) => p.status === 'paid' && campaigns.find((x) => x.id === p.campaignId)?.settlementMonth === m)
        .reduce((s, p) => s + p.amount, 0),
    );
    const quote = months.map((m) =>
      myCoops
        .filter((c) => campaigns.find((x) => x.id === c.campaignId)?.settlementMonth === m)
        .reduce((s, c) => s + c.clientQuote, 0),
    );
    return baseChartOption({
      legend: { data: ['合作成本', '已付', '预计利润'] },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        { name: '合作成本', type: 'bar', data: cost, itemStyle: { color: CHART_COLORS.primary } },
        { name: '已付', type: 'bar', data: paid, itemStyle: { color: CHART_COLORS.success } },
        {
          name: '预计利润',
          type: 'line',
          data: quote.map((q, i) => q - cost[i]),
          itemStyle: { color: CHART_COLORS.warning },
        },
      ],
    } as EChartsOption);
  }, [campaigns, myCampaigns, myCoops, myPays]);

  const contribBar = useMemo(() => {
    const map: Record<string, number> = {};
    myCoops.forEach((c) => {
      map[c.operator] = (map[c.operator] || 0) + c.creatorTotal;
    });
    const keys = Object.keys(map);
    if (!keys.length) return null;
    return baseChartOption({
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: keys },
      series: [{ type: 'bar', data: keys.map((k) => map[k]), itemStyle: { color: CHART_COLORS.primary } }],
    });
  }, [myCoops]);

  const overTarget = myCampaigns
    .map((c) => {
      const cost = cooperations
        .filter((co) => co.campaignId === c.id)
        .reduce((s, co) => s + co.creatorTotal, 0);
      return { ...c, cost, over: (c.targetCost || 0) > 0 && cost > (c.targetCost || 0) };
    })
    .filter((c) => c.over);

  const title =
    role === 'business'
      ? '商务工作台'
      : role === 'operator' || role === 'owner'
        ? '运营工作台'
        : role === 'finance'
          ? '财务工作台'
          : role === 'executive'
            ? '经营概览'
            : '工作台';

  return (
    <PageContainer
      className={styles.page}
      title={title}
      subTitle={`${roleMeta.shortLabel} · ${me}`}
      extra={
        <Space>
          {canCreateCampaign(role) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/campaigns')}>
              新建 Campaign
            </Button>
          )}
          {(role === 'operator' || role === 'owner') && (
            <>
              <Button icon={<SolutionOutlined />} onClick={() => history.push('/cooperations')}>
                新建合作
              </Button>
              <Button onClick={() => history.push('/campaigns')}>我的 Campaign</Button>
            </>
          )}
          {canReviewPayment(role) && (
            <Button type="primary" icon={<WalletOutlined />} onClick={() => history.push('/finance/approvals')}>
              付款队列
            </Button>
          )}
          {role === 'executive' && (
            <Button type="primary" icon={<ProjectOutlined />} onClick={() => history.push('/analytics')}>
              打开看板
            </Button>
          )}
        </Space>
      }
    >
      <Row gutter={[16, 16]} className={styles.kpiRow}>
        {role === 'business' && (
          <>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="我的项目" value={myCampaigns.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="草稿" value={draftCount} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="进行中" value={activeCount} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="内部目标合计" value={targetSum} prefix="$" /></div></Col>
          </>
        )}
        {(role === 'operator' || role === 'owner') && (
          <>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="分配给我" value={myCampaigns.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="我的合作" value={myCoops.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="待付款申请" value={pendingPays.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="成本占用" value={coopCost} prefix="$" /></div></Col>
          </>
        )}
        {role === 'finance' && (
          <>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="待审核" value={pendingPays.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="已通过待付" value={approvedPays.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="已付金额" value={paidSum} prefix="$" /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="驳回/补充" value={myPays.filter((p) => ['rejected', 'need_info'].includes(p.status)).length} /></div></Col>
          </>
        )}
        {(role === 'executive' || role === 'architecture') && (
          <>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="Campaign" value={campaigns.length} /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="合作成本" value={coopCost} prefix="$" /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="已付" value={paidSum} prefix="$" /></div></Col>
            <Col xs={12} md={6}><div className={styles.metric}><Statistic title="预计利润" value={profit} prefix="$" /></div></Col>
          </>
        )}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        {role === 'business' && (
          <>
            <Col xs={24} lg={10}><div className={styles.chartCard}><Text type="secondary">预算类型</Text>{budgetPie ? <DemoChart option={budgetPie} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
            <Col xs={24} lg={14}><div className={styles.chartCard}><Text type="secondary">各项目内部目标成本</Text>{targetBar ? <DemoChart option={targetBar} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
          </>
        )}
        {(role === 'operator' || role === 'owner') && (
          <Col span={24}><div className={styles.chartCard}><Text type="secondary">目标成本 vs 已发生合作成本</Text>{burnBar ? <DemoChart option={burnBar} height={280} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
        )}
        {role === 'finance' && (
          <>
            <Col xs={24} lg={10}><div className={styles.chartCard}><Text type="secondary">付款状态构成</Text>{payPie ? <DemoChart option={payPie} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
            <Col xs={24} lg={14}><div className={styles.chartCard}><Text type="secondary">近月已付金额</Text>{paidMonthBar ? <DemoChart option={paidMonthBar} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
          </>
        )}
        {(role === 'executive' || role === 'architecture') && (
          <>
            <Col span={24}><div className={styles.chartCard}><Text type="secondary">成本 / 已付 / 利润（按结算月）</Text>{trendCombo ? <DemoChart option={trendCombo} height={300} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
            <Col xs={24} lg={12}><div className={styles.chartCard}><Text type="secondary">运营贡献</Text>{contribBar ? <DemoChart option={contribBar} /> : <Text type="secondary">暂无数据</Text>}</div></Col>
            <Col xs={24} lg={12}>
              <div className={styles.chartCard}>
                <Text type="secondary">超内部目标成本项目</Text>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  style={{ marginTop: 12 }}
                  dataSource={overTarget}
                  locale={{ emptyText: '暂无超成本项目' }}
                  columns={[
                    { title: '项目', dataIndex: 'name' },
                    { title: '目标', render: (_, r) => money(r.targetCost) },
                    { title: '成本', render: (_, r) => money(r.cost) },
                  ]}
                />
              </div>
            </Col>
          </>
        )}
      </Row>

      <div className={styles.listCard}>
        <Title level={5} style={{ marginTop: 0 }}>
          {role === 'finance' ? '待审付款' : '最近 Campaign'}
        </Title>
        {role === 'finance' ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={pendingPays}
            locale={{ emptyText: '暂无待审核' }}
            columns={[
              { title: '申请', dataIndex: 'id' },
              { title: '达人', dataIndex: 'creatorName' },
              { title: '金额', render: (_, r) => money(r.amount, r.currency) },
              {
                title: '操作',
                render: (_, r) => (
                  <Button type="link" onClick={() => history.push('/finance/approvals')}>
                    去审核 {r.id}
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={myCampaigns.slice(0, 8)}
            locale={{ emptyText: '暂无项目' }}
            columns={[
              {
                title: '项目',
                render: (_, r) => (
                  <Button type="link" style={{ padding: 0 }} onClick={() => history.push('/campaigns')}>
                    {r.name}
                  </Button>
                ),
              },
              { title: '品牌', dataIndex: 'clientBrand' },
              { title: '结算月', dataIndex: 'settlementMonth' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (s: string) => (
                  <Tag color={s === 'active' ? 'processing' : s === 'draft' ? 'default' : 'success'}>
                    {{ draft: '草稿', active: '进行中', closed: '已结束' }[s] || s}
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
}
