# HarmonyOS 构建指南

本指南提供了如何将 Favorites Browser 应用构建并部署到 HarmonyOS 平台的详细说明。

## 前提条件

1. 安装最新版的 [DevEco Studio](https://developer.harmonyos.com/en/develop/deveco-studio/)
2. 注册 HarmonyOS 开发者账号
3. 配置开发环境和设备

## 项目转换步骤

Electron 应用不能直接在 HarmonyOS 上运行，需要进行以下转换：

1. **创建 HarmonyOS 项目**：
   - 在 DevEco Studio 中创建一个新的 HarmonyOS 应用项目
   - 选择 "Empty Feature Ability" 作为模板

2. **移植源代码**：
   - 将 HTML/CSS/JS 资源从项目根目录复制到 HarmonyOS 项目的 `resources/rawfile` 目录
   - 创建适配 HarmonyOS 的主入口和页面

3. **适配文件系统**：
   ```javascript
   // HarmonyOS 文件系统访问示例
   import fs from '@ohos.file.fs';
   import featureAbility from '@ohos.ability.featureAbility';
   
   // 获取应用数据目录
   const context = featureAbility.getContext();
   const filesDir = await context.getFilesDir();
   const favoritesDir = path.join(filesDir, 'Favorites browser');
   ```

4. **适配窗口和 UI**：
   - 使用 HarmonyOS 的 UI 组件重构界面
   - 适配应用生命周期

## 构建和打包

1. 在 DevEco Studio 中配置应用签名
2. 选择目标设备类型（手机、平板等）
3. 构建 HAP（Harmony Ability Package）文件
4. 通过 DevEco Studio 或命令行安装到设备

## 注意事项

1. HarmonyOS 平台有自己的权限管理系统，需要在配置文件中声明所需权限
2. 存储路径与其他平台不同，需要特别注意文件存储逻辑
3. 某些 Electron 特有的 API 在 HarmonyOS 上不可用，需要寻找替代方案
4. 建议参考官方文档：[HarmonyOS 开发指南](https://developer.harmonyos.com/en/docs/documentation/doc-guides/overview-0000001054308090)

## 支持的功能

- 收藏夹管理
- 用户数据存储
- 基础界面操作

## 不支持的功能

- 某些系统级 API
- 特定于桌面平台的交互

如有任何问题，请联系开发团队。