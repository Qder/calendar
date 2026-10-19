# Calendar

本地优先个人日历：**阶段 0–5 收官**（骨架 → 通知 → 事件/重复 → 课表 → **备份/ICS/桌面托盘与 Android 引导**）。

**已有**：事件多提醒与重复、60 天通知窗口、学期/节次、Excel 课表导入（官方 SheetJS）、课表周视图、JSON 备份（覆盖/合并 + rebuildAll）、ICS（VEVENT+VALARM，不含课表）、Tauri 托盘保活/单实例/开机自启、国产 Android 提醒引导与 debug/release 文档。

**不做**：账号/云同步、合并单元格教务表、上课前提醒、停课调课、keystore 入库。

规则见 [`AGENTS.md`](AGENTS.md)。真机见 [`docs/real-device-test.md`](docs/real-device-test.md)。

## SheetJS 安装（勿用 npm 旧 `xlsx@0.18.x`）

```bash
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## 课表周次语法

- `1-16`、`1,3,5`、`1-8,10-16`（支持全角）
- 单双**仅** `单周`/`单`、`双周`/`双`
- 导入开始/结束节须落在当前节次表；节次保存强制开始 &lt; 结束

## 备份与 ICS

- JSON：`version` + zod 校验；导入可选**覆盖**或**合并**；导入后 `rebuildAll` 重建通知
- ICS：仅事件 + VALARM；**课表不导出**
- 设置 → 备份与导出，或 `/#/backup`

## 桌面（Tauri）

- 关窗进托盘保活；单实例二次启动唤起；设置内开机自启
- 构建说明：[`docs/tauri-build.md`](docs/tauri-build.md)

## Android

- OEM 提醒：[`docs/android-oem-notifications.md`](docs/android-oem-notifications.md)
- Debug / Release（含 keystore 勿入库）：[`docs/android-release.md`](docs/android-release.md)

## 脚本

```bash
npm install
npm run dev
npm run typecheck && npm run lint && npm run test
npm run build
npm run android:sync && npm run android:open
npm run tauri:dev
npm run tauri:build
```

- 月 `/#/` · 课表 `/#/week` · 导入 `/#/courses/import` · 设置 `/#/settings` · 备份 `/#/backup`
- 通知调试页默认隐藏；设置 → 开发者选项开启后可见

**Android / Windows 真机：未验证。**

## 目录要点

```
src/domain/             纯函数 + vitest
src/services/backup/    JSON / ICS + mock 往返测
src/services/importer/  课表 Excel
src/services/scheduler/ 通知窗口重建
src-tauri/              托盘 / 单实例 / 自启
docs/                   OEM、Android release、Tauri build
```
