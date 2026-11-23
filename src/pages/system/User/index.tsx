import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import { UserFormModal } from '@/domains/iam/components/UserFormModal';
import { userService } from '@/domains/iam/services/userService';
import type { SysUser } from '@/domains/iam/types';
import { ApiError } from '@/shared/api/client';
import { Permission } from '@/shared/components/Permission';
import { QueryProTable } from '@/shared/components/QueryProTable';
import { StatusTag } from '@/shared/components/StatusTag';
import { statusValueEnum } from '@/shared/constants/status';
import { useAsyncAction } from '@/shared/hooks/useAsyncAction';
import { useProTableRequest } from '@/shared/hooks/useProTableRequest';

export default function SystemUserPage() {
  const { formatMessage } = useIntl();
  const fm = (id: string, values?: Record<string, string>) => formatMessage({ id }, values);
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SysUser | null>(null);
  const { loading, run } = useAsyncAction();

  const request = useProTableRequest(
    userService.page,
    {
      mapParams: (params) => ({
        email: params.email as string | undefined,
        nickname: params.nickname as string | undefined,
        status: params.status as number | undefined,
      }),
    },
  );

  const columns: ProColumns<SysUser>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: fm('system.user.email'), dataIndex: 'email', copyable: true, ellipsis: true },
    { title: fm('system.user.nickname'), dataIndex: 'nickname', ellipsis: true, width: 120 },
    {
      title: fm('system.user.dept'),
      dataIndex: 'deptName',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, row) => row.deptName || fm('common.empty'),
    },
    {
      title: fm('system.user.roles'),
      dataIndex: 'roleNames',
      search: false,
      width: 200,
      render: (_, row) =>
        row.roleNames?.length ? (
          <Space size={[0, 4]} wrap>
            {row.roleNames.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </Space>
        ) : (
          fm('common.empty')
        ),
    },
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
      width: 140,
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
      width: 220,
      render: (_, row) => (
        <Space>
          <Permission accessKey="canUserUpdate">
            <a
              onClick={async () => {
                try {
                  const detail = await userService.get(row.id);
                  setEditing(detail);
                  setOpen(true);
                } catch {
                  /* 无权限时 apiRequest 已提示 */
                }
              }}
            >
              {fm('common.edit')}
            </a>
          </Permission>
          <Permission accessKey="canUserUpdatePassword">
            <a
              onClick={() => {
                let pwd = '';
                Modal.confirm({
                  title: fm('system.user.resetPasswordTitle', { email: row.email }),
                  content: (
                    <input
                      type="password"
                      placeholder={fm('system.user.newPasswordPlaceholder')}
                      style={{ width: '100%', marginTop: 12 }}
                      onChange={(e) => {
                        pwd = e.target.value;
                      }}
                    />
                  ),
                  onOk: async () => {
                    if (!pwd || pwd.length < 6) {
                      message.error(fm('system.user.passwordMin'));
                      return Promise.reject(new ApiError(fm('system.user.passwordMin'), 400));
                    }
                    if (!(await run(() => userService.updatePassword(row.id, pwd), fm('system.user.passwordReset')))) {
                      return Promise.reject(new ApiError(fm('system.user.resetFailed'), 400));
                    }
                  },
                });
              }}
            >
              {fm('system.user.resetPassword')}
            </a>
          </Permission>
          <Permission accessKey="canUserDelete">
            <a
              onClick={() => {
                Modal.confirm({
                  title: fm('system.user.deleteConfirm'),
                  onOk: async () => {
                    if (!(await run(() => userService.remove(row.id), fm('common.deleted')))) return;
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
      <QueryProTable<SysUser>
        headerTitle={fm('system.user.title')}
        actionRef={actionRef}
        columns={columns}
        scroll={{ x: 1100 }}
        request={request}
        toolBarRender={() => [
          <Permission key="add" accessKey="canUserCreate">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {fm('system.user.create')}
            </Button>
          </Permission>,
        ]}
      />

      <UserFormModal
        open={open}
        editing={editing}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          if (
            !(await run(async () => {
              if (editing) {
                await userService.update({ id: editing.id, ...values });
              } else {
                await userService.create(values);
              }
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
