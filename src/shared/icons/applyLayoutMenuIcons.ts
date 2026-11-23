import {
  collectIconByPath,
  collectMenuPaths,
  iconNameForMenuPath,
  normalizePath,
  type MenuPathNode,
} from './menuIcons';
import { isProductPrototypePath } from '@/domains/product/prototypeNavigation';
import { renderMenuIcon } from './renderMenuIcon';

type LayoutMenu = {
  path?: string;
  icon?: any;
  children?: LayoutMenu[];
  [key: string]: any;
};

const ALWAYS_SHOW = new Set(['/home']);

/** 侧栏只展示后端仍有效的菜单（停用的目录/页面不再出现）。首页始终保留。 */
export function filterLayoutMenusByBackend(menuData: LayoutMenu[], backendMenus: MenuPathNode[] = []) {
  const allowed = collectMenuPaths(backendMenus);
  const walk = (items: LayoutMenu[]): LayoutMenu[] =>
    items.flatMap((item) => {
      const children = item.children?.length ? walk(item.children) : item.children;
      if (children?.length) {
        return [{ ...item, children }];
      }
      const path = normalizePath(item.path || '');
      if (ALWAYS_SHOW.has(path) || isProductPrototypePath(path) || allowed.has(path)) {
        return [{ ...item, children }];
      }
      return [];
    });
  return walk(menuData);
}

/** 先按后端有效菜单过滤，再贴图标。 */
export function applyLayoutMenuIcons(menuData: LayoutMenu[], backendMenus: MenuPathNode[] = []) {
  const visible = filterLayoutMenusByBackend(menuData, backendMenus);
  const backend = collectIconByPath(backendMenus);
  const walk = (items: LayoutMenu[]): LayoutMenu[] =>
    items.map((item) => ({
      ...item,
      icon: renderMenuIcon(iconNameForMenuPath(item.path || '', backend)),
      children: item.children?.length ? walk(item.children) : item.children,
    }));
  return walk(visible);
}
