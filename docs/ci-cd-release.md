# JUMOON 自动发布规则

状态为待实施。仓库目前有 Umi 前端、Dockerfile 和 Nginx 配置，尚无后端实现和 GitHub Actions 工作流。开发顺序是先建立无生产凭证的前端 PR 检查，后端可运行后再接入 PostgreSQL 集成测试、双镜像候选及发布演练。生产由维护者选择版本并手动触发，流水线通过同地域阿里云 ACR 发布到单台 Linux ECS 上的 Docker Compose。单机更新允许短暂中断，正式发布前确定维护窗口。

## GitHub 流水线

| 触发 | 规则 |
| --- | --- |
| PR | 每个 PR 都启动只读、无生产凭证的工作流。同一 PR 的新提交可取消过时运行。按变更并行运行相关检查。涉及前端时运行 `pnpm test`，前端构建输入变化时编译一次生产包，使用同一份 `dist` 检查页面和体积。后端落地后运行 pytest，涉及服务端、迁移或共享契约时用临时 PostgreSQL 验证集成、空库建表和上一发布基线升级。最终必需检查核对所有应跑作业均成功。 |
| `main` 合并 | 在受信任的运行中按 ECS 实际 CPU 架构并行构建受影响镜像，各组件最多编译一次。在 ACR 写入候选镜像并取得 digest，按 digest 拉回这对镜像，用临时 PostgreSQL 冒烟验证代理、迁移、认证与静态资源。通过后登记可发布清单。失败的候选保留运行记录，禁止生产选用。 |
| 手动生产发布 | 在受信任的 `main` 上用 `workflow_dispatch` 选择成功的候选构建。根据构建记录验证仓库、工作流、分支、源提交和结果，再发布同一对镜像。 |

- **按影响范围调度。** PR 比较与目标分支的合并基点至当前提交。`main` 比较目标提交祖先中最近一份已通过验证、可追溯的候选与目标提交的完整输入差异，覆盖中间失败或取消的提交。仅说明文档变化时跳过组件作业，仅测试变化时运行对应测试。有可信基线时，这两种情形沿用已有镜像。仅 Compose 或主机部署定义变化时验证新定义与既有镜像的组合。仅前端或后端构建输入变化时构建该组件。共享 API 契约、共用构建配置或工作流逻辑变化时验证两端。缺少可信基线、未知路径或无法确认影响时全量检查并重建。全量刷新入口用于基础镜像更新和缓存故障排查。必需工作流在作业内部决定跳过项，避免顶层路径过滤导致检查一直待定。[GitHub 路径过滤与检查状态](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore)
- **复用已验证产物。** 未变组件复用基线清单内的镜像 digest，前提是目标架构、锁文件、基础镜像 digest、构建参数及其他输入一致且镜像仍可拉取。发布清单记录发布编号、目标 Git SHA、每个组件的构建输入指纹、实际源码 SHA 和完整镜像引用及 digest、目标 Alembic revision、CI 运行编号，以及 Compose 定义的版本和所需主机脚本版本。将对应部署定义归档，主机执行前核对版本，回滚时取回上一份清单绑定的定义。全链路用该清单晋级和回滚，部署阶段编译次数为零。候选产物和上一成功版至少保留到回滚窗口结束。
- 保护 `main` 和工作流改动，要求 CI 通过。生产工作流固定部署目标，部署与回滚共享并发组，`cancel-in-progress: false`。可用时用 GitHub Environment 限制生产分支并配置审批，首版手动触发流程不依赖额外套餐能力。[手动触发](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow) · [并发规则](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) · [环境功能条件](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- 外部 Actions 固定完整提交 SHA。前端现有 Dockerfile 使用已结束维护的 Node 20，首次发布前在 CI 与 Dockerfile 上统一验证并固定受支持的 LTS，首选 Node 24。更新基础镜像、依赖和工作流版本时重新走候选验证。线上 ECS 只拉取镜像和运行服务。[现有 Dockerfile](../Dockerfile) · [Node.js 发布状态](https://nodejs.org/en/about/previous-releases) · [GitHub 工作流安全](https://docs.github.com/en/actions/reference/security/secure-use)

## 构建产物与缓存

| 对象 | 实施约束 | 验收 |
| --- | --- | --- |
| 前端镜像 | 在锁文件、包清单及公开的 pnpm 配置单独成层后，用精确版本的 pnpm 和 `--frozen-lockfile` 安装依赖，保留项目所需的 `max setup`。将 Dockerfile 的 `COPY . .` 改为按实际输入复制 `config/`、`src/`、`public/` 与 `tsconfig.json` 等文件。Nginx 配置与展示用的组件版本标识在运行层写入，避免版本标识使全部 JS 失去缓存。使用多阶段构建，运行层只包含 Nginx、配置与可发布的静态文件。 | 修改 README 或后端文件时无需重编前端，单改 Nginx 配置只更新镜像运行层并验证代理。按[前端性能验收](frontend-performance.md)核对路由实际传输量、静态响应与源映射策略。 |
| 后端镜像 | 使用 `backend/` 作为构建上下文。先按锁文件安装生产依赖，再复制应用与 Alembic 配置、迁移。构建阶段可使用编译工具。运行阶段使用兼容的 Python、系统库和目标架构，仅保留 API 与迁移所需内容。测试依赖独立安装。 | 用同一 digest 启动 API、执行一次性迁移并验证健康检查。核对运行用户、所需动态库、迁移文件和镜像传输大小。详见[后端技术基线](backend-architecture.md)。 |
| 缓存与可复现性 | 基础镜像锁定已验证的 digest，按独立变更更新。为每个组件、平台和构建工具版本配置单独的 BuildKit 外部缓存。包下载缓存按系统、架构、工具版本和锁文件区分。限制可信发布缓存的写入来源。各构建上下文排除 Git 历史、本地依赖、生成目录、环境密钥与无关文件。 | 缓存缺失时能按相同锁文件冷构建并通过同一检查。PR 可以使用允许读取的缓存。生产构建只读取可信来源。验证两端缓存能独立命中。[Docker 缓存优化](https://docs.docker.com/build/cache/optimize/) · [BuildKit 缓存范围](https://docs.docker.com/build/cache/backends/gha/#scope) |

## 耗时与成本验收

1. **测开发者等待时间。** 在 GitHub 运行摘要记录排队秒数、首个失败检查反馈秒数、开始运行到必需检查结束的墙钟秒数，以及各并行作业合计 runner 分钟。分阶段记录安装依赖、测试、编译、镜像传输和集成冒烟耗时。按变更类型、runner 型号、架构和冷／热缓存分组。
2. **建立可对照的基线。** 第一次上线流水线时，强制对同一提交执行两次完整构建，分别使用空缓存和上次的缓存。再用一次典型的源码修改测量依赖缓存命中、业务代码需重编的耗时。验证文档、前端、后端和共享输入四种变更的实际构建数，两端就绪后的预期分别为 0、1、1、2。按目标平台汇总 OCI 镜像清单的压缩层大小，同时记录与上一版共享层后实际新增的传输字节、前端路由字节和缓存命中情况。同类运行积累 20 次前保留单次值和中位数，此后用最近 20 次成功运行报告 p50、p95，并单列失败与取消率。首轮目标为部署重编 0 次、典型源码修改复用依赖层，且热缓存的开发者等待中位数短于冷缓存。缓存导入导出用时计入总耗时。
3. **依据实测调整。** 每个受影响的前端 PR 从已编译的产物核对路由字节并运行关键操作冒烟；首轮优化、公共入口变更或指标异常时运行同机多轮浏览器对照。普通 PR 运行受影响的快速检查和必要集成测试，缓存探索、跨版本恢复及全套发布失败演练放到专门的验证运行。检查耗时、runner 分钟或镜像字节出现持续回退时，对相同输入重新测量并定位对应阶段。撤回导致退化的缓存或并行策略，保留原有正确性门禁。线上页面另以[前端性能验收](frontend-performance.md)为准。

## 云端与主机约定

1. **发布身份。** GitHub OIDC 换取阿里云短期 RAM 凭证。发布角色的信任策略绑定当前仓库和信任分支或生产环境，授权固定 ECS 实例、固定云助手命令和结果读取。镜像推送和 ECS 拉取使用独立凭证与最小权限。验证所选 ACR 版本支持 CI 写、ECS 只读。新个人版的 RAM 登录账号与临时 Docker 凭证存在限制，生产启用前以实际鉴权测试为准。[阿里云 OIDC](https://github.com/aliyun/configure-aliyun-credentials-action) · [云助手资源级权限](https://help.aliyun.com/zh/ecs/developer-reference/api-ecs-2014-05-26-invokecommand) · [ACR 个人版限制](https://help.aliyun.com/zh/acr/user-guide/individual-edition-instance-independent-domain-name-capacity-limit/)
2. **触发信息。** 发布作业把已核验的清单写入私有 OSS 的固定生产请求路径，再用云助手调用 ECS 上预装的无参数脚本。请求包含唯一 ID、有效期和预期当前版本，服务器在锁内按严格格式核对，允许的镜像路径固定。脚本把请求作为数据读取，不执行请求中的文本。ECS 记录每个请求的执行结果，同一请求重试时可查回结果。GitHub 核对对应请求的最终状态和退出码后再报告成功。[OSS 权限](https://help.aliyun.com/zh/oss/user-guide/authorization-syntax-and-elements) · [云助手执行结果](https://help.aliyun.com/en/ecs/api-describeinvocationresults)
3. **服务网络。** Compose 固定项目名、应用网络与 PostgreSQL 命名卷。Nginx 通过 `backend:8000` 代理，只有入口端口对外，FastAPI 和 PostgreSQL 留在内部网络。以现有域名为基础统一 HTTPS 主站，证书目录只读挂载并验证续期。HTTP 只处理必要的 ACME 校验和页面跳转，直接拒绝 HTTP 下的 API 请求。[现有 Nginx 配置](../nginx.conf) · [Compose 网络](https://docs.docker.com/compose/how-tos/networking/)
4. **数据与密钥。** PostgreSQL 18 官方镜像的命名卷挂在 `/var/lib/postgresql`。生产数据库密码、认证密钥与拉取凭证由受限的主机配置或密钥服务供应。应用发布保留数据卷与数据库镜像，PostgreSQL 大版本升级单独安排。发布前验证 ECS 架构、镜像拉取、磁盘空间、证书和备份恢复能力。[PostgreSQL 官方镜像卷路径](https://hub.docker.com/_/postgres)

## 发布执行顺序

1. **检查并加锁。** 主机部署脚本用 `flock` 保护整个发布和回滚。核对请求 ID、当前应用版本、数据库 revision 与目标迁移路径。保存当前清单和发布状态。校验并预拉取两个候选镜像。
2. **备份并迁移。** 数据库结构有变更时，在执行前生成可恢复的备份并保存到异机加密存储。用候选后端镜像、迁移账号和一次性进程执行 `alembic upgrade head`，核对实际 revision。失败即停止应用切换，并记录数据库状态。迁移默认先增加兼容结构，再切换应用和回填，最后另次发布清理旧结构。[Alembic](https://alembic.sqlalchemy.org/en/latest/tutorial.html) · [PostgreSQL 备份与恢复](https://www.postgresql.org/docs/18/backup.html)
3. **按依赖更新容器。** 启动候选后端并等待就绪，再更新前端与 Nginx。切换 HTML 入口前，把新镜像内使用内容哈希或版本目录的静态资源复制到跨版本持久目录，按原 URL 提供，只增不覆盖。新旧资源先同时可用，再启用新入口。至少保留覆盖回滚和已约定旧页面使用时限的资源，清理前检查仍在支持期的清单引用。HTML 入口与非哈希资源按[缓存规则](frontend-performance.md)服务。后端重建后重新加载或重建 Nginx，使其解析到当前后端。使用 Compose 健康检查、`--wait` 和明确的超时。验证旧前端与新后端兼容。[Docker Compose 启动和等待](https://docs.docker.com/reference/cli/docker/compose/up/)
4. **验证入口与版本。** 核对实际运行的两个镜像 digest。从 HTTPS 入口检查首页、前端构建标识与 `/admin-api/health/ready`。就绪接口检查数据库连接和应用所需的结构，返回构建标识。分别与清单中的组件源码 SHA 核对。构建标识和就绪响应禁用缓存。另验证 HTTP API 未被代理。生产自动探测只读。通过后原子更新当前发布记录，保留 Git SHA、镜像 digest、数据库 revision、备份位置和流水线链接。
5. **按数据库状态决定回滚。** 迁移后若应用检查失败，并且确认库结构兼容上一版，就用上一版发布清单恢复前后端，再重新检查 HTTPS 入口。就绪检查接受向后兼容的较新库结构。首次发布检查失败则关闭候选应用入口并保留数据卷。迁移失败或兼容性不明确时保留现场，先核对数据库再决定恢复。应用回滚流程不降级数据库或回灌备份。

## 首次生产发布验收

- 在隔离环境演练成功发布、重复触发、迁移失败、健康检查失败和上一版回滚。用临时账号验证真实 HTTPS 登录、续期及读取权限，确认生产不会开放 Mock 写入入口。
- 用候选 A 打开页面，保留标签页，发布候选 B 后在 A 标签页进入尚未访问的懒加载路由。核对旧 JS/CSS 的响应体、MIME、状态与缓存头，并检查缺失静态资源返回 404。在 B 运行期间再打开一个 B 标签页，保持打开并回滚至 A，在该标签页重复验证。演练覆盖 Nginx 重建，留存两版清单、被请求的资源 URL 和结果。
- 定期异机备份，并在隔离数据库演练恢复。核对数据、权限和运行记录，记录可接受的数据丢失窗口与恢复时间。涉及破坏性迁移的发布单独安排窗口，先确定停写、恢复点和发布后写入的处理方式。
- 生产发布后保留可查询的 CI 日志、云助手退出状态、当前与上一版清单。生产凭证和敏感业务数据从输出中脱敏。
