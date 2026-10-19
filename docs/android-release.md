# Android Debug / Release 构建

## Debug（日常）

```bash
npm run android:sync
npm run android:open
# 在 Android Studio：Run → app（debug）
```

或命令行（需本机 SDK）：

```bash
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Release 签名（勿把密钥提交进 git）

1. 生成本地 keystore（示例，自行保管口令）：

```bash
keytool -genkey -v -keystore "$HOME/calendar-release.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias calendar
```

2. 在 `android/` 旁自建 **不入库** 的 `keystore.properties`（路径已在 `.gitignore`）：

```properties
storeFile=/absolute/path/to/calendar-release.jks
storePassword=***
keyAlias=calendar
keyPassword=***
```

3. 按 Capacitor / Android 文档在 `android/app/build.gradle` 配置 `signingConfigs.release` 读取上述文件（本仓库不提交真实口令或 jks）。

4. 构建：

```bash
cd android && ./gradlew assembleRelease
# 或 bundleRelease → AAB
```

**禁止**：`*.jks` / `*.keystore` / `keystore.properties` 进入 git。
