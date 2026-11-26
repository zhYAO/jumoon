# JUMOON 后端技术基线

状态为待实施。首批目标是用真实员工账号登录，加载权限菜单并通过续期、退出和首次改密验收。前端认证随首批一起切换至同源 HttpOnly 续期 Cookie。

## 技术栈与边界

| 层 | 一期约定 |
| --- | --- |
| API | Python 3.14、FastAPI、Pydantic。用 OpenAPI 维护请求、响应及错误契约。 |
| 数据 | PostgreSQL 18、SQLAlchemy 2.x、Alembic。首版统一使用同步会话与请求内事务边界。 |
| 仓库 | 前端留在根目录，FastAPI 放在 `backend/`。服务内部按系统管理、项目与合作、财务分模块。 |
| 验证 | pytest 跑服务端测试，集成测试使用与目标环境同大版本的 PostgreSQL。 |

首次构建验证 Python 和依赖兼容性。锁定应用依赖，提交锁文件。开发、CI 和生产使用相同大版本，补丁升级通过测试与候选镜像发布。数据库运行账号只持有业务读写权限，由独立迁移账号执行 DDL。启用结构化日志和请求 ID，记录接口耗时、错误及关键业务操作。日志过滤密码、令牌、Cookie 和完整收款账号。 [Python 支持周期](https://devguide.python.org/versions/) · [PostgreSQL 支持周期](https://www.postgresql.org/support/versioning/) · [FastAPI 接口能力](https://fastapi.tiangolo.com/features/) · [Alembic 迁移](https://alembic.sqlalchemy.org/en/latest/tutorial.html)

## 接口与认证

1. **保留接口入口。** 使用 [认证服务](../src/domains/iam/services/authService.ts) 和 [IAM 类型](../src/domains/iam/types/index.ts) 中的路径和字段作为已有契约。统一响应为 `{ code, data, msg }`，成功码为 `0`，分页为 `{ list, total }`。在认证改造中同步调整请求、响应和前端类型。令牌失效返回 `401`，已认证的权限拒绝返回 `403`。后端在执行写入前完成认证和授权。
2. **改造浏览器凭证。** 登录、续期和首次改密返回短时访问令牌，浏览器仅在内存持有，通过 Bearer 请求受保护资源。续期凭证使用不可预测的随机值，服务端只保存摘要、有效期和会话关联。签发和轮换通过 `Set-Cookie` 写入 Host-only、`Secure`、`HttpOnly`、`SameSite=Lax` 的 Cookie。续期与退出通过 Cookie 识别会话，响应体不返回续期凭证，认证响应设置 `Cache-Control: no-store`。删除前端持久化令牌逻辑，清理历史存储键。[当前令牌存储](../src/shared/utils/storage.ts) · [OWASP 会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
3. **处理恢复与并发。** 从页面刷新和新标签打开时先尝试一次会话恢复。续期在服务端原子更新，前端协调跨标签并发，正常并发不会误撤销会话。授权请求最多重试一次。登录、续期和退出不参与自动续期重试。使用 Cookie 的写接口拒绝非允许来源，校验 `Origin` 并要求同源应用发送 CSRF 防护请求头或令牌。开发可通过同源代理联调，含 Cookie 的验收覆盖真实 HTTPS。[当前续期入口](../src/shared/api/authSession.ts) · [OWASP CSRF 防护](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
4. **使撤销即时生效。** 访问令牌关联服务端会话。每次鉴权校验会话有效性和用户状态。退出撤销当前会话并清理 Cookie，停用账号、管理员重置密码撤销全部相关会话。旧访问令牌即使尚未过期也会被拒绝。首次改密期间，后端仅放行完成改密和管理当前会话所需的接口。改密成功时撤销原受限会话并签发新会话。服务端使用 Argon2id 保存密码，限制登录尝试，从受控配置初始化首位管理员，生产禁用默认口令。[系统管理产品手册](系统管理产品手册.md) · [OWASP 密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
5. **用真实权限保护业务。** 按当前员工身份检查操作权限、对象可见范围和字段暴露范围，包括直接请求详情或写接口。角色数据范围按产品手册合并，业务归属以真实用户 ID 表示。未接入真实后端与权限校验的 Mock 写入页面在生产隔离，覆盖菜单和直接路由。

## 数据与付款

- 数据库约束保护必填、唯一性和引用关系。已发布的迁移用新 revision 演进。CI 同时验证空库创建和上一发布基线升级。
- 金额用 PostgreSQL `NUMERIC` 与 Python `Decimal`。API 传约定精度的十进制字符串，统一校验精度、币种、正数和上限。看板按币种聚合，换汇口径经产品确认后再实现。[PostgreSQL 金额类型](https://www.postgresql.org/docs/18/datatype-numeric.html)
- 同一合作中影响可用额度的写操作采用同一锁顺序。服务端在事务内锁定合作，重新读取额度，拒绝零、负数、超额及非法状态流转，再写入付款和审计记录。申请、审批、登记付款支持幂等键，同一键与相同载荷返回原结果，不同载荷返回冲突，数据库唯一约束保护并发重复请求。[PostgreSQL 行级锁](https://www.postgresql.org/docs/18/explicit-locking.html)
- 分别计算可申请余额、占用金额和实际已付款。全额待审只占用额度。实际打款后由财务登记是一期方案的规划假设，审批退回、补充重提和分期的规则在实现对应接口前确认。 [当前 Mock 付款口径](../src/domains/product/coopPayProgress.ts)

## 查询与单机容量

1. **绑定查询范围。** 列表在 SQL 中同时应用用户权限、过滤条件、稳定排序与分页，约定默认和最大页长，只选页面用到的字段。看板按授权范围、币种和所选时间段在数据库汇总。列表从 10 条扩大到 50 条时，SQL 往返次数应保持有界。需要关联数据时用联表或批量加载，在代表性数据上用查询计数和只读查询的 `EXPLAIN (ANALYZE, BUFFERS)` 验证索引与扫描量。[SQLAlchemy 关系加载](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html) · [PostgreSQL 查询计划](https://www.postgresql.org/docs/18/using-explain.html)
2. **给数据库和同机服务留出资源。** 同步数据库调用放在普通 `def` 路由或明确的线程边界，每次请求单独使用并关闭 Session。初始从单个 API worker 起测。所有实例的 worker 数乘以每 worker 的 `pool_size + max_overflow`，加上迁移、备份和管理预留连接，应低于数据库可用上限。记录连接等待、各容器 CPU 和峰值内存，尤其是并发登录时 Argon2id 的开销。根据实测调整 worker、连接池和请求并发上限。[FastAPI 同步调用](https://fastapi.tiangolo.com/async/) · [SQLAlchemy 连接池](https://docs.sqlalchemy.org/en/20/core/pooling.html)
3. **在相同负载下验收。** 首版在与 ECS 同规格的隔离环境使用候选镜像和 PostgreSQL，记录 vCPU、内存、数据量、角色、并发、请求比例与测试时长。覆盖会话恢复、权限信息、项目列表和首页指标；在有付款接口后加入并发写入与读写混合场景。用预计峰值连续测 10 分钟，逐档加压确认首先饱和的资源。峰值未知时先给出不同并发档位的吞吐与延迟曲线。报告各接口成功率、p50/p95、查询次数、连接等待和内存峰值。
4. **首轮验收目标。** 对成功的普通权限与分页读请求，建议起始目标为服务端 p95 ≤ 300 ms，看板汇总 p95 ≤ 600 ms；在约定峰值下要求无意外 5xx、连接池超时或 OOM。登录单列耗时，同时验证密码哈希配置和限流。空库、回环网络和健康探针的数据各自单列。首次用真实流量规模校准目标并记录依据，后续候选在同一负载和夹具下比较。

## 后端镜像验收

- 基于受支持的 Python 3.14 slim 镜像，构建和运行阶段固定兼容的基础镜像 digest、操作系统和目标 CPU 架构。在构建阶段基于锁文件准备 wheel 或依赖环境，最终层只带应用、运行依赖、所需共享库和 Alembic 配置及迁移文件。使用非 root 用户运行 API；迁移通过同一镜像的单独命令启动。[Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/) · [Docker 基础镜像选择](https://docs.docker.com/build/building/best-practices/)
- 用最终 digest 在临时 PostgreSQL 上实测导入数据库驱动、空库迁移、上一版升级、启动并就绪及一次受保护读取。记录该架构的镜像压缩层字节、干净主机拉取耗时、容器启动到就绪耗时和峰值内存。首个通过功能与负载验证的镜像建立基线，后续维持或降低压缩层大小与启动耗时；新增依赖导致增长时，在 PR 列出增长的层、字节数及业务理由，并在同规格环境复测就绪耗时与峰值内存。[候选镜像与发布规则](ci-cd-release.md)

## 开发顺序与验收

| 顺序 | 验收结果 |
| --- | --- |
| 1. 登录与权限 | 用真实账号登录，验证同源 Cookie、页面刷新、多标签续期、首次改密，退出与重置后用旧访问令牌直接请求也被拒绝。 |
| 2. 系统管理 | 管理员能开通账号和分配权限，员工无法读取或修改越权对象。直接访问未接入的 Mock 业务页面受限。 |
| 3. 项目、达人和合作 | 用不同账号创建、分配、查看同一条持久化业务记录，权限和数据范围一致。 |
| 4. 付款和看板 | 覆盖负数、并发申请超额、重复提交、分次付款和按币种汇总。用同一笔业务核对项目、合作、付款和看板。 |
