// 统一管理视频平台域名和相关工具函数

/**
 * 知名视频平台域名列表
 */
const videoPlatforms = [
  'v.qq.com', // 腾讯视频
  'www.bilibili.com', // Bilibili
  'www.iqiyi.com', // 爱奇艺
  'youku.com', // 优酷
  'mgtv.com', // 芒果TV
  'sohu.com', // 搜狐视频
  'le.com' // 乐视视频
];

/**
 * 网盘平台域名列表
 */
const cloudDiskPlatforms = {
  'baidudisk.com': 'baidudisk', // 百度网盘
  'pan.baidu.com': 'baidudisk', // 百度网盘备用域名
  'aliyundrive.com': 'aliyundrive', // 阿里云网盘
  'www.aliyundrive.com': 'aliyundrive' // 阿里云网盘备用域名
};

/**
 * 检查URL是否属于视频平台
 * @param {string} url - 要检查的URL
 * @returns {boolean} - 如果URL属于视频平台则返回true
 */
function isVideoPlatformUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    return videoPlatforms.some(platform => domain.includes(platform));
  } catch (e) {
    console.error('验证URL时出错:', e);
    return false;
  }
}

/**
 * 检查URL是否属于网盘平台并返回具体类型
 * @param {string} url - 要检查的URL
 * @returns {string|null} - 返回网盘类型，不是网盘则返回null
 */
function isCloudDiskUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    
    for (const [platformDomain, diskType] of Object.entries(cloudDiskPlatforms)) {
      if (domain.includes(platformDomain)) {
        return diskType;
      }
    }
    return null;
  } catch (e) {
    console.error('验证网盘URL时出错:', e);
    return null;
  }
}

/**
 * 更新视频URL中的集数参数
 * @param {string} url - 原始URL
 * @param {number} downloadedEpisodes - 新的集数
 * @returns {string} - 更新后的URL
 */
function updateEpisodeInURL(url, downloadedEpisodes) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const searchParams = parsedUrl.searchParams;
    
    // 根据不同平台更新对应的集数参数
    if (domain.includes('v.qq.com')) {
      // 腾讯视频
      if (searchParams.has('episode')) {
        searchParams.set('episode', downloadedEpisodes);
      } else if (searchParams.has('vpage')) {
        searchParams.set('vpage', downloadedEpisodes);
      }
    } else if (domain.includes('www.bilibili.com')) {
      // Bilibili
      if (searchParams.has('p')) {
        searchParams.set('p', downloadedEpisodes);
      }
    } else if (domain.includes('www.iqiyi.com')) {
      // 爱奇艺
      if (searchParams.has('ep')) {
        searchParams.set('ep', downloadedEpisodes);
      }
    } else if (domain.includes('youku.com')) {
      // 优酷
      if (searchParams.has('ep')) {
        searchParams.set('ep', downloadedEpisodes);
      } else if (searchParams.has('spm')) {
        // 处理格式如: spm=a2hkt.13141534.1_6.d_1_2 的参数
        const spmValue = searchParams.get('spm');
        const spmParts = spmValue.split('.');
        
        // 寻找包含'd_'的部分，例如'd_1_2'
        const dPartIndex = spmParts.findIndex(part => part.startsWith('d_'));
        
        if (dPartIndex !== -1) {
          // 解析d_1_2格式，提取季数和集数
          const dParts = spmParts[dPartIndex].split('_');
          if (dParts.length >= 3) {
            // 保留季数，只更新集数
            spmParts[dPartIndex] = `d_${dParts[1]}_${downloadedEpisodes}`;
          } else {
            // 如果格式不符合预期，保持原有逻辑修改最后一部分
            spmParts[spmParts.length - 1] = downloadedEpisodes;
          }
          searchParams.set('spm', spmParts.join('.'));
        }
      }
    }
    
    // 更新search属性
    parsedUrl.search = searchParams.toString();
    return parsedUrl.toString();
  } catch (e) {
    console.error('更新视频URL时出错:', e);
    return url; // 出错时返回原始URL
  }
}

/**
 * 获取URL类型
 * @param {string} url - 要检查的URL
 * @returns {string} - URL类型（'video', 'baidudisk', 'aliyundrive'或'other'）
 */
function getUrlType(url) {
  const diskType = isCloudDiskUrl(url);
  if (diskType) {
    return diskType;
  }
  return isVideoPlatformUrl(url) ? 'video' : 'other';
}

/**
 * 验证URL是否有效
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 如果URL有效则返回true
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

// CommonJS 模块导出
module.exports = {
  videoPlatforms,
  cloudDiskPlatforms,
  isVideoPlatformUrl,
  isCloudDiskUrl,
  updateEpisodeInURL,
  getUrlType,
  isValidUrl
};