import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Descriptions, Modal, Tag, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useRef } from 'react';
import { operateLogService } from '@/domains/iam/services/operateLogService';
import type { SysOperateLog } from '@/domains/iam/types';
import { QueryProTable } from '@/shared/components/QueryProTable';
import { useProTableRequest } from '@/shared/hooks/useProTableRequest';

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 90;

type Fm = (id: string, values?: Record<string, string | number>) => string;

function rangeLastDays(days: number): [Dayjs, Dayjs] {
  return [dayjs().subtract(days - 1, 'day').startOf('day'), dayjs().endOf('day')];
}

/** 与库里 DATETIME（本地墙钟，新加坡 UTC+8）对齐；不要用 toISOString()（会变成 UTC 并带 Z） */
function toQueryDateTime(value: Dayjs | string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
}

const MODULE_KEYS = ['system', 'creator', 'campaign', 'outreach', 'finance'] as const;

function parseObj(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function formatValue(fm: Fm, key: string, value: unknown): string {
  if (value == null || value === '') return fm('common.empty');
  if (key === 'status') {
    if (String(value) === '0') return fm('common.enabled');
    if (String(value) === '1') return fm('common.disabled');
  }
  if (key === 'reason') {
    const id = `system.log.reason.${value}`;
    const text = fm(id);
    if (text !== id) return text;
  }
  if (Array.isArray(value)) return value.length ? value.join(', ') : fm('system.log.emptyArray');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function moduleLabel(fm: Fm, code?: string | null): string {
  if (!code) return fm('common.empty');
  const id = `system.log.module.${code}`;
  const text = fm(id);
  return text === id ? code : text;
}

function bizLabel(fm: Fm, code?: string | null): string {
  if (!code) return '';
  const id = `system.log.biz.${code}`;
  const text = fm(id);
  return text === id ? code : text;
}

function fieldLabel(fm: Fm, key: string): string {
  const id = `system.log.field.${key}`;
  const text = fm(id);
  return text === id ? key : text;
}

function objectSummary(fm: Fm, row: SysOperateLog): string {
  const after = parseObj(row.afterData);
  const before = parseObj(row.beforeData);
  const data = after || before;

  if (row.actionName === '登录' || row.actionName === '登录失败' || row.actionName === '退出登录') {
    return row.userEmail || fm('common.empty');
  }
  if (data?.email) return String(data.email);
  if (data?.name) return String(data.name);
  if (data?.nickname) return String(data.nickname);
  if (data?.code) return String(data.code);

  const typeLabel = bizLabel(fm, row.bizType);
  if (typeLabel && row.bizId) return fm('system.log.objectId', { label: typeLabel, id: row.bizId });
  if (typeLabel) return typeLabel;
  return fm('common.empty');
}

function changeLines(fm: Fm, row: SysOperateLog): { label: string; text: string }[] {
  const before = parseObj(row.beforeData);
  const after = parseObj(row.afterData);
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  if (!keys.size) return [];

  const lines: { label: string; text: string }[] = [];
  for (const key of keys) {
    const label = fieldLabel(fm, key);
    const b = before?.[key];
    const a = after?.[key];
    if (before && after && key in before && key in after && formatValue(fm, key, b) !== formatValue(fm, key, a)) {
      lines.push({ label, text: `${formatValue(fm, key, b)} → ${formatValue(fm, key, a)}` });
    } else if (after && key in after && !(before && key in before)) {
      lines.push({ label, text: formatValue(fm, key, a) });
    } else if (before && key in before && !(after && key in after)) {
      lines.push({ label, text: fm('system.log.removed', { value: formatValue(fm, key, b) }) });
    } else if (after && key in after) {
      lines.push({ label, text: formatValue(fm, key, a) });
    }
  }
  return lines;
}

function showDetail(fm: Fm, row: SysOperateLog) {
  const changes = changeLines(fm, row);
  const resultText =
    row.resultCode === 0
      ? fm('system.log.success')
      : row.resultMsg
        ? fm('system.log.failWith', { code: row.resultCode, msg: row.resultMsg })
        : fm('system.log.failCode', { code: row.resultCode });
  Modal.info({
    title: row.actionName || fm('system.log.detailTitle'),
    width: 560,
    okText: fm('system.log.close'),
    content: (
      <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label={fm('system.log.operator')}>{row.userEmail || fm('common.empty')}</Descriptions.Item>
        <Descriptions.Item label="IP">{row.userIp || fm('common.empty')}</Descriptions.Item>
        <Descriptions.Item label={fm('system.log.module')}>{moduleLabel(fm, row.module)}</Descriptions.Item>
        <Descriptions.Item label={fm('system.log.object')}>{objectSummary(fm, row)}</Descriptions.Item>
        <Descriptions.Item label={fm('system.log.result')}>{resultText}</Descriptions.Item>
        <Descriptions.Item label={fm('system.log.time')}>{row.createdAt || fm('common.empty')}</Descriptions.Item>
        {changes.length > 0 ? (
          <Descriptions.Item label={fm('system.log.content')}>
            <div style={{ lineHeight: 1.8 }}>
              {changes.map((line) => (
                <div key={line.label}>
                  {line.label}：{line.text}
                </div>
              ))}
            </div>
          </Descriptions.Item>
        ) : null}
      </Descriptions>
    ),
  });
}

export default function SystemOperateLogPage() {
  const { formatMessage } = useIntl();
  const fm: Fm = (id, values) => formatMessage({ id }, values);
  const actionRef = useRef<ActionType>();

  const request = useProTableRequest<SysOperateLog>(
    (query) => operateLogService.page(query),
    {
      mapParams: (params) => {
        let beginTime = params.beginTime as string | undefined;
        let endTime = params.endTime as string | undefined;
        if (!beginTime || !endTime) {
          const [b, e] = rangeLastDays(DEFAULT_RANGE_DAYS);
          beginTime = toQueryDateTime(b);
          endTime = toQueryDateTime(e);
        }
        return {
          userEmail: params.userEmail as string | undefined,
          module: params.module as string | undefined,
          actionName: params.actionName as string | undefined,
          success: params.success as boolean | undefined,
          beginTime,
          endTime,
        };
      },
      beforeFetch: (_params, query) => {
        const begin = dayjs(query.beginTime as string);
        const end = dayjs(query.endTime as string);
        if (!begin.isValid() || !end.isValid()) {
          message.warning(fm('system.log.timeInvalid'));
          return false;
        }
        if (end.diff(begin, 'day', true) > MAX_RANGE_DAYS) {
          message.warning(fm('system.log.rangeTooWide', { days: MAX_RANGE_DAYS }));
          return false;
        }
        return true;
      },
    },
  );

  const moduleValueEnum = Object.fromEntries(
    MODULE_KEYS.map((value) => [value, { text: fm(`system.log.module.${value}`) }]),
  );

  const columns: ProColumns<SysOperateLog>[] = [
    {
      title: fm('system.log.time'),
      dataIndex: 'createdAt',
      valueType: 'dateTimeRange',
      hideInTable: true,
      order: 10,
      initialValue: rangeLastDays(DEFAULT_RANGE_DAYS),
      formItemProps: {
        rules: [{ required: true, message: fm('system.log.timeRequired') }],
      },
      fieldProps: {
        allowClear: false,
        presets: [
          { label: fm('system.log.last7d'), value: rangeLastDays(7) },
          { label: fm('system.log.last30d'), value: rangeLastDays(30) },
        ],
        showTime: true,
      },
      search: {
        transform: (value) => ({
          beginTime: value?.[0] ? toQueryDateTime(value[0]) : undefined,
          endTime: value?.[1] ? toQueryDateTime(value[1]) : undefined,
        }),
      },
    },
    {
      title: fm('system.log.time'),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: fm('system.log.operator'),
      dataIndex: 'userEmail',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'IP',
      dataIndex: 'userIp',
      search: false,
      width: 130,
      ellipsis: true,
      render: (_, row) => row.userIp || fm('common.empty'),
    },
    {
      title: fm('system.log.action'),
      dataIndex: 'actionName',
      ellipsis: true,
      width: 120,
    },
    {
      title: fm('system.log.module'),
      dataIndex: 'module',
      width: 110,
      valueEnum: moduleValueEnum,
      fieldProps: { allowClear: true },
      render: (_, row) => moduleLabel(fm, row.module),
    },
    {
      title: fm('system.log.object'),
      dataIndex: 'bizId',
      search: false,
      ellipsis: true,
      render: (_, row) => objectSummary(fm, row),
    },
    {
      title: fm('system.log.result'),
      dataIndex: 'success',
      width: 90,
      valueType: 'select',
      fieldProps: {
        options: [
          { label: fm('system.log.success'), value: true },
          { label: fm('system.log.fail'), value: false },
        ],
        allowClear: true,
      },
      render: (_, row) =>
        row.resultCode === 0 ? (
          <Tag color="success">{fm('system.log.success')}</Tag>
        ) : (
          <Tag color="error">{fm('system.log.fail')}</Tag>
        ),
    },
    {
      title: fm('system.log.detail'),
      valueType: 'option',
      width: 80,
      render: (_, row) => [
        <a key="detail" onClick={() => showDetail(fm, row)}>
          {fm('system.log.view')}
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <QueryProTable<SysOperateLog>
        actionRef={actionRef}
        columns={columns}
        form={{
          ignoreRules: false,
          initialValues: { createdAt: rangeLastDays(DEFAULT_RANGE_DAYS) },
        }}
        search={{ defaultCollapsed: false }}
        params={{ _range: 'default7d' }}
        request={request}
      />
    </PageContainer>
  );
}
