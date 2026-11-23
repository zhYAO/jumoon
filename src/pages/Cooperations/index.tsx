import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  COOP_PAY_PROGRESS_LABEL,
  indexCooperationPayments,
  type CoopPayProgress,
} from '@/domains/product/coopPayProgress';
import { buildCampaignRecordList } from '@/domains/product/campaignRecordList';
import { ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import type { CoopLine, PrototypeCooperation } from '@/domains/product/mockTypes';
import { addCooperation, useMockStore } from '@/domains/product/mockStore';
import {
  campaignsForRole,
  canCreateCooperation,
  canExecCampaign,
  cooperationsForPaymentApplication,
  cooperationsForRole,
} from '@/domains/product/permissions';
import { canRoleSeeModule, getPrototypeRole } from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Text } = Typography;

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X'].map((v) => ({ value: v, label: v }));

function money(v?: number) {
  return v == null ? '-' : `$ ${v.toLocaleString('en-US')}`;
}

type CoopRow = PrototypeCooperation & {
  campaignName: string;
  brand: string;
  payProgress: CoopPayProgress;
  remain: number;
};

export default function CooperationsPage() {
  const role = getPrototypeRole();
  const me = ROLE_CURRENT_USER[role];
  const { campaigns, creators, cooperations, payments } = useMockStore();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [lines, setLines] = useState<CoopLine[]>([
    { key: '1', platform: 'TikTok', qty: 1, creatorAmt: 0, clientQuote: 0 },
  ]);
  const [filters, setFilters] = useState({
    keyword: '',
    campaignId: 'all',
    brand: 'all',
    operator: 'all',
    creatorId: 'all',
    payProgress: 'all' as 'all' | CoopPayProgress,
    paymentMode: 'all' as 'all' | 'full' | 'deposit_balance',
  });

  const showMoney = role !== 'operator' && role !== 'owner';
  /** 运营本人默认只看自己的，不需要「运营」筛；Owner/老板/商务要按人拆 */
  const showOperatorFilter = role !== 'operator';

  useEffect(() => {
    if (!canRoleSeeModule(role, '/cooperations')) {
      history.replace('/home');
    }
  }, [role]);

  const visibleCampaigns = useMemo(
    () =>
      campaignsForRole(campaigns, role, cooperations, payments).filter((c) => c.status === 'active'),
    [campaigns, cooperations, payments, role],
  );

  const list = useMemo(
    () => cooperationsForRole(cooperations, campaigns, role, payments),
    [campaigns, cooperations, payments, role],
  );

  const paymentSummary = useMemo(() => indexCooperationPayments(payments), [payments]);
  const payableCoopIds = useMemo(
    () => new Set(cooperationsForPaymentApplication(cooperations, campaigns, role).map((c) => c.id)),
    [cooperations, campaigns, role],
  );
  const { rows: campaignRows, campaignOptions, brandOptions, operatorOptions, creatorOptions } = useMemo(
    () => buildCampaignRecordList(list, campaigns),
    [list, campaigns],
  );
  const rows: CoopRow[] = useMemo(
    () => campaignRows.map((coop) => ({ ...coop, ...paymentSummary(coop) })),
    [campaignRows, paymentSummary],
  );

  const filteredRows = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.campaignId !== 'all' && r.campaignId !== filters.campaignId) return false;
      if (filters.brand !== 'all' && r.brand !== filters.brand) return false;
      if (filters.operator !== 'all' && r.operator !== filters.operator) return false;
      if (filters.creatorId !== 'all' && r.creatorId !== filters.creatorId) return false;
      if (filters.payProgress !== 'all' && r.payProgress !== filters.payProgress) return false;
      if (filters.paymentMode !== 'all' && r.paymentMode !== filters.paymentMode) return false;
      if (kw) {
        const hay = `${r.id} ${r.campaignName} ${r.brand} ${r.creatorName} ${r.operator}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const canCreate = canCreateCooperation(role);

  const onSubmit = async () => {
    const v = await form.validateFields();
    const camp = visibleCampaigns.find((c) => c.id === v.campaignId);
    if (!canCreate || !camp || !canExecCampaign(role, camp)) {
      message.error('无权在该 Campaign 下建合作，或项目未发布');
      return;
    }
    const creator = creators.find((c) => c.id === v.creatorId);
    if (!creator) return message.error('请选择达人');
    if (cooperations.some((c) => c.campaignId === v.campaignId && c.creatorId === v.creatorId)) {
      return message.error('该达人已在本项目有合作');
    }
    const validLines = lines.filter((l) => l.qty > 0);
    const creatorTotal = validLines.reduce((s, l) => s + Number(l.creatorAmt || 0), 0);
    const clientQuote = validLines.reduce((s, l) => s + Number(l.clientQuote || 0), 0);
    if (!creatorTotal) return message.error('请填写合作金额');
    addCooperation({
      campaignId: v.campaignId,
      creatorId: creator.id,
      creatorName: creator.name,
      country: creator.country,
      operator: me,
      currency: camp.currency || 'USD',
      paymentMode: v.paymentMode,
      depositAmount: v.paymentMode === 'deposit_balance' ? Number(v.depositAmount || 0) : 0,
      creatorTotal,
      clientQuote,
      lines: validLines,
    });
    message.success('合作已建立，已计入项目当前成本');
    setOpen(false);
    form.resetFields();
    setLines([{ key: String(Date.now()), platform: 'TikTok', qty: 1, creatorAmt: 0, clientQuote: 0 }]);
  };

  const progressTag = (p: CoopPayProgress) => {
    const color = p === 'settled' ? 'success' : p === 'partial' ? 'processing' : 'default';
    return <Tag color={color}>{COOP_PAY_PROGRESS_LABEL[p]}</Tag>;
  };

  return (
    <PageContainer
      title="合作管理"
      subTitle="确认合作 → 计入项目当前成本 · 付款进度从申请单汇总"
      extra={
        canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新建合作
          </Button>
        ) : null
      }
    >
      <div className={styles.filterBar}>
        <Input
          allowClear
          placeholder="搜 ID / 项目 / 达人 / 运营"
          style={{ width: 220 }}
          value={filters.keyword}
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
        />
        <Select
          style={{ width: 200 }}
          value={filters.campaignId}
          onChange={(v) => setFilters((f) => ({ ...f, campaignId: v }))}
          options={[{ value: 'all', label: '全部项目' }, ...campaignOptions]}
        />
        {showMoney && (
          <Select
            style={{ width: 140 }}
            value={filters.brand}
            onChange={(v) => setFilters((f) => ({ ...f, brand: v }))}
            options={[{ value: 'all', label: '全部品牌' }, ...brandOptions]}
          />
        )}
        {showOperatorFilter && (
          <Select
            style={{ width: 120 }}
            value={filters.operator}
            onChange={(v) => setFilters((f) => ({ ...f, operator: v }))}
            options={[{ value: 'all', label: '全部运营' }, ...operatorOptions]}
          />
        )}
        <Select
          style={{ width: 140 }}
          value={filters.creatorId}
          onChange={(v) => setFilters((f) => ({ ...f, creatorId: v }))}
          options={[{ value: 'all', label: '全部达人' }, ...creatorOptions]}
        />
        <Select
          style={{ width: 120 }}
          value={filters.payProgress}
          onChange={(v) => setFilters((f) => ({ ...f, payProgress: v }))}
          options={[
            { value: 'all', label: '全部进度' },
            { value: 'none', label: '未申请' },
            { value: 'partial', label: '部分付' },
            { value: 'settled', label: '已结清' },
          ]}
        />
        <Select
          style={{ width: 130 }}
          value={filters.paymentMode}
          onChange={(v) => setFilters((f) => ({ ...f, paymentMode: v }))}
          options={[
            { value: 'all', label: '全部付款方式' },
            { value: 'full', label: '全款' },
            { value: 'deposit_balance', label: '订金+尾款' },
          ]}
        />
        <Button
          onClick={() =>
            setFilters({
              keyword: '',
              campaignId: 'all',
              brand: 'all',
              operator: 'all',
              creatorId: 'all',
              payProgress: 'all',
              paymentMode: 'all',
            })
          }
        >
          重置
        </Button>
      </div>

      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        当前 {filteredRows.length} 条
        {role === 'operator' || role === 'owner' ? '（仅自己相关合作）' : ''}
      </Text>

      <Table<CoopRow>
        rowKey="id"
        dataSource={filteredRows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 120 },
          {
            title: '项目',
            key: 'campaign',
            render: (_, r) => (
              <div className={styles.cellStack}>
                <strong>{r.campaignName}</strong>
                {r.brand ? <span>{r.brand}</span> : null}
              </div>
            ),
          },
          { title: '达人', dataIndex: 'creatorName', width: 120 },
          { title: '运营', dataIndex: 'operator', width: 90 },
          {
            title: '合作额',
            width: 110,
            render: (_, r) => money(r.creatorTotal),
          },
          ...(showMoney
            ? [
                {
                  title: '品牌报价',
                  width: 110,
                  render: (_: unknown, r: CoopRow) => money(r.clientQuote),
                },
              ]
            : []),
          {
            title: '付款进度',
            width: 160,
            render: (_, r) => (
              <div className={styles.cellStack}>
                {progressTag(r.payProgress)}
                {r.payProgress !== 'settled' && r.remain > 0 ? (
                  <span>可付 {money(r.remain)}</span>
                ) : null}
              </div>
            ),
          },
          {
            title: '操作',
            width: 120,
            fixed: 'right' as const,
            render: (_, r) =>
              r.payProgress === 'settled' ? (
                <Text type="secondary">已结清</Text>
              ) : payableCoopIds.has(r.id) ? (
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => history.push(`/finance/payment-requests?coop=${r.id}`)}
                >
                  申请付款
                </Button>
              ) : null,
          },
        ]}
      />

      <Drawer
        title="新建合作"
        width={720}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={onSubmit}>
              确认合作
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ paymentMode: 'full' }}>
          <Form.Item name="campaignId" label="项目 Campaign" rules={[{ required: true }]}>
            <Select
              options={visibleCampaigns.map((c) => ({
                value: c.id,
                label: `${c.name}（${c.id}）`,
              }))}
              placeholder="仅可选已发布且可见的项目"
            />
          </Form.Item>
          <Form.Item name="creatorId" label="达人" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={creators.map((c) => ({
                value: c.id,
                label: `${c.name} · ${c.country}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="paymentMode" label="付款模式" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="full">全款</Radio>
              <Radio value="deposit_balance">订金+尾款</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.paymentMode !== b.paymentMode}>
            {() =>
              form.getFieldValue('paymentMode') === 'deposit_balance' ? (
                <Form.Item name="depositAmount" label="订金金额" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: '100%' }} addonBefore="$" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <strong>合作明细</strong>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() =>
              setLines((p) => [
                ...p,
                {
                  key: String(Date.now()),
                  platform: 'TikTok',
                  qty: 1,
                  creatorAmt: 0,
                  clientQuote: 0,
                },
              ])
            }
          >
            加一行
          </Button>
        </div>
        {lines.map((line, idx) => (
          <Row gutter={8} key={line.key} style={{ marginBottom: 8 }}>
            <Col span={6}>
              <Select
                value={line.platform}
                options={PLATFORMS}
                style={{ width: '100%' }}
                onChange={(v) =>
                  setLines((p) => p.map((l, i) => (i === idx ? { ...l, platform: v } : l)))
                }
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={1}
                value={line.qty}
                style={{ width: '100%' }}
                onChange={(v) =>
                  setLines((p) => p.map((l, i) => (i === idx ? { ...l, qty: Number(v || 1) } : l)))
                }
              />
            </Col>
            <Col span={6}>
              <InputNumber
                min={0}
                value={line.creatorAmt}
                addonBefore="$"
                style={{ width: '100%' }}
                placeholder="达人金额"
                onChange={(v) =>
                  setLines((p) =>
                    p.map((l, i) => (i === idx ? { ...l, creatorAmt: Number(v || 0) } : l)),
                  )
                }
              />
            </Col>
            <Col span={6}>
              <InputNumber
                min={0}
                value={line.clientQuote}
                addonBefore="$"
                style={{ width: '100%' }}
                placeholder="品牌报价"
                onChange={(v) =>
                  setLines((p) =>
                    p.map((l, i) => (i === idx ? { ...l, clientQuote: Number(v || 0) } : l)),
                  )
                }
              />
            </Col>
            <Col span={2}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={lines.length <= 1}
                onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
              />
            </Col>
          </Row>
        ))}
      </Drawer>
    </PageContainer>
  );
}
