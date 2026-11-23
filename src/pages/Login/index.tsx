import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Form, Input, message } from 'antd';
import { useEffect } from 'react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/domains/iam/hooks/useAuth';
import { enablePrototypeSession } from '@/domains/product/prototypeSession';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { isApiError } from '@/shared/api/client';
import { takeLogoutReason } from '@/shared/utils/storage';
import styles from './index.less';

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [form] = Form.useForm<LoginValues>();
  const { login, loading } = useAuth();
  const { formatMessage } = useIntl();

  useEffect(() => {
    const reason = takeLogoutReason();
    if (reason) {
      message.warning(reason);
    }
  }, []);

  const onFinish = async (values: LoginValues) => {
    try {
      const tokens = await login(values);
      takeLogoutReason();
      if (tokens.mustChangePassword) {
        window.location.href = '/change-password';
        return;
      }
      message.success(formatMessage({ id: 'auth.loginSuccess' }));
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirect || '/home';
    } catch (e: any) {
      if (!isApiError(e)) {
        message.error(e?.message || formatMessage({ id: 'auth.loginFailed' }));
      }
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#9584b7',
          borderRadius: 8,
          fontFamily:
            "'Avenir Next', 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif",
        },
      }}
    >
      <div className={styles.page}>
        <aside className={styles.brand}>
          <img className={styles.brandLogo} src={logo} alt="JUMOON" />
        </aside>

        <main className={styles.panel}>
          <div className={styles.formWrap}>
            <div className={styles.brandRow}>
              <img className={styles.mark} src={logo} alt="" />
              <div className={styles.brandText}>
                <span className={styles.brandName}>JUMOON</span>
                <span className={styles.brandSub}>{formatMessage({ id: 'auth.brandSub' })}</span>
              </div>
              <div className={styles.lang}>
                <LanguageSwitcher />
              </div>
            </div>

            <Form
              form={form}
              className={styles.form}
              size="large"
              onFinish={onFinish}
              autoComplete="off"
              requiredMark={false}
              initialValues={{ email: 'admin@jumoon.com' }}
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: formatMessage({ id: 'auth.emailRequired' }) },
                  { type: 'email', message: formatMessage({ id: 'auth.emailInvalid' }) },
                ]}
              >
                <Input
                  prefix={<MailOutlined className={styles.icon} />}
                  placeholder={formatMessage({ id: 'auth.email' })}
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: formatMessage({ id: 'auth.passwordRequired' }) }]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.icon} />}
                  placeholder={formatMessage({ id: 'auth.password' })}
                />
              </Form.Item>

              <Form.Item className={styles.submitItem}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className={styles.submit}
                  loading={loading}
                >
                  {formatMessage({ id: 'auth.login' })}
                </Button>
              </Form.Item>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  block
                  className={styles.prototypeButton}
                  onClick={() => {
                    enablePrototypeSession();
                    window.location.href = '/home';
                  }}
                >
                  进入产品原型（Mock）
                </Button>
              )}
            </Form>
          </div>

          <footer className={styles.footer}>JUMOON Admin</footer>
        </main>
      </div>
    </ConfigProvider>
  );
}
