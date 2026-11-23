import '@/shared/api/client';
import { LogoutOutlined } from '@ant-design/icons';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { Link, history } from '@umijs/max';
import { Dropdown, message } from 'antd';
import logo from '@/assets/logo.png';
import { authService } from '@/domains/iam/services/authService';
import type { PermissionInfo } from '@/domains/iam/types';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { PrototypeRoleSwitcher } from '@/domains/product/components/PrototypeRoleSwitcher';
import { filterMenusForPrototypeRole } from '@/domains/product/prototypeNavigation';
import {
  clearPrototypeSession,
  isPrototypeSession,
  PROTOTYPE_PERMISSION_INFO,
} from '@/domains/product/prototypeSession';
import { localeHeaders, t } from '@/i18n';
import { redirectToLogin } from '@/shared/api/authSession';
import { applyLayoutMenuIcons } from '@/shared/icons/applyLayoutMenuIcons';
import { clearTokens, getAccessToken, getRefreshToken } from '@/shared/utils/storage';

const loginPath = '/login';
const changePasswordPath = '/change-password';

export type InitialStateType = {
  name?: string;
  avatar?: string;
  currentUser?: PermissionInfo['user'];
  permissionInfo?: PermissionInfo | null;
  mustChangePassword?: boolean;
};

export async function getInitialState(): Promise<InitialStateType> {
  const { location } = history;
  const token = getAccessToken();

  if (isPrototypeSession()) {
    return {
      name: PROTOTYPE_PERMISSION_INFO.user.nickname,
      currentUser: PROTOTYPE_PERMISSION_INFO.user,
      permissionInfo: PROTOTYPE_PERMISSION_INFO,
      mustChangePassword: false,
    };
  }

  if (!token) {
    if (location.pathname !== loginPath) {
      history.push(loginPath);
    }
    return { permissionInfo: null, mustChangePassword: false };
  }

  try {
    const permissionInfo = await authService.getPermissionInfo();
    const mustChangePassword = Boolean(permissionInfo.mustChangePassword);
    if (mustChangePassword && location.pathname !== changePasswordPath) {
      history.push(changePasswordPath);
    } else if (!mustChangePassword && location.pathname === changePasswordPath) {
      history.push('/home');
    }
    return {
      name: permissionInfo.user.nickname || permissionInfo.user.email,
      avatar:
        'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      currentUser: permissionInfo.user,
      permissionInfo,
      mustChangePassword,
    };
  } catch {
    clearTokens();
    if (location.pathname !== loginPath) {
      history.push(loginPath);
    }
    return { permissionInfo: null, mustChangePassword: false };
  }
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  const loggedIn = Boolean(initialState?.currentUser);
  return {
    pure: !loggedIn,
    navTheme: 'light',
    logo: (
      <img
        src={logo}
        alt="JUMOON"
        style={{
          height: 28,
          width: 28,
          objectFit: 'cover',
          objectPosition: 'center 30%',
          borderRadius: 4,
        }}
      />
    ),
    title: 'JUMOON',
    menu: {
      locale: false,
    },
    menuDataRender: (menuData) =>
      filterMenusForPrototypeRole(
        applyLayoutMenuIcons(menuData, initialState?.permissionInfo?.menus || []),
      ),
    menuItemRender: (item, defaultDom) => {
      const nested =
        Array.isArray(item.pro_layout_parentKeys) && item.pro_layout_parentKeys.length > 0;
      const content =
        nested && item.icon ? (
          <span className="jumoon-sub-menu-item">
            <span className="jumoon-sub-menu-icon">{item.icon}</span>
            {defaultDom}
          </span>
        ) : (
          defaultDom
        );
      if (item.isUrl || item.children) {
        return content;
      }
      if (item.path && history.location.pathname !== item.path) {
        return (
          <Link to={item.path.replace('/*', '')} target={item.target}>
            {content}
          </Link>
        );
      }
      return content;
    },
    rightContentRender: false,
    actionsRender: false,
    menuFooterRender: (props) => (
      <div className={props?.collapsed ? 'jumoon-sider-tools is-collapsed' : 'jumoon-sider-tools'}>
        <PrototypeRoleSwitcher collapsed={props?.collapsed} />
        <LanguageSwitcher />
      </div>
    ),
    avatarProps: {
      src: initialState?.avatar,
      size: 'small',
      title: initialState?.name,
      render: (_props, dom) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: t('layout.logout'),
                onClick: async () => {
                  if (isPrototypeSession()) {
                    clearPrototypeSession();
                    clearTokens();
                    history.push(loginPath);
                    return;
                  }
                  try {
                    await authService.logout(getRefreshToken() || undefined);
                  } catch {
                    // ignore
                  }
                  clearTokens();
                  message.success(t('layout.loggedOut'));
                  history.push(loginPath);
                },
              },
            ],
          }}
        >
          <div style={{ cursor: 'pointer' }}>{dom}</div>
        </Dropdown>
      ),
    },
    onPageChange: () => {
      const path = history.location.pathname;
      if (isPrototypeSession()) return;
      if (!getAccessToken()) {
        if (path !== loginPath) {
          history.push(loginPath);
        }
        return;
      }
      if (initialState?.mustChangePassword && path !== changePasswordPath) {
        history.push(changePasswordPath);
      }
    },
  };
};

export const request: RequestConfig = {
  timeout: 15000,
  requestInterceptors: [
    (url, options) => {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
        ...localeHeaders(),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return { url, options: { ...options, headers } };
    },
  ],
  errorConfig: {
    errorHandler(error: any) {
      const msg = error?.response?.data?.msg || error?.message || t('common.networkError');
      if (error?.response?.status === 401) {
        redirectToLogin();
      }
      message.error(msg);
    },
  },
};
