# IAM 限界上下文（前端）

对齐后端 `app/iam`：账号、角色、菜单、部门、权限。

| 目录 | 职责 |
|------|------|
| `types/` | 领域 DTO |
| `services/` | 调 `/admin-api/system/*` |
| `hooks/` | useAuth / useRoleOptions / useDeptTree … |
| `components/` | 表单弹窗等 IAM UI |
| `utils/` | accessFactory、菜单树 |

页面只编排 UI，业务调用走 hooks/services。
