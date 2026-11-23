import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Select, TreeSelect } from 'antd';
import { useEffect, useMemo } from 'react';
import { useMenuTreeData } from '../../hooks/useMenuTreeData';
import { useDeptTree } from '../../hooks/useDeptTree';
import { DATA_SCOPE, type SysRole } from '../../types';
import { STATUS } from '@/shared/constants/status';

type Props = {
  open: boolean;
  editing?: SysRole | null;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
};

export function RoleFormModal({ open, editing, confirmLoading, onCancel, onSubmit }: Props) {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const [form] = Form.useForm();
  const { tree: menuTree } = useMenuTreeData(open);
  const { tree: deptTree } = useDeptTree({ enabled: open, enabledOnly: true });
  const dataScope = Form.useWatch('dataScope', form);

  const menuTreeData = useMemo(() => menuTree, [menuTree]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        code: editing.code,
        sort: editing.sort,
        status: editing.status,
        type: editing.type,
        dataScope: editing.dataScope,
        remark: editing.remark,
        menuIds: editing.menuIds || [],
        dataScopeDeptIds: editing.dataScopeDeptIds || [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: STATUS.ENABLE,
        type: 2,
        dataScope: DATA_SCOPE.ALL,
        sort: 0,
        menuIds: [],
        dataScopeDeptIds: [],
      });
    }
  }, [open, editing, form]);

  return (
    <Modal
      title={editing ? fm('system.role.edit') : fm('system.role.create')}
      open={open}
      width={640}
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
        <Form.Item name="name" label={fm('system.role.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label={fm('system.role.code')} rules={[{ required: true }]}>
          <Input disabled={editing?.type === 1} placeholder={fm('system.role.codePlaceholder')} />
        </Form.Item>
        <Form.Item name="sort" label={fm('common.sort')}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="status" label={fm('common.status')} rules={[{ required: true }]}>
          <Select
            options={[
              { label: fm('common.enabled'), value: STATUS.ENABLE },
              { label: fm('common.disabled'), value: STATUS.DISABLE },
            ]}
          />
        </Form.Item>
        <Form.Item name="dataScope" label={fm('system.role.dataScope')} rules={[{ required: true }]}>
          <Select
            options={[
              { label: fm('system.role.scopeAll'), value: DATA_SCOPE.ALL },
              { label: fm('system.role.scopeCustom'), value: DATA_SCOPE.CUSTOM },
              { label: fm('system.role.scopeDept'), value: DATA_SCOPE.DEPT },
              { label: fm('system.role.scopeDeptAndChild'), value: DATA_SCOPE.DEPT_AND_CHILD },
              { label: fm('system.role.scopeSelf'), value: DATA_SCOPE.SELF },
            ]}
          />
        </Form.Item>
        {dataScope === DATA_SCOPE.CUSTOM && (
          <Form.Item name="dataScopeDeptIds" label={fm('system.role.customDepts')}>
            <TreeSelect
              treeCheckable
              treeData={deptTree as any}
              fieldNames={{ label: 'name', value: 'id', children: 'children' }}
              treeNodeLabelProp="pathName"
              placeholder={fm('system.user.selectDept')}
            />
          </Form.Item>
        )}
        <Form.Item name="menuIds" label={fm('system.role.menuPerms')}>
          <TreeSelect
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_ALL}
            treeData={menuTreeData}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
            placeholder={fm('system.role.selectMenus')}
          />
        </Form.Item>
        <Form.Item name="remark" label={fm('common.remark')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="type" hidden>
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
}
