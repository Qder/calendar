# Windows / 桌面 Tauri 构建

## 开发

```bash
npm install
npm run tauri:dev
```

关闭窗口会**隐藏到托盘**（进程保活以便通知）；托盘菜单「退出」才结束进程。  
二次启动由 **单实例** 插件唤起已有窗口。开机自启在设置页开关（`@tauri-apps/plugin-autostart`）。

## 发布构建

```bash
npm run tauri:build
```

产出位于 `src-tauri/target/release/bundle/`（msi / nsis 等，视平台与 `tauri.conf.json` bundle.targets）。

## 验收边界

- 点关闭 → 托盘保活 → 到点通知：**目标行为**
- 任务管理器结束进程后仍弹出：**不验收**
