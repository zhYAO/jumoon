import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Select, TreeSelect } from 'antd';
import { useEffect } from 'react';
import { useRoleOptions } from '../../hooks/useRoleOptions';
import { useDeptTree } from '../../hooks/useDeptTree';
import { STATUS } from '@/shared/constants/status';
import type { SysUser } from '../../types';

type Props = {
  open: boolean;
  editing?: SysUser | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
};

export function UserFormModal({ open, editing, confirmLoading, onCancel, onSubmit }: Props) {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const [form] = Form.useForm();
  const { options: roleOptions } = useRoleOptions(open);
  const { tree: deptTree } = useDeptTree({ enabled: open, enabledOnly: true });
  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        email: editing.email,
        nickname: editing.nickname,
        username: editing.username,
        mobile: editing.mobile,
        deptId: editing.deptId,
        status: editing.status,
        remark: editing.remark,
        roleIds: editing.roleIds || [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: STATUS.ENABLE, roleIds: [] });
    }
  }, [open, editing, form]);

  return (
    <Modal
      title={isEdit ? fm('system.user.edit') : fm('system.user.create')}
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
        <Form.Item
          name="email"
          label={fm('system.user.email')}
          rules={[{ required: true, type: 'email', message: fm('system.user.emailRequired') }]}
        >
          <Input placeholder={fm('system.user.emailPlaceholder')} disabled={isEdit} />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="password"
            label={fm('system.user.initPassword')}
            rules={[{ required: true, min: 6, message: fm('system.user.passwordMinRule') }]}
          >
            <Input.Password placeholder={fm('system.user.initPassword')} />
          </Form.Item>
        )}
        <Form.Item
          name="nickname"
          label={fm('system.user.nickname')}
          rules={[{ required: true, message: fm('system.user.nicknameRequired') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="deptId" label={fm('system.user.dept')}>
          <TreeSelect
            allowClear
            treeData={deptTree as any}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
            treeNodeLabelProp="pathName"
            treeDefaultExpandAll
            placeholder={fm('system.user.selectDept')}
          />
        </Form.Item>
        <Form.Item name="roleIds" label={fm('system.user.roles')}>
          <Select mode="multiple" options={roleOptions} placeholder={fm('system.user.selectRoles')} />
        </Form.Item>
        <Form.Item name="status" label={fm('common.status')} rules={[{ required: true }]}>
          <Select
            options={[
              { label: fm('common.enabled'), value: STATUS.ENABLE },
              { label: fm('common.disabled'), value: STATUS.DISABLE },
            ]}
          />
        </Form.Item>
        <Form.Item name="remark" label={fm('common.remark')}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
