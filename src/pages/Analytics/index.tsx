import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Col, Row, Statistic, Table, Typography } from 'antd';
import { useMemo, type CSSProperties } from 'react';
import { DemoChart } from '@/domains/product/charts/DemoChart';
import { baseChartOption } from '@/domains/product/charts/chartOptions';
import { CHART_COLORS } from '@/domains/product/mockTypes';
import { useMockStore } from '@/domains/product/mockStore';
import {
  campaignsForRole,
  cooperationsForRole,
  paymentsForRole,
} from '@/domains/product/permissions';
import { getPrototypeRole } from '@/domains/product/prototypeNavigation';

const { Text } = Typography;

function money(v: number) {
  return `$ ${v.toLocaleString('en-US')}`;
}

const card: CSSProperties = {
  padding: '16px 18px',
  border: '1px solid #e4e7ec',
  borderRadius: 8,
  background: '#fff',
  minHeight: 96,
};

/**
 * 财务看板：只关心钱怎么流
 * - 待审 / 待付 / 已付 / 未结清
 * - 不看运营贡献、内部目标、预计利润（那是商务/老板视角）
 */
function FinanceBoard() {
  const role = getPrototypeRole();
  const { campaigns, cooperations, payments } = useMockStore();

  const camps = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );
  const coops = useMemo(
    () => cooperationsForRole(cooperations, campaigns, role, payments),
    [campaigns, cooperations, payments, role],
  );
  const pays = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const pendingRows = pays.filter((p) => p.status === 'pending');
  const approvedRows = pays.filter((p) => p.status === 'approved');
  const paidRows = pays.filter((p) => p.status === 'paid');

  const pendingAmt = pendingRows.reduce((s, p) => s + p.amount, 0);
  const approvedAmt = approvedRows.reduce((s, p) => s + p.amount, 0);
  const paidAmt = paidRows.reduce((s, p) => s + p.amount, 0);

  const unpaid = coops
    .map((c) => {
      const paidSum = pays
        .filter((p) => p.cooperationId === c.id && p.status === 'paid')
        .reduce((s, p) => s + p.amount, 0);
      return {
        id: c.id,
        creatorName: c.creatorName,
        campaign: camps.find((x) => x.id === c.campaignId)?.name || c.campaignId,
        total: c.creatorTotal,
        paid: paidSum,
        remain: Math.max(0, c.creatorTotal - paidSum),
      };
    })
    .filter((r) => r.remain > 0);
  const unpaidAmt = unpaid.reduce((s, r) => s + r.remain, 0);

  const payPie = useMemo(() => {
    const data = [
      { name: '待审核', value: pendingRows.length },
      { name: '已通过待付', value: approvedRows.length },
      { name: '已付款', value: paidRows.length },
      {
        name: '驳回/补充',
        value: pays.filter((p) => ['rejected', 'need_info'].includes(p.status)).length,
      },
    ].filter((d) => d.value > 0);
    if (!data.length) return null;
    return baseChartOption({
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: ['40%', '65%'], data, label: { formatter: '{b} {d}%' } }],
    });
  }, [pays, pendingRows.length, approvedRows.length, paidRows.length]);

  const cashTrend = useMemo(() => {
    const months = Array.from(new Set(camps.map((c) => c.settlementMonth).filter(Boolean))).sort();
    if (!months.length) return null;
    const pendingArr = months.map((m) =>
      pays
        .filter(
          (p) =>
            p.status === 'pending' &&
            camps.find((x) => x.id === p.campaignId)?.settlementMonth === m,
        )
        .reduce((s, p) => s + p.amount, 0),
    );
    const approvedArr = months.map((m) =>
      pays
        .filter(
          (p) =>
            p.status === 'approved' &&
            camps.find((x) => x.id === p.campaignId)?.settlementMonth === m,
        )
        .reduce((s, p) => s + p.amount, 0),
    );
    const paidArr = months.map((m) =>
      pays
        .filter(
          (p) =>
            p.status === 'paid' &&
            camps.find((x) => x.id === p.campaignId)?.settlementMonth === m,
        )
        .reduce((s, p) => s + p.amount, 0),
    );
    return baseChartOption({
      legend: { data: ['待审核', '待付款', '已付'] },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        { name: '待审核', type: 'bar', stack: 'todo', data: pendingArr, itemStyle: { color: CHART_COLORS.warning } },
        { name: '待付款', type: 'bar', stack: 'todo', data: approvedArr, itemStyle: { color: CHART_COLORS.primary } },
        { name: '已付', type: 'line', data: paidArr, itemStyle: { color: CHART_COLORS.success } },
      ],
    });
  }, [camps, pays]);

  return (
    <PageContainer
      title="财务看板"
      subTitle="只看付款流：待审 → 待付 → 已付；不看运营贡献和内部目标成本"
      extra={
        <Button type="primary" onClick={() => history.push('/finance/approvals')}>
          去财务审批
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <div style={card}>
            <Statistic title="待审核金额" value={pendingAmt} prefix="$" />
            <Text type="secondary">{pendingRows.length} 笔</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}>
            <Statistic title="待付款（已通过）" value={approvedAmt} prefix="$" />
            <Text type="secondary">{approvedRows.length} 笔</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}>
            <Statistic title="已付金额" value={paidAmt} prefix="$" />
            <Text type="secondary">{paidRows.length} 笔</Text>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}>
            <Statistic title="未付达人余额" value={unpaidAmt} prefix="$" />
            <Text type="secondary">{unpaid.length} 笔合作未结清</Text>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={14}>
          <div style={card}>
            <Text type="secondary">按结算月：待审 / 待付 / 已付</Text>
            {cashTrend ? (
              <DemoChart option={cashTrend} height={280} />
            ) : (
              <Text type="secondary">暂无数据</Text>
            )}
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div style={card}>
            <Text type="secondary">付款状态（笔数）</Text>
            {payPie ? <DemoChart option={payPie} height={280} /> : <Text type="secondary">暂无数据</Text>}
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <div style={card}>
            <Text type="secondary">待审核清单</Text>
            <Table
              size="small"
              style={{ marginTop: 12 }}
              rowKey="id"
              pagination={false}
              dataSource={pendingRows}
              locale={{ emptyText: '暂无待审' }}
              columns={[
                { title: '申请号', dataIndex: 'id', width: 90 },
                { title: '达人', dataIndex: 'creatorName' },
                { title: '金额', render: (_, r) => money(r.amount) },
                {
                  title: '',
                  width: 80,
                  render: () => (
                    <Button type="link" size="small" onClick={() => history.push('/finance/approvals')}>
                      去审
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={card}>
            <Text type="secondary">已通过 · 待标记已付</Text>
            <Table
              size="small"
              style={{ marginTop: 12 }}
              rowKey="id"
              pagination={false}
              dataSource={approvedRows}
              locale={{ emptyText: '暂无' }}
              columns={[
                { title: '申请号', dataIndex: 'id', width: 90 },
                { title: '达人', dataIndex: 'creatorName' },
                { title: '金额', render: (_, r) => money(r.amount) },
                {
                  title: '',
                  width: 90,
                  render: () => (
                    <Button type="link" size="small" onClick={() => history.push('/finance/approvals')}>
                      标记已付
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </Col>
        <Col span={24}>
          <div style={card}>
            <Text type="secondary">未结清合作（合作应付 − 已付）</Text>
            <Table
              size="small"
              style={{ marginTop: 12 }}
              rowKey="id"
              pagination={false}
              dataSource={unpaid}
              locale={{ emptyText: '全部结清' }}
              columns={[
                { title: '达人', dataIndex: 'creatorName' },
                { title: '项目', dataIndex: 'campaign' },
                { title: '合作应付', render: (_, r) => money(r.total) },
                { title: '已付', render: (_, r) => money(r.paid) },
                { title: '剩余', render: (_, r) => money(r.remain) },
              ]}
            />
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
}

/** 商务 / 运营 / 老板：项目与经营视角 */
function OpsBoard() {
  const role = getPrototypeRole();
  const { campaigns, cooperations, payments } = useMockStore();

  const camps = useMemo(
    () => campaignsForRole(campaigns, role, cooperations, payments),
    [campaigns, cooperations, payments, role],
  );
  const coops = useMemo(
    () => cooperationsForRole(cooperations, campaigns, role, payments),
    [campaigns, cooperations, payments, role],
  );
  const pays = useMemo(
    () => paymentsForRole(payments, role, campaigns),
    [campaigns, payments, role],
  );

  const cost = coops.reduce((s, c) => s + c.creatorTotal, 0);
  const quote = coops.reduce((s, c) => s + c.clientQuote, 0);
  const paid = pays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const isBoss = role === 'executive' || role === 'architecture';

  const monthTrend = useMemo(() => {
    const months = Array.from(new Set(camps.map((c) => c.settlementMonth).filter(Boolean))).sort();
    if (!months.length) return null;
    const costArr = months.map((m) =>
      coops
        .filter((c) => camps.find((x) => x.id === c.campaignId)?.settlementMonth === m)
        .reduce((s, c) => s + c.creatorTotal, 0),
    );
    const paidArr = months.map((m) =>
      pays
        .filter(
          (p) =>
            p.status === 'paid' &&
            camps.find((x) => x.id === p.campaignId)?.settlementMonth === m,
        )
        .reduce((s, p) => s + p.amount, 0),
    );
    return baseChartOption({
      legend: { data: ['合作成本', '已付'] },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        { name: '合作成本', type: 'bar', data: costArr, itemStyle: { color: CHART_COLORS.primary } },
        { name: '已付', type: 'line', data: paidArr, itemStyle: { color: CHART_COLORS.success } },
      ],
    });
  }, [camps, coops, pays]);

  const costVsTarget = useMemo(() => {
    const rows = camps
      .filter((c) => c.status === 'active')
      .map((c) => ({
        name: c.name.slice(0, 14),
        target: c.targetCost || 0,
        actual: coops.filter((x) => x.campaignId === c.id).reduce((s, x) => s + x.creatorTotal, 0),
      }))
      .slice(0, 8);
    if (!rows.length) return null;
    return baseChartOption({
      legend: { data: ['内部目标', '实际成本'] },
      xAxis: { type: 'category', data: rows.map((r) => r.name), axisLabel: { rotate: 18 } },
      yAxis: { type: 'value' },
      series: [
        { name: '内部目标', type: 'bar', data: rows.map((r) => r.target), itemStyle: { color: CHART_COLORS.muted } },
        { name: '实际成本', type: 'bar', data: rows.map((r) => r.actual), itemStyle: { color: CHART_COLORS.warning } },
      ],
    });
  }, [camps, coops]);

  const contrib = useMemo(() => {
    if (!isBoss && role !== 'business') return null;
    const map: Record<string, number> = {};
    coops.forEach((c) => {
      map[c.operator] = (map[c.operator] || 0) + c.creatorTotal;
    });
    const keys = Object.keys(map);
    if (!keys.length) return null;
    return baseChartOption({
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: keys },
      series: [{ type: 'bar', data: keys.map((k) => map[k]), itemStyle: { color: CHART_COLORS.primary } }],
    });
  }, [coops, isBoss, role]);

  const overRows = camps
    .map((c) => {
      const actual = coops
        .filter((x) => x.campaignId === c.id)
        .reduce((s, x) => s + x.creatorTotal, 0);
      return {
        id: c.id,
        name: c.name,
        target: c.targetCost || 0,
        actual,
        over: (c.targetCost || 0) > 0 && actual > (c.targetCost || 0),
      };
    })
    .filter((r) => r.over);

  const title =
    role === 'business' ? '商务看板' : role === 'operator' || role === 'owner' ? '运营看板' : '经营看板';

  return (
    <PageContainer title={title} subTitle="项目成本、报价与目标对比（按当前身份过滤数据）">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <div style={card}><Statistic title="合作成本" value={cost} prefix="$" /></div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}><Statistic title="已付" value={paid} prefix="$" /></div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}><Statistic title="预计利润" value={quote - cost} prefix="$" /></div>
        </Col>
        <Col xs={12} md={6}>
          <div style={card}><Statistic title="项目数" value={camps.length} /></div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={14}>
          <div style={card}>
            <Text type="secondary">结算月：合作成本 / 已付</Text>
            {monthTrend ? <DemoChart option={monthTrend} height={280} /> : <Text type="secondary">暂无数据</Text>}
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div style={card}>
            <Text type="secondary">项目成本 vs 内部目标</Text>
            {costVsTarget ? (
              <DemoChart option={costVsTarget} height={280} />
            ) : (
              <Text type="secondary">暂无数据</Text>
            )}
          </div>
        </Col>
        {contrib && (
          <Col xs={24} lg={12}>
            <div style={card}>
              <Text type="secondary">运营贡献（合作成本）</Text>
              <DemoChart option={contrib} height={260} />
            </div>
          </Col>
        )}
        <Col xs={24} lg={contrib ? 12 : 24}>
          <div style={card}>
            <Text type="secondary">超内部目标成本项目</Text>
            <Table
              size="small"
              style={{ marginTop: 12 }}
              rowKey="id"
              pagination={false}
              dataSource={overRows}
              locale={{ emptyText: '无' }}
              columns={[
                { title: '项目', dataIndex: 'name' },
                { title: '目标', render: (_, r) => money(r.target) },
                { title: '实际', render: (_, r) => money(r.actual) },
              ]}
            />
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
}

export default function AnalyticsPage() {
  const role = getPrototypeRole();
  if (role === 'finance') return <FinanceBoard />;
  return <OpsBoard />;
}
