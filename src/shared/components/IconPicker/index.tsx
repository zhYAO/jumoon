import { CloseCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Popover } from 'antd';
import { useMemo, useState } from 'react';
import { MENU_ICON_CATALOG, getMenuIconItem, resolveMenuIconName } from '@/shared/icons/menuIcons';
import styles from './index.less';

type Props = {
  value?: string | null;
  onChange?: (value?: string) => void;
  placeholder?: string;
};

export function IconPicker({ value, onChange, placeholder }: Props) {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const resolvedPlaceholder = placeholder ?? formatMessage({ id: 'system.menu.pickIcon' });

  const selected = getMenuIconItem(value);
  const selectedName = resolveMenuIconName(value);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return MENU_ICON_CATALOG;
    return MENU_ICON_CATALOG.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.label.includes(q) ||
        item.aliases.some((alias) => alias.includes(q))
      );
    });
  }, [keyword]);

  const panel = (
    <div className={styles.panel}>
      <Input
        allowClear
        placeholder={formatMessage({ id: 'system.menu.searchIcon' })}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className={styles.grid}>
        {filtered.map((item) => {
          const active = item.name === selectedName;
          return (
            <button
              key={item.name}
              type="button"
              title={`${item.label}（${item.name}）`}
              className={active ? `${styles.cell} ${styles.active}` : styles.cell}
              onClick={() => {
                onChange?.(item.name);
                setOpen(false);
                setKeyword('');
              }}
            >
              <item.Icon />
            </button>
          );
        })}
        {filtered.length === 0 && <div className={styles.empty}>{formatMessage({ id: 'system.menu.noIcon' })}</div>}
      </div>
    </div>
  );

  return (
    <div className={styles.triggerRow}>
      <Popover
        trigger="click"
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setKeyword('');
        }}
        content={panel}
        placement="bottomLeft"
      >
        <Button className={styles.trigger} htmlType="button" block>
          {selected ? (
            <span className={styles.selected}>
              <selected.Icon />
              <span>{selected.label}</span>
            </span>
          ) : (
            <span className={styles.placeholder}>{resolvedPlaceholder}</span>
          )}
        </Button>
      </Popover>
      {value ? (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange?.(undefined)}
          aria-label={formatMessage({ id: 'system.menu.clearIcon' })}
        >
          <CloseCircleFilled />
        </button>
      ) : null}
    </div>
  );
}
