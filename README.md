<div align="center">

<img src="src/assets/icons/icon-128.png" alt="PowerfulTab" width="96" height="96" />

# PowerfulTab

**一键整理 Chrome 标签页：域名 / Path 分组 · 精确去重 · 快速检索 · 多窗口配色**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.config.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Privacy](https://img.shields.io/badge/Privacy-Local-brightgreen)](https://peeeng.github.io/PowerfulTab/privacy)

[✨ 功能](#支持的能力) · [📸 预览](#预览) · [📦 安装](#安装与更新) · [🛠 开发](#开发与代码入口) · [🔒 隐私](#本地数据与权限)

</div>

---

## 🌌 简介

Chrome 标签管理扩展：域名 / 一级 Path 整理、精确去重、搜索、窗口配色及标签操作。基于 Manifest V3、TypeScript、React 18、Vite 5 和 GSAP。

产品名称与仓库名称统一为 **PowerfulTab**。内部 `cosmotab.*` 存储键保留，避免丢失已有设置与搜索历史。

## 支持的能力

| 能力 | 当前行为 |
| --- | --- |
| 🚀 一键整理 | 只执行分组及设置要求的组内排列，不去重、不关闭标签、不跨窗口合并 |
| 🧹 独立去重 | 完整 URL 字符串完全一致才关闭重复标签，保留最近访问者 |
| 整理方式 | 按完整 hostname，或按 hostname + 一级 Path 分组 |
| Path 白名单 | 指定域名不拆 Path，按域名分组 |
| 最少标签数 | 默认 5；不足的预分组合并到 `other` |
| 最多分组数 | 默认 20，始终生效，包含 `other` |
| 组内标签排序 | 创建时间升序，或访问时间降序（默认） |
| 🔎 标签检索 | URL、标签名称不区分大小写的包含匹配，输入实时筛选 |
| 🕘 搜索记忆 | 默认保留 1 条，可设置 n 条或 0；点击输入框显示历史下拉列表 |
| 标签操作 | 激活、复制、关闭标签和关闭整组 |
| 🎨 多窗口配色 | 每个标签行显示窗口色竖线，各窗口活动标签使用同色背景高亮 |
| ⌨️ 快捷键 | `Ctrl+Shift+Z` / macOS `⌘⇧Z` 切换侧边栏，打开时聚焦搜索框 |
| ⚙️ 设置弹窗 | 齿轮按钮打开；保存才写入，取消、Esc 或点击弹窗外丢弃未保存修改 |
| 🌗 主题 | 浅色、深色，可通过工具栏或设置切换 |

## 整理与去重

### 一键整理

一键整理不包含任何去重步骤。处理流程如下：

1. 读取标签与设置，排除固定标签及 URL 保护白名单。
2. 按窗口分别生成预分组；采用域名或 Path 规则。
3. 应用最少标签数规则，不足的预分组进入 `other`。
4. 合格预分组按标签数量降序排列，同数量保持原预分组顺序。
5. 应用最多分组数规则；超限时保留前 `n-1` 个大组，尾部组和小组统一进入 `other`。没有剩余标签时不创建空 `other`。
6. 按选定的组内排序排列成员，先解除参与标签的旧分组，再创建 Chrome 原生组。
7. 原生组按大组优先排列，`other` 位于最后、使用灰色。即使 `other` 只有一个标签也会建组。

最多分组数为 1 时，只要需要合并，全部参与标签进入 `other`。

### 分组键与名称

| 情况 | 分组键 | 显示名称示例 |
| --- | --- | --- |
| 按域名 | 完整 hostname | `data.bytedance.net` → `data` |
| 按一级 Path | 完整 hostname + 首个非空路径段 | `data.bytedance.net/dorado/instance` → `data.dorado` |
| Path 白名单域名 | 完整 hostname | `cloud.bytedance.net` → `cloud` |
| 无一级 Path | 根路径的独立分组键 | 使用原域名简称 |
| 小组 / 超限组 | 特殊键 `__other__` | `other` |

Path 名称使用 **hostname 最左段 + `.` + 一级 Path**，不使用 query 或 hash。路径段会尝试 URL 解码；不同 hostname 即使显示简称相同，也不会合为同一个预分组。

仅域名的简称规则保留旧行为：取最左段，连字符业务名前缀可截短；`www`、`bytedance` 等占位前缀回退到根域，`larkoffice` 使用 `lark` 别名。

Path 白名单支持 hostname 或 URL 输入，以及逗号、空格、换行分隔；保存时提取 hostname、去重并规范化。按精确 hostname 匹配，不自动包含子域名。它与“完全跳过整理 / 去重”的 URL 保护白名单是两套规则。

### 去重按钮

工具栏的重叠页面图标表示去重。只有 **完整 URL 字符串完全一致** 才视为重复，包括：

- hostname、Path、尾部斜杠；
- 所有参数、参数值及参数顺序；
- hash。

不会去除追踪参数、忽略 hash，也不会按域名或一级 Path 关闭不同页面。重复组中保留访问时间最大者，固定标签及 URL 保护白名单不参与。

访问时间记录于激活、新建以及 URL 变化事件；它是最近访问 / 导航时间，不是阅读时长。已有标签的缺失记录优先使用 Chrome 的 `lastAccessed`，否则使用兜底值。时间相同则保留输入顺序靠前者。

## 设置

点击工具栏的齿轮图标打开设置弹窗。设置项名称加粗，输入内容和说明文字保持普通字重；主界面不外露这些配置。

| 设置项 | 默认值 | 规则 |
| --- | --- | --- |
| 整理方式 | 按域名分组 | 域名 / 一级 Path |
| Path 白名单 | 空 | 白名单域名仅按域名分组 |
| 最少标签数 | 5 | 正整数，达到此数量才独立成组 |
| 最多分组数 | 20 | 正整数，始终生效，包含 `other`，没有启用勾选框 |
| 组内标签排序 | 访问时间 | 创建时间：升序；访问时间：降序 |
| 搜索框保留数 | 1 | 非负整数；0 不保留搜索历史 |
| 主题 | 明亮 | 浅色 / 深色 |

只有点击“保存”才写入设置。取消、Esc、点击弹窗外部关闭时不保存草稿；保存进行中不响应外部点击取消。

Chrome 不提供旧标签的真实创建时间。插件记录新标签创建时刻；安装前已有标签使用首次记录顺序兜底。此排序不能恢复历史创建时间。

## 搜索与焦点

主界面只保留搜索输入框，不显示搜索按钮。输入实时匹配 URL 或标题，不区分大小写，首尾空白被忽略。

- 停止输入约 500ms、失焦或按 Enter 后自动记录关键词。
- 最近记录在前；重复关键词不区分大小写，移到最近位置。
- 保留条数由“搜索框保留数”控制，0 时不展示历史。
- 点击 / 聚焦输入框显示历史下拉列表，可鼠标选择，或用方向键、Enter 选择；Esc 关闭下拉列表。
- 删除输入内容恢复完整列表。搜索不改变原生标签或分组。
- 初次打开界面、图标打开或快捷键打开时尝试聚焦，等待侧边栏挂载后短暂重试；不会在每次标签操作后抢焦点。

快捷键在 `chrome://extensions/shortcuts` 中配置，默认 `Ctrl+Shift+Z`，macOS 为 `⌘⇧Z`。默认组合可能被浏览器、其他扩展或系统占用，也可能保留用户之前的绑定，需要手动确认。

侧边栏通过连接上报可见状态；快捷键打开时直接调用 `sidePanel.open()`，避免先执行异步查询丢失用户手势。支持 `sidePanel.close()` 的 Chrome 直接关闭；旧版本使用禁用 / 恢复面板的兼容方式，实际效果需在对应 Chrome 版本验证。

## 标签行与窗口配色

- 点击标签行激活原标签，并切换到所属窗口；列表更新时保持当前滚动位置，不主动滚到顶部 Recent。
- 右侧的浏览时间、复制、删除共享同一空间：正常显示时间，悬停或键盘聚焦显示两个按钮。
- 复制使用 `chrome.tabs.duplicate()`，复制的是标签页，不是复制 URL 到剪贴板。
- 复制与删除点击区域独立，间距 6px；复制悬停用紫色，删除用红色。
- 聚焦标签行时可用 Enter 激活，Backspace / Delete 关闭；内部操作按钮的键盘事件不触发行级动作。
- 列表隐藏滚动条，但滚轮、触控板和正常滚动仍可用。

所有窗口的标签都有左侧 **5px 彩色竖线**，竖线铺满标签行高度，与活动标签高亮贴合；行上下各留 1px 外部间距。

窗口颜色由窗口 ID 固定映射到 10 色循环，依次使用蓝、橙、绿、紫、粉、青、黄、黄绿、靛、红（具体索引取 `windowId % 10`）。切换窗口、搜索或关闭其他窗口不会改变已有窗口的颜色；超过 10 个窗口或 ID 同余时会复用颜色。

各窗口当前活动标签均使用所属窗口的同色浅背景高亮，并显示窗口编号。当前聚焦窗口的活动标签额外描边。深色主题使用低饱和度深背景。

新标签优先继承 `openerTabId` 来源页的原生组；没有明确来源时使用同窗口最近激活的页面。支持继承 `other`，不跨窗口入组，不改变已入组或固定的新标签。创建时不会按 URL 重新分类；再次整理才应用分组规则。

## 主界面渲染逻辑

主界面 / 侧边栏使用同一个 Dashboard 和 CardGrid：

1. Dashboard 读取所有窗口标签、设置、创建时间、访问时间及当前聚焦窗口。
2. CardGrid 使用完整标签集合计算预分组，应用最少标签数和最多分组数。
3. 按标签数量计算目标组序，但保留上一次显示顺序；分组键或数量停止变化 **30 秒** 后更新顺序。连续变化重新计时，访问时间更新和搜索不重置计时。
4. 新组暂时追加到已有组之后，消失的组不显示，`other` 始终在最后。延迟只影响组序，不冻结成员、数量、阈值归类或组内排序。
5. 在完整分组之后筛选搜索结果，因此搜索不会让原组因命中数量少于 5 而进入 `other`。
6. 组内按创建时间或访问时间排序，显示匹配数量、组内最新访问时间、相对时间和行操作。
7. Recent 独立展示最近访问的最多 8 个匹配标签，始终按访问时间倒序，与组内排序设置无关。它是同一标签的快捷视图，不计入分组汇总数量。
8. 搜索时临时展开匹配组；清空后恢复原折叠状态。无匹配时展示空结果提示。

标签新建、移除、更新、移动、激活、窗口焦点变化以及有关存储变化触发刷新，另有 30 秒定时刷新相对时间。30 秒排序防抖不会自动执行原生一键整理。

### 已知边界 / 待改进

- **插件展示与原生组不一定一致**：Dashboard 对所有窗口汇总计算阈值，原生整理按窗口独立计算。例如两个窗口各 3 个同类标签，插件可能显示 6 个独立组，但每个原生窗口仍应进入 `other`。
- CardGrid 展示的是规则计算结果，**不是 Chrome 原生 groupId 的直接映射**。新标签继承原组后，界面可能已按 URL 显示另一预分组。
- 原生解除分组、建组或移动失败目前只记录后台日志；汇总中的参与数量并不代表所有入组调用成功。出现“界面新分组、原生仍在 other”需检查窗口计数与扩展 service worker 日志。
- 创建时间、访问时间是浏览器 / 插件事件记录，不表示真实阅读时长；部分操作边界依赖 Chrome API 版本。
- 普通手动关闭及关闭整组可通过界面的 5 秒 Undo 尝试恢复最近关闭会话；独立去重按钮不生成该 Undo 提示，可尝试浏览器恢复关闭标签快捷键。恢复依赖 `chrome.sessions`。

## 安装与更新

### 🛍️ 方式 1：Chrome Web Store

上架后可通过 Chrome Web Store 安装。原 README 提到商店审核，但目前仓库没有可核验的商店安装链接，暂不承诺上线时间；现阶段可使用下面的源码或 ZIP 安装方式。

### 🧑‍💻 方式 2：从源码加载（开发者）

```bash
git clone https://github.com/Peeeng/PowerfulTab.git
cd PowerfulTab
npm install
npm run build
```

然后：

1. 打开 `chrome://extensions/`。
2. 右上角开启 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，选择本仓库 **`dist/`** 目录。
4. 点击工具栏 PowerfulTab 图标，打开侧边栏使用。

### 📦 方式 3：从 ZIP 加载

下载或获取发布的扩展 ZIP，先解压到固定目录，再在 `chrome://extensions/` 中启用开发者模式，选择“加载已解压的扩展程序”，加载解压后含 `manifest.json` 的目录。

仓库保留的 [v0.1.1 历史 ZIP](release/cosmotab-v0.1.1.zip) 是旧版本，**不包含全部本次改动**。最新源码打包请执行 `npm run release`，产物为 `release/dist.zip`。

### 🔄 更新与重新加载

源码修改后需重新 `npm run build`，在扩展页点击重新加载，并关闭后重新打开已有侧边栏 / 标签管理页面。重新加载旧 ZIP 的解压目录不会自动获取仓库 `dist/` 的新代码。

`release/dist.zip` 由 `npm run release` 生成，普通 build 不更新 ZIP。现有 `release/screenshots/` 为历史界面截图，可能仍含 CosmoTab、旧去重模式和旧操作布局，不能作为当前能力依据。

## 开发与代码入口

```bash
npm run dev      # 监听构建
npm run build    # TypeScript 检查 + Vite 生产构建
npm run release  # 构建并打包 release/dist.zip
```

```text
src/
├── background/
│   ├── index.ts                 # 时间记录、快捷键、侧边栏状态、消息桥
│   └── inherit-group.ts         # 新标签继承来源页分组
├── core/
│   ├── grouping.ts              # 分组键、命名、阈值、原生入组
│   ├── tabs.ts                  # 整理、独立去重、标签查询
│   ├── dedupe.ts                # 完整 URL 精确去重
│   ├── search.ts                # URL / 标题匹配、历史去重
│   ├── storage.ts               # 设置、时间、搜索历史存储
│   ├── sort.ts                  # 旧独立排序入口，主界面整理不调用
│   └── types.ts                 # 设置与消息类型
├── components/                 # 共享设置弹窗、操作 SVG 图标
├── dashboard/
│   ├── Dashboard.tsx            # 状态刷新、操作、滚动保持
│   ├── components/CardGrid.tsx  # 列表渲染、延迟组序、配色、行操作
│   └── components/TabSearch.tsx # 搜索、历史下拉、焦点处理
├── popup/                      # 备用 Popup 入口
└── assets/icons/
```

点击扩展图标实际打开侧边栏；Popup 页面保留为备用入口。Manifest 见 `manifest.config.ts`，Vite 多页面入口为 `index.html`、`sidepanel.html`、`popup.html`。

## 本地数据与权限

没有新增远端数据服务，偏好、URL 保护白名单、搜索历史及时间记录保存在 `chrome.storage.local`；来源页激活历史保存在 `chrome.storage.session`。产品更名不更换存储键。

| 权限 | 用途 |
| --- | --- |
| `tabs` | 查询、激活、复制、关闭及排列标签 |
| `tabGroups` | 创建原生组、修改标题 / 颜色、移动组 |
| `sessions` | 查询和恢复最近关闭会话 |
| `storage` | 保存设置、历史、时间和会话状态 |
| `sidePanel` | 打开 / 关闭侧边栏 |
| `favicon` | 显示站点图标 |

快捷键通过 Manifest `commands` 配置，不是额外权限。

[隐私政策](https://peeeng.github.io/PowerfulTab/privacy) · [反馈 Issue](https://github.com/Peeeng/PowerfulTab/issues) · [MIT License](LICENSE)

## 🐱 设计

- 手绘猫咪与品牌图标，保留原有轻松的视觉风格。
- 辉光“一键整理”按钮，GSAP 3D 视差与悬停交互。
- 浅色 / 深色主题、窗口彩色竖线与活动标签高亮。
- 相对时间 `刚刚 / 5m / 2h / 3d`，中文界面与紧凑列表。

## 🙏 贡献与反馈

欢迎通过 [Issue](https://github.com/Peeeng/PowerfulTab/issues) 反馈问题或提交 PR。开发前请核对本文的现有能力和已知边界，并运行 `npm run build` 验证改动。

邮箱：Peeeng520@gmail.com。

## 📄 许可

MIT License。维护者：[Peeeng](https://github.com/Peeeng)；原版权声明见 [LICENSE](LICENSE)。
