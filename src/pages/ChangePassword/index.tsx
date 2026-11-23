import { LockOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Form, Input, message } from 'antd';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { authService } from '@/domains/iam/services/authService';
import { useAuth } from '@/domains/iam/hooks/useAuth';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { isApiError } from '@/shared/api/client';
import { setTokens } from '@/shared/utils/storage';
import styles from '../Login/index.less';

type ChangePasswordValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordPage() {
  const [form] = Form.useForm<ChangePasswordValues>();
  const [submitting, setSubmitting] = useState(false);
  const { logout } = useAuth();
  const { formatMessage } = useIntl();

  const onFinish = async (values: ChangePasswordValues) => {
    setSubmitting(true);
    try {
      const tokens = await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      message.success(formatMessage({ id: 'auth.changePasswordSuccess' }));
      window.location.href = '/home';
    } catch (e: unknown) {
      if (!isApiError(e)) {
        message.error(formatMessage({ id: 'auth.loginFailed' }));
      }
    } finally {
      setSubmitting(false);
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
                <span className={styles.brandSub}>
                  {formatMessage({ id: 'auth.changePasswordTitle' })}
                </span>
              </div>
              <div className={styles.lang}>
                <LanguageSwitcher />
              </div>
            </div>

            <p className={styles.hint}>{formatMessage({ id: 'auth.changePasswordHint' })}</p>

            <Form
              form={form}
              className={styles.form}
              size="large"
              onFinish={onFinish}
              autoComplete="off"
              requiredMark={false}
            >
              <Form.Item
                name="oldPassword"
                rules={[
                  { required: true, message: formatMessage({ id: 'auth.oldPasswordRequired' }) },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.icon} />}
                  placeholder={formatMessage({ id: 'auth.oldPassword' })}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: formatMessage({ id: 'auth.newPasswordRequired' }) },
                  { min: 6, message: formatMessage({ id: 'auth.passwordMin' }) },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.icon} />}
                  placeholder={formatMessage({ id: 'auth.newPassword' })}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  {
                    required: true,
                    message: formatMessage({ id: 'auth.confirmPasswordRequired' }),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(formatMessage({ id: 'auth.passwordMismatch' })),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.icon} />}
                  placeholder={formatMessage({ id: 'auth.confirmPassword' })}
                />
              </Form.Item>

              <Form.Item className={styles.submitItem}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className={styles.submit}
                  loading={submitting}
                >
                  {formatMessage({ id: 'auth.changePasswordSubmit' })}
                </Button>
              </Form.Item>
            </Form>

            <button type="button" className={styles.logoutLink} onClick={() => logout()}>
              {formatMessage({ id: 'layout.logout' })}
            </button>
          </div>

          <footer className={styles.footer}>JUMOON Admin</footer>
        </main>
      </div>
    </ConfigProvider>
  );
}
