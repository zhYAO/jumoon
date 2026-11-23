import React from 'react';
import { getMenuIconItem } from './menuIcons';

/** 把图标名渲染成侧栏/表格可用的节点；未知名称不渲染，避免出现破图。 */
export function renderMenuIcon(raw?: string | null, props?: { style?: React.CSSProperties }) {
  const item = getMenuIconItem(raw);
  if (!item) return undefined;
  return React.createElement(item.Icon, props);
}
