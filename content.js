// ==================== 知网期刊筛选 Content Script ====================

let filteredCount = 0;
let totalCount = 0;
let isFiltering = false;

// 在页面注入一个浮动提示框
function injectToast() {
  if (document.getElementById('cnki-filter-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'cnki-filter-toast';
  toast.innerHTML = `
    <div id="cnki-filter-toast-inner" style="
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 999999;
      background: #fff;
      border: 1px solid #3584e4;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 13px;
      color: #333;
      max-width: 280px;
      transition: all 0.3s;
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <strong style="color:#1a5fb4;font-size:14px;">知网期刊筛选器</strong>
        <button id="cnki-toast-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:#999;line-height:1;">&times;</button>
      </div>
      <div id="cnki-toast-content">正在筛选...</div>
      <button id="cnki-toast-reset" style="
        margin-top:8px;
        padding:4px 12px;
        background:#f0f0f0;
        border:1px solid #d9d9d9;
        border-radius:4px;
        cursor:pointer;
        font-size:12px;
      ">显示全部结果</button>
    </div>
  `;
  document.body.appendChild(toast);

  document.getElementById('cnki-toast-close').addEventListener('click', () => {
    toast.style.display = 'none';
  });

  document.getElementById('cnki-toast-reset').addEventListener('click', () => {
    resetFilter();
  });
}

function updateToast(message) {
  const content = document.getElementById('cnki-toast-content');
  if (content) content.textContent = message;
  const toast = document.getElementById('cnki-filter-toast-inner');
  if (toast) toast.style.display = 'block';
}

function hideToast() {
  const toast = document.getElementById('cnki-filter-toast-inner');
  if (toast) toast.style.display = 'none';
}

// ==================== 核心筛选逻辑 ====================

/**
 * 获取知网搜索结果中的所有条目
 * 知网有多种页面结构，需要兼容处理
 */
function getSearchItems() {
  const selectors = [
    // 新版知网 kns8 列表模式
    '.result-table-list tbody tr',
    // 新版知网卡片模式
    '.search-result .item',
    '.result-list .item',
    // 旧版
    '.GridTableContent tbody tr',
    // 其他可能
    '[class*="result"] [class*="item"]',
    '.article-list .list-item',
    '.c_docu_dissertations li',
    '.result-table-list tr'
  ];

  for (const selector of selectors) {
    const items = document.querySelectorAll(selector);
    if (items.length > 0) {
      return Array.from(items);
    }
  }

  return [];
}

/**
 * 从单个条目中提取期刊/来源名称
 */
function getSourceFromItem(item) {
  // 尝试多种可能的选择器
  const selectors = [
    '.source',
    '.name a',
    '.name',
    '.source a',
    '.fz14',
    '.title a',
    'a[title]',
    '.journal',
    '.pub',
    '[class*="source"]',
    '[class*="journal"]',
    'td:nth-child(4)',
    'td:nth-child(3)',
    '.date+span'
  ];

  for (const selector of selectors) {
    const el = item.querySelector(selector);
    if (el) {
      const text = el.textContent.trim();
      if (text && text.length > 1 && text.length < 50) {
        return text;
      }
    }
  }

  // 兜底：遍历所有子元素文本，查找可能的期刊名
  const allText = item.textContent;
  // 常见模式匹配
  const patterns = [
    /《([^》]{2,30})》/,
    /([^，,]+?)[\s]*\d{4}[\s]*年/,
    /(?:期刊|来源)[:：]\s*([^\s；;]+)/
  ];

  for (const p of patterns) {
    const match = allText.match(p);
    if (match) return match[1].trim();
  }

  return allText.trim().substring(0, 80);
}

/**
 * 标准化期刊名称用于匹配
 */
function normalizeJournalName(name) {
  return name
    .replace(/[《》<>]/g, '')
    .replace(/[\s\u3000]+/g, '')
    .replace(/[•·]/g, '')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .trim();
}

/**
 * 检查来源是否匹配选中的期刊列表
 */
function isMatch(source, targetJournals) {
  const normalizedSource = normalizeJournalName(source);

  for (const journal of targetJournals) {
    const normalizedJournal = normalizeJournalName(journal);

    // 完全匹配
    if (normalizedSource === normalizedJournal) return true;

    // 包含关系（处理括号等差异）
    if (normalizedSource.includes(normalizedJournal)) return true;
    if (normalizedJournal.includes(normalizedSource)) return true;

    // 去掉括号再匹配
    const sourceNoParen = normalizedSource.replace(/\([^)]*\)/g, '');
    const journalNoParen = normalizedJournal.replace(/\([^)]*\)/g, '');
    if (sourceNoParen === journalNoParen) return true;
    if (sourceNoParen.includes(journalNoParen) && journalNoParen.length > 4) return true;
  }

  return false;
}

/**
 * 应用筛选
 */
function applyFilter(journals) {
  injectToast();
  isFiltering = true;

  const items = getSearchItems();
  totalCount = items.length;
  filteredCount = 0;

  if (items.length === 0) {
    updateToast('未找到搜索结果，请确认您在知网搜索结果页');
    return;
  }

  items.forEach(item => {
    // 先恢复显示
    item.style.display = '';
    item.classList.remove('cnki-filter-hidden');

    const source = getSourceFromItem(item);
    const match = isMatch(source, journals);

    if (match) {
      filteredCount++;
      item.style.display = '';
      item.style.opacity = '1';
    } else {
      item.style.display = 'none';
      item.classList.add('cnki-filter-hidden');
    }
  });

  // 处理分页控件旁边的提示
  addFilterHint(journals.length);

  updateToast(`筛选完成：显示 ${filteredCount} / ${totalCount} 条结果（${journals.length} 个期刊）`);

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 重置筛选
 */
function resetFilter() {
  const items = getSearchItems();
  items.forEach(item => {
    item.style.display = '';
    item.style.opacity = '1';
    item.classList.remove('cnki-filter-hidden');
  });

  // 移除提示
  const hint = document.getElementById('cnki-filter-hint');
  if (hint) hint.remove();

  hideToast();
  isFiltering = false;
}

/**
 * 添加筛选提示
 */
function addFilterHint(journalCount) {
  let hint = document.getElementById('cnki-filter-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'cnki-filter-hint';
    hint.style.cssText = `
      background: #e6f2ff;
      border: 1px solid #3584e4;
      color: #1a5fb4;
      padding: 8px 16px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    `;
  }

  hint.innerHTML = `
    <strong>【知网期刊筛选器】</strong> 当前仅显示 ${journalCount} 个选中期刊的结果。
    <a href="javascript:void(0)" id="cnki-hint-reset" style="color:#1a5fb4;text-decoration:underline;margin-left:8px;cursor:pointer;">显示全部</a>
  `;

  // 尝试插入到结果列表上方
  const containers = [
    '.result-table-list',
    '.search-result',
    '.result-list',
    '.GridTableContent',
    '.article-list',
    '.c_docu_dissertations'
  ];

  for (const selector of containers) {
    const container = document.querySelector(selector);
    if (container && container.parentElement) {
      container.parentElement.insertBefore(hint, container);
      break;
    }
  }

  const resetLink = document.getElementById('cnki-hint-reset');
  if (resetLink) {
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilter();
    });
  }
}

// ==================== 监听来自 popup 的消息 ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'filter') {
    applyFilter(request.journals);
    sendResponse({ success: true, filtered: filteredCount, total: totalCount });
  } else if (request.action === 'reset') {
    resetFilter();
    sendResponse({ success: true });
  }
  return true;
});

// ==================== 监听页面变化（动态加载） ====================
let observer = null;

function startObserver() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    if (!isFiltering) return;

    // 检查是否有新的搜索结果被添加
    let hasNewItems = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.matches && (
            node.matches('tr, .item, .list-item, [class*="result"]')
          )) {
            hasNewItems = true;
          }
        }
      }
    }

    if (hasNewItems) {
      // 重新获取当前筛选条件并应用
      chrome.storage.local.get('selectedJournals', (result) => {
        if (result.selectedJournals && result.selectedJournals.length > 0) {
          applyFilter(result.selectedJournals);
        }
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// 页面加载完成后启动观察器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

console.log('[知网期刊筛选器] Content script 已加载');
