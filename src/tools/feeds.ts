import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TtrssClient } from "../ttrss-client.js";

export function registerFeedTools(server: McpServer, client: TtrssClient) {
  server.tool(
    "get_categories",
    "【仅操作用户的 tt-rss RSS 订阅源】获取分类列表。当用户明确需要查看 RSS 订阅分类或检查未读文章分布时使用。",
    {
      unread_only: z
        .boolean()
        .default(false)
        .describe("仅返回有未读文章的分类"),
      enable_nested: z
        .boolean()
        .default(false)
        .describe("嵌套模式，只返回顶级分类"),
      include_empty: z
        .boolean()
        .default(true)
        .describe("包含空分类"),
    },
    async (params) => {
      try {
        const categories = await client.getCategories(params);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(categories, null, 2) }],
        };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `获取分类失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "get_feeds",
    "【仅操作用户的 tt-rss RSS 订阅源】获取订阅源列表。当用户明确需要查看 RSS 订阅源列表时使用。特殊分类 ID: -1=特殊，-2=标签，-3=所有 (不含虚拟), -4=所有 (含虚拟), 0=未分类",
    {
      cat_id: z
        .number()
        .optional()
        .describe("分类 ID，不传则返回全部"),
      unread_only: z
        .boolean()
        .default(false)
        .describe("仅返回有未读文章的源"),
      limit: z.number().optional().describe("返回数量限制"),
      offset: z.number().optional().describe("跳过前 N 条"),
      include_nested: z
        .boolean()
        .default(false)
        .describe("包含子分类中的源"),
    },
    async (params) => {
      try {
        const feeds = await client.getFeeds(params);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(feeds, null, 2) }],
        };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `获取订阅源失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "subscribe_feed",
    "【仅操作用户的 tt-rss RSS 订阅源】订阅新的 RSS 源。当用户明确想要添加新的 RSS 订阅时使用。",
    {
      feed_url: z.string().url().describe("RSS 源的 URL"),
      category_id: z
        .number()
        .default(0)
        .describe("放入的分类 ID，默认 0 (未分类)"),
      login: z.string().optional().describe("源需要认证时的用户名"),
      password: z.string().optional().describe("源需要认证时的密码"),
    },
    async (params) => {
      try {
        const result = await client.subscribeToFeed(params);
        const code = result.status.code;
        const messages: Record<number, string> = {
          0: "订阅成功",
          1: "已订阅该源",
          2: "无效的 URL",
          3: "URL 中未找到 RSS 源",
          4: "URL 中发现多个 RSS 源 (请指定具体的源地址)",
          5: "无法下载该 URL",
          6: "内容重复",
        };
        const msg = messages[code] ?? `未知状态码：${code}`;
        if (code !== 0 && code !== 1) {
          return {
            content: [{ type: "text" as const, text: msg }],
            isError: true,
          };
        }
        return { content: [{ type: "text" as const, text: msg }] };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `订阅失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "unsubscribe_feed",
    "【仅操作用户的 tt-rss RSS 订阅源】取消订阅指定的 RSS 源。当用户明确想要取消某个 RSS 订阅时使用。",
    {
      feed_id: z.number().describe("要取消订阅的源 ID"),
    },
    async ({ feed_id }) => {
      try {
        await client.unsubscribeFeed(feed_id);
        return { content: [{ type: "text" as const, text: "取消订阅成功" }] };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `取消订阅失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );
}
