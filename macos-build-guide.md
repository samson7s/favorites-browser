# macOS 构建指南

本指南提供了如何在 macOS 系统上构建、安装和运行 Favorites Browser 应用的详细说明。

## 前提条件

1. 安装最新版本的 Node.js 和 npm：
   - 通过 [Node.js 官网](https://nodejs.org/) 下载安装包
   - 或使用 Homebrew 安装：
     ```bash
     brew install node
     ```

2. 安装 Xcode Command Line Tools（构建 macOS 应用必需）：
   ```bash
   xcode-select --install
   ```

3. 安装 Git（如果需要克隆仓库）：
   ```bash
   brew install git
   ```

## 构建步骤

1. **克隆或获取项目源码**

2. **安装依赖**：
   ```bash
   cd favorites-browser
   npm install
   ```

3. **构建应用**：
   
   - 构建 DMG 安装包：
     ```bash
     npm run dist -- --mac dmg
     ```
     
   - 构建 ZIP 压缩包：
     ```bash
     npm run dist -- --mac zip
     ```

   构建产物将位于 `dist` 目录中。

## 安装方法

### DMG 安装

1. 打开 DMG 文件：
   ```bash
   open dist/收藏夹记事本-1.0.0.dmg
   ```

2. 将应用图标拖放到 Applications 文件夹中

### ZIP 安装

1. 解压 ZIP 文件：
   ```bash
   unzip dist/收藏夹记事本-1.0.0-mac.zip -d /Applications
   ```

## 代码签名（可选但推荐）

为了确保应用能够在其他 macOS 设备上正常运行，建议进行代码签名：

1. 在 Apple Developer Center 申请开发者证书
2. 配置签名信息：
   修改 `package.json` 文件中的 `mac` 部分：
   ```json
   "mac": {
     "target": ["dmg", "zip"],
     "icon": "build/icons/icon.icns",
     "category": "public.app-category.utilities",
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist",
     "entitlementsInherit": "build/entitlements.mac.plist",
     "signingIdentity": "Developer ID Application: Your Name (TEAMID)"
   }
   ```

3. 重新构建应用：
   ```bash
   npm run dist -- --mac dmg
   ```

4. （可选）进行公证：
   ```bash
   xcrun altool --notarize-app --primary-bundle-id "cn.com.ndstudio.favoritesbrowser" --username "your-apple-id" --password "your-app-specific-password" --file "dist/收藏夹记事本-1.0.0.dmg"
   ```

## 数据存储位置

在 macOS 系统上，应用数据默认存储在：
```
~/Library/Application Support/Favorites browser/
```

该目录包含：
- `favorites.json` - 收藏夹数据
- `settings.json` - 应用设置

## 命令行参数

应用支持以下命令行参数：
- `--dev` - 启用开发模式
- `--verbose` - 启用详细日志

## 故障排除

### 常见问题

1. **Gatekeeper 阻止应用运行**
   如果 macOS 的 Gatekeeper 阻止应用运行，可以：
   - 右键点击应用，选择 "打开"，然后确认打开
   - 或在 "系统偏好设置" -> "安全性与隐私" 中允许运行

2. **应用无法启动**
   检查应用日志：
   ```bash
   tail -f ~/Library/Logs/收藏夹记事本/main.log
   ```

3. **文件权限问题**
   如果遇到文件访问权限问题，请检查应用数据目录的权限：
   ```bash
   ls -la ~/Library/Application\ Support/Favorites\ browser/
   ```

## 卸载方法

1. 从 Applications 文件夹中删除应用
2. （可选）删除应用数据：
   ```bash
   rm -r ~/Library/Application\ Support/Favorites\ browser/
   ```

## 提交到 Mac App Store（可选）

如果需要将应用提交到 Mac App Store，还需要进行以下额外配置：

1. 修改 `package.json` 文件中的 `mac` 部分，添加 MAS 目标：
   ```json
   "mac": {
     "target": ["dmg", "zip", "mas"],
     // 其他配置...
   }
   ```

2. 创建 MAS 专用的 entitlements 文件 `build/entitlements.mas.plist`

3. 详细步骤请参考 [Electron 打包文档](https://www.electron.build/mac)

如有任何问题，请联系开发团队。