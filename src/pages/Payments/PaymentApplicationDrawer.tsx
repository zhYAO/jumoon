import { Button, Drawer, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { useEffect, useMemo } from 'react';
import { indexCooperationPayments } from '@/domains/product/coopPayProgress';
import { addPayment, useMockStore } from '@/domains/product/mockStore';
import type { PaymentType, PrototypeCooperation } from '@/domains/product/mockTypes';
import { cooperationsForPaymentApplication } from '@/domains/product/permissions';
import type { PrototypeRole } from '@/domains/product/prototypeNavigation';
import { PAYMENT_TYPE_OPTIONS } from './paymentViews';

type PaymentApplication = {
  cooperationId: string;
  paymentType: PaymentType;
  amount: number;
  payoutMethod: string;
  internalPayer: string;
  payoutAccount: string;
};

type Props = {
  role: PrototypeRole;
  open: boolean;
  requestedCoopId: string | null;
  onClose: () => void;
};

export function PaymentApplicationDrawer({ role, open, requestedCoopId, onClose }: Props) {
  const [form] = Form.useForm<PaymentApplication>();
  const { campaigns, cooperations, payments, creators } = useMockStore();
  const eligibleCooperations = useMemo(
    () => cooperationsForPaymentApplication(cooperations, campaigns, role),
    [cooperations, campaigns, role],
  );
  const paymentSummary = useMemo(() => indexCooperationPayments(payments), [payments]);

  function payoutFields(coop: PrototypeCooperation) {
    const creator = creators.find((c) => c.id === coop.creatorId);
    return {
      amount: paymentSummary(coop).remain,
      payoutMethod: creator?.payoutMethod || 'PayPal',
      payoutAccount: creator?.payoutAccount,
    };
  }

  const requestedCoop = eligibleCooperations.find((coop) => coop.id === requestedCoopId);
  const initialValues = requestedCoop && {
    ...payoutFields(requestedCoop),
    amount: paymentSummary(requestedCoop).remain || undefined,
    cooperationId: requestedCoop.id,
    paymentType: requestedCoop.paymentMode === 'full' ? 'full' : 'deposit',
    internalPayer: '美国财务',
  };

  useEffect(() => {
    if (requestedCoopId && !requestedCoop) {
      message.warning('该合作不存在或无权申请付款');
      onClose();
    }
  }, [requestedCoopId, requestedCoop, onClose]);

  function submitApply(values: PaymentApplication) {
    const coop = eligibleCooperations.find((c) => c.id === values.cooperationId);
    if (!coop) return message.error('请选择可申请付款的合作');
    const { remain } = paymentSummary(coop);
    if (!Number.isFinite(values.amount) || values.amount <= 0 || values.amount > remain) {
      return message.error(`金额须在 0 ~ ${remain} 之间`);
    }
    addPayment({
      cooperationId: coop.id,
      campaignId: coop.campaignId,
      creatorId: coop.creatorId,
      creatorName: coop.creatorName,
      operator: coop.operator,
      paymentType: values.paymentType,
      amount: Number(values.amount),
      currency: coop.currency,
      clientQuote: coop.clientQuote,
      payoutMethod: values.payoutMethod,
      internalPayer: values.internalPayer,
      payoutAccount: values.payoutAccount || '',
      status: 'pending',
    });
    message.success('付款申请已提交');
    form.resetFields();
    onClose();
  }

  return (
    <Drawer
      title="发起付款申请"
      open={open && (!requestedCoopId || Boolean(requestedCoop))}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={() => form.submit()}>
            提交
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={submitApply}>
        <Form.Item name="cooperationId" label="合作" rules={[{ required: true }]}>
          <Select
            options={eligibleCooperations.map((c) => ({
              value: c.id,
              label: `${c.id} · ${c.creatorName} · 剩余 ${paymentSummary(c).remain}`,
            }))}
            onChange={(id) => {
              const coop = eligibleCooperations.find((c) => c.id === id);
              if (coop) form.setFieldsValue(payoutFields(coop));
            }}
          />
        </Form.Item>
        <Form.Item name="paymentType" label="付款类型" rules={[{ required: true }]}>
          <Select options={PAYMENT_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="amount" label="本次金额" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} addonBefore="$" />
        </Form.Item>
        <Form.Item name="payoutMethod" label="付款渠道" rules={[{ required: true }]}>
          <Select
            options={['PayPal', 'Wise', 'Bank', 'Zelle'].map((v) => ({ value: v, label: v }))}
          />
        </Form.Item>
        <Form.Item name="internalPayer" label="内部付款人" rules={[{ required: true }]}>
          <Select options={['美国财务', '冰姐', '国内财务'].map((v) => ({ value: v, label: v }))} />
        </Form.Item>
        <Form.Item name="payoutAccount" label="达人收款账号" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
