import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space } from 'antd';
import { useRef, useState } from 'react';
import { RoleFormModal } from '@/domains/iam/components/RoleFormModal';
import { roleService } from '@/domains/iam/services/roleService';
import {
  dataScopeValueEnum,
  roleTypeValueEnum,
  type SysRole,
} from '@/domains/iam/types';
import { Permission } from '@/shared/components/Permission';
import { QueryProTable } from '@/shared/components/QueryProTable';
import { StatusTag } from '@/shared/components/StatusTag';
import { statusValueEnum } from '@/shared/constants/status';
import { useAsyncAction } from '@/shared/hooks/useAsyncAction';
import { useProTableRequest } from '@/shared/hooks/useProTableRequest';

export default function SystemRolePage() {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SysRole | null>(null);
  const { loading, run } = useAsyncAction();

  const request = useProTableRequest<SysRole>(
    (query) => roleService.page(query),
    {
      mapParams: (params) => ({
        name: params.name as string | undefined,
        code: params.code as string | undefined,
        status: params.status as number | undefined,
      }),
    },
  );

  const columns: ProColumns<SysRole>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: fm('common.name'), dataIndex: 'name', ellipsis: true },
    { title: fm('common.code'), dataIndex: 'code', ellipsis: true, width: 140 },
    {
      title: fm('common.type'),
      dataIndex: 'type',
      search: false,
      width: 80,
      valueEnum: roleTypeValueEnum(fm),
    },
    {
      title: fm('system.role.dataScope'),
      dataIndex: 'dataScope',
      search: false,
      width: 120,
      valueEnum: dataScopeValueEnum(fm),
    },
    { title: fm('common.sort'), dataIndex: 'sort', search: false, width: 70 },
    {
      title: fm('common.status'),
      dataIndex: 'status',
      width: 80,
      valueEnum: statusValueEnum(fm),
      render: (_, row) => <StatusTag value={row.status} />,
    },
    {
      title: fm('common.remark'),
      dataIndex: 'remark',
      search: false,
      ellipsis: true,
      width: 160,
      render: (_, row) => row.remark || fm('common.empty'),
    },
    {
      title: fm('common.createdAt'),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: fm('common.actions'),
      valueType: 'option',
      width: 160,
      render: (_, row) => (
        <Space>
          <Permission accessKey="canRoleUpdate">
            <a
              onClick={async () => {
                try {
                  setEditing(await roleService.get(row.id));
                  setOpen(true);
                } catch {
                  /* 无权限时 apiRequest 已提示 */
                }
              }}
            >
              {fm('common.edit')}
            </a>
          </Permission>
          <Permission accessKey="canRoleDelete">
            <a
              onClick={() => {
                Modal.confirm({
                  title: fm('system.role.deleteConfirm'),
                  onOk: async () => {
                    if (!(await run(() => roleService.remove(row.id), fm('common.deleted')))) return;
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
      <QueryProTable<SysRole>
        headerTitle={fm('system.role.title')}
        actionRef={actionRef}
        columns={columns}
        scroll={{ x: 1100 }}
        request={request}
        toolBarRender={() => [
          <Permission key="add" accessKey="canRoleCreate">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {fm('system.role.create')}
            </Button>
          </Permission>,
        ]}
      />
      <RoleFormModal
        open={open}
        editing={editing}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          if (
            !(await run(async () => {
              if (editing) await roleService.update({ id: editing.id, ...values });
              else await roleService.create(values);
            }, fm('common.saved')))
          ) {
            return;
          }
          setOpen(false);
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
}
