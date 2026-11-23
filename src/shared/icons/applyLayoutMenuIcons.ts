import {
  collectIconByPath,
  collectMenuPaths,
  iconNameForMenuPath,
  normalizePath,
  type MenuPathNode,
} from './menuIcons';
import { renderMenuIcon } from './renderMenuIcon';

type LayoutMenu = {
  path?: string;
  icon?: any;
  children?: LayoutMenu[];
  [key: string]: any;
};

const ALWAYS_SHOW = new Set(['/home']);

/** 保留后端有效菜单、首页，以及调用方指定的前端菜单。 */
export function filterLayoutMenusByBackend(
  menuData: LayoutMenu[],
  backendMenus: MenuPathNode[] = [],
  keepFrontendPath?: (path: string) => boolean,
) {
  const allowed = collectMenuPaths(backendMenus);
  const walk = (items: LayoutMenu[]): LayoutMenu[] =>
    items.flatMap((item) => {
      const children = item.children?.length ? walk(item.children) : item.children;
      if (children?.length) {
        return [{ ...item, children }];
      }
      const path = normalizePath(item.path || '');
      if (ALWAYS_SHOW.has(path) || allowed.has(path) || keepFrontendPath?.(path)) {
        return [{ ...item, children }];
      }
      return [];
    });
  return walk(menuData);
}

/** 先按后端有效菜单过滤，再贴图标。 */
export function applyLayoutMenuIcons(
  menuData: LayoutMenu[],
  backendMenus: MenuPathNode[] = [],
  keepFrontendPath?: (path: string) => boolean,
) {
  const visible = filterLayoutMenusByBackend(menuData, backendMenus, keepFrontendPath);
  const backend = collectIconByPath(backendMenus);
  const walk = (items: LayoutMenu[]): LayoutMenu[] =>
    items.map((item) => ({
      ...item,
      icon: renderMenuIcon(iconNameForMenuPath(item.path || '', backend)),
      children: item.children?.length ? walk(item.children) : item.children,
    }));
  return walk(visible);
}
