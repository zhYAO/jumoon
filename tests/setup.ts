/**
 * 用 node 环境跑测试，只补齐被测代码真正依赖的浏览器 API，
 * 避免为了 localStorage / location 引入完整的 jsdom。
 */
import { beforeEach, vi } from 'vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const storage = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true });
Object.defineProperty(globalThis, 'window', {
  value: {
    location: { pathname: '/system/user', search: '' },
    localStorage: storage,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  },
  writable: true,
});

beforeEach(() => {
  storage.clear();
  (globalThis as any).window.location = { pathname: '/system/user', search: '' };
  vi.restoreAllMocks();
});
