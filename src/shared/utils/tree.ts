export type TreeNode<T extends { id: number; parentId?: number; children?: TreeNode<T>[] }> = T;

/** 扁平列表 → 树（parentId） */
export function listToTree<T extends { id: number; parentId?: number }>(
  list: T[],
  rootParentIds: number[] = [0],
): (T & { children: (T & { children: any[] })[] })[] {
  const map = new Map<number, T & { children: any[] }>();
  list.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });
  const roots: (T & { children: any[] })[] = [];
  const rootSet = new Set(rootParentIds);
  map.forEach((node) => {
    const pid = node.parentId ?? 0;
    if (rootSet.has(pid) || !map.has(pid)) {
      roots.push(node);
    } else {
      map.get(pid)!.children.push(node);
    }
  });
  return roots;
}

/** 给树节点补 pathName，选中后显示「上级 / 本级」，下拉仍用 name。 */
export function withPathName<T extends { name: string; children?: T[] }>(
  nodes: T[],
  prefix: string[] = [],
): (T & { pathName: string; children?: (T & { pathName: string })[] })[] {
  return nodes.map((node) => {
    const path = [...prefix, node.name];
    const children = node.children?.length ? withPathName(node.children, path) : node.children;
    return { ...node, pathName: path.join(' / '), children };
  });
}
