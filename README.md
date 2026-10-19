# Calendar

本地优先个人日历：**阶段 0–4**（骨架 → 通知 → 事件/重复 → **课表导入与周视图**）。

**已有**：事件多提醒与重复、60 天通知窗口、学期/节次、Excel 课表导入（官方 SheetJS）、课表周视图。

**不做（阶段 5 / 本阶段禁项）**：备份导出、合并单元格教务表、上课前提醒、停课调课、账号云同步。

规则见 [`AGENTS.md`](AGENTS.md)。真机见 [`docs/real-device-test.md`](docs/real-device-test.md)。

## SheetJS 安装（勿用 npm 旧 `xlsx@0.18.x`）

官方 CDN tarball（当前 `0.20.3`）：

```bash
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

`package.json` 依赖写为该 URL。文档：https://docs.sheetjs.com/docs/getting-started/installation/nodejs/

## 课表周次语法

- `1-16`、`1,3,5`、`1-8,10-16`（支持全角数字与 `，` `、` `－`）
- **单双（仅一种写法）**：`单周`/`单`、`双周`/`双` → 1..总周数内全部奇数/偶数周
- **不支持**：`1-16单`；合并单元格教务导出表

## 阶段 3 调度约定

- 窗口 `WINDOW_DAYS=60`；发生日展开上界 = 60 + max(daysBefore)，再按 triggerAt 截断
- `MAX_SCHEDULED=64`；启动/回前台防抖补窗口；改删整系列
- 月末/闰年：锚点 + N 周期，夹到当月最后一天

## 技术栈

Vue 3 + TS + Vite + Pinia + Vue Router + Vuetify 3 + dayjs + Dexie + zod + **SheetJS (cdn.sheetjs.com)** + Capacitor / Tauri

## 脚本

```bash
npm install
npm run dev
npm run typecheck && npm run lint && npm run test
npm run build
npm run android:sync && npm run android:open
npm run tauri:dev
```

- 月视图 `/#/` · 课表周视图 `/#/week` · 导入 `/#/courses/import` · 设置 `/#/settings`

**Android / Windows 真机：未验证。**

## 目录要点

```
src/domain/          日期/重复/周次/学期/节次纯函数 + vitest
src/services/importer/  模板、parseWorkbook、preview、commit
src/services/scheduler/ 通知窗口重建
src/views/WeekView.vue CourseImportView.vue
```
