import { SwapOutlined } from '@ant-design/icons';
import { Select, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { ROLE_CURRENT_USER } from '../../mockTypes';
import {
  getPrototypeRole,
  PROTOTYPE_ROLES,
  setPrototypeRole,
  type PrototypeRole,
} from '../../prototypeNavigation';
import styles from './index.less';

const DEMO_ROLES = PROTOTYPE_ROLES.filter((r) => r.demo || r.value === 'architecture');

export function PrototypeRoleSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const currentRole = useMemo(() => getPrototypeRole(), []);
  const userName = ROLE_CURRENT_USER[currentRole];

  const handleChange = (value: PrototypeRole) => {
    setPrototypeRole(value);
    window.location.reload();
  };

  if (collapsed) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <Tag className={styles.prototypeTag} bordered={false}>
          MOCK
        </Tag>
        <Typography.Text className={styles.label}>{userName}</Typography.Text>
      </div>
      <Select
        aria-label="切换演示角色"
        className={styles.select}
        value={currentRole}
        suffixIcon={<SwapOutlined />}
        onChange={handleChange}
        options={DEMO_ROLES.map((role) => ({
          value: role.value,
          label: role.shortLabel,
        }))}
      />
    </div>
  );
}
