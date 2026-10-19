# AGENTS.md — Calendar 项目规则

本地优先个人日历（Vue 3 + Capacitor + Tauri 2）。冲突时以 Yang / 协调人当轮指令为准。

## 产品边界

- **本地优先**：无账号、无云同步后端。
- **已落地**：阶段 0–4（含课表导入与周视图）。
- **禁止本阶段**：备份/阶段5、合并单元格教务表、上课前提醒、停课调课。

## 课表约定（阶段 4）

- 学期：第一周**周一** + 总周数；节次时间表可编辑（有默认）。
- 模板列：`课程名|星期|开始节|结束节|周次|教室|教师`。
- 周次：`1-16` / `1,3,5` / `1-8,10-16`；单双**仅** `单周`/`单`、`双周`/`双`（相对总周数）。全角可；超出总周数报错。
- SheetJS：**只**从 `https://cdn.sheetjs.com/xlsx-…/xlsx-….tgz` 安装，勿用 npm  registry 旧包。
- 导入：预览错误标红；提交可选覆盖或追加。

## 通知与调度（阶段 1–3）

- 只经 `NotificationService`；Android 精确闹钟；Desktop 杀进程不验收；Web stub 不验收。
- `WINDOW_DAYS=60`、`MAX_SCHEDULED=64`；展开上界含 max(daysBefore)；resume 防抖。
- 改删整系列。

## 协作

- Vibe Coder 实现；CR 挑问题；Test 只测；Architect 拆任务。
- 阶段 2–5：协调人授权后可中文 commit + push。
- 不开 Cloud Agent，除非 Yang 明确要求。

## 质量

- 不提交密钥；提交前 typecheck/lint/test 绿；真机项标未验证。
