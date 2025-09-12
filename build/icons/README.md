# 应用图标说明

本目录包含应用在不同平台上使用的图标文件。

## 已有文件

- `icon.ico` - Windows平台图标
- `icon.svg` - 矢量图标（可缩放，适用于各种平台）

## 缺失文件及创建方法

### macOS 图标 (icon.icns)

macOS需要`.icns`格式的图标文件。请按照以下步骤创建：

1. 在macOS系统上，使用预览应用打开`icon.svg`
2. 导出为不同尺寸的PNG文件（16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024）
3. 使用`sips`命令行工具创建icns文件：
   
   ```bash
   # 创建临时目录
   mkdir -p Icons.iconset
   
   # 将不同尺寸的PNG文件复制到临时目录并重命名
   cp icon_16x16.png Icons.iconset/icon_16x16.png
   cp icon_32x32.png Icons.iconset/icon_16x16@2x.png
   cp icon_32x32.png Icons.iconset/icon_32x32.png
   cp icon_64x64.png Icons.iconset/icon_32x32@2x.png
   cp icon_128x128.png Icons.iconset/icon_128x128.png
   cp icon_256x256.png Icons.iconset/icon_128x128@2x.png
   cp icon_256x256.png Icons.iconset/icon_256x256.png
   cp icon_512x512.png Icons.iconset/icon_256x256@2x.png
   cp icon_512x512.png Icons.iconset/icon_512x512.png
   cp icon_1024x1024.png Icons.iconset/icon_512x512@2x.png
   
   # 创建icns文件
   iconutil -c icns Icons.iconset -o icon.icns
   
   # 清理临时文件
   rm -r Icons.iconset
   ```

4. 将生成的`icon.icns`文件复制到本目录

### Linux 图标

Linux平台支持PNG格式的图标。请创建不同尺寸的PNG图标文件：
- 16x16
- 24x24
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

可以使用`inkscape`或其他图像编辑工具从SVG文件导出这些尺寸的PNG文件。

## 注意事项

- 所有图标应保持一致的设计风格
- 确保图标在小尺寸下仍然清晰可辨
- 更新图标后，请重新构建应用以确保更改生效