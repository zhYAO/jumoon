# web-frontend

JUMOON 业务管理系统前端（Umi Max + Ant Design）。IAM/RBAC 按 **DDD 限界上下文** 分层，对接 `web-backend` `/admin-api`。

## 分层

```text
src/
  shared/                 # 公共层：api / utils / hooks / components
  domains/iam/            # IAM 上下文：types / services / hooks / components / utils
  pages/system/*          # 用户/角色/菜单/部门页面（薄编排）
  pages/Login             # 登录（邮箱+密码）
```

详见：

- `src/shared/README.md`
- `src/domains/iam/README.md`

## 本地

```bash
# 后端需先起：http://127.0.0.1:8000
cd web-frontend
pnpm install
pnpm dev
```

代理：`/admin-api` → `127.0.0.1:8000`（`config/proxy.ts`）

种子账号：`admin@jumoon.com` / `admin123`

## 产品文档

- [系统管理产品说明书](docs/系统管理产品手册.md)
