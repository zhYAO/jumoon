import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { Button, Modal, Space } from 'antd';
import { useRef, useState } from 'react';
import { Permission } from '@/shared/components/Permission';
import { StatusTag } from '@/shared/components/StatusTag';
import { useAsyncAction } from '@/shared/hooks/useAsyncAction';
import { MenuFormModal } from '@/domains/iam/components/MenuFormModal';
import { menuService } from '@/domains/iam/services/menuService';
import { MENU_TYPE, type SysMenu } from '@/domains/iam/types';
import { renderMenuIcon } from '@/shared/icons/renderMenuIcon';
import { listToTree } from '@/shared/utils/tree';

export default function SystemMenuPage() {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const actionRef = useRef<ActionType>();
  const { refresh: refreshInitialState } = useModel('@@initialState');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SysMenu | null>(null);
  const [parentId, setParentId] = useState(0);
  const { loading, run } = useAsyncAction();

  const columns: ProColumns<SysMenu>[] = [
    { title: fm('common.name'), dataIndex: 'name', width: 180 },
    {
      title: fm('system.menu.icon'),
      dataIndex: 'icon',
      width: 70,
      search: false,
      render: (_, row) => renderMenuIcon(row.icon, { style: { fontSize: 16 } }) || '-',
    },
    {
      title: fm('common.type'),
      dataIndex: 'type',
      width: 80,
      valueEnum: {
        [MENU_TYPE.DIR]: { text: fm('system.menu.dir') },
        [MENU_TYPE.MENU]: { text: fm('system.menu.menu') },
        [MENU_TYPE.BUTTON]: { text: fm('system.menu.button') },
      },
    },
    { title: fm('system.menu.permission'), dataIndex: 'permission', ellipsis: true },
    { title: fm('system.menu.path'), dataIndex: 'path', search: false },
    { title: fm('common.sort'), dataIndex: 'sort', width: 70, search: false },
    {
      title: fm('common.status'),
      dataIndex: 'status',
      width: 80,
      render: (_, row) => <StatusTag value={row.status} />,
    },
    {
      title: fm('common.actions'),
      valueType: 'option',
      width: 200,
      render: (_, row) => (
        <Space>
          <Permission accessKey="canMenuCreate">
            <a
              onClick={() => {
                setEditing(null);
                setParentId(row.id);
                setOpen(true);
              }}
            >
              {fm('system.menu.addChild')}
            </a>
          </Permission>
          <Permission accessKey="canMenuUpdate">
            <a
              onClick={() => {
                setEditing(row);
                setOpen(true);
              }}
            >
              {fm('common.edit')}
            </a>
          </Permission>
          <Permission accessKey="canMenuDelete">
            <a
              onClick={() => {
                Modal.confirm({
                  title: fm('system.menu.deleteConfirm'),
                  onOk: async () => {
                    if (!(await run(() => menuService.remove(row.id), fm('common.deleted')))) return;
                    actionRef.current?.reload();
                  },
                });
              }}
            >
              {fm('common.delete')}
            </a>
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<SysMenu>
        headerTitle={fm('system.menu.title')}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={false}
        columns={columns}
        request={async () => {
          try {
            const list = await menuService.list();
            const tree = listToTree(list);
            return { data: tree as any, success: true };
          } catch {
            return { data: [], success: false };
          }
        }}
        toolBarRender={() => [
          <Permission key="add" accessKey="canMenuCreate">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setParentId(0);
                setOpen(true);
              }}
            >
              {fm('system.menu.create')}
            </Button>
          </Permission>,
        ]}
      />
      <MenuFormModal
        open={open}
        editing={editing}
        parentId={parentId}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          if (
            !(await run(async () => {
              if (editing) await menuService.update({ id: editing.id, ...values });
              else await menuService.create(values);
            }, fm('common.saved')))
          ) {
            return;
          }
          setOpen(false);
          actionRef.current?.reload();
          try {
            await refreshInitialState?.();
          } catch {
            /* 菜单已保存；权限刷新失败不挡操作 */
          }
        }}
      />
    </PageContainer>
  );
}
