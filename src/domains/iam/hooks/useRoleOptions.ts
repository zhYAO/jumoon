import { useEffect, useState } from 'react';
import { roleService } from '../services/roleService';

export function useRoleOptions(enabled = true) {
  const [options, setOptions] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    roleService
      .listAllSimple(true)
      .then((list) => {
        if (!alive) return;
        setOptions(list.map((r) => ({ label: `${r.name} (${r.code})`, value: r.id })));
      })
      .catch(() => {
        if (alive) setOptions([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [enabled]);

  return { options, loading };
}
