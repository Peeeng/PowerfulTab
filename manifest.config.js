import { defineManifest } from '@crxjs/vite-plugin';
export default defineManifest({
    manifest_version: 3,
    name: 'PowerfulTab',
    version: '0.1.10',
    description: 'Organize tabs by domain or path, remove exact URL duplicates, and search across windows. Local-only. No uploads.',
    homepage_url: 'https://github.com/Peeeng/PowerfulTab',
    action: {
        default_title: 'PowerfulTab · Open Side Panel',
    },
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
    side_panel: {
        default_path: 'sidepanel.html',
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
