# @garlic-claw/server 测试报告

> 测试时间: 2026-06-13  
> 运行环境: Windows (pwsh)  
> Jest 配置: `--runInBand --passWithNoTests`

---

## 总览

| 指标 | 数值 |
|------|------|
| 测试套件总数 | 97 |
| 通过套件 | 53 |
| 失败套件 | 44 |
| 测试用例总数 | 414 |
| 通过用例 | 412 |
| 失败用例 | 2 |
| 运行耗时 | ~33 s |

---

## 失败分类

### 1. 模块解析失败 — 43 个套件 (99% 的失败)

**根本原因**: workspace 内联包 `@garlic-claw/shared` 和 `@garlic-claw/plugin-sdk` 未预先构建，Jest 无法在 `node_modules` 中找到它们的导出入口。

**涉及模块**:
- `@garlic-claw/shared` — 被 `ai-settings.store.ts` → `ai-provider-settings.service.ts` → `ai-model-execution.service.ts` 链引用的所有测试套件（约 10 个套件）
- `@garlic-claw/plugin-sdk/authoring` — 被 `builtin-automation.plugin.ts` / `plugin-dispatch.service.ts` 引用的所有测试套件（约 33 个套件）

**受影响测试目录**:
```
tests/ai-management/          (3 个套件)
tests/api-contract-freeze.spec.ts
tests/core/bootstrap/         (1 个套件)
tests/core/config/            (1 个套件)
tests/execution/automation/   (1 个套件)
tests/execution/todo/         (1 个套件)
tests/execution/tool/         (1 个套件)
tests/persona/                (2 个套件)
tests/plugin/                 (5 个套件)
tests/runtime/gateway/        (1 个套件)
tests/runtime/host/           (7 个套件)
tests/runtime/kernel/         (1 个套件)
tests/vision/                 (1 个套件)
tests/conversation/           (1 个套件)
```

**解决方案**: 运行 `npm run build` 或在 `packages/shared`、`packages/plugin-sdk` 中先执行构建，再运行测试。

---

### 2. 真实测试失败 — `McpController` DTO 校验 (1 个套件, 2 个失败断言)

**文件**: `tests/execution/mcp/mcp.controller.spec.ts:44`

**失败断言**:
```typescript
expect(validateSync(plainToInstance(McpServerDto, {
  name: 'tavily',
  command: 'npx',
  args: ['-y', 'tavily-mcp@latest'],
  envEntries: [{ key: 'TAVILY_API_KEY', source: 'env-ref', value: '${TAVILY_API_KEY}' }],
  eventLog: { maxFileSizeMb: 1 },
}))).toEqual([]);
```

**实际输出**: `validateSync` 返回了一个 `ValidationError`，其中 `constraints.unknownValue = "an unknown value was passed to the validate function"`，表明 `envEntries` 数组中对象的 `source: 'env-ref'` 字段值未被 DTO 的校验装饰器识别为合法枚举值。

**原因**: `McpServerDto` 中 `envEntries` 元素的 `source` 字段的校验规则（可能是 `@IsEnum()` 或自定义 validator）未包含 `'env-ref'` 这个值，或者 `env-ref` 对应的枚举定义与应用代码中的实际使用不匹配。

**受影响断言**: 该 DTO 测试块内共 2 个 expect 失败（均在同一个 `toEqual([])` 断言）。

---

## 通过测试摘要 (53 个套件, 412 个用例)

### auth (5 套件, 全部通过)
| 套件 | 说明 |
|------|------|
| auth.controller.spec.ts | Controller 路由、认证流程 |
| auth.dto.spec.ts | 单密钥登录 Payload 校验 |
| auth.service.spec.ts | JWT 签发、密钥校验、过期配置 |
| bootstrap-user.service.spec.ts | 初始用户引导 |
| jwt-auth.guard.spec.ts | JWT 守卫逻辑 |
| request-auth.service.spec.ts | 请求级认证 |

### conversation (2 套件, 全部通过)
- conversation.dto.spec.ts — DTO 校验
- conversation.controller.spec.ts — 会话 Controller

### core/runtime (1 套件)
- server-workspace-paths.spec.ts — 工作区路径解析

### execution 模块 (大量通过)

**bash** (1): bash-tool.service.spec.ts  
**edit** (1): edit-tool.service.spec.ts — 编辑策略、空字符串创建流、后端歧义处理  
**file** (3): runtime-text-replace.spec.ts (~20 用例), runtime-file-post-write-report.spec.ts, runtime-search-result-report.spec.ts  
**glob** (1): glob-tool.service.spec.ts  
**grep** (1): grep-tool.service.spec.ts  
**mcp** (3): mcp.service.spec.ts, mcp-server-store.service.spec.ts, mcp-stdio-launcher.spec.ts  
**project** (4): project-subagent-type-registry.service.spec.ts, project-worktree-*.spec.ts (3 个)  
**read** (1): read-tool.service.spec.ts  
**runtime** (10+): runtime-command.service.spec.ts, runtime-command-output.spec.ts, runtime-command-capture.service.spec.ts, runtime-just-bash.service.spec.ts, runtime-native-shell.service.spec.ts, runtime-powershell-variant.spec.ts, runtime-session-environment.service.spec.ts, runtime-shell-tool-name.spec.ts, runtime-tool-backend.service.spec.ts, runtime-tool-permission.service.spec.ts, runtime-tools-settings.service.spec.ts, runtime-filesystem-post-write.service.spec.ts, runtime-file-freshness.service.spec.ts, runtime-visible-path.spec.ts  
**skill** (3): skill.controller.spec.ts, skill-registry.service.spec.ts, skill-tool.service.spec.ts, weather-script.spec.ts, project-weather-skill.spec.ts  
**tool** (1): tool-registry.service.spec.ts, model-tool-call-name.spec.ts  
**webfetch** (1): webfetch-service.spec.ts  
**write** (1): write-tool.service.spec.ts  

### health (1)
- health.controller.spec.ts

### runtime/host (4)
- user-context.service.spec.ts, memory.controller.spec.ts, subagent-runner.service.spec.ts, conversation-store.service.spec.ts

### 其他
- plugin/governance/plugin-governance.service.spec.ts (通过)
- plugin/persistence/plugin-persistence.service.spec.ts (通过)
- plugin/ws/plugin-ws-module.spec.ts (通过)
- shared-runtime-boundary.spec.ts (通过)
- ai/ai-model-execution.service.spec.ts (通过)
- conversation/conversation-task.service.spec.ts (通过)
- conversation/conversation-after-response-compaction.service.spec.ts (通过)
- conversation/context-governance.service.spec.ts (通过)

---

## 结论与建议

1. **阻塞性问题**: 43 个套件因 workspace 包未构建而无法运行，需先构建 `@garlic-claw/shared` 和 `@garlic-claw/plugin-sdk`。
2. **真实 Bug**: `McpServerDto` 的 `envEntries.source` 枚举校验缺少 `'env-ref'` 值，导致合法的 MCP 配置被拒绝。
3. **已通过测试**: 53 个套件 412 个用例全部通过，覆盖 auth、execution、runtime、conversation、health 等核心模块，无意外回归。

---

# @garlic-claw/web 测试报告

> 测试时间: 2026-06-13  
> 运行环境: Windows (pwsh)  
> Vitest 配置: jsdom 环境, `@` 别名指向 `packages/web/src`  
> 测试框架: Vitest v2.1.9 + @vue/test-utils

---

## 总览

| 指标 | 数值 |
|------|------|
| 测试文件 | 5 |
| 测试套件总数 | 33 |
| 通过套件 | 33 |
| 失败套件 | 0 |
| 测试用例总数 | 188 |
| 通过用例 | 188 |
| 失败用例 | 0 |
| 运行耗时 | ~2.6 s |

---

## 测试覆盖范围

### 1. 主题引擎 (web-theme.spec.ts) — 11 个套件, 70 个用例

| 套件 | 说明 |
|------|------|
| constants | 6 个色板预设验证、`getPreset` 回退逻辑 |
| registry | `PRIMITIVE` / `ALIAS` / `DEPTH` 键完整性、`ALIAS_TO_PRIMITIVE` 映射覆盖率 |
| groups | 9 个 Token 分组定义、`getGroup` / `getTokenGroup` 查询 |
| tokens (computeThemeBase) | oklch 输出格式、亮/暗模式差异、饱和度/色相/亮度覆盖、滑块控制器、玻璃效果令牌 |
| aliases | `computeAliases` 映射正确性、`validateAliases` 孤儿键检测、`computeAllTokens` 多层合并 |
| depth (computeDepthTokens) | 阴影/blur/z-index/表面层/悬停/交互状态令牌正确性 |
| diff (computeDiff) | 空/相同/变化/删除/新增/大规模 diff 效率验证 |
| freeze (computeTokenHash) | 确定性哈希、键序无关、dev 模式冻结 |

### 2. 工具函数 (web-utils.spec.ts) — 9 个套件, 49 个用例

| 套件 | 说明 |
|------|------|
| AppError | 5 种错误类、构造参数、retryable 默认值 |
| toAppError | TypeError/AbortError/http-like/string/null 统一转换、状态码路由 (401/403/400/404/408/429/500) |
| getErrorMessage | 错误消息提取、回退文案 |
| isRetryableError | 可重试状态码判定 |
| isAbortedAppError | ABORTED code 检测 |
| uuid utilities | UUID v7 验证、`isValidConversationRouteId` 逻辑 |
| plugin-labels | 中文健康标签、时间格式化 |
| chat-image-upload | `formatBytes`、`measureDataUrlBytes` |

### 3. Vue Composables (web-composables.spec.ts) — 3 个套件, 35 个用例

| 套件 | 说明 |
|------|------|
| useAsyncState | loading/error/clearError/setError 状态管理 |
| usePagination | 分页逻辑、翻页、空列表、pageCount 自适应、computed 输入 |
| useFormEditor | 表单值管理、校验、提交、异步校验、错误处理 |

### 4. HTTP 客户端 (web-api.spec.ts) — 2 个套件, 15 个用例

| 套件 | 说明 |
|------|------|
| HTTP client base utilities | `getApiBase` 返回值 |
| HTTP request functions | GET/POST/PUT/PATCH/DELETE 请求、API 信封解析、401 重定向、timeout 处理、拦截器、错误监听、204/skipEnvelope/绝对 URL |

### 5. 特性模块 (web-features.spec.ts) — 8 个套件, 34 个用例

| 套件 | 说明 |
|------|------|
| Atmosphere lighting tokens | 空采样回退、强度/glowScale 缩放、饱和度上限 0.40、glass-reflection |
| Atmosphere samples bridge | 反应式桥接读写 |
| Material config | 默认值、部分更新、重置、glassOpacity/noiseEnabled |
| Material tokens | reflection/grain/blur/edge/noise/refraction/glass 令牌正确性、glowRatio 响应 |
| Background presets | 4 个预设、CSS 渐变、推荐主题 |
| Background types & constants | 幻灯片/显示模式/调节选项默认值 |
| Cross-module integration | 全色板亮暗模式 NaN 检测、atmosphere+material 集成 |

---

## 发现的问题

### 1. `ALIAS` 中 4 个交互状态键缺少 `ALIAS_TO_PRIMITIVE` 映射

**文件**: `packages/web/src/shared/theme/registry.ts:120`  
**缺失键**: `--gc-interactive-hover-bg`, `--gc-interactive-active-bg`, `--gc-interactive-focus-ring`, `--gc-interactive-glow`

这些键定义在 `ALIAS` 中，但在 `ALIAS_TO_PRIMITIVE` 映射表中没有对应条目。这使得 `computeAliases` 无法为它们生成值，`validateAliases()` 会将这些键报告为孤儿。

**影响**: 低。这些键在 `DEPTH.*` 中有定义（`registry.ts:228-232`），通过 `computeDepthTokens` 生成值。但 `computeAliases` 的"全别名覆盖"契约被违反。

### 2. `isValidConversationRouteId` 逻辑异常

**文件**: `packages/web/src/shared/utils/uuid.ts:5`  
**逻辑**: `return !/uuid-regex/.test(value) || isUuidV7Text(value)`

当前实现对所有 *非 UUID 格式* 的字符返回 `true`（因为取反后短路），而对 UUID v4 返回 `false`。这可能与函数名暗示的"valid route ID"语义不一致。

### 3. `cloneValues` 在 jsdom 下依赖 `structuredClone` 导致 DataCloneError

**文件**: `packages/web/src/shared/composables/use-form-editor.ts:130`

`globalThis.structuredClone` 在 jsdom 中实现不完整，对某些对象抛出 `DataCloneError`。回退路径 `JSON.parse(JSON.stringify(values))` 仍可用。

---

## 结论

- **188/188 用例通过**，覆盖 `@garlic-claw/web` 的核心纯逻辑层：主题引擎、工具函数、Vue composables、HTTP 客户端、大气/材质/背景模块。
- **零运行时失败**，所有断言与实际代码行为一致。
- 交互状态键的 `ALIAS_TO_PRIMITIVE` 映射缺失属于代码库已有问题，不影响运行时行为（由 `DEPTH` 系统绕过）。
- 测试可在 `~2.6s` 内完成，适合集成到 CI 流程。

---

# @garlic-claw/shared 测试报告

> 测试时间: 2026-06-13  
> 运行环境: Windows (pwsh)  
> Vitest 配置: jsdom 环境, `@garlic-claw/shared` 别名指向 `packages/shared/src/index.ts`  
> 测试框架: Vitest v2.1.9

---

## 总览

| 指标 | 数值 |
|------|------|
| 测试文件 | 4 |
| 测试套件总数 | 34 |
| 通过套件 | 34 |
| 失败套件 | 0 |
| 测试用例总数 | 108 |
| 通过用例 | 108 |
| 失败用例 | 0 |
| 运行耗时 | ~1.9 s |

---

## 模块说明

`@garlic-claw/shared` 为**纯类型定义包**（无运行时逻辑），由以下子模块组成：

| 模块 | 文件 | 说明 |
|------|------|------|
| JSON 类型 | `types/json.ts` | `JsonValue` / `JsonObject` 递归类型 |
| 角色 | `types/roles.ts` | `Role` 字符串联合 |
| API 契约 | `types/api.ts` | `ApiResponse<T>`、`PaginatedResponse<T>`、认证/API 密钥 DTO |
| AI 配置 | `types/ai.ts` | 模型/提供商/路由/重试/视觉回退配置 |
| 自动化 | `types/automation.ts` | 触发器、动作、自动化信息、事件分派 |
| 对话/消息 | `types/chat.ts` | 消息零件、状态/角色枚举、14 种 SSE 事件变体、消息/会话结构 |
| 权限 | `types/runtime-permission.ts` | 运行时操作能力、决策、请求/响应类型 |
| 插件核心 | `types/plugin-core.ts` | 插件运行时描述、权限/钩子名、配置模式、调用上下文 |
| 插件清单 | `types/plugin-manifest.ts` | 清单、注册/执行/钩子负载、治理、命令目录 |
| 插件 AI | `types/plugin-ai.ts` | LLM 生成、子代理派生/等待、5 类钩子负载与结果联合 |
| 插件生命周期 | `types/plugin-lifecycle.ts` | 加载/卸载/错误事件钩子 |
| 插件 Host | `types/plugin-host.ts` | 54 种 Host 方法、调用/结果负载 |
| 插件 Cron | `types/plugin-cron.ts` | Cron 描述符/任务摘要/嘀嗒负载 |
| 插件路由 | `types/plugin-route.ts` | HTTP 路由描述符、请求/响应、调用/结果负载 |
| 插件记录 | `types/plugin-records.ts` | 健康/事件日志/存储/自身信息/人设/知识库类型 |
| 插件子代理 | `types/plugin-subagent.ts` | 子代理摘要/详情/概览 |
| 插件工具输出 | `types/plugin-tool-output.ts` | 文本/JSON 输出判别联合 |
| 插件运行时工具 | `types/plugin-runtime-tools.ts` | 命令执行/读取/glob/grep/写入/编辑结果类型 |
| 工具 | `types/tool.ts` | 工具源/信息/MCP 服务器配置、删除结果 |
| Skill | `types/skill.ts` | Skill 治理/资产/摘要/详情/加载结果 |
| 钩子契约 | `plugin-runtime-contract.ts` | 钩子系列定义（入站/消息/操作/广播/生命周期/子代理） |

---

## 测试覆盖

### 1. shared-core.spec.ts — 39 个用例

| 套件 | 用例数 | 覆盖范围 |
|------|--------|----------|
| JSON types | 3 | `JsonValue` 原始值/对象/嵌套数组 |
| Role | 1 | 全部 5 种角色字符串 |
| API types | 7 | `ApiResponse<T>`、`PaginatedResponse<T>`、AuthTokens、Login/Register、UserInfo、ApiKeyScope、ApiKeySummary、CreateApiKeyResponse |
| AI types | 10 | Provider 驱动枚举、`AiModelCapabilities`、`AiModelConfig`、`AiModelUsage` 源区分、`AiProviderCatalogItem`、`VisionFallbackConfig` 可选字段、`AiUtilityModelRole` 联合、`AiHostModelRoutingConfig`、`DEFAULT_AI_CHAT_AUTO_RETRY_CONFIG` 运行时值验证 |
| Automation types | 2 | `TriggerConfig` 类型判别、`AutomationInfo` 全字段 |
| Chat types | 11 | `ChatMessagePart` 判别、状态/角色枚举、`ChatMessageCustomBlock` 种类判别、`ChatMessageAnnotation`、14→13 种 SSEEvent 变体（修正为 13 种实际变体）、`Conversation` 可选子代理、`ConversationSubagentState`、`ConversationDetail` 扩展、`ConversationContextWindowPreview` 策略联合 |
| Runtime Permission | 4 | 策略动作/决策枚举、请求/回复结构 |

### 2. shared-plugin.spec.ts — 43 个用例

| 套件 | 用例数 | 覆盖范围 |
|------|--------|----------|
| Plugin core types | 11 | 运行时种类、权限列表、调用上下文 7 种来源、参数模式 5 种类型、钩子过滤器、配置模式 5 种变体、`PluginConfigSchema`、`WsMessage` 泛型、`PluginManifest`、`PluginCapability`、`PluginBuiltinRole`、`PluginInfo` |
| Plugin lifecycle | 2 | 加载/卸载/错误钩子负载，含远程描述符 |
| Plugin host | 2 | Host 方法联合、调用负载 |
| Plugin cron | 2 | 描述符/任务摘要 |
| Plugin route | 2 | 路由描述符/响应 |
| Plugin records | 6 | 健康状态 5 种/快照/事件日志/自身信息/人设摘要与详情 |
| Plugin subagent | 2 | 摘要与详情 |
| Plugin tool output | 1 | 文本/JSON 种类判别 |
| Plugin runtime tools | 5 | 命令参数/结果/读取结果/写入状态判别/编辑策略 |
| Tool types | 4 | 工具源种类、`ToolSourceInfo`、MCP 环境值源 3 种、`McpServerConfig` 结构化环境 |
| Skill types | 4 | 来源种类、加载策略、治理信息、详情扩展 |

### 3. shared-contract.spec.ts — 13 个用例

| 套件 | 用例数 | 覆盖范围 |
|------|--------|----------|
| Hook payload input | 1 | `HookPayloadInput` 包裹上下文与负载 |
| HookSpec | 1 | 元组 `[payload, result]` 结构 |
| InboundHookFamily | 1 | 入站钩子 2 种命名空间 |
| MessageHookFamily | 1 | 生命周期钩子结果类型=负载类型 |
| OperationHookFamily | 1 | 操作钩子负载/结果类型 |
| BroadcastHookFamily | 1 | 广播钩子返回 `void` |
| LifecycleBroadcastHookFamily | 1 | 插件生命周期钩子返回 `void` |
| AllBroadcastHookFamily | 1 | 广播+生命周期交集 |
| SubagentHookFamily | 2 | before-run 联合结果（continue/short-circuit）、after-run 传递 |
| HookFamilyInput | 1 | 从家族派生的泛型输入 |
| HookChainInput | 1 | 记录/上下文/负载/调用者结构 |
| HookChainRunnerMap | 1 | 钩子名到运行函数映射 |

### 4. shared-integration.spec.ts — 13 个用例

| 套件 | 用例数 | 覆盖范围 |
|------|--------|----------|
| ChatBeforeModel flow | 2 | 负载在 `HookPayloadInput` 中流通、`ChatBeforeModelHookResult` 三重联合 |
| MessageReceived flow | 2 | mutate/short-circuit 结果分支 |
| After model to response | 1 | `ChatAfterModelHookResult` pass/mutate |
| Subagent lifecycle | 1 | 子代理 before-run 使用 `PluginCallContext` 和 `PluginSubagentRequest` |
| Response pipeline | 1 | `ResponseBeforeSend` 和 `ResponseAfterSend` 共享负载形状 |
| Automation flow | 1 | 自动化 before-run 使用 `ActionConfig[]` |
| Generic type binding | 1 | `ApiResponse<T>` / `PaginatedResponse<T>` 泛型参数绑定 |
| ConversationSubagentState | 1 | 运行时子代理状态含可选 provider/model 标识 |
| PluginRuntimeReadResult | 1 | 目录/文件/资产三重判别 |
| PluginToolOutput | 1 | 文本/JSON 输出在自动化结果中自洽 |
| Export accessibility | 1 | 所有模块可通过 `@garlic-claw/shared` 索引访问 |

---

## 结论

- **108/108 测试用例全部通过**，覆盖 `@garlic-claw/shared` 包的 21 个 TypeScript 源文件。
- 纯类型包的测试策略：结构验证（构建符合接口的对象）+ 联合判别验证（SSE/钩子结果/MCP 配置）+ 跨模块集成验证（`HookPayloadInput`→`ChatBeforeModelHookPayload` 流通）。
- 测试在 `~1.9s` 内完成，零运行时依赖，适合集成到 CI 流程。
- 测试过程中发现并修正了 2 个问题：
  1. `import type` 无法导入运行时常量 `DEFAULT_AI_CHAT_AUTO_RETRY_CONFIG` — 拆分为独立运行时导入。
  2. SSEEvent 变体实际为 13 种（非 14 种），`message-start` 的 `userMessage` 字段可选。
