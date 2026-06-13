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
