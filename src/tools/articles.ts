import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TtrssClient } from "../ttrss-client.js";

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function fail(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true as const };
}

export function registerArticleTools(server: McpServer, client: TtrssClient) {
  server.tool(
    "get_headlines",
    "获取文章标题列表。特殊 feed_id: -4=全部, -3=最新, -2=已发布, -1=星标, 0=已归档。可按 view_mode 过滤未读/星标等。",
    {
      feed_id: z
        .number()
        .default(-4)
        .describe("源 ID。-4=全部, -3=最新, -2=已发布, -1=星标, 0=已归档, 正数=具体源"),
      limit: z.number().default(20).describe("返回数量限制 (最大 200)"),
      skip: z.number().default(0).describe("跳过前 N 篇"),
      view_mode: z
        .enum(["all_articles", "unread", "adaptive", "marked", "updated"])
        .default("unread")
        .describe("过滤模式"),
      is_cat: z.boolean().default(false).describe("feed_id 是否为分类 ID"),
      show_excerpt: z.boolean().default(true).describe("返回文章摘要"),
      show_content: z.boolean().default(false).describe("返回文章全文 (较大)"),
      include_attachments: z.boolean().default(false).describe("包含附件信息"),
      order_by: z
        .enum(["", "feed_dates", "date_reverse"])
        .default("")
        .describe("排序方式: 空=默认, feed_dates=最新优先, date_reverse=最旧优先"),
      since_id: z.number().optional().describe("只返回 ID 大于此值的文章"),
    },
    async (params) => {
      try {
        const headlines = await client.getHeadlines(params);
        const simplified = headlines.map((h) => ({
          id: h.id,
          title: h.title,
          feed_title: h.feed_title,
          link: h.link,
          unread: h.unread,
          marked: h.marked,
          updated: new Date(h.updated * 1000).toISOString(),
          author: h.author,
          excerpt: h.excerpt,
          ...(params.show_content ? { content: h.content } : {}),
          labels: h.labels,
          note: h.note,
        }));
        return ok(JSON.stringify(simplified, null, 2));
      } catch (e: unknown) {
        return fail(`获取文章列表失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "get_article",
    "获取一篇或多篇文章的完整内容 (含正文)。支持逗号分隔的多个 ID。",
    {
      article_id: z.string().describe("文章 ID，支持逗号分隔的多个 ID (如 '123,456')"),
    },
    async ({ article_id }) => {
      try {
        const articles = await client.getArticle(article_id);
        const simplified = articles.map((a) => ({
          id: a.id,
          title: a.title,
          link: a.link,
          author: a.author,
          updated: new Date(a.updated * 1000).toISOString(),
          content: a.content,
          feed_title: a.feed_title,
          feed_id: a.feed_id,
          unread: a.unread,
          marked: a.marked,
          published: a.published,
          labels: a.labels,
          note: a.note,
          attachments: a.attachments,
        }));
        return ok(JSON.stringify(simplified, null, 2));
      } catch (e: unknown) {
        return fail(`获取文章内容失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "get_unread_count",
    "获取当前未读文章总数",
    {},
    async () => {
      try {
        const count = await client.getUnread();
        return ok(`未读文章数: ${count}`);
      } catch (e: unknown) {
        return fail(`获取未读数失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "update_article",
    "更新文章状态。field: 0=星标, 1=已发布, 2=未读, 3=笔记。mode: 0=取消, 1=设置, 2=切换。",
    {
      article_ids: z.string().describe("文章 ID 列表，逗号分隔 (如 '123,456')"),
      field: z.number().min(0).max(3).describe("操作字段: 0=星标, 1=已发布, 2=未读, 3=笔记"),
      mode: z.number().min(0).max(2).describe("操作模式: 0=取消, 1=设置, 2=切换"),
      data: z.string().optional().describe("当 field=3 (笔记) 时，笔记内容"),
    },
    async (params) => {
      try {
        const result = await client.updateArticle(params);
        return ok(`操作成功，更新了 ${result.updated} 篇文章`);
      } catch (e: unknown) {
        return fail(`更新文章失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "catchup_feed",
    "将订阅源或分类中的所有文章标记为已读。mode 可选: all (全部), 1day, 1week, 2week",
    {
      feed_id: z.number().describe("源或分类 ID"),
      is_cat: z.boolean().default(false).describe("feed_id 是否为分类 ID"),
      mode: z.enum(["all", "1day", "1week", "2week"]).default("all").describe("标记范围"),
    },
    async (params) => {
      try {
        await client.catchupFeed(params);
        return ok("标记已读成功");
      } catch (e: unknown) {
        return fail(`标记已读失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "share_to_published",
    "创建一篇文章到已发布 (Published) 源中",
    {
      title: z.string().describe("文章标题"),
      url: z.string().url().describe("文章 URL"),
      content: z.string().describe("文章内容"),
    },
    async (params) => {
      try {
        await client.shareToPublished(params);
        return ok("分享到已发布成功");
      } catch (e: unknown) {
        return fail(`分享失败: ${(e as Error).message}`);
      }
    },
  );

  server.tool(
    "search_articles",
    "在文章中搜索关键词。search_mode: all_feeds=全部源, this_feed=当前源, this_cat=当前分类",
    {
      search: z.string().describe("搜索关键词"),
      feed_id: z.number().default(-4).describe("在哪个源中搜索，-4=全部"),
      search_mode: z
        .enum(["all_feeds", "this_feed", "this_cat"])
        .default("all_feeds")
        .describe("搜索范围"),
      limit: z.number().default(20).describe("返回数量限制"),
      view_mode: z
        .enum(["all_articles", "unread", "adaptive", "marked", "updated"])
        .default("all_articles")
        .describe("过滤模式"),
    },
    async (params) => {
      try {
        const headlines = await client.getHeadlines({
          feed_id: params.feed_id,
          search: params.search,
          search_mode: params.search_mode,
          limit: params.limit,
          view_mode: params.view_mode,
          show_excerpt: true,
        });
        const simplified = headlines.map((h) => ({
          id: h.id,
          title: h.title,
          feed_title: h.feed_title,
          link: h.link,
          updated: new Date(h.updated * 1000).toISOString(),
          excerpt: h.excerpt,
          author: h.author,
        }));
        return ok(JSON.stringify(simplified, null, 2));
      } catch (e: unknown) {
        return fail(`搜索失败: ${(e as Error).message}`);
      }
    },
  );
}
