# 前端公共层（shared）

跨限界上下文复用，禁止依赖具体业务 domain。

| 目录 | 职责 |
|------|------|
| `api/` | HTTP 解包、ApiResult 类型 |
| `constants/` | 存储 key、状态枚举 |
| `utils/` | token 读写、树工具 |
| `components/` | StatusTag、Permission |
| `hooks/` | useAsyncAction |

业务域代码放在 `src/domains/<context>/`。
