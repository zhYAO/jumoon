import { defineConfig } from '@umijs/max';
import routes from './routes';
import proxy from './proxy';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'JUMOON',
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: false,
    title: false,
  },
  // Browser tab icon only (sidebar/login logos unchanged)
  favicons: ['/favicon.png'],
  routes,
  proxy,
  mock: false,
  npmClient: 'pnpm',
});
