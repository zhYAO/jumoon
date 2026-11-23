import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Select, TreeSelect } from 'antd';
import { useEffect } from 'react';
import { useDeptTree } from '../../hooks/useDeptTree';
import type { SysDept } from '../../types';
import { STATUS } from '@/shared/constants/status';

type Props = {
  open: boolean;
  editing?: SysDept | null;
  parentId?: number;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
};

export function DeptFormModal({
  open,
  editing,
  parentId = 0,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const [form] = Form.useForm();
  const { tree } = useDeptTree({ enabled: open, enabledOnly: true });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(editing);
    } else {
      form.resetFields();
      form.setFieldsValue({ parentId, status: STATUS.ENABLE, sort: 0 });
    }
  }, [open, editing, parentId, form]);

  const rootLabel = fm('system.dept.root');

  return (
    <Modal
      title={editing ? fm('system.dept.edit') : fm('system.dept.createTitle')}
      open={open}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onOk={async () => {
        try {
          const values = await form.validateFields();
          await onSubmit(values);
        } catch {
          /* 校验失败由表单项提示；接口失败已 toast，避免未捕获红屏 */
        }
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="parentId" label={fm('system.dept.parent')}>
          <TreeSelect
            allowClear
            treeData={[{ id: 0, name: rootLabel, pathName: rootLabel, children: tree }]}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
            treeNodeLabelProp="pathName"
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item name="name" label={fm('system.dept.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="sort" label={fm('common.sort')}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label={fm('common.status')}>
          <Select
            options={[
              { label: fm('common.enabled'), value: STATUS.ENABLE },
              { label: fm('common.disabled'), value: STATUS.DISABLE },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
