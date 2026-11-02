import { defineManifest } from '@crxjs/vite-plugin';
export default defineManifest({
    manifest_version: 3,
    name: 'PowerfulTab',
    version: '0.1.11',
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
    // Minimum permissions for local tab management:
    //   tabs        - Read metadata and perform requested tab actions
    //   tabGroups   - Manage native Chrome groups
    //   sessions    - Undo recent manual closing
    //   storage     - Local settings, language, history, and timestamps
    //   sidePanel   - Display the dashboard in Chrome's side panel
    //   favicon     - Display site icons in tab rows
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
