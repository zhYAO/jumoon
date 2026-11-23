import { useEffect, useState } from 'react';
import { deptService } from '../services/deptService';
import type { SysDept } from '../types';
import { withPathName } from '@/shared/utils/tree';

type Options = {
  /** false 时不请求；默认 true */
  enabled?: boolean;
  /** 选部门场景只展示正常部门，避免选到停用节点 */
  enabledOnly?: boolean;
};

export function useDeptTree(enabledOrOptions: boolean | Options = true) {
  const options: Options =
    typeof enabledOrOptions === 'boolean' ? { enabled: enabledOrOptions } : enabledOrOptions;
  const { enabled = true, enabledOnly = false } = options;
  const [tree, setTree] = useState<SysDept[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await deptService.tree(true, enabledOnly ? { status: 0 } : undefined);
      setTree(withPathName(data || []));
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    reload().catch(() => setTree([]));
  }, [enabled, enabledOnly]);

  return { tree, loading, reload };
}
