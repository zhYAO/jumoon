import { useEffect, useState } from 'react';
import { menuService } from '../services/menuService';
import { menusToTree } from '../utils/menuTree';
import type { SysMenu } from '../types';

export function useMenuTreeData(enabled = true) {
  const [flat, setFlat] = useState<SysMenu[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await menuService.list(undefined, true);
      setFlat(list);
      setTree(menusToTree(list));
    } catch {
      setFlat([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    reload().catch(() => {
      setFlat([]);
      setTree([]);
    });
  }, [enabled]);

  return { flat, tree, loading, reload };
}
