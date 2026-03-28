# ttrss-mcp

tt-rss MCP (Model Context Protocol)，允许通过 AI 助手读写 Tiny Tiny RSS 订阅源。

官方接口文档：https://github.com/tt-rss/tt-rss/wiki/Api-Reference


## 使用方法

本服务通过 **stdio** 传输协议运行，AI 客户端直接启动进程通信。

```json
{
  "mcpServers": {
    "tt-rss": {
      "command": "npx",
      "args": ["ttrss-mcp"],
      "env": {
        "TT_RSS_URL": "https://rss.example.com/tt-rss",
        "TT_RSS_SID": "your-session-id"
      }
    }
  }
}
```

## MCP 工具列表

### 订阅源管理

| 工具 | 说明 |
|------|------|
| `get_categories` | 获取分类列表 |
| `get_feeds` | 获取订阅源列表 |
| `subscribe_feed` | 订阅新 RSS 源 |
| `unsubscribe_feed` | 取消订阅 |

### 文章管理

| 工具 | 说明 |
|------|------|
| `get_headlines` | 获取文章标题列表 (支持过滤/分页) |
| `get_article` | 获取文章全文 |
| `get_unread_count` | 获取未读数量 |
| `update_article` | 更新文章状态 (星标/已读/发布/笔记) |
| `catchup_feed` | 标记源为已读 |
| `share_to_published` | 分享到已发布 |
| `search_articles` | 搜索文章 |

### 标签管理

| 工具 | 说明 |
|------|------|
| `get_labels` | 获取标签列表 |
| `set_article_label` | 设置/移除文章标签 |

### 系统与日报

| 工具 | 说明 |
|------|------|
| `get_config` | 获取服务器配置 |
| `generate_daily_report` | 生成日报 (按源分组的文章汇总) |

## 项目结构

```
ttrss-mcp/
├── src/
│   ├── index.ts            # MCP Server 入口 (stdio)
│   ├── ttrss-client.ts     # tt-rss API 客户端封装
│   ├── types.ts            # TypeScript 类型定义
│   └── tools/
│       ├── feeds.ts        # 订阅源管理工具
│       ├── articles.ts     # 文章读写工具
│       ├── labels.ts       # 标签管理工具
│       └── report.ts       # 日报生成工具
├── .env.example
├── package.json
└── tsconfig.json
```

## License

MIT
