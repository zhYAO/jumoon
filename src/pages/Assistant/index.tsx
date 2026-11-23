import { RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  assistantTitleForRole,
  ASSISTANT_POSITIONING,
  promptsForRole,
  runAssistantPrompt,
  type AssistantAnswer,
} from '@/domains/product/assistantEngine';
import { ROLE_CURRENT_USER } from '@/domains/product/mockTypes';
import { useMockStore } from '@/domains/product/mockStore';
import {
  canRoleSeeModule,
  getPrototypeRole,
  getPrototypeRoleMeta,
} from '@/domains/product/prototypeNavigation';
import styles from './index.less';

const { Text, Title, Paragraph } = Typography;

export default function AssistantPage() {
  const role = getPrototypeRole();
  const roleMeta = getPrototypeRoleMeta(role);
  const me = ROLE_CURRENT_USER[role];
  const { campaigns, cooperations, payments } = useMockStore();
  const prompts = useMemo(() => promptsForRole(role), [role]);
  const [activeId, setActiveId] = useState(prompts[0]?.id);
  const [answer, setAnswer] = useState<AssistantAnswer>();

  useEffect(() => {
    if (!canRoleSeeModule(role, '/assistant')) {
      history.replace('/home');
    }
  }, [role]);

  useEffect(() => {
    const first = promptsForRole(role)[0]?.id;
    setActiveId(first);
  }, [role]);

  useEffect(() => {
    if (!activeId) return;
    setAnswer(runAssistantPrompt(activeId, role, campaigns, cooperations, payments));
  }, [activeId, role, campaigns, cooperations, payments]);

  const title = assistantTitleForRole(role);

  return (
    <PageContainer
      className={styles.page}
      title={title}
      subTitle={`${roleMeta.shortLabel} · ${me} · 权限内全局管家`}
      tags={<Tag color="blue">AI</Tag>}
    >
      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <RobotOutlined />
        </div>
        <div>
          <Text className={styles.eyebrow}>JUMOON AI</Text>
          <Title level={4} style={{ margin: '4px 0 8px' }}>
            {ASSISTANT_POSITIONING.headline}
          </Title>
          <Paragraph className={styles.heroBody}>{ASSISTANT_POSITIONING.body}</Paragraph>
          <Space size={[8, 8]} wrap>
            <Tag>看懂数据</Tag>
            <Tag>串起复杂流程</Tag>
            <Tag>按权限操控 / 指引</Tag>
            <Tag>越权不可见</Tag>
          </Space>
        </div>
      </section>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="当前演示：分析结论 + 一键跳到对应业务页（申请、审批、项目等）。"
        description="完整「代你点完流程」会在同权限规则下继续加；永远不会超过你的角色权限。"
      />

      <div className={styles.layout}>
        <aside className={styles.prompts}>
          <Text className={styles.eyebrow}>场景</Text>
          <Title level={5} style={{ marginTop: 4 }}>
            管家先帮你做这些
          </Title>
          <div className={styles.promptList}>
            {prompts.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.promptItem} ${activeId === p.id ? styles.promptActive : ''}`}
                onClick={() => setActiveId(p.id)}
              >
                <ThunderboltOutlined />
                <span>
                  <strong>{p.label}</strong>
                  {p.hint ? <small>{p.hint}</small> : null}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.answerPanel}>
          {answer ? (
            <>
              <div className={styles.answerHead}>
                <Text type="secondary">{activeId}</Text>
                <Title level={4} style={{ margin: '4px 0 8px' }}>
                  {answer.title}
                </Title>
                <Paragraph className={styles.summary}>{answer.summary}</Paragraph>
              </div>

              {answer.bullets.length > 0 && (
                <ul className={styles.bullets}>
                  {answer.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}

              <Space wrap className={styles.actions}>
                {answer.actions.map((a) => (
                  <Button key={a.path + a.label} type="primary" ghost onClick={() => history.push(a.path)}>
                    {a.label}
                  </Button>
                ))}
              </Space>

              <Text type="secondary" className={styles.note}>
                {answer.note}
              </Text>
            </>
          ) : (
            <Text type="secondary">选择一个场景开始</Text>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
