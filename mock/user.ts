export default {
  'GET /api/users': (_req: any, res: any) => {
    res.json({
      list: [
        { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'enabled' },
        { id: 2, name: '李四', email: 'lisi@example.com', status: 'disabled' },
        { id: 3, name: '王五', email: 'wangwu@example.com', status: 'enabled' },
      ],
      total: 3,
    });
  },
};
