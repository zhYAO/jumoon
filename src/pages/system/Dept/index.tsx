import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space } from 'antd';
import { useRef, useState } from 'react';
import { Permission } from '@/shared/components/Permission';
import { StatusTag } from '@/shared/components/StatusTag';
import { useAsyncAction } from '@/shared/hooks/useAsyncAction';
import { DeptFormModal } from '@/domains/iam/components/DeptFormModal';
import { deptService } from '@/domains/iam/services/deptService';
import type { SysDept } from '@/domains/iam/types';

export default function SystemDeptPage() {
  const { formatMessage } = useIntl();
  const fm = (id: string) => formatMessage({ id });
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SysDept | null>(null);
  const [parentId, setParentId] = useState(0);
  const { loading, run } = useAsyncAction();

  const columns: ProColumns<SysDept>[] = [
    { title: fm('common.name'), dataIndex: 'name' },
    { title: fm('common.sort'), dataIndex: 'sort', width: 80, search: false },
    {
      title: fm('common.status'),
      dataIndex: 'status',
      width: 90,
      render: (_, row) => <StatusTag value={row.status} />,
    },
    {
      title: fm('common.actions'),
      valueType: 'option',
      width: 200,
      render: (_, row) => (
        <Space>
          <Permission accessKey="canDeptCreate">
            <a
              onClick={() => {
                setEditing(null);
                setParentId(row.id);
                setOpen(true);
              }}
            >
              {fm('system.dept.addChild')}
            </a>
          </Permission>
          <Permission accessKey="canDeptUpdate">
            <a
              onClick={() => {
                setEditing(row);
                setOpen(true);
              }}
            >
              {fm('common.edit')}
            </a>
          </Permission>
          <Permission accessKey="canDeptDelete">
            <a
              onClick={() => {
                Modal.confirm({
                  title: fm('system.dept.deleteConfirm'),
                  onOk: async () => {
                    if (!(await run(() => deptService.remove(row.id), fm('common.deleted')))) return;
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
      <ProTable<SysDept>
        headerTitle={fm('system.dept.title')}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={false}
        columns={columns}
        request={async () => {
          try {
            const tree = await deptService.tree();
            return { data: tree, success: true };
          } catch {
            return { data: [], success: false };
          }
        }}
        toolBarRender={() => [
          <Permission key="add" accessKey="canDeptCreate">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setParentId(0);
                setOpen(true);
              }}
            >
              {fm('system.dept.create')}
            </Button>
          </Permission>,
        ]}
      />
      <DeptFormModal
        open={open}
        editing={editing}
        parentId={parentId}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          if (
            !(await run(async () => {
              if (editing) await deptService.update({ id: editing.id, ...values });
              else await deptService.create(values);
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
