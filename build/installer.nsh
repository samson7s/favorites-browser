!macro customInstall
  ; 确保程序安装路径正确注册
  WriteRegStr HKCU "Software\${COMPANY_NAME}\${PRODUCT_NAME}" "InstallLocation" "$INSTDIR\"
  WriteRegStr HKLM "Software\${COMPANY_NAME}\${PRODUCT_NAME}" "InstallLocation" "$INSTDIR\"
  
  ; 明确创建桌面快捷方式 - 使用应用程序自身作为图标来源
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe" "" "$INSTDIR\${PRODUCT_FILENAME}.exe" 0
  
  ; 添加到开始菜单 - 使用应用程序自身作为图标来源
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe" "" "$INSTDIR\${PRODUCT_FILENAME}.exe" 0
  
  ; 添加卸载快捷方式到开始菜单 - 使用卸载程序自身作为图标来源
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\卸载.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
!macroend

!macro customUnInstall
  ; 卸载时清理注册表项
  DeleteRegKey HKCU "Software\${COMPANY_NAME}\${PRODUCT_NAME}"
  DeleteRegKey HKLM "Software\${COMPANY_NAME}\${PRODUCT_NAME}"
  
  ; 删除桌面快捷方式
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  
  ; 删除开始菜单快捷方式
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\卸载.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
!macroend