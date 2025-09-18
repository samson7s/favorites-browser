const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 设置输出编码为UTF-8以支持中文
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

// 创建readline接口用于用户输入
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

/**
 * 版本更新脚本
 * 此脚本用于一次性更新应用程序中所有包含版本信息的文件
 * 使用方法: node update-version.js
 */

// 定义包含版本信息的文件路径
const packageJsonPath = path.join(__dirname, 'package.json');
const packageLockJsonPath = path.join(__dirname, 'package-lock.json');
const languageJsPath = path.join(__dirname, 'language.js');
const aboutHtmlPath = path.join(__dirname, 'about.html');

// 定义需要更新的文件列表
const filesToUpdate = [
    {
        path: packageJsonPath,
        updateFunction: updatePackageJson
    },
    {
        path: packageLockJsonPath,
        updateFunction: updatePackageLockJson
    },
    {
        path: languageJsPath,
        updateFunction: updateLanguageJs
    },
    {
        path: aboutHtmlPath,
        updateFunction: updateAboutHtml
    }
];

// 清屏
function clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0f'); // ANSI清屏命令
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取当前版本号
function getCurrentVersion() {
    try {
        if (!fs.existsSync(packageJsonPath)) {
            return '未知版本';
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '未知版本';
    } catch (error) {
        console.error('获取当前版本号失败:', error.message);
        return '未知版本';
    }
}

// 验证版本号格式
function isValidVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
}

// 提示用户输入新版本号
function promptForVersion(currentVersion) {
    return new Promise((resolve) => {
        function askVersion() {
            console.log(`\n当前版本: ${currentVersion}`);
            rl.question('请输入新版本号 (格式: X.Y.Z): ', (input) => {
                if (!input) {
                    console.log('错误: 版本号不能为空！');
                    askVersion();
                } else if (!isValidVersion(input)) {
                    console.log('错误: 无效的版本号格式！');
                    console.log('请使用 X.Y.Z 的格式，其中X、Y、Z均为数字。');
                    askVersion();
                } else {
                    resolve(input);
                }
            });
        }
        askVersion();
    });
}

// 确认更新
function confirmUpdate(newVersion) {
    return new Promise((resolve) => {
        function askConfirmation() {
            rl.question(`确认将版本更新为 ${newVersion} 吗？(Y/N): `, (input) => {
                if (input.toUpperCase() === 'Y') {
                    resolve(true);
                } else if (input.toUpperCase() === 'N') {
                    resolve(false);
                } else {
                    console.log('请输入 Y 或 N！');
                    askConfirmation();
                }
            });
        }
        askConfirmation();
    });
}

// 询问是否查看更新后的文件
function askOpenFile() {
    return new Promise((resolve) => {
        function askOpen() {
            rl.question('是否查看更新后的package.json文件？(Y/N): ', (input) => {
                if (input.toUpperCase() === 'Y') {
                    resolve(true);
                } else if (input.toUpperCase() === 'N') {
                    resolve(false);
                } else {
                    console.log('请输入 Y 或 N！');
                    askOpen();
                }
            });
        }
        askOpen();
    });
}

// 更新 package.json 中的版本号
function updatePackageJson(filePath, newVersion) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const oldVersion = packageJson.version || '未知版本';
        packageJson.version = newVersion;
        fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2), 'utf8');
        console.log(`✓ 更新 ${path.basename(filePath)}: ${oldVersion} -> ${newVersion}`);
    } catch (error) {
        throw new Error(`更新 ${path.basename(filePath)} 失败: ${error.message}`);
    }
}

// 更新 package-lock.json 中的版本号
function updatePackageLockJson(filePath, newVersion) {
    try {
        const packageLockJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const oldVersion = packageLockJson.version || '未知版本';
        
        // 更新顶层版本号
        packageLockJson.version = newVersion;
        
        // 更新 packages 下的版本号
        if (packageLockJson.packages && packageLockJson.packages['']) {
            const oldNestedVersion = packageLockJson.packages[''].version || '未知版本';
            packageLockJson.packages[''].version = newVersion;
            console.log(`✓ 更新 ${path.basename(filePath)} 中的嵌套版本号: ${oldNestedVersion} -> ${newVersion}`);
        }
        
        fs.writeFileSync(filePath, JSON.stringify(packageLockJson, null, 2), 'utf8');
        console.log(`✓ 更新 ${path.basename(filePath)}: ${oldVersion} -> ${newVersion}`);
    } catch (error) {
        throw new Error(`更新 ${path.basename(filePath)} 失败: ${error.message}`);
    }
}

// 更新 language.js 中的版本文本
function updateLanguageJs(filePath, newVersion) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 匹配中文版本文本并替换
        const cnVersionRegex = /'version':\s*'版本: \d+\.\d+\.\d+'/;
        const cnMatch = content.match(cnVersionRegex);
        if (cnMatch) {
            const oldCnVersion = cnMatch[0];
            const newCnVersion = `'version': '版本: ${newVersion}'`;
            content = content.replace(cnVersionRegex, newCnVersion);
            console.log(`✓ 更新 ${path.basename(filePath)} 中的中文版本文本`);
        }
        
        // 匹配英文版本文本并替换
        const enVersionRegex = /'version':\s*'Version: \d+\.\d+\.\d+'/;
        const enMatch = content.match(enVersionRegex);
        if (enMatch) {
            const oldEnVersion = enMatch[0];
            const newEnVersion = `'version': 'Version: ${newVersion}'`;
            content = content.replace(enVersionRegex, newEnVersion);
            console.log(`✓ 更新 ${path.basename(filePath)} 中的英文版本文本`);
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`更新 ${path.basename(filePath)} 失败: ${error.message}`);
    }
}

// 更新 about.html 中的版本号
function updateAboutHtml(filePath, newVersion) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 匹配并替换 about.html 中的版本号
        const versionRegex = /<p\s+data-i18n="version">版本: \d+\.\d+\.\d+<\/p>/;
        const match = content.match(versionRegex);
        if (match) {
            const oldVersionLine = match[0];
            const newVersionLine = `<p data-i18n="version">版本: ${newVersion}</p>`;
            content = content.replace(versionRegex, newVersionLine);
            console.log(`✓ 更新 ${path.basename(filePath)} 中的版本号`);
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`更新 ${path.basename(filePath)} 失败: ${error.message}`);
    }
}

// 执行更新
async function runUpdate() {
    try {
        clearScreen();
        
        // 显示标题
        console.log('########################################');
        console.log('#       收藏夹记事本 - 版本更新工具      #');
        console.log('########################################');
        console.log('\n当前目录:', process.cwd());
        
        // 检查文件是否存在
        for (const file of filesToUpdate) {
            if (!fs.existsSync(file.path)) {
                console.warn(`警告: 文件 ${file.path} 不存在！`);
            }
        }
        
        // 获取当前版本
        const currentVersion = getCurrentVersion();
        
        // 提示用户输入新版本号
        const newVersion = await promptForVersion(currentVersion);
        
        // 确认更新
        const confirmed = await confirmUpdate(newVersion);
        if (!confirmed) {
            console.log('\n操作已取消。');
            return;
        }
        
        // 执行更新
        console.log('\n开始更新版本...\n');
        let success = true;
        
        // 更新所有文件
        for (const file of filesToUpdate) {
            if (fs.existsSync(file.path)) {
                try {
                    file.updateFunction(file.path, newVersion);
                } catch (error) {
                    console.error(`更新 ${path.basename(file.path)} 失败:`, error.message);
                    success = false;
                }
            }
        }
        
        // 显示更新结果
        if (success) {
            console.log('\n✅ 版本更新成功！');
            console.log(`\n已将所有文件的版本号从 ${currentVersion} 更新为 ${newVersion}`);
            console.log('\n更新的文件:');
            filesToUpdate.forEach(file => console.log(`- ${path.basename(file.path)}`));
            
            // 询问是否查看更新后的文件
            const openFile = await askOpenFile();
            if (openFile) {
                try {
                    // 尝试使用记事本打开文件
                    if (process.platform === 'win32') {
                        const { exec } = require('child_process');
                        exec(`notepad ${packageJsonPath}`);
                    }
                } catch (err) {
                    console.log('无法打开文件查看器。');
                }
            }
        } else {
            console.error('\n❌ 部分文件更新失败，请查看上面的错误信息');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 更新过程中发生错误:', error.message);
        process.exit(1);
    } finally {
        // 关闭readline接口
        console.log('\n版本更新工具已完成。');
        await delay(1000); // 给用户时间阅读输出
        rl.close();
    }
}

// 运行更新过程
runUpdate().catch(err => {
    console.error('程序运行出错:', err);
    process.exit(1);
});