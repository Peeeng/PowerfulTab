import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'PowerfulTab',
  version: '0.1.3',
  description:
    '一键整理标签页：域名 / Path 分组、完整 URL 精确去重、标题与 URL 搜索、多窗口配色、复制标签和撤销关闭。本地处理，不上传数据。',
  homepage_url: 'https://github.com/Peeeng/PowerfulTab',
  action: {
    default_title: 'PowerfulTab · 打开侧边栏',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'sidepanel.html',
  },
  commands: {
    'focus-search-input': {
      suggested_key: { default: 'Ctrl+Shift+F', mac: 'MacCtrl+Shift+F' },
      description: '聚焦标签搜索栏（不关闭侧边栏）',
    },
    'focus-search': {
      description: '打开/关闭标签侧边栏，打开时聚焦搜索框',
    },
  },
  // 最小权限原则：
  //   tabs        - 读取标签 URL/title/icon 用于分组/去重/展示
  //   tabGroups   - 整理时把同域标签合到 Chrome 原生标签组
  //   sessions    - 撤销关闭功能：恢复刚刚关掉的标签
  //   storage     - 本地保存白名单、主题、模式偏好（chrome.storage.local，零远端）
  //   sidePanel   - 在侧边栏渲染 Dashboard
  //   favicon     - 拉取站点 favicon 给卡片做 16x16 图标
  permissions: ['tabs', 'tabGroups', 'sessions', 'storage', 'favicon', 'sidePanel'],
  icons: {
    '16': 'src/assets/icons/icon-16.png',
    '32': 'src/assets/icons/icon-32.png',
    '48': 'src/assets/icons/icon-48.png',
    '128': 'src/assets/icons/icon-128.png',
  },
  web_accessible_resources: [
    {
      resources: ['index.html', '_favicon/*'],
      matches: ['<all_urls>'],
    },
  ],
});
