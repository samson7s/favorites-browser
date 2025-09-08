# Linux/Ubuntu 构建指南

本指南提供了如何在 Linux/Ubuntu 系统上构建、安装和运行 Favorites Browser 应用的详细说明。

## 前提条件

1. 安装最新版本的 Node.js 和 npm：
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```

2. 安装构建依赖：
   ```bash
   sudo apt install build-essential libssl-dev
   ```

## 构建步骤

1. **克隆或获取项目源码**

2. **安装依赖**：
   ```bash
   cd favorites-browser
   npm install
   ```

3. **构建应用**：
   
   - 构建 AppImage 格式（推荐，适用于大多数 Linux 发行版）：
     ```bash
     npm run dist -- --linux appimage
     ```
     
   - 构建 DEB 包（适用于 Debian/Ubuntu 及其衍生版）：
     ```bash
     npm run dist -- --linux deb
     ```
     
   - 构建 Snap 包（适用于支持 Snap 的系统）：
     ```bash
     npm run dist -- --linux snap
     ```

   构建产物将位于 `dist` 目录中。

## 安装方法

### AppImage 安装

1. 授予执行权限：
   ```bash
   chmod +x dist/Favorites\ 浏览器-1.0.0.AppImage
   ```

2. 直接运行：
   ```bash
   ./dist/Favorites\ 浏览器-1.0.0.AppImage
   ```

3. （可选）创建桌面快捷方式：
   创建 `~/.local/share/applications/favorites-browser.desktop` 文件，内容如下：
   ```
   [Desktop Entry]
   Name=收藏夹记事本
   Comment=这是一个使用 Electron 构建的 Favorites browser 应用
   Exec=/path/to/Favorites\ 浏览器-1.0.0.AppImage
   Terminal=false
   Type=Application
   Icon=dist/build/icons/icon.png
   Categories=Utility;
   ```

### DEB 包安装

```bash
cd dist
sudo dpkg -i favorites-browser_1.0.0_amd64.deb
sudo apt install -f  # 安装缺失的依赖（如果有）
```

安装完成后，可以在应用菜单中找到并启动 "收藏夹记事本"。

### Snap 包安装

```bash
snap install --dangerous dist/favorites-browser_1.0.0_amd64.snap
```

> 注意：使用 `--dangerous` 选项是因为我们的 Snap 包没有经过 Canonical 的审核。

## 数据存储位置

在 Linux/Ubuntu 系统上，应用数据默认存储在：
```
~/.config/Favorites browser/
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

1. **权限错误**
   如果遇到文件访问权限问题，请检查应用数据目录的权限：
   ```bash
   ls -la ~/.config/Favorites\ browser/
   sudo chown -R $USER:$USER ~/.config/Favorites\ browser/
   ```

2. **依赖缺失**
   如果应用无法启动，可能是缺少某些系统依赖：
   ```bash
   sudo apt install libgconf-2-4 libnss3 libgtk-3-0 libxss1 libasound2
   ```

3. **图标不显示**
   如果应用图标不显示，可能需要手动复制图标文件：
   ```bash
   sudo mkdir -p /usr/share/icons/hicolor/256x256/apps
   sudo cp build/icons/icon.png /usr/share/icons/hicolor/256x256/apps/favorites-browser.png
   ```

## 卸载方法

### AppImage 卸载

删除 AppImage 文件和数据目录：
```bash
rm /path/to/Favorites\ 浏览器-1.0.0.AppImage
rm -r ~/.config/Favorites\ browser/
```

### DEB 包卸载

```bash
sudo apt remove favorites-browser
sudo apt autoremove
```

### Snap 包卸载

```bash
snap remove favorites-browser
```

如有任何问题，请联系开发团队。