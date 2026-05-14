// ==================== 期刊数据 ====================
const JOURNAL_DATA = [
  {
    level: "A",
    title: "A",
    subtitle: "",
    journals: ["中国社会科学"]
  },
  {
    level: "A-",
    title: "A-",
    subtitle: "",
    journals: ["经济研究", "管理世界"]
  },
  {
    level: "B+",
    title: "B+",
    subtitle: "经济与管理",
    journals: [
      "世界经济",
      "中国工业经济",
      "金融研究",
      "经济学（季刊）",
      "南开管理评论",
      "管理科学学报",
      "系统工程理论与实践",
      "会计研究"
    ]
  },
  {
    level: "B",
    title: "B",
    subtitle: "经济类",
    journals: [
      "数量经济技术经济研究",
      "财贸经济",
      "世界经济研究",
      "国际贸易问题",
      "经济学动态",
      "财政研究",
      "中国经济史研究",
      "保险研究",
      "中国人口•资源与环境",
      "中国人口·资源与环境",
      "中国人口资源与环境",
      "中国农村经济",
      "经济科学",
      "国际金融研究",
      "经济理论与经济管理",
      "中国人口科学",
      "中国土地科学",
      "宏观经济研究"
    ]
  },
  {
    level: "B",
    title: "B",
    subtitle: "管理类",
    journals: [
      "审计研究",
      "经济管理",
      "管理工程学报",
      "中国管理科学",
      "科研管理",
      "科学学研究",
      "研究与发展管理",
      "管理科学",
      "管理学报",
      "管理评论",
      "工程管理科技前沿",
      "预测",
      "营销科学学报",
      "旅游学刊"
    ]
  },
  {
    level: "B",
    title: "B",
    subtitle: "综合性期刊",
    journals: [
      "世界社会科学",
      "人民日报（理论版）",
      "人民日报(理论版)",
      "光明日报（理论版）",
      "光明日报(理论版)",
      "经济日报（理论版）",
      "经济日报(理论版)"
    ]
  }
];

// ==================== 状态管理 ====================
let selectedJournals = new Set();
let customJournals = [];

// ==================== DOM 元素 ====================
const journalListEl = document.getElementById('journal-list');
const selectedCountEl = document.getElementById('selected-count');
const customTextarea = document.getElementById('custom-journals');
const btnApply = document.getElementById('btn-apply');
const btnReset = document.getElementById('btn-reset');
const btnSelectAll = document.getElementById('btn-select-all');
const btnClearAll = document.getElementById('btn-clear-all');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');
const btnQuickA = document.getElementById('btn-quick-a');
const btnQuickAMinus = document.getElementById('btn-quick-a-minus');
const btnQuickBPlus = document.getElementById('btn-quick-b-plus');
const btnQuickB = document.getElementById('btn-quick-b');

// ==================== 初始化 ====================
async function init() {
  // 从 storage 读取已保存的选择
  const result = await chrome.storage.local.get(['selectedJournals', 'customJournals']);
  if (result.selectedJournals) {
    selectedJournals = new Set(result.selectedJournals);
  }
  if (result.customJournals) {
    customJournals = result.customJournals;
    customTextarea.value = customJournals.join('\n');
  }

  renderJournalList();
  updateSelectedCount();
  updateQuickButtons();
}

// ==================== 渲染期刊列表 ====================
function renderJournalList() {
  journalListEl.innerHTML = '';

  JOURNAL_DATA.forEach((category, index) => {
    const categoryEl = document.createElement('div');
    categoryEl.className = 'category';

    const headerEl = document.createElement('div');
    headerEl.className = 'category-header';
    headerEl.innerHTML = `
      <span class="arrow">▼</span>
      <span>${category.title}</span>
      ${category.subtitle ? `<span class="category-subtitle">${category.subtitle}</span>` : ''}
    `;

    const itemsEl = document.createElement('div');
    itemsEl.className = 'category-items';

    category.journals.forEach(journal => {
      const itemEl = document.createElement('div');
      itemEl.className = 'journal-item';
      itemEl.textContent = journal;
      if (selectedJournals.has(journal)) {
        itemEl.classList.add('selected');
      }
      itemEl.addEventListener('click', () => toggleJournal(journal, itemEl));
      itemsEl.appendChild(itemEl);
    });

    headerEl.addEventListener('click', () => {
      headerEl.classList.toggle('collapsed');
      itemsEl.classList.toggle('hidden');
    });

    categoryEl.appendChild(headerEl);
    categoryEl.appendChild(itemsEl);
    journalListEl.appendChild(categoryEl);
  });
}

// ==================== 交互逻辑 ====================
function toggleJournal(journal, element) {
  if (selectedJournals.has(journal)) {
    selectedJournals.delete(journal);
    element.classList.remove('selected');
  } else {
    selectedJournals.add(journal);
    element.classList.add('selected');
  }
  updateSelectedCount();
  updateQuickButtons();
  saveState();
}

function updateSelectedCount() {
  const customList = parseCustomJournals();
  const total = selectedJournals.size + customList.filter(c => !selectedJournals.has(c)).length;
  selectedCountEl.textContent = `已选 ${total} 个期刊`;
}

function updateQuickButtons() {
  const levels = ['A', 'A-', 'B+', 'B'];
  const buttons = [btnQuickA, btnQuickAMinus, btnQuickBPlus, btnQuickB];

  levels.forEach((level, idx) => {
    const levelJournals = getJournalsByLevel(level);
    const allSelected = levelJournals.length > 0 && levelJournals.every(j => selectedJournals.has(j));
    buttons[idx].classList.toggle('active', allSelected);
  });
}

function getJournalsByLevel(level) {
  const result = [];
  JOURNAL_DATA.forEach(cat => {
    if (cat.level === level) {
      result.push(...cat.journals);
    }
  });
  return result;
}

function selectLevel(level) {
  const journals = getJournalsByLevel(level);
  const allSelected = journals.length > 0 && journals.every(j => selectedJournals.has(j));

  if (allSelected) {
    // 取消全选
    journals.forEach(j => selectedJournals.delete(j));
  } else {
    // 全选
    journals.forEach(j => selectedJournals.add(j));
  }

  renderJournalList();
  updateSelectedCount();
  updateQuickButtons();
  saveState();
}

function selectAll() {
  JOURNAL_DATA.forEach(cat => {
    cat.journals.forEach(j => selectedJournals.add(j));
  });
  renderJournalList();
  updateSelectedCount();
  updateQuickButtons();
  saveState();
}

function clearAll() {
  selectedJournals.clear();
  customTextarea.value = '';
  renderJournalList();
  updateSelectedCount();
  updateQuickButtons();
  saveState();
}

function expandAll() {
  document.querySelectorAll('.category-header').forEach(h => h.classList.remove('collapsed'));
  document.querySelectorAll('.category-items').forEach(i => i.classList.remove('hidden'));
}

function collapseAll() {
  document.querySelectorAll('.category-header').forEach(h => h.classList.add('collapsed'));
  document.querySelectorAll('.category-items').forEach(i => i.classList.add('hidden'));
}

// ==================== 解析自定义期刊 ====================
function parseCustomJournals() {
  const text = customTextarea.value.trim();
  if (!text) return [];
  // 支持逗号、顿号、换行分隔
  return text
    .split(/[,，、\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ==================== 保存状态 ====================
function saveState() {
  const customList = parseCustomJournals();
  chrome.storage.local.set({
    selectedJournals: Array.from(selectedJournals),
    customJournals: customList
  });
}

// ==================== 应用筛选 ====================
async function applyFilter() {
  const customList = parseCustomJournals();
  const allJournals = Array.from(new Set([...selectedJournals, ...customList]));

  if (allJournals.length === 0) {
    alert('请至少选择一个期刊');
    return;
  }

  saveState();

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 检查是否在知网页面
  if (!tab.url || !tab.url.includes('cnki')) {
    alert('请在知网搜索页面使用此功能');
    return;
  }

  // 发送消息给 content script
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'filter',
      journals: allJournals
    });
    // 关闭 popup
    window.close();
  } catch (err) {
    // content script 可能还没加载，尝试注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // 等待一下再发送消息
      setTimeout(async () => {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'filter',
          journals: allJournals
        });
        window.close();
      }, 300);
    } catch (injectErr) {
      alert('无法在此页面运行插件，请确保您在知网搜索结果页');
    }
  }
}

async function resetFilter() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (!tab.url || !tab.url.includes('cnki')) {
    alert('请在知网搜索页面使用此功能');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'reset' });
    window.close();
  } catch (err) {
    alert('重置失败，请刷新页面后重试');
  }
}

// ==================== 事件绑定 ====================
btnApply.addEventListener('click', applyFilter);
btnReset.addEventListener('click', resetFilter);
btnSelectAll.addEventListener('click', selectAll);
btnClearAll.addEventListener('click', clearAll);
btnExpandAll.addEventListener('click', expandAll);
btnCollapseAll.addEventListener('click', collapseAll);

btnQuickA.addEventListener('click', () => selectLevel('A'));
btnQuickAMinus.addEventListener('click', () => selectLevel('A-'));
btnQuickBPlus.addEventListener('click', () => selectLevel('B+'));
btnQuickB.addEventListener('click', () => selectLevel('B'));

customTextarea.addEventListener('input', () => {
  updateSelectedCount();
  saveState();
});

// 启动
init();
