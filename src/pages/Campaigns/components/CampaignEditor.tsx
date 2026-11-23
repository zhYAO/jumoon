import {
  CheckCircleFilled,
  ClockCircleOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  SaveOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Progress,
  Radio,
  Row,
  Select,
  Tooltip,
  Typography,
  type FormInstance,
} from 'antd';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { BUSINESS_USERS, COMPANY_USERS, OPERATOR_USERS } from '@/domains/product/mockTypes';
import { MIN_CAMPAIGN_BUDGET, publishChecks, type CampaignFormValues } from '../campaignForm';
import styles from '../index.less';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MARKET_OPTIONS = ['美国', '加拿大', '英国', '德国', '法国', '澳大利亚', '东南亚'].map(
  (value) => ({ value, label: value }),
);
const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'X'].map((value) => ({
  value,
  label: value,
}));
const LANGUAGE_OPTIONS = ['英语', '西班牙语', '法语', '德语', '中文'].map((value) => ({
  value,
  label: value,
}));
const CURRENCY_OPTIONS = ['USD', 'CNY', 'EUR', 'GBP'].map((value) => ({ value, label: value }));

function RequiredLabel({ children, help }: { children: ReactNode; help?: string }) {
  return (
    <span className={styles.fieldLabel}>
      <span className={styles.requiredMark}>*</span>
      {children}
      {help && (
        <Tooltip title={help}>
          <InfoCircleOutlined className={styles.helpIcon} />
        </Tooltip>
      )}
    </span>
  );
}

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <span className={styles.fieldLabel}>
      {children}
      <span className={styles.optional}>选填</span>
    </span>
  );
}

function money(value?: number, currency = 'USD') {
  if (value === undefined || value === null) return '-';
  return `${currency} ${value.toLocaleString('en-US')}`;
}

function readinessLabel(passed: number, total: number) {
  if (passed === total) return { text: '可发布', className: styles.statusReady };
  if (passed === 0) return { text: '草稿', className: styles.statusDraft };
  return { text: `缺 ${total - passed} 项`, className: styles.statusMissing };
}

type CampaignEditorProps = {
  form: FormInstance<CampaignFormValues>;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: (values: CampaignFormValues) => void;
};

export function CampaignEditor({ form, onCancel, onSaveDraft, onPublish }: CampaignEditorProps) {
  const budgetType = Form.useWatch('budgetType', form) || 'open';

  return (
    <Form<CampaignFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={onPublish}
      onFinishFailed={() => message.warning('还有发布必填项未完成，请按右侧检查清单补齐')}
      className={styles.editorForm}
    >
      <div className={styles.editorShell}>
        <div className={styles.editorScroll}>
          <Alert
            className={styles.editorAlert}
            type="info"
            showIcon
            message="草稿可随时保存；发布时才会校验核心字段。"
          />
          <div className={styles.editorGrid}>
            <div className={styles.formSurface}>
              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>1</span>
                  <div>
                    <Title level={4}>项目身份</Title>
                    <Text>先把 Campaign 的归属与结算口径定下来</Text>
                  </div>
                </div>
                <Row gutter={[20, 0]}>
                  <Col xs={24} lg={14}>
                    <Form.Item
                      name="name"
                      label={<RequiredLabel>Campaign 名称</RequiredLabel>}
                      rules={[
                        { required: true, whitespace: true, message: '请输入 Campaign 名称' },
                      ]}
                    >
                      <Input placeholder="例如：Luma US Back to School" maxLength={80} showCount />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Form.Item
                      name="clientBrand"
                      label={<RequiredLabel>客户 / 品牌</RequiredLabel>}
                      rules={[{ required: true, whitespace: true, message: '请输入客户或品牌' }]}
                    >
                      <Input placeholder="例如：Luma Beauty" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="settlementMonth"
                      label={
                        <RequiredLabel help="用于财务归集，格式为 YYYY-MM">结算月</RequiredLabel>
                      }
                      rules={[{ required: true, message: '请选择结算月' }]}
                    >
                      <DatePicker
                        picker="month"
                        format="YYYY-MM"
                        placeholder="选择结算月"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="period" label={<OptionalLabel>执行周期</OptionalLabel>}>
                      <RangePicker className={styles.fullWidth} />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>2</span>
                  <div>
                    <Title level={4}>执行范围</Title>
                    <Text>明确市场、平台和内容语言</Text>
                  </div>
                </div>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="markets"
                      label={<RequiredLabel>市场</RequiredLabel>}
                      rules={[
                        { required: true, type: 'array', min: 1, message: '至少选择一个市场' },
                      ]}
                    >
                      <Select mode="multiple" placeholder="选择市场" options={MARKET_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="platforms"
                      label={<RequiredLabel>平台</RequiredLabel>}
                      rules={[
                        { required: true, type: 'array', min: 1, message: '至少选择一个平台' },
                      ]}
                    >
                      <Select mode="multiple" placeholder="选择平台" options={PLATFORM_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="languages" label={<OptionalLabel>内容语言</OptionalLabel>}>
                      <Select
                        mode="multiple"
                        placeholder="选择内容语言"
                        options={LANGUAGE_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="productSku" label={<OptionalLabel>产品 / SKU</OptionalLabel>}>
                      <Input placeholder="产品名称、套装或 SKU" />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>3</span>
                  <div>
                    <Title level={4}>预算与结算</Title>
                    <Text>预算口径会决定后续的成本控制方式</Text>
                  </div>
                </div>
                <Form.Item name="budgetType" label={<RequiredLabel>预算类型</RequiredLabel>}>
                  <Radio.Group className={styles.budgetOptions}>
                    <Radio value="fixed" className={styles.budgetOption}>
                      <div>
                        <strong>固定预算</strong>
                        <span>客户已确认总预算，需要录入客户预算</span>
                      </div>
                    </Radio>
                    <Radio value="open" className={styles.budgetOption}>
                      <div>
                        <strong>开放预算</strong>
                        <span>按执行逐步确认，只控制内部目标成本</span>
                      </div>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="currency"
                      label={<RequiredLabel>币种</RequiredLabel>}
                      rules={[{ required: true }]}
                    >
                      <Select options={CURRENCY_OPTIONS} />
                    </Form.Item>
                  </Col>
                  {budgetType === 'fixed' && (
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="clientBudget"
                        label={<RequiredLabel>客户预算</RequiredLabel>}
                        rules={[
                          { required: true, type: 'number', min: MIN_CAMPAIGN_BUDGET, message: '请输入客户预算' },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          precision={2}
                          className={styles.fullWidth}
                          placeholder="0.00"
                        />
                      </Form.Item>
                    </Col>
                  )}
                  <Col xs={24} md={budgetType === 'fixed' ? 8 : 16}>
                    <Form.Item
                      name="targetCost"
                      label={
                        <RequiredLabel help="参与运营可以查看，但只有项目管理角色可以修改">
                          内部目标成本
                        </RequiredLabel>
                      }
                      rules={[
                        { required: true, type: 'number', min: MIN_CAMPAIGN_BUDGET, message: '请输入内部目标成本' },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        className={styles.fullWidth}
                        placeholder="团队执行成本上限"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>4</span>
                  <div>
                    <Title level={4}>人员分配</Title>
                    <Text>负责人默认当前用户，可改；参与运营从公司用户中选择</Text>
                  </div>
                </div>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="projectOwner"
                      label={
                        <RequiredLabel help="默认当前用户，可从公司用户中调整">
                          项目负责人 Owner
                        </RequiredLabel>
                      }
                      rules={[{ required: true, message: '请选择项目负责人（BD）' }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        placeholder="选择项目负责人"
                        options={COMPANY_USERS}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="businessOwner"
                      label={<OptionalLabel>商务负责人</OptionalLabel>}
                    >
                      <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={BUSINESS_USERS}
                        placeholder="默认当前商务"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="operators"
                      label={
                        <RequiredLabel help="草稿可空；发布时至少一位。发布后自动进入对方「我的 Campaign」">
                          参与运营
                        </RequiredLabel>
                      }
                      rules={[
                        {
                          required: true,
                          type: 'array',
                          min: 1,
                          message: '发布前至少选择一位参与运营',
                        },
                      ]}
                    >
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        placeholder="选择公司运营人员"
                        options={OPERATOR_USERS}
                        suffixIcon={<TeamOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>5</span>
                  <div>
                    <Title level={4}>Brief 与达人要求</Title>
                    <Text>选填；不影响草稿保存与发布校验</Text>
                  </div>
                </div>
                <Form.Item name="brief" label={<OptionalLabel>客户 Brief</OptionalLabel>}>
                  <Input.TextArea
                    rows={4}
                    placeholder="背景、核心信息、内容方向、禁忌事项和交付要求"
                    maxLength={1200}
                    showCount
                  />
                </Form.Item>
                <Form.Item
                  name="creatorRequirements"
                  label={<OptionalLabel>达人画像要求</OptionalLabel>}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="粉丝、均播、类目、地区或排除条件"
                    maxLength={600}
                    showCount
                  />
                </Form.Item>
              </section>

              <section className={styles.formSection}>
                <div className={styles.formSectionTitle}>
                  <span>6</span>
                  <div>
                    <Title level={4}>执行目标</Title>
                    <Text>一期可空，用于后续目标 vs 实际对比</Text>
                  </div>
                </div>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="targetCreators"
                      label={<OptionalLabel>目标达人数</OptionalLabel>}
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        className={styles.fullWidth}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="targetContent"
                      label={<OptionalLabel>目标内容条数</OptionalLabel>}
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        className={styles.fullWidth}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </section>
            </div>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldsValue }) => {
                const values = getFieldsValue(true) as Partial<CampaignFormValues>;
                const checks = publishChecks(values);
                const passed = checks.filter((item) => item.passed).length;
                const percent = Math.round((passed / checks.length) * 100);
                const ready = readinessLabel(passed, checks.length);
                return (
                  <aside className={styles.publishPanel}>
                    <div className={styles.publishPanelHead}>
                      <div>
                        <Text className={styles.eyebrow}>项目摘要</Text>
                        <Title level={4}>实时预览</Title>
                      </div>
                      <Progress type="circle" percent={percent} size={54} strokeWidth={9} />
                    </div>
                    <div className={styles.summaryList}>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>项目名称</span>
                        <span className={styles.v}>{values.name?.trim() || '—'}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>客户 / 品牌</span>
                        <span className={styles.v}>{values.clientBrand?.trim() || '—'}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>结算月</span>
                        <span className={styles.v}>
                          {values.settlementMonth
                            ? dayjs(values.settlementMonth).format('YYYY-MM')
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>预算类型</span>
                        <span className={styles.v}>
                          {values.budgetType === 'fixed' ? '固定预算' : '开放预算'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>内部目标成本</span>
                        <span className={styles.v}>
                          {values.targetCost != null
                            ? money(values.targetCost, values.currency || 'USD')
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>参与运营</span>
                        <span className={styles.v}>
                          {values.operators?.length ? values.operators.join('、') : '未分配'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.k}>当前状态</span>
                        <span className={`${styles.v} ${ready.className}`}>{ready.text}</span>
                      </div>
                    </div>
                    <Text className={styles.eyebrow} style={{ marginBottom: 8 }}>
                      发布检查
                    </Text>
                    <div className={styles.checkList}>
                      {checks.map((item) => (
                        <div className={item.passed ? styles.checkPassed : ''} key={item.label}>
                          {item.passed ? <CheckCircleFilled /> : <ClockCircleOutlined />}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.permissionNote}>
                      <InfoCircleOutlined />
                      <div>
                        <strong>发布后的权限</strong>
                        <span>
                          运营可查看内部目标成本但不可改；财务仅在有合作/付款后看到该项目。
                        </span>
                      </div>
                    </div>
                  </aside>
                );
              }}
            </Form.Item>
          </div>
        </div>

        <div className={styles.editorFooter}>
          <Button onClick={onCancel}>取消</Button>
          <div>
            <Button icon={<SaveOutlined />} onClick={onSaveDraft}>
              保存草稿
            </Button>
            <Button type="primary" icon={<RocketOutlined />} htmlType="submit">
              发布并分配
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}
