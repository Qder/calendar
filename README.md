# Calendar（通知验证阶段）

本地优先个人日历的**通知能力验证切片**：Vue 3 调试页 + Capacitor Local Notifications + Tauri 2 托盘保活调度。

**本阶段不做**：事件 CRUD、课表、Excel、账号、后端。

## 技术栈

- Vue 3 + TypeScript (strict) + Vite + Pinia + Vue Router + Vuetify 3 + dayjs
- 通知：`src/services/notification/`（`NotificationService` 接口；Capacitor / Desktop / Web 三实现）
- 手机：Capacitor 8 + `@capacitor/local-notifications` 8.3
- 桌面：Tauri 2 + `plugin-notification` + `plugin-autostart` + 系统托盘
- 测试：vitest（仅 `domain/` 纯函数）

## 脚本

```bash
npm install
npm run dev          # 浏览器打开调试页（Web stub，关标签页即失效）
npm run typecheck
npm run lint
npm run test
npm run build
```

调试页路由：`/#/debug/notifications`  
按钮：30 秒 / 2 分钟 / 5 分钟后提醒、取消全部、列出待触发。

## 精确闹钟依据（Android）

安装版本：`@capacitor/local-notifications@^8.3`、`@capacitor/android@^8.5`。

依据文档：

1. [Capacitor Local Notifications — Android](https://capacitorjs.com/docs/apis/local-notifications)  
   - Android 13+：`requestPermissions()` / `POST_NOTIFICATIONS`  
   - Android 12+：清单声明 `SCHEDULE_EXACT_ALARM` 后，定时才可能精确  
   - `checkExactNotificationSetting` / `changeExactNotificationSetting` 引导用户打开「闹钟和提醒」  
   - `schedule` 使用 `isExactNotification: true`（8.3 默认）+ `allowWhileIdle: true`（Doze）
2. [Android Schedule exact alarms](https://developer.android.com/develop/background-work/services/alarms)  
   - `SCHEDULE_EXACT_ALARM` 与 `USE_EXACT_ALARM` 的差异；本应用声明 **`SCHEDULE_EXACT_ALARM`**（需用户授予，适合提醒类应用）

`android/app/src/main/AndroidManifest.xml` 中已加入：

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

（若尚未生成 `android/`，先按下方 Capacitor 步骤执行 `npx cap add android` 后再核对清单。）

## Capacitor（Android APK）— Yang 本机

`@capacitor/cli@8` 需要 **Node.js ≥ 22**。本仓库已生成 `android/`（含精确闹钟相关权限）。  
机器人环境**无完整 Android SDK**，无法编译/安装 APK。请在本机：

```bash
# Node ≥ 22
npm install
npm run build
npx cap sync android
npx cap open android   # Android Studio 编译安装到真机
```

真机步骤见 [`docs/real-device-test.md`](docs/real-device-test.md)。  
**APK 安装与划掉后通知：未验证。**

## Tauri 2（Windows）— Yang 本机

```bash
# 需本机：Rust ≥ 1.90（当前 Tauri 2.12 / plugin 要求）、WebView2
npm install
npm run tauri:dev      # 开发
npm run tauri:build    # 安装包
```

关闭窗口 = 隐藏到托盘（进程仍在）；托盘菜单「打开」「退出」。  
**验收：关窗托盘存活后到点弹出。杀进程后仍弹出 — 不承诺、不验收。**  
机器人环境 rustc 1.85，无法在此完成 `cargo check` / Windows 打包。  
**Windows 实机：未验证。**

## 目录

```
src/
  domain/                 纯函数 + vitest
  db/                     占位（本阶段无业务表）
  services/notification/  NotificationService + 三实现
  services/importer|backup/  后续阶段占位
  stores/ views/ components/ router/
android/                  Capacitor 生成（若已 add）
src-tauri/                Tauri 2 工程
docs/real-device-test.md   真机清单
```

## 提交策略

未经 Yang 明确「提交 / push」指令，**不** `git commit` / `git push`。
