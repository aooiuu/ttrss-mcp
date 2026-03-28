#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TtrssClient } from "./ttrss-client.js";
import { registerFeedTools } from "./tools/feeds.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerReportTools } from "./tools/report.js";

const TT_RSS_URL = process.env.TT_RSS_URL;
const TT_RSS_SID = process.env.TT_RSS_SID;

if (!TT_RSS_URL || !TT_RSS_SID) {
  console.error(
    "缺少必要的环境变量。请设置 TT_RSS_URL 和 TT_RSS_SID。\n" +
      "  TT_RSS_URL: tt-rss 实例地址 (如 https://rss.example.com/tt-rss)\n" +
      "  TT_RSS_SID: tt-rss 会话 ID",
  );
  process.exit(1);
}

const client = new TtrssClient(TT_RSS_URL, TT_RSS_SID);

const server = new McpServer({
  name: "ttrss-mcp",
  version: "1.0.0",
});

// -- System tool --
server.tool(
  "get_config",
  "【仅操作用户的 tt-rss RSS 订阅源】获取 tt-rss 服务器配置信息 (守护进程状态、订阅数等)。当用户需要查看 tt-rss 服务器状态时使用。",
  {},
  async () => {
    try {
      const config = await client.getConfig();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(config, null, 2) }],
      };
    } catch (e: unknown) {
      return {
        content: [{ type: "text" as const, text: `获取配置失败: ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
);

registerFeedTools(server, client);
registerArticleTools(server, client);
registerLabelTools(server, client);
registerReportTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
