import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Select, TreeSelect } from 'antd';
import { useEffect } from 'react';
import { useMenuTreeData } from '../../hooks/useMenuTreeData';
import { MENU_TYPE, type SysMenu } from '../../types';
import { IconPicker } from '@/shared/components/IconPicker';
import { STATUS } from '@/shared/constants/status';
import { resolveMenuIconName } from '@/shared/icons/menuIcons';

type Props = {
  open: boolean;
  editing?: SysMenu | null;
  parentId?: number;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
};

export function MenuFormModal({
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
  const { tree } = useMenuTreeData(open);
  const type = Form.useWatch('type', form);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        ...editing,
        icon: resolveMenuIconName(editing.icon) || undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        parentId,
        type: MENU_TYPE.MENU,
        status: STATUS.ENABLE,
        visible: 1,
        keepAlive: 1,
        alwaysShow: 1,
        sort: 0,
        permission: '',
      });
    }
  }, [open, editing, parentId, form]);

  return (
    <Modal
      title={editing ? fm('system.menu.edit') : fm('system.menu.createTitle')}
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
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="parentId" label={fm('system.menu.parent')}>
          <TreeSelect
            allowClear
            treeData={[{ id: 0, name: fm('system.menu.root'), children: tree }]}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
          />
        </Form.Item>
        <Form.Item name="name" label={fm('common.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label={fm('common.type')} rules={[{ required: true }]}>
          <Select
            options={[
              { label: fm('system.menu.dir'), value: MENU_TYPE.DIR },
              { label: fm('system.menu.menu'), value: MENU_TYPE.MENU },
              { label: fm('system.menu.button'), value: MENU_TYPE.BUTTON },
            ]}
          />
        </Form.Item>
        {type !== MENU_TYPE.BUTTON && (
          <>
            <Form.Item name="path" label={fm('system.menu.path')}>
              <Input placeholder={fm('system.menu.pathPlaceholder')} />
            </Form.Item>
            <Form.Item name="component" label={fm('system.menu.component')}>
              <Input placeholder={fm('system.menu.componentPlaceholder')} />
            </Form.Item>
            <Form.Item name="icon" label={fm('system.menu.icon')}>
              <IconPicker />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="permission"
          label={fm('system.menu.permission')}
          rules={type === MENU_TYPE.BUTTON ? [{ required: true, message: fm('system.menu.buttonPermission') }] : []}
        >
          <Input placeholder={fm('system.menu.permissionPlaceholder')} />
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
