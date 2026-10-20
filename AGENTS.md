# AGENTS.md — Calendar 项目规则

本地优先个人日历（Vue 3 + Capacitor + Tauri 2）。冲突时以 Yang / 协调人当轮指令为准。

## 产品边界

- **本地优先**：无账号、无云同步后端。
- **已落地**：阶段 0–5（含备份/ICS/托盘与 Android 引导）。
- **禁止扩需求**：账号云同步、上课前提醒、停课调课、keystore 进 git、课表进 ICS、任意其它教务表变体（已支持个人课程表 HTML 网格含 rowspan）。

## 课表约定（阶段 4）

- 学期：第一周**周一** + 总周数；节次时间表可编辑（有默认）；保存时 **start &lt; end**。
- 模板列：`课程名|星期|开始节|结束节|周次|教室|教师`（可下载空模板）。
- **教务 HTML/.xls 个人课程表**：网格 + rowspan → 起止节；一格多课（title `;;`）拆行；GBK；解析见 `parseHtmlTimetable.ts`（不走 SheetJS 网格）。
- 周次：`1-16` / `1,3,5` / `1-8,10-16`；`单周`/`单`、`双周`/`双`；前缀 `双6-8,15周`、`单1-16`。**拒**后缀 `1-16单`。全角可；超出总周数报错。
- 导入：先识别 HTML 网格，否则模板列；开始/结束节须在当前节次表 index 内；预览错误标红；覆盖或追加。
- SheetJS：**只**从 `https://cdn.sheetjs.com/xlsx-…/xlsx-….tgz` 安装（模板路径）。

## 备份 / ICS（阶段 5）

- JSON：`version` + zod；覆盖 | 合并；导入后 `rebuildAll`；往返测用 **mock NotificationService**。
- ICS：VEVENT + VALARM；**跳过 courses**。

## 通知与调度（阶段 1–3）

- 只经 `NotificationService`；Android 精确闹钟；Desktop 杀进程不验收；Web stub 不验收。
- `WINDOW_DAYS=60`、`MAX_SCHEDULED=64`；展开上界含 max(daysBefore)；resume 防抖。
- 改删整系列。调试页默认关（开发者选项）。
- **N-reminder-kind**：事项字段 `reminderKind: alarm|banner`（默认 banner）；Android 双渠道；不跳系统时钟。N-sys-alarm 入口已下架。
- **N-help**：设置 → 使用说明（`/#/help`），静态分区 + 本地子串搜索。

## 协作

- Vibe Coder 实现；CR 挑问题；Test 只测；Architect 拆任务。
- 协调人授权后可中文 commit + push。
- 不开 Cloud Agent，除非 Yang 明确要求。

## 质量

- 不提交密钥 / jks / keystore.properties；提交前 typecheck/lint/test 绿；真机项标未验证。
