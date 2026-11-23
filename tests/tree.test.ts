import { describe, expect, it } from 'vitest';
import { listToTree, withPathName } from '@/shared/utils/tree';

describe('listToTree', () => {
  it('按 parentId 组装层级', () => {
    const tree = listToTree([
      { id: 1, parentId: 0, name: '系统管理' },
      { id: 2, parentId: 1, name: '用户管理' },
      { id: 3, parentId: 2, name: '用户查询' },
    ]);
    expect(tree.map((n) => n.id)).toEqual([1]);
    expect(tree[0].children.map((n) => n.id)).toEqual([2]);
    expect(tree[0].children[0].children.map((n: any) => n.id)).toEqual([3]);
  });

  it('父节点缺失的节点提升为根，避免整块消失', () => {
    const tree = listToTree([{ id: 5, parentId: 999, name: '孤儿菜单' }]);
    expect(tree.map((n) => n.id)).toEqual([5]);
  });

  it('空列表返回空树', () => {
    expect(listToTree([])).toEqual([]);
  });

  it('支持自定义根 parentId', () => {
    const tree = listToTree(
      [
        { id: 1, parentId: 100 },
        { id: 2, parentId: 1 },
      ],
      [100],
    );
    expect(tree.map((n) => n.id)).toEqual([1]);
    expect(tree[0].children.map((n) => n.id)).toEqual([2]);
  });

  it('不修改入参对象', () => {
    const input = [{ id: 1, parentId: 0 }];
    listToTree(input);
    expect(input[0]).not.toHaveProperty('children');
  });
});

describe('withPathName', () => {
  it('给子节点拼上上级路径', () => {
    const tree = withPathName([
      {
        name: 'JUMOON',
        children: [
          { name: '测试' },
          { name: '运营', children: [{ name: '华东' }] },
        ],
      },
      { name: '财务' },
    ]);
    expect(tree[0].pathName).toBe('JUMOON');
    expect(tree[0].children?.[0].pathName).toBe('JUMOON / 测试');
    expect(tree[0].children?.[1].children?.[0].pathName).toBe('JUMOON / 运营 / 华东');
    expect(tree[1].pathName).toBe('财务');
  });
});
