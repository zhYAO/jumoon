import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { history } from '@umijs/max';
import { ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import { addCreator, useMockStore } from '@/domains/product/mockStore';
import {
  canSeePayoutAccount,
  creatorsForRole,
  maskAccount,
} from '@/domains/product/permissions';
import { canRoleSeeModule, getPrototypeRole } from '@/domains/product/prototypeNavigation';

const PAYOUT_OPTS = ['PayPal', 'Wise', 'Bank', 'Zelle'].map((v) => ({ value: v, label: v }));
const COUNTRY_OPTS = ['美国', '加拿大', '英国', '日本', '韩国', '其他'].map((v) => ({
  value: v,
  label: v,
}));

export default function CreatorsPage() {
  const role = getPrototypeRole();
  const me = ROLE_CURRENT_USER[role];
  const { creators } = useMockStore();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const list = useMemo(() => creatorsForRole(creators, role), [creators, role]);
  const canCreate = ['operator', 'owner', 'business', 'executive', 'architecture'].includes(role);

  useEffect(() => {
    if (!canRoleSeeModule(role, '/creators')) {
      history.replace('/home');
    }
  }, [role]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    addCreator({
      name: v.name.trim(),
      country: v.country,
      account: v.account.trim(),
      email: v.email,
      payoutMethod: v.payoutMethod,
      payoutAccount: v.payoutAccount,
      createdBy: me,
    });
    message.success('达人已保存');
    setOpen(false);
    form.resetFields();
  };

  return (
    <PageContainer
      title="Creator 达人库"
      subTitle="一期最小档案"
      extra={
        canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新建达人
          </Button>
        ) : null
      }
    >
      <Table
        rowKey="id"
        dataSource={list}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 130 },
          { title: '姓名', dataIndex: 'name' },
          { title: '国家', dataIndex: 'country', width: 90 },
          { title: '平台账号', dataIndex: 'account' },
          { title: '邮箱', dataIndex: 'email', render: (v) => v || '-' },
          { title: '付款方式', dataIndex: 'payoutMethod', width: 100, render: (v) => v || '-' },
          {
            title: '付款账号',
            dataIndex: 'payoutAccount',
            render: (v, r) =>
              canSeePayoutAccount(role, r.createdBy) ? v || '-' : maskAccount(v),
          },
        ]}
      />

      <Drawer
        title="新建达人"
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={onSubmit}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label="国家" rules={[{ required: true }]}>
            <Select options={COUNTRY_OPTS} />
          </Form.Item>
          <Form.Item name="account" label="平台账号 / 主页" rules={[{ required: true }]}>
            <Input placeholder="tiktok.com/@xxx" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="payoutMethod" label="付款方式">
            <Select allowClear options={PAYOUT_OPTS} />
          </Form.Item>
          <Form.Item name="payoutAccount" label="付款账号">
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  );
}
