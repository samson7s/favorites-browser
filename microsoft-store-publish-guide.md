# 微软商店发布指南

本指南将帮助您配置、构建和发布应用程序到微软商店，以支持微软商店下载链接要求。同时也包含如何生成传统Windows EXE安装包的信息。

## 🚀 配置已更新

我已经为您修改了 `package.json` 文件，添加了对微软商店（Windows Store/AppX）和传统Windows安装包（NSIS）的支持。具体修改如下：

```json
"win": {
  "target": [
    "appx",
    "nsis",
    "portable"
  ],
  "icon": "build/icons/icon.ico",
  "signAndEditExecutable": false
},
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "收藏夹记事本",
  "installerIcon": "build/icons/icon.ico",
  "uninstallerIcon": "build/icons/icon.ico",
  "installerHeaderIcon": "build/icons/icon.ico",
  "runAfterFinish": true
},
"appx": {
  "applicationId": "FavoritesBrowser",
  "publisherDisplayName": "收藏夹记事本",
  "publisher": "CN=NDStudio",
  "identityName": "NDStudio.FavoritesBrowser",
  "displayName": "收藏夹记事本"
}
```

这些配置是构建微软商店兼容包和传统Windows安装包的基础要求。

## 🔧 构建微软商店版本和Windows EXE安装包

要构建适用于微软商店的版本和传统Windows EXE安装包，请按照以下步骤操作：

1. 打开终端或命令提示符

2. 导航到您的项目目录：
```bash
cd e:/共享/Favorites browser
```

3. 确保已安装所有依赖（已安装可跳过此步骤）：
```bash
npm install
```

4. 执行构建命令：
```bash
npm run dist
```

5. 构建完成后，您将在 `dist` 目录中获得以下文件：
   - 微软商店包：扩展名为 `.appx`
   - Windows安装程序：扩展名为 `.exe`（带安装向导）
   - 便携式版本：扩展名为 `.exe`（无需安装，可直接运行）

> 现在项目配置同时支持构建微软商店(appx)版本和传统安装包(nsis)，以及便携式版本。

## 🖥️ Windows EXE安装包特性

我们配置的Windows EXE安装包具有以下特性：

- **自定义安装路径**：用户可以选择安装位置
- **桌面快捷方式**：自动创建桌面图标
- **开始菜单快捷方式**：添加到开始菜单
- **自定义安装界面**：使用应用图标美化安装程序
- **安装后自动运行**：安装完成后可以选择立即启动应用

## ⚙️ 自定义NSIS安装配置

如果您需要进一步自定义Windows安装包，可以修改`package.json`中的`nsis`部分：

```json
"nsis": {
  "oneClick": false,         // 禁用一键安装
  "allowToChangeInstallationDirectory": true,  // 允许更改安装目录
  "createDesktopShortcut": true, // 创建桌面快捷方式
  "createStartMenuShortcut": true, // 创建开始菜单快捷方式
  "shortcutName": "收藏夹记事本", // 快捷方式名称
  "installerIcon": "build/icons/icon.ico", // 安装程序图标
  "uninstallerIcon": "build/icons/icon.ico", // 卸载程序图标
  "installerHeaderIcon": "build/icons/icon.ico", // 安装程序头部图标
  "runAfterFinish": true // 安装后运行
}
```

您可以根据需要调整这些选项。更多NSIS配置选项请参考[electron-builder官方文档](https://www.electron.build/configuration/nsis)。

## 📦 微软商店提交准备

在向微软商店提交应用之前，您需要准备以下内容：

1. **微软开发者账号**：
   - 注册 [微软开发者中心](https://developer.microsoft.com/zh-cn/store/register/) 账号
   - 支付开发者年费（约人民币300元）

2. **应用图标和截图**：
   - 确保您有高质量的应用图标（至少400x400像素）
   - 准备至少3张应用截图，展示不同功能页面
   - 推荐分辨率：1920x1080像素

3. **应用说明文档**：
   - 简短描述（约50-100字）
   - 详细描述（包含功能特点、使用方法等）
   - 隐私政策（如适用）

4. **证书准备**：
   - 微软商店要求应用必须签名
   - 您可以使用微软提供的临时证书进行测试
   - 正式提交需要使用代码签名证书

## 🚚 微软商店提交流程

完成准备工作后，按照以下步骤提交应用：

1. **登录微软开发者中心**
   - 访问 [https://partner.microsoft.com/zh-cn/dashboard/](https://partner.microsoft.com/zh-cn/dashboard/)
   - 使用您的开发者账号登录

2. **创建应用程序**
   - 点击"创建新应用程序"
   - 输入应用名称，点击"保留产品名称"

3. **填写应用信息**
   - 导航至"产品" > "应用程序设置"
   - 填写所有必要信息（描述、截图、分类等）
   - 确保隐私政策链接有效（如适用）

4. **上传应用包**
   - 导航至"产品" > "应用包"
   - 点击"上传新包"
   - 选择构建生成的 `.appx` 文件（微软系统会自动将其转换为msixupload格式）
   - 等待上传和验证完成

5. **提交审核**
   - 确认所有信息填写完整
   - 点击"提交到商店"
   - 选择适当的发布选项（立即发布或指定日期）

6. **等待审核**
   - 微软商店审核流程通常需要1-5个工作日
   - 您可以在开发者中心查看审核状态

## 🔗 生成微软商店下载链接

应用通过审核后，您可以获取官方下载链接：

1. 在微软开发者中心，导航到您的应用
2. 点击"产品" > "链接和促销"
3. 复制"商店链接"（格式为 `https://www.microsoft.com/store/apps/{应用ID}`）

您可以将此链接添加到应用的README.md、网站或其他宣传材料中，供用户直接从微软商店下载应用。

## 💡 重要注意事项

1. **应用权限**：确保在package.json中正确声明应用所需的所有权限
2. **内容合规性**：确保应用内容符合微软商店的内容政策
3. **性能优化**：微软商店对应用性能有一定要求，确保应用启动快速、响应迅速
4. **版本更新**：更新应用时，需要递增版本号并重新提交审核

## ❓ 常见问题

**Q: 构建.appx包时遇到错误怎么办？**
A: 检查package.json中的appx配置是否正确，确保所有必填字段都已填写。尝试重新安装依赖：`npm install`。

**Q: 如何获取开发者证书？**
A: 您可以从第三方证书颁发机构购买，或使用微软提供的临时证书进行测试。

**Q: 应用审核被拒绝了怎么办？**
A: 微软会提供拒绝原因，根据反馈修改应用后重新提交审核。

**Q: 应用发布后如何更新？**
A: 增加package.json中的版本号，重新构建.appx包，然后在开发者中心上传新版并提交审核。