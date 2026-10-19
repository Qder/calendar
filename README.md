# Calendar

本地优先个人日历：**阶段 0 骨架** + **阶段 1 通知保活验证**。

**当前不做**：事件 CRUD、课表、Excel、账号、云同步、后端。

项目规则见 [`AGENTS.md`](AGENTS.md)。真机清单见 [`docs/real-device-test.md`](docs/real-device-test.md)。

## 技术栈

- Vue 3 + TypeScript (strict) + Vite + Pinia + Vue Router + Vuetify 3 + dayjs + Dexie + zod
- 通知：`src/services/notification/`（`NotificationService`；Capacitor / Desktop / Web）
- 手机：Capacitor 8 + `@capacitor/local-notifications`（占位 app id：`com.qder.calendar`）
- 桌面：Tauri 2 + `plugin-notification` + `plugin-autostart` + 系统托盘
- 测试：vitest（`domain/` 纯函数）

## 脚本

```bash
npm install
npm run dev              # 首页 Hello + 平台；调试页 /#/debug/notifications
npm run typecheck
npm run lint
npm run test
npm run build
npm run android:sync     # build + cap sync android
npm run android:open     # Android Studio
npm run tauri:dev
npm run tauri:build
```

首页：`/#/`（Hello + 平台 `browser` / `android` / `desktop`）  
调试页：`/#/debug/notifications`（30 秒 / 2 分钟 / 5 分钟、取消、列出）

## Capacitor（Android）— Yang 本机

占位应用 id：`com.qder.calendar`（上架前可改）。  
`@capacitor/cli@8` 需要 **Node.js ≥ 22**。仓库已含 `android/`（精确闹钟相关权限）。  
机器人环境无完整 Android SDK，无法编 APK。本机：

```bash
npm install
npm run android:sync
npm run android:open
```

**APK / 划掉后通知：未验证。**

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
  domain/                 纯函数 + vitest（含 platform）
  db/                     Dexie 壳（尚无业务表）
  services/notification/  阶段 1 通知三实现
  services/importer|backup/  后续占位
  stores/ views/ components/ router/
android/                  Capacitor Android
src-tauri/                Tauri 2
AGENTS.md                 代理协作与产品规则
docs/real-device-test.md
```

## 提交策略

未经 Yang / 协调人明确「提交 / push」授权，**不** `git commit` / `git push`。
