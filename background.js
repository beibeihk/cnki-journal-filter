// ==================== 知网期刊筛选器 Background Service Worker ====================

chrome.runtime.onInstalled.addListener(() => {
  console.log('[知网期刊筛选器] 插件已安装');
});

// 监听标签页更新，在知网页面显示徽章
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('cnki')) {
      chrome.action.setBadgeText({ text: 'ON', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#3584e4' });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// 处理来自 content script 或 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabId') {
    sendResponse({ tabId: sender.tab?.id });
  }
  return true;
});
