# Calendar

本地优先的个人日历与课表应用：事项提醒、学期课表、备份导出；支持 **Web**、**Android（Capacitor）**、**桌面（Tauri）**。数据保存在本机（Dexie / IndexedDB），无账号、无云同步。

## 功能

- **日历事项**：多提醒、重复、闹钟式 / 横幅两种提醒强度；滚动通知窗口
- **课表**：学期与节次（开始 + 每节时长自动算结束）、周视图连堂、Excel 模板导入、教务 HTML 网格导入
- **今天吃什么**：自建食物列表，随机抽一个（设置入口）
- **备份**：JSON 覆盖 / 合并导入（含食物库）；ICS 导出事项（不含课表）
- **平台**：Android 本地通知与 OEM 引导；桌面托盘保活、单实例、开机自启
- **帮助**：应用内可搜索使用说明

## 技术栈

| 层 | 选型 |
| --- | --- |
| UI | Vue 3 · TypeScript · Vite · Pinia · Vuetify |
| 存储 | Dexie（IndexedDB），库名 `calendar-local` |
| 校验 | Zod |
| 移动 | Capacitor 8 + Local Notifications |
| 桌面 | Tauri 2 |
| 课表 Excel | SheetJS 官方 tarball（见下方安装） |

## 环境要求

- Node.js 20+（建议 LTS）
- Android：Android Studio + JDK（装包 / 真机）
- 桌面：Rust 工具链（仅跑 Tauri 时需要）

## 快速开始（Web）

```bash
git clone https://github.com/Qder/calendar.git
cd calendar
npm install
npm run dev
```

浏览器打开终端提示的本地地址。常用入口：

| 页面 | 路径 |
| --- | --- |
| 月视图 | `/#/` |
| 课表周视图 | `/#/week` |
| 课表导入 | `/#/courses/import` |
| 设置 | `/#/settings` |
| 今天吃什么 | `/#/food` |
| 使用说明 | `/#/help` |
| 备份 | `/#/backup` |

通知调试页默认隐藏：设置 → 开发者选项开启后可见。

## Android

```bash
npm run android:sync
cd android
./gradlew assembleDebug          # macOS / Linux
# Windows: .\gradlew.bat assembleDebug
```

Debug APK：`android/app/build/outputs/apk/debug/app-debug.apk`  
包名：`com.qder.calendar`

也可：

```bash
npm run android:open    # 打开 Android Studio
```

真机提醒请先允许通知与「闹钟和提醒」，并参考 [`docs/android-oem-notifications.md`](docs/android-oem-notifications.md)、[`docs/real-device-test.md`](docs/real-device-test.md)。  
Release / keystore：[`docs/android-release.md`](docs/android-release.md)（**勿把 keystore 提交进仓库**）。

## 桌面（Tauri）

```bash
npm run tauri:dev
npm run tauri:build
```

说明见 [`docs/tauri-build.md`](docs/tauri-build.md)。

## 常用脚本

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## SheetJS

请使用官方 CDN tarball，**不要**装 npm 上过时的 `xlsx@0.18.x`：

```bash
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## 课表导入

- **Excel 模板列**：课程名 · 星期 · 开始节 · 结束节 · 周次 · 教室 · 教师（设置里可下载模板）
- **教务 HTML / .xls**：个人课程表网格（节次 × 星期，支持 rowspan / GBK）；勿用 SheetJS 直接读网格
- 周次支持：`1-16`、`1,3,5`、`双6-8,15周` 等（详见应用内说明）；导入节次须落在当前节次表内

## 数据与备份

- 业务数据在 App / 浏览器私有 IndexedDB（`calendar-local`）；**卸载 App 会清空**
- 换机或重装：先在设置导出 JSON 备份，再导入（覆盖或合并）
- ICS：仅事项 + VALARM，**不含课表**

## 目录结构

```
src/domain/              纯领域逻辑 + vitest
src/db/                  Dexie schema / repos
src/services/backup/     JSON · ICS
src/services/importer/   课表模板 · HTML 网格
src/services/scheduler/  通知重建 / 清理
src/services/notification/  Web · Capacitor · 桌面
src-tauri/               托盘 · 单实例 · 自启
docs/                    OEM · Android release · Tauri · 真机清单
android/                 Capacitor Android 工程
```

协作约定见 [`AGENTS.md`](AGENTS.md)。

## 范围外

账号与云同步、上课前提醒、停课调课、任意教务变体适配、keystore 入库。

## 状态

功能以 `main` 为准持续迭代。Android / Windows **真机提醒与托盘**仍建议按文档自测确认。
