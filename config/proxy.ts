/**
 * 开发代理：对齐后端 FastAPI `/admin-api`
 */
export default {
  '/admin-api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
};
