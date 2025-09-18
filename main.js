const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 引入语言包支持
const languageFilePath = path.join(__dirname, 'language.js');
let globalTranslations = { 'zh-CN': {}, 'en': {} };

// 尝试读取语言文件
if (fs.existsSync(languageFilePath)) {
  try {
    const languageContent = fs.readFileSync(languageFilePath, 'utf8');
    // 精确提取globalTranslations对象内容（包括zh-CN和en两个完整的语言对象）
    const match = languageContent.match(/globalTranslations\s*=\s*(\{[\s\S]*?\s*\}\s*\});/);
    if (match && match[1]) {
      try {
        // 尝试直接使用JavaScript的Function构造函数解析对象字面量
        const parsedObj = new Function('return ' + match[1])();
        globalTranslations = parsedObj;
      } catch (jsError) {
        try {
          // 如果直接解析失败，尝试转换为JSON字符串
          // 将单引号替换为双引号，确保JSON格式正确
          const jsonStr = match[1]
            .replace(/'/g, '"')            // 替换单引号为双引号
            .replace(/([^\\])"/g, '$1\\"')  // 转义未转义的双引号
            .replace(/,\s*\}/g, '}');       // 移除末尾多余的逗号
          globalTranslations = JSON.parse(jsonStr);
        } catch (jsonError) {
          console.error('无法通过JSON解析语言文件:', jsonError);
          throw new Error('无法解析语言文件');
        }
      }
    }
  } catch (error) {
    console.error('无法读取或解析语言文件:', error);
    // 保持默认翻译，确保应用可以继续运行
    console.log('使用默认翻译继续运行...');
  }
}

// 获取当前语言设置
function getCurrentLanguage() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settings.language || 'zh-CN';
    }
  } catch (error) {
    console.error('无法读取设置文件:', error);
  }
  return 'zh-CN';
}

// 获取翻译文本
function getTranslation(key, defaultValue = key) {
  const language = getCurrentLanguage();
  if (globalTranslations[language] && globalTranslations[language][key]) {
    return globalTranslations[language][key];
  }
  return defaultValue;
}

// 主窗口实例（避免被GC回收）
  let mainWindow; // 确保mainWindow在全局作用域
  // 新窗口数组
  let newWindows = [];

// 先定义路径常量，确保在任何地方都能访问
let favoritesDir;

// 根据不同操作系统设置适当的数据存储路径
const platform = process.platform;

if (platform === 'win32') {
  // Windows平台：优先使用OneDrive文档目录（如果存在）
  const userProfile = process.env.USERPROFILE || '';
  const oneDriveDocumentsPath = path.join(userProfile, 'OneDrive', '文档');
  
  // 检查OneDrive文档目录是否存在，如果存在则使用它
  if (fs.existsSync(oneDriveDocumentsPath)) {
    favoritesDir = path.join(oneDriveDocumentsPath, 'Favorites browser');
  } else {
    // 否则使用标准文档目录
    const documentsPath = app.getPath('documents');
    favoritesDir = path.join(documentsPath, 'Favorites browser');
  }
} else if (platform === 'darwin') {
  // macOS平台：使用应用支持目录
  const appDataPath = app.getPath('appData');
  favoritesDir = path.join(appDataPath, 'Favorites browser');
} else if (platform === 'linux') {
  // Ubuntu/Linux平台：使用配置目录
  const configPath = app.getPath('userData');
  favoritesDir = path.join(configPath, 'Favorites browser');
} else if (platform.includes('harmony')) {
  // HarmonyOS平台：使用应用数据目录
  const dataPath = app.getPath('appData');
  favoritesDir = path.join(dataPath, 'Favorites browser');
} else {
  // 其他平台：默认使用文档目录
  const documentsPath = app.getPath('documents');
  favoritesDir = path.join(documentsPath, 'Favorites browser');
}

const favoritesPath = path.join(favoritesDir, 'favorites.json');
const settingsPath = path.join(favoritesDir, 'settings.json');

// 用户管理相关变量和函数
let users = [getTranslation('defaultUser')];

// 加载用户数据
function loadUsers() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      if (Array.isArray(settings.users)) {
        users = settings.users;
      }
    }
  } catch (error) {
    console.log(`${getTranslation('userDataFileNotExistOrReadFailed')}，${getTranslation('useDefaultUser')}`);
    users = [getTranslation('defaultUser')];
  }
}

// 确保目录存在的辅助函数
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      // 目录已创建
    } catch (err) {
      console.error(`创建目录失败: ${err}`);
    }
  }
}

// 初始化设置文件（确保文件存在）
function initSettingsFile() {
  ensureDirectoryExists(favoritesDir);
  
  if (!fs.existsSync(settingsPath)) {
    try {
      const defaultSettings = {
        windowMode: 'normal',
        users: [getTranslation('defaultUser')]
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
      // 默认设置文件已创建
    } catch (err) {
      console.error(`创建设置文件失败: ${err}`);
    }
  }
}

// 监听窗口模式获取请求
ipcMain.on('get-window-mode', (event) => {
  try {
    let windowMode = 'normal';
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      windowMode = settings.windowMode || 'normal';
    }
    event.reply('window-mode-response', windowMode);
  } catch (err) {
    console.error('获取窗口模式失败:', err);
    event.reply('window-mode-response', 'normal');
  }
});

// 监听窗口模式更新
ipcMain.on('update-window-mode', (event, mode) => {
  try {
    ensureDirectoryExists(favoritesDir);
    // 保存设置到文件
    const settings = { windowMode: mode };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    // 更新窗口模式
    if (mainWindow) {
      if (mode === 'maximized') {
        mainWindow.maximize();
      } else {
        mainWindow.unmaximize();
      }
    }
  } catch (err) {
    console.error('保存设置失败:', err);
  }
});

function createWindow() {
  // 定义windowMode变量并从设置加载
  let windowMode = 'normal';
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      windowMode = settings.windowMode || 'normal';
    }
  } catch (err) {
    console.error('读取窗口模式设置失败:', err);
  }
  
  // 根据不同操作系统选择合适的图标
let iconPath = getIconPath();
  
  // 优化图标路径设置，确保在打包后的应用中也能正确找到图标
  try {
    if (platform === 'win32') {
      // Windows使用ico格式
      // 尝试多种可能的图标路径
      const possibleIconPaths = [
        path.join(process.resourcesPath, 'icon.ico'), // 打包后可能的路径1
        path.join(process.resourcesPath, 'build/icons/icon.ico'), // 现有路径
        path.join(__dirname, 'icon.ico'), // 可能的路径2
        path.join(__dirname, 'build/icons/icon.ico') // 开发环境路径
      ];
      
      // 遍历所有可能的路径，直到找到存在的图标文件
      for (const possiblePath of possibleIconPaths) {
        if (fs.existsSync(possiblePath)) {
          iconPath = possiblePath;
          break;
        }
      }
    } else if (platform === 'darwin') {
      // macOS尝试使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
    } else {
      // Linux等其他系统使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
    }
  } catch (error) {
    // 静默处理图标路径获取失败
    iconPath = null;
  }
  
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: 1024,
    height: 768,
    icon: iconPath,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true, // 根据项目需求调整
      contextIsolation: false // 若使用预加载脚本需设为true
    }
  });

  // 根据模式设置窗口
  if (windowMode === 'maximized') {
    mainWindow.maximize();
  }

  // 加载主页面（根据项目实际路径调整）
  mainWindow.loadFile('index.html');

  // 当主页面加载完成后，发送用户数据
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      // 发送用户列表数据
      mainWindow.webContents.send('users-data', users);
      // 用户数据已发送
    } catch (error) {
      console.error('发送用户数据失败:', error);
    }
  });

  // 监听窗口模式获取请求
  ipcMain.on('get-window-mode', (event) => {
    try {
      let windowMode = 'normal';
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        windowMode = settings.windowMode || 'normal';
      }
      event.reply('window-mode-response', windowMode);
    } catch (err) {
      console.error('获取窗口模式失败:', err);
      event.reply('window-mode-response', 'normal');
    }
  });

  // 监听窗口模式更新
  ipcMain.on('update-window-mode', (event, mode) => {
    try {
      // 保存设置到文件
      const settings = { windowMode: mode };
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

      // 更新窗口模式
      if (mode === 'maximized') {
        mainWindow.maximize();
      } else {
        mainWindow.unmaximize();
      }
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  });

  // 窗口关闭时清空实例引用
  mainWindow.on('closed', () => {
    // 关闭所有新窗口
    newWindows.forEach((window) => window.close());
    newWindows.length = 0;
    mainWindow = null;
  });
}

// 创建新窗口的函数
function createNewWindow(url, index) {
  // 根据不同操作系统选择合适的图标
  let iconPath = getIconPath();
  
  // 尝试使用 process.resourcesPath，这在打包后的应用中更可靠
  try {
    // 首先尝试从应用资源目录加载图标
    if (platform === 'win32') {
      // Windows使用ico格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.ico');
    } else if (platform === 'darwin') {
      // macOS尝试使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
    } else {
      // Linux等其他系统使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
    }
    
    // 检查文件是否存在，如果不存在则回退到开发环境路径
    if (!fs.existsSync(iconPath)) {
      
      if (platform === 'win32') {
        iconPath = path.join(__dirname, 'build/icons/icon.ico');
      } else {
        iconPath = path.join(__dirname, 'build/icons/icon.png');
      }
      
      // 再次检查文件是否存在
      if (!fs.existsSync(iconPath)) {
        console.error(`图标文件不存在: ${iconPath}`);
        // 即使图标文件不存在也继续执行，应用仍能运行但不会显示图标
        iconPath = null;
      }}
  } catch (error) {
    // 静默处理新窗口图标路径获取失败
    iconPath = null;
  }
  
  const newWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: 1024,
    height: 768,
    icon: iconPath,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true // 启用 webview 标签
    }
  });

  // 加载自定义页面
  newWindow.loadFile('custom-window.html');

  // 将窗口最大化
  newWindow.maximize();

  // 当自定义页面加载完成后，发送要加载的 URL 和索引
  newWindow.webContents.on('did-finish-load', () => {
    // 发送一个包含URL和索引的对象，而不是两个独立参数
    newWindow.webContents.send('load-url', {
      url: url,
      index: index
    });
  });

  // 移除原生菜单，使用自定义HTML菜单

  // 将新窗口添加到数组中
  newWindows.push(newWindow);

  newWindow.on('closed', () => {
    // 从数组中移除关闭的窗口
    const index = newWindows.indexOf(newWindow);
    if (index !== -1) {
      newWindows.splice(index, 1);
    }
  });
}

// 变量 documentsPath 已声明，移除重复声明
// 变量 favoritesDir 已声明，移除该行以避免重复声明
// 变量 favoritesPath 已声明，移除该行以避免重复声明
// 移除重复声明，因为 settingsPath 已在文件上方声明
// OneDrive下载配置（示例公共链接，需用户替换为实际OneDrive共享链接）
// 由于变量 onedriveFavoritesUrl 声明后从未被使用，故移除该声明

// 初始化收藏数据（含目录创建）
async function initFavorites() {
  try {
    // 开始初始化收藏数据
    
    // 确保目录存在
    ensureDirectoryExists(favoritesDir);

    // 处理收藏文件初始化和格式迁移
    if (!fs.existsSync(favoritesPath)) {
      // favorites.json不存在，尝试创建默认文件
      try {
        // 首次使用 - 创建默认用户的收藏文件
        const defaultUser = getTranslation('defaultUser');
        const initialData = {
          currentUser: defaultUser,
          users: {
            [defaultUser]: []
          }
        };
        fs.writeFileSync(favoritesPath, JSON.stringify(initialData, null, 2), 'utf-8');
        // 成功创建默认收藏文件
      } catch (err) {
        console.error('创建收藏文件失败:', err.message);
        console.error('错误详情:', err);
        
        // 即使创建失败也继续执行，不阻止应用启动
        // 尝试在应用数据目录创建一个备用的收藏文件
        try {
          const appDataPath = app.getPath('appData');
          const backupFavoritesDir = path.join(appDataPath, 'Favorites browser');
          const backupFavoritesPath = path.join(backupFavoritesDir, 'favorites.json');
          
          // 尝试创建备用收藏文件
          ensureDirectoryExists(backupFavoritesDir);
          
          const defaultUser = getTranslation('defaultUser');
          const initialData = {
            currentUser: defaultUser,
            users: {
              [defaultUser]: []
            }
          };
          fs.writeFileSync(backupFavoritesPath, JSON.stringify(initialData, null, 2), 'utf-8');
          // 成功创建备用收藏文件
        } catch (backupErr) {
          console.error('创建备用收藏文件也失败:', backupErr.message);
          // 继续执行，让应用程序以无数据状态运行
        }
      }
    } else {
      // 检查是否需要格式迁移（旧数组格式 -> 新用户格式）
      try {
        const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        if (Array.isArray(data)) {
          // 旧格式数据 - 需要迁移
          // 检测到旧格式收藏数据，开始迁移
          const defaultUser = getTranslation('defaultUser');
          const migratedData = {
            currentUser: defaultUser,
            users: {
              [defaultUser]: data // 将旧数组作为默认用户的收藏
            }
          };
          fs.writeFileSync(favoritesPath, JSON.stringify(migratedData, null, 2), 'utf-8');
          // 收藏数据已迁移
        }
      } catch (err) {
        console.error('收藏数据格式验证失败，将创建新文件:', err.message);
        try {
          const defaultUser = getTranslation('defaultUser');
          const initialData = {
            currentUser: defaultUser,
            users: {
              [defaultUser]: []
            }
          };
          fs.writeFileSync(favoritesPath, JSON.stringify(initialData, null, 2), 'utf-8');
          // 成功创建新的收藏文件
        } catch (writeErr) {
          console.error('创建新收藏文件失败:', writeErr.message);
        }
      }
    }
  } catch (err) {
    console.error('初始化收藏数据时发生错误:', err.message);
    console.error('错误详情:', err);
    // 继续执行，不阻止应用启动
  }
  
  // 收藏数据初始化完成
}

// 用户名对话框功能已整合到下方的事件处理程序中

// 关键：在app准备就绪后创建窗口（Electron 9+推荐写法）
// 用户管理相关代码已移动到下方

  // 获取图标路径的辅助函数
function getIconPath() {
  try {
    let iconPath;
    
    if (platform === 'win32') {
      // Windows使用ico格式
      // 尝试多种可能的图标路径
      const possibleIconPaths = [
        path.join(process.resourcesPath, 'icon.ico'), // 打包后可能的路径1
        path.join(process.resourcesPath, 'build/icons/icon.ico'), // 现有路径
        path.join(__dirname, 'icon.ico'), // 可能的路径2
        path.join(__dirname, 'build/icons/icon.ico') // 开发环境路径
      ];
      
      // 遍历所有可能的路径，直到找到存在的图标文件
      for (const possiblePath of possibleIconPaths) {
        if (fs.existsSync(possiblePath)) {
          iconPath = possiblePath;
          break;
        }
      }
    } else if (platform === 'darwin') {
      // macOS尝试使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
      
      // 检查文件是否存在，如果不存在则回退到开发环境路径
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(__dirname, 'build/icons/icon.png');
      }
    } else {
      // Linux等其他系统使用png格式
      iconPath = path.join(process.resourcesPath, 'build/icons/icon.png');
      
      // 检查文件是否存在，如果不存在则回退到开发环境路径
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(__dirname, 'build/icons/icon.png');
      }
    }
    
    return iconPath;
  } catch (error) {
    // 静默处理图标路径获取失败
    return null;
  }
}

// 确保单实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当第二个实例启动时，显示已有实例的窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // 弹出消息提示
  
    dialog.showMessageBox({
      type: 'info',
      title: getTranslation('appAlreadyRunning'),
      message: getTranslation('appIsRunning'),
      buttons: [getTranslation('confirm')]
    });
  });

  app.whenReady().then(async () => {
    await initFavorites();
    // 同步favorites.json中的用户列表到settings.json
    try {
      if (fs.existsSync(favoritesPath) && fs.existsSync(settingsPath)) {
        const favoritesData = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        // 获取favorites.json中的所有用户名
        const favoritesUsers = Object.keys(favoritesData.users || {});
        
        // 更新settings.json中的用户列表
        if (favoritesUsers.length > 0) {
          settingsData.users = favoritesUsers;
          fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2));
          // 已同步用户列表
          // 重新加载用户数据
          loadUsers();
        }
      }
    } catch (error) {
      console.error('同步用户列表失败:', error);
    }
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

// 非macOS系统：所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理用户名相关IPC事件
ipcMain.on('get-current-user', (event) => {
  try {
    if (fs.existsSync(favoritesPath)) {
      const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      event.reply('current-user-response', data.currentUser || getTranslation('defaultUser'));
    } else {
      event.reply('current-user-response', getTranslation('defaultUser'));
    }
  } catch (err) {
    console.error('获取当前用户失败:', err);
    event.reply('current-user-response', getTranslation('defaultUser'));
  }
});

// 处理用户切换事件
ipcMain.on('switch-user', (event, newUsername) => {
  try {
    if (fs.existsSync(favoritesPath)) {
      const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      
      // 更新当前用户
      data.currentUser = newUsername;
      
      // 确保该用户存在于users对象中
      if (!data.users[newUsername]) {
        data.users[newUsername] = [];
      }
      
      // 保存更新后的收藏数据
      fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2));
      // 成功切换用户
      
      // 发送收藏数据更新事件，确保切换用户后立即更新UI
      event.sender.send('favorites-updated', data.users[newUsername]);
    } else {
      // 如果文件不存在，创建包含新用户的默认数据结构
      const defaultUser = getTranslation('defaultUser');
      const initialData = {
        currentUser: newUsername,
        users: {
          [defaultUser]: [],
          [newUsername]: []
        }
      };
      
      // 确保目录存在
      ensureDirectoryExists(favoritesDir);
      
      // 保存数据
      fs.writeFileSync(favoritesPath, JSON.stringify(initialData, null, 2));
      // 文件不存在，创建新数据并切换用户
      
      // 发送收藏数据更新事件
      event.sender.send('favorites-updated', initialData.users[newUsername]);
    }
  } catch (error) {
    console.error(`切换用户失败:`, error);
  }
});

// 确保单实例运行前初始化设置文件
initSettingsFile();

// 处理打开用户名对话框事件
ipcMain.on('open-username-dialog', (event) => {
  const usernameWindow = new BrowserWindow({
    width: 400,
    height: 280,
    resizable: false,
    maximizable: false,
    minimizable: false,
    title: getTranslation('addUser'),
    parent: mainWindow,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    modal: true,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // 加载用户名对话框页面
  usernameWindow.loadFile('username-dialog.html');

  // 监听用户名确认事件
  ipcMain.once('username-confirmed', (event, username) => {
    // 将用户名传回渲染进程
    mainWindow.webContents.send('username-confirmed', username);
    usernameWindow.close();
  });

  // 窗口关闭时清理事件监听器
  usernameWindow.on('closed', () => {
    // 移除临时监听器
    ipcMain.removeAllListeners('username-confirmed');
  });
});

// 加载用户数据
loadUsers();

// 处理添加用户事件
ipcMain.on('add-user', (event, username) => {
  if (!users.includes(username)) {
    users.push(username);
    saveUsers(users);
    
    // 通知渲染进程更新用户列表
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('users-data', users);
      // 用户添加成功，已通知渲染进程
    }
    
    // 为新用户创建空的收藏数据结构
    try {
      let favoritesData = { users: {}, currentUser: username };
      
      // 如果收藏文件已存在，读取现有数据
      if (fs.existsSync(favoritesPath)) {
        const existingData = fs.readFileSync(favoritesPath, 'utf8');
        favoritesData = JSON.parse(existingData);
        
        // 确保数据结构完整性
        if (!favoritesData.users || typeof favoritesData.users !== 'object') {
          favoritesData.users = {};
        }
        
        // 为新用户创建空数组
        favoritesData.users[username] = favoritesData.users[username] || [];
      } else {
        // 如果文件不存在，创建包含所有用户的新数据结构
        favoritesData.users = {};
        users.forEach(user => {
          favoritesData.users[user] = [];
        });
      }
      
      // 保存更新后的收藏数据
      fs.writeFileSync(favoritesPath, JSON.stringify(favoritesData, null, 2));
      // 成功为用户创建空的收藏数据结构
    } catch (error) {
      console.error(`为用户 ${username} 创建收藏数据失败:`, error);
    }
  }
});

// 处理打开隐私政策事件
ipcMain.on('open-privacy-policy', (event) => {
  try {
    const { shell } = require('electron');
    
    // 隐私政策网页URL
    const privacyPolicyUrl = 'https://github.com/samson7s/favorites-browser/blob/master/privacy-policy.md';
    
    // 使用默认浏览器打开隐私政策网页
    shell.openExternal(privacyPolicyUrl);
  } catch (error) {
    console.error('打开隐私政策失败:', error);
    dialog.showErrorBox(getTranslation('openFailed'), `${getTranslation('cannotOpenPrivacyPolicy')}${getTranslation('errorReason')}：${error.message}`);
  }
});

// 处理移除用户事件
ipcMain.handle('remove-user', async (event, username) => {
  const index = users.indexOf(username);
  if (index > -1 && username !== getTranslation('defaultUser')) {
    // 从用户列表中移除用户
    users.splice(index, 1);
    
    // 保存更新后的用户列表
    const success = saveUsers(users);
    
    if (success) {
      try {
        // 删除被移除用户的数据
        if (fs.existsSync(favoritesPath)) {
          const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
          
          // 检查并删除被移除用户的数据
          if (data.users && data.users[username]) {
            delete data.users[username];
          }
          
          // 将当前用户设置为默认用户
          const defaultUser = getTranslation('defaultUser');
          data.currentUser = defaultUser;
          
          // 保存更新后的数据
          fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2));
          
          // 发送更新后的收藏数据（默认用户的数据）
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('favorites-updated', data.users[defaultUser] || []);
          }
        }
      } catch (error) {
        console.error('删除用户数据失败:', error);
      }
      
      // 通知渲染进程更新用户列表
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('users-data', users);
      }
    }
    
    return success;
  } else {
    return false;
  }
});

// 用户数据持久化
function saveUsers(usersList) {
  try {
    ensureDirectoryExists(favoritesDir);
    const currentSettings = fs.existsSync(settingsPath) ? 
      JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {};
    
    currentSettings.users = usersList;
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
}

// 处理收藏相关IPC事件
ipcMain.on('get-favorites', (event) => {
  try {
    // 接收到获取收藏请求
    if (fs.existsSync(favoritesPath)) {
      // 收藏文件存在
      try {
        const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        // 成功解析收藏文件
        
        // 确保数据结构完整性
        if (!data || typeof data !== 'object') {
          throw new Error('收藏数据格式无效');
        }
        
        const defaultUser = getTranslation('defaultUser');
        const currentUser = data.currentUser || defaultUser;
        // 当前用户
        
        if (!data.users || typeof data.users !== 'object') {
          data.users = { [defaultUser]: [] };
        }
        
        if (!data.users[currentUser]) {
          data.users[currentUser] = [];
        }
        
        event.sender.send('favorites-updated', data.users[currentUser]);
      } catch (parseErr) {
        console.error('解析收藏文件失败:', parseErr.message);
        console.error('错误详情:', parseErr);
        
        // 尝试使用备用收藏文件
        try {
          const appDataPath = app.getPath('appData');
          const backupFavoritesPath = path.join(appDataPath, 'Favorites browser', 'favorites.json');
          
          if (fs.existsSync(backupFavoritesPath)) {
            // 尝试使用备用收藏文件
            const backupData = JSON.parse(fs.readFileSync(backupFavoritesPath, 'utf8'));
            const defaultUser = getTranslation('defaultUser');
            const currentUser = backupData.currentUser || defaultUser;
            event.sender.send('favorites-updated', backupData.users?.[currentUser] || []);
            return;
          }
        } catch (backupErr) {
          // 静默处理备用收藏文件加载失败
        }
        
        // 所有尝试都失败，返回空数组
        event.sender.send('favorites-updated', []);
      }
    } else {
      // 收藏文件不存在，返回空数组
      event.sender.send('favorites-updated', []);
    }
  } catch (err) {
    console.error('获取收藏失败:', err.message);
    console.error('错误详情:', err);
    event.sender.send('favorites-updated', []);
  }
});

ipcMain.on('add-favorite', (event, newItem) => {
  try {
    ensureDirectoryExists(favoritesDir);
    
    let data;
    // 检查文件是否存在
    if (fs.existsSync(favoritesPath)) {
      data = JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
    } else {
      // 文件不存在时创建默认数据结构
      const defaultUser = getTranslation('defaultUser');
      data = {
        currentUser: defaultUser,
        users: {
          [defaultUser]: []
        }
      };
    }
    
    // 确保当前用户的收藏数组存在
    const defaultUser = getTranslation('defaultUser');
    const currentUser = data.currentUser || defaultUser;
    if (!data.users[currentUser]) {
      data.users[currentUser] = [];
    }
    
    // 添加新数据（避免重复）
    if (!data.users[currentUser].some((item) => item.url === newItem.url)) {
      newItem.isNew = true;
      data.users[currentUser].push(newItem);
      // 写回文件
      fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
      // 通知渲染进程更新
      event.sender.send('favorites-updated', data.users[currentUser]);
    }
  } catch (err) {
    console.error('添加收藏失败:', err);
  
    dialog.showErrorBox(getTranslation('saveFavoritesFailed'), `${getTranslation('errorReason')}：${err.message}`);
  }
});

ipcMain.on('delete-favorite', (event, index) => {
  try {
    if (fs.existsSync(favoritesPath)) {
      const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      const defaultUser = getTranslation('defaultUser');
      const currentUser = data.currentUser || defaultUser;
      if (data.users[currentUser] && index >= 0 && index < data.users[currentUser].length) {
        data.users[currentUser].splice(index, 1);
        fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
        event.sender.send('favorites-updated', data.users[currentUser]);
      }
    }
  } catch (err) {
    console.error('删除收藏失败:', err);
  }
});

// 处理收藏顺序更新
ipcMain.on('update-favorites-order', (event, newFavorites) => {
  try {
    if (fs.existsSync(favoritesPath)) {
      const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      const defaultUser = getTranslation('defaultUser');
      const currentUser = data.currentUser || defaultUser;
      data.users[currentUser] = newFavorites;
      fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
      event.sender.send('favorites-updated', newFavorites);
    }
  } catch (err) {
    console.error('更新收藏顺序失败:', err);
  }
});

// 保存集数数据
// 导入工具函数
let utilsModule;
try {
  utilsModule = require('./utils');
} catch (e) {
  console.error('utils.js导入失败:', e);
}

const { isVideoPlatformUrl, updateEpisodeInURL } = utilsModule || { isVideoPlatformUrl: null, updateEpisodeInURL: null };

async function saveEpisodeData({ index, total, downloaded, url }) {
  return new Promise((resolve, reject) => {
    try {
      // 确保收藏目录存在
      ensureDirectoryExists(favoritesDir);

      // 读取现有收藏数据
      let data;
      if (fs.existsSync(favoritesPath)) {
        data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      } else {
        // 文件不存在时创建默认数据结构
        const defaultUser = getTranslation('defaultUser');
        data = {
          currentUser: defaultUser,
          users: {
            [defaultUser]: []
          }
        };
      }
      
      const defaultUser = getTranslation('defaultUser');
      const currentUser = data.currentUser || defaultUser;
      const userFavorites = data.users[currentUser] || [];

      // 验证索引有效性
      if (index === undefined || index < 0 || index >= userFavorites.length) {
        reject(new Error(`无效的收藏项索引: ${index} (总数: ${userFavorites.length})`));
        return;
      }

      console.log(`更新收藏项 ${index} 之前的数据:`, {
        totalEpisodes: userFavorites[index].totalEpisodes,
        downloadedEpisodes: userFavorites[index].downloadedEpisodes,
        url: userFavorites[index].url
      });

      // 更新集数数据
      if (total !== null) {
        userFavorites[index].totalEpisodes = total;
        console.log(`更新总集数为: ${total}`);
      }
      userFavorites[index].downloadedEpisodes = downloaded;
      console.log(`更新下载集数为: ${downloaded}`);

      // 如果提供了URL参数，直接使用它；否则检查当前URL是否需要更新
      if (url) {
        console.log(`使用提供的URL: ${url}`);
        userFavorites[index].url = url;
      } else {
        // 检查URL是否属于视频平台，如果是则更新URL中的剧集信息
        const itemUrl = userFavorites[index].url;
        if (itemUrl && downloaded > 0 && isVideoPlatformUrl(itemUrl)) {
          console.log(`URL属于视频平台，更新剧集信息: ${itemUrl}`);
          // 更新URL中的剧集信息
          const updatedUrl = updateEpisodeInURL(itemUrl, downloaded);
          userFavorites[index].url = updatedUrl;
          console.log(`更新后的URL: ${updatedUrl}`);
        }
      }

      console.log(`更新收藏项 ${index} 之后的数据:`, {
        totalEpisodes: userFavorites[index].totalEpisodes,
        downloadedEpisodes: userFavorites[index].downloadedEpisodes,
        url: userFavorites[index].url
      });

      // 写入文件并验证
      fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`数据已写入文件: ${favoritesPath}`);

      // 验证写入结果
      const updatedData = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      const updatedUserFavorites = updatedData.users[updatedData.currentUser] || [];
      console.log(`验证写入结果 - 更新后的数据:`, {
        totalEpisodes: updatedUserFavorites[index].totalEpisodes,
        downloadedEpisodes: updatedUserFavorites[index].downloadedEpisodes
      });
      
      // 只在total不为null时才比较totalEpisodes字段
      if (
        (total !== null && updatedUserFavorites[index].totalEpisodes !== total) ||
        updatedUserFavorites[index].downloadedEpisodes !== downloaded
      ) {
        throw new Error('数据写入后验证失败');
      }

      // 通知所有窗口数据已更新
      if (mainWindow) {
        mainWindow.webContents.send('favorites-updated', userFavorites);
        console.log('已通知所有窗口数据已更新');
      }

      resolve();
    } catch (error) {
      console.error('保存失败:', error);
      reject(new Error(`保存失败: ${error.message} (路径: ${favoritesPath})`));
    }
  });
}

// 处理打开添加对话框请求
ipcMain.on('open-add-dialog', (event) => {
  const addDialog = new BrowserWindow({
    width: 500,
    height: 450,
    resizable: false,
    modal: true,
    parent: mainWindow,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  addDialog.loadFile('add-dialog.html');
  addDialog.setMenu(null);
});

// 处理添加收藏确认事件
ipcMain.on('add-favorite-confirm', (event, { title, url, openMethod, pinToTop, downloadedEpisodes, urlType }) => {
  try {
    const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
    // 确保当前用户的收藏数组存在
    if (!data.users[data.currentUser]) {
      data.users[data.currentUser] = [];
    }
    if (!data.users[data.currentUser].some((item) => item.url === url)) {
        data.users[data.currentUser].push({ 
          title, 
          url, 
          openMethod: openMethod || 'internal',
          pinToTop: pinToTop || false,
          downloadedEpisodes: downloadedEpisodes || 0, // 默认为0
          totalEpisodes: 0, // 默认总集数为0
          urlType: urlType || 'video' // 默认添加urlType: video
        });
      fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
      mainWindow.webContents.send('favorites-updated', data.users[data.currentUser]);
    }
  } catch (err) {
    
    dialog.showErrorBox(getTranslation('addFailed'), `${getTranslation('errorReason')}：${err.message}`);
  }
});

// 处理编辑收藏对话框
ipcMain.handle('show-edit-dialog', async (event, index) => {
  return new Promise((resolve) => {
    // 创建对话框窗口
    const dialogWindow = new BrowserWindow({
      width: 500,
      height: 450,
      resizable: false,
      modal: false,
      parent: mainWindow,
      alwaysOnTop: true,
      show: false,
      autoHideMenuBar: true,
      icon: getIconPath(),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // 加载编辑对话框HTML
    dialogWindow.loadFile('edit-dialog.html');

    // 定义确认事件处理函数
    const handleConfirm = (event, data) => {
        try {
          // 读取现有收藏数据
          const favoritesData = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
          // 获取当前用户的收藏列表
          const userFavorites = favoritesData.users[favoritesData.currentUser] || [];
          // 更新收藏项
      if (data.index >= 0 && data.index < userFavorites.length) {
        userFavorites[data.index].title = data.title;
        userFavorites[data.index].url = data.url;
        userFavorites[data.index].openMethod = data.openMethod || 'internal';
        userFavorites[data.index].pinToTop = data.pinToTop || false;
        userFavorites[data.index].downloadedEpisodes = data.downloadedEpisodes || 0;
        userFavorites[data.index].totalEpisodes = data.totalEpisodes || 0;
        userFavorites[data.index].urlType = data.urlType || 'video';
            // 保存更新后的数据
            fs.writeFileSync(favoritesPath, JSON.stringify(favoritesData, null, 2), 'utf-8');
            // 通知主窗口更新
            if (mainWindow) {
              mainWindow.webContents.send('favorites-updated', userFavorites);
            }
            // 检查窗口是否仍然存在
            if (dialogWindow && !dialogWindow.isDestroyed()) {
              // 通知对话框操作成功
              dialogWindow.webContents.send('edit-dialog-success');
            }
            resolve(data);
          } else {
            // 检查窗口是否仍然存在
            if (dialogWindow && !dialogWindow.isDestroyed()) {
              dialogWindow.webContents.send('edit-dialog-error', {
                field: 'general',
                message: getTranslation('invalidIndex')
              });
            }
          }
        } catch (err) {
          // 检查窗口是否仍然存在
          if (dialogWindow && !dialogWindow.isDestroyed()) {
            dialogWindow.webContents.send('edit-dialog-error', {
              field: 'general',
              message: `${getTranslation('saveFailed')}: ${err.message}`
            });
          }
        }
    };

    // 定义取消事件处理函数
    const handleCancel = () => {
      resolve(null);
      // 检查窗口是否仍然存在
      if (dialogWindow && !dialogWindow.isDestroyed()) {
        // 通知对话框可以关闭了
        dialogWindow.webContents.send('edit-dialog-canceled');
      }
    };

    // 注册事件监听器
    ipcMain.on('edit-dialog-confirm', handleConfirm);
    ipcMain.on('edit-dialog-cancel', handleCancel);

    // 添加窗口关闭事件处理，移除监听器
    dialogWindow.on('closed', () => {
      ipcMain.removeListener('edit-dialog-confirm', handleConfirm);
      ipcMain.removeListener('edit-dialog-cancel', handleCancel);
    });
    dialogWindow.webContents.on('did-finish-load', () => {
      try {
        // 读取现有收藏数据
        const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        // 获取当前用户的收藏列表
        const userFavorites = favorites.users[favorites.currentUser] || [];
        const item = userFavorites[index];
        if (!item) {
          dialogWindow.webContents.send('edit-dialog-error', {
            field: 'general',
            message: getTranslation('cannotFindFavoriteItem')
          });
          setTimeout(() => dialogWindow.close(), 3000);
          return;
        }
        dialogWindow.webContents.send('set-edit-values', {
          title: item.title || '',
          url: item.url || '',
          openMethod: item.openMethod || 'internal',
          pinToTop: item.pinToTop || false,
          downloadedEpisodes: item.downloadedEpisodes || 0,
          totalEpisodes: item.totalEpisodes || 0,
          urlType: item.urlType || 'video',
          index: index
        });
        dialogWindow.show();
      } catch (error) {
          dialogWindow.webContents.send('edit-dialog-error', {
            field: 'general',
            message: `${getTranslation('loadFavoritesFailed')}: ${error.message}`
          });
          setTimeout(() => dialogWindow.close(), 3000);
        }
    });
  });
});

// 处理集数更新
ipcMain.handle('show-episode-dialog', async (event, index) => {
  return new Promise((resolve) => {
    if (!mainWindow) {
      console.error('主窗口未初始化');
      resolve(null);
      return;
    }
    // 创建对话框窗口
    const dialogWindow = new BrowserWindow({
      width: 500,
      height: 350,
      resizable: false,
      modal: false,
      parent: mainWindow, // 使用主窗口作为明确父窗口
      alwaysOnTop: true, // 确保对话框置顶显示
      show: false,
      autoHideMenuBar: true, // 自动隐藏菜单栏
      icon: getIconPath(),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // 加载自定义对话框HTML
    dialogWindow.loadFile('episode-dialog.html');

    // 添加错误处理
    dialogWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`对话框加载失败: ${errorDescription} (错误代码: ${errorCode})`);
      dialogWindow.show(); // 即使加载失败也显示窗口以便查看错误
      dialogWindow.webContents.send('episode-dialog-error', `${getTranslation('cannotLoadDialog')}: ${errorDescription}`);
    });

    // 定义确认事件处理函数
    const handleConfirm = (event, data) => {
      saveEpisodeData(data).then(() => {
        resolve(data);
        dialogWindow.close();
      }).catch((err) => {
        dialogWindow.webContents.send('episode-dialog-error', `${getTranslation('saveFailed')}: ${err.message}`);
      });
      // 移除监听器
      ipcMain.removeListener('episode-dialog-confirm', handleConfirm);
      ipcMain.removeListener('episode-dialog-cancel', handleCancel);
    };

    // 定义取消事件处理函数
    const handleCancel = () => {
      resolve(null);
      dialogWindow.close();
      // 移除监听器
      ipcMain.removeListener('episode-dialog-confirm', handleConfirm);
      ipcMain.removeListener('episode-dialog-cancel', handleCancel);
    };

    // 注册事件监听器
    ipcMain.on('episode-dialog-confirm', handleConfirm);
    ipcMain.on('episode-dialog-cancel', handleCancel);

    // 修正ready-to-show事件监听对象
     dialogWindow.on('ready-to-show', () => {
       dialogWindow.show();
     });

    dialogWindow.webContents.on('did-finish-load', () => {
      try {
        // 发送当前集数数据
        const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        // 获取当前用户的收藏列表
        const userFavorites = favorites.users[favorites.currentUser] || [];
        const item = userFavorites[index];
        if (!item) {
          dialogWindow.webContents.send('episode-dialog-error', getTranslation('cannotFindFavoriteItemWithIndex').replace('%s', index));
          return;
        }
        dialogWindow.webContents.send('set-episode-values', {
          total: item.totalEpisodes || 0,
          downloaded: item.downloadedEpisodes || 0,
          index: index,
          url: item.url || ''
        });
        // 移除重复的show()调用
      } catch (error) {
        dialogWindow.webContents.send('episode-dialog-error', `${getTranslation('loadFavoritesFailed')}: ${error.message}`);
        setTimeout(() => dialogWindow.close(), 3000);
      }
    });
  });
});

ipcMain.on('update-favorites', (event, updatedFavorites) => {
  try {
    // 读取现有收藏数据
    const data = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
    // 更新当前用户的收藏
    data.users[data.currentUser] = updatedFavorites;
    // 保存更新后的数据
    fs.writeFileSync(favoritesPath, JSON.stringify(data, null, 2), 'utf-8');
    // 通知渲染进程更新
    event.sender.send('favorites-updated', updatedFavorites);
  } catch (err) {
    
    dialog.showErrorBox(getTranslation('updateFailed'), `${getTranslation('cannotSaveFavorites')}: ${err.message}`);
  }
});
// 打开新窗口
ipcMain.on('open-new-window', (event, url, index) => {
  createNewWindow(url, index);
});

// 使用系统默认浏览器打开
ipcMain.on('open-external-browser', (event, url) => {
  
  shell.openExternal(url).catch(err => {
    const { dialog } = require('electron');
    dialog.showErrorBox(getTranslation('openFailed'), `${getTranslation('openExternalBrowserFailed')}：${err.message}`);
  });
});

ipcMain.on('open-about-window', () => {
  const aboutWindow = new BrowserWindow({
    width: 600,
    height: 400,
    resizable: false,
    parent: mainWindow,
    modal: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  aboutWindow.loadFile('about.html');
  aboutWindow.setMenu(null);
});

// 处理导入收藏夹
ipcMain.on('import-favorites', (event) => {
  const { dialog } = require('electron');
  
  dialog.showOpenDialog(mainWindow, {
    title: getTranslation('selectFavoritesFile'),
    filters: [
      { name: 'Favorites Backup Files', extensions: ['favbackup'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      
      try {
        // 读取导入的备份文件
        const importedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 确保目录存在
        ensureDirectoryExists(favoritesDir);
        
        // 还原favorites.json文件
        if (importedData.favorites) {
          fs.writeFileSync(favoritesPath, JSON.stringify(importedData.favorites, null, 2), 'utf8');
        }
        
        // 还原settings.json文件
        if (importedData.settings) {
          fs.writeFileSync(settingsPath, JSON.stringify(importedData.settings, null, 2), 'utf8');
        }
        
        // 重新加载用户数据
        loadUsers();
        
        // 通知渲染进程更新
        try {
          const favoritesData = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
          mainWindow.webContents.send('favorites-updated', favoritesData.users[favoritesData.currentUser] || []);
        } catch (e) {
          console.error('重新加载收藏数据失败:', e);
        }
        
        // 显示导入成功提示
        event.sender.send('import-export-notification', {
          type: 'success',
          message: getTranslation('importFavoritesSuccess')
        });
      } catch (error) {
        console.error('导入收藏夹失败:', error);
        event.sender.send('import-export-notification', {
          type: 'error',
          message: `${getTranslation('importFailed')}: ${error.message}`
        });
      }
    }
  }).catch(err => {
    console.error('打开文件对话框失败:', err);
    event.sender.send('import-export-notification', {
      type: 'error',
      message: `${getTranslation('operationFailed')}: ${err.message}`
    });
  });
});

// 处理导出收藏夹
ipcMain.on('export-favorites', (event) => {
  const { dialog } = require('electron');
  
  dialog.showSaveDialog(mainWindow, {
    title: getTranslation('exportFavorites'),
    defaultPath: `收藏夹备份_${new Date().toISOString().slice(0, 10)}.favbackup`,
    filters: [
      { name: 'Favorites Backup Files', extensions: ['favbackup'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      const filePath = result.filePath;
      
      try {
        // 创建备份数据对象
        const backupData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          favorites: null,
          settings: null
        };
        
        // 读取收藏数据
        if (fs.existsSync(favoritesPath)) {
          backupData.favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
        }
        
        // 读取设置数据
        if (fs.existsSync(settingsPath)) {
          backupData.settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        
        // 导出为备份文件
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
        
        // 显示导出成功提示
        event.sender.send('import-export-notification', {
          type: 'success',
          message: getTranslation('exportFavoritesSuccess')
        });
      } catch (error) {
        console.error('导出收藏夹失败:', error);
        event.sender.send('import-export-notification', {
          type: 'error',
          message: `${getTranslation('exportFailed')}: ${error.message}`
        });
      }
    }
  }).catch(err => {
    console.error('打开保存对话框失败:', err);
    event.sender.send('import-export-notification', {
      type: 'error',
      message: `${getTranslation('operationFailed')}: ${err.message}`
    });
  });
});

// 处理从浏览窗口发送的观看集数更新
ipcMain.on('update-watched-episode', async (event, data) => {
  try {
    console.log('接收到观看集数更新原始数据:', data);
    
    // 防御性编程：检查数据格式
    if (!data || typeof data !== 'object') {
      console.error('无效的集数更新数据格式:', data);
      return;
    }
    
    const { index, episode, url } = data;
    console.log('解析后的集数更新数据:', { index, episode, url });
    
    // 验证必要参数
    if (index === undefined || index === null || episode === undefined || !url) {
      console.error('缺少必要的集数更新参数:', { index, episode, url });
      return;
    }
    
    // 调用saveEpisodeData函数保存集数信息
    console.log('准备调用saveEpisodeData函数保存集数信息');
    await saveEpisodeData({
      index: index,
      total: null, // 不更新总集数
      downloaded: episode,
      url: url
    });
    
    console.log('集数数据更新成功');
  } catch (error) {
    console.error('更新集数数据失败:', error);
  }
});
