# Calendar

本地优先个人日历：**阶段 0 骨架** + **阶段 1 通知保活** + **阶段 2 事件 / 月视图 / 单条提醒**。

**已有**：Dexie 事件与提醒规则、月视图 CRUD、默认提醒时刻、保存/删除时经 `NotificationService` 重建系统通知。

**当前不做**：课表、Excel 导入、备份导出、多条/复杂重复提醒、账号、云同步、后端。

项目规则见 [`AGENTS.md`](AGENTS.md)。真机清单见 [`docs/real-device-test.md`](docs/real-device-test.md)。

## 技术栈

- Vue 3 + TypeScript (strict) + Vite + Pinia + Vue Router + Vuetify 3 + dayjs + Dexie + zod
- 通知：`src/services/notification/`（`NotificationService`；Capacitor / Desktop / Web）
- 调度：`src/services/scheduler/`（先取消再重建；业务不散落平台判断）
- 手机：Capacitor 8 + `@capacitor/local-notifications`（占位 app id：`com.qder.calendar`）
- 桌面：Tauri 2 + `plugin-notification` + `plugin-autostart` + 系统托盘
- 测试：vitest（`domain/` 纯函数）

## 脚本

```bash
npm install
npm run dev              # 月视图 /#/ ；调试页 /#/debug/notifications
npm run typecheck
npm run lint
npm run test
npm run build
npm run android:sync     # build + cap sync android
npm run android:open     # Android Studio
npm run tauri:dev
npm run tauri:build
```

- 月视图：`/#/`
- 新建 / 编辑：`/#/events/new`、`/#/events/:id`
- 设置（默认提醒时刻）：`/#/settings`
- 骨架 Hello：`/#/home`
- 通知调试：`/#/debug/notifications`

## Capacitor（Android）— Yang 本机

占位应用 id：`com.qder.calendar`（上架前可改）。  
`@capacitor/cli@8` 需要 **Node.js ≥ 22**。仓库已含 `android/`（精确闹钟相关权限）。  
机器人环境无完整 Android SDK，无法编 APK。本机：

```bash
npm install
npm run android:sync
npm run android:open
```

**APK / 划掉后通知 / 点通知跳详情：未验证。**

## Tauri 2（Windows）— Yang 本机

需 Rust（建议 ≥ 1.90）与 WebView2：

```bash
npm run tauri:dev
npm run tauri:build
```

关窗 = 托盘保活；**杀进程后仍弹出 — 不验收。**  
**Windows 实机：未验证。**

## 精确闹钟依据（Android）

见 Capacitor Local Notifications 文档与 `SCHEDULE_EXACT_ALARM` / `POST_NOTIFICATIONS` 清单声明（已写入 `android/`）。

## 目录

```
src/
  domain/                 日期 / 提醒纯函数 + zod + vitest
  db/                     Dexie（events / reminder_rules / scheduled_notifications / settings）
  services/notification/  阶段 1 通知三实现
  services/scheduler/     按事件重建通知；点通知跳转（Capacitor）
  services/importer|backup/  后续占位
  stores/ views/ components/ router/
android/                  Capacitor Android
src-tauri/                Tauri 2
AGENTS.md                 代理协作与产品规则
docs/real-device-test.md
```

## 提交策略

未经 Yang / 协调人明确「提交 / push」授权，**不** `git commit` / `git push`。
