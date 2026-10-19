# AGENTS.md — Calendar 项目规则（给实现 / 审查 / 测试代理）

本地优先个人日历（Vue 3 + Capacitor + Tauri 2）。下列规则优先于临时 vibe；冲突时以 Yang 当轮明确指令为准。

## 产品边界

- **本地优先**：事件与设置默认落在本机（Dexie / IndexedDB；桌面可再扩本地文件）。不引入账号体系、不引入云同步后端。
- **不做**：用户注册登录、OAuth、远程日历同步服务、推送账号绑定。
- **分阶段交付**：骨架 → 通知保活 → 事件 CRUD → 课表 / Excel 导入 → 备份。禁止一次铺全站。
- 当前已落地切片：**阶段 0 骨架** + **阶段 1 通知保活** + **阶段 2 事件 / 月视图 / 单条提醒**。课表 / Excel / 备份尚未开始。

## 通知规则（阶段 1 约定，后续业务须遵守）

- 统一走 `src/services/notification/` 的 `NotificationService`；平台选择只在该模块内完成。
- **Android（Capacitor Local Notifications）**：划掉进程后仍期望系统到点弹出；需通知权限 + 精确闹钟（`SCHEDULE_EXACT_ALARM`）。
- **Desktop（Tauri）**：关窗 = 托盘保活，进程在则调度有效；**杀进程后仍弹出 — 不承诺、不验收**。
- **Web stub**：仅 UI / 冒烟；关标签页即失效，不验收。
- 真机步骤与边界见 `docs/real-device-test.md`。机器人环境不得把「未验证」写成「通过」。

## 技术栈与目录

- Vue 3 + TypeScript (strict) + Vite + Pinia + Vue Router + Vuetify 3 + dayjs + Dexie + zod + vitest
- 手机：Capacitor（占位 app id：`com.qder.calendar`，见 README）+ `android/`
- 桌面：Tauri 2，同一套前端界面
- 目录：`domain/` `db/` `services/{notification,importer,backup}/` `stores/` `views/` `components/` `router/`
- 纯逻辑放 `domain/` 并尽量有 vitest；UI 不塞业务算法。

## 协作与提交

- **Vibe Coder**：实现；不擅自大范围重构无关模块。
- **Code Reviewer**：对照需求挑 Blocking / Should / Nice；不替写完整功能。
- **Test Bot**：只测不乱改产品代码；报告通过 / 失败 / 阻塞。
- **Architect**：拆模块与里程碑；不直接堆大段实现。
- 未经 Yang 明确「提交 / push」指令，不 `git commit` / `git push`（协调人 / Yang 当轮授权除外）。
- 中文短 commit；一逻辑一提交为宜。
- 不开 Cloud Agent，除非 Yang 明确要求且指定模型档位。

## 安全与质量底线

- 不提交密钥、PAT、`.env` 机密；文档用占位说明。
- 不引入明文存密码（本项目无账号亦可忽略，但不得预埋）。
- `typecheck` / `lint` / `test` 在提交前应绿（本机无法跑的 Android/Tauri 真机项单独标注未验证）。
