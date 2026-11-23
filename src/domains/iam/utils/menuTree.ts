import { listToTree } from '@/shared/utils/tree';
import type { SysMenu } from '../types';

export function menusToTree(menus: SysMenu[]) {
  return listToTree(
    menus.map((m) => ({
      ...m,
      parentId: m.parentId,
      title: m.name,
      key: m.id,
      value: m.id,
    })),
  );
}
