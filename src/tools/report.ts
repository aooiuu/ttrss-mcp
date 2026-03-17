import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TtrssClient } from "../ttrss-client.js";
import type { TtrssHeadline } from "../types.js";

export function registerReportTools(server: McpServer, client: TtrssClient) {
  server.tool(
    "generate_daily_report",
    "生成日报：汇总近期文章，按分类和订阅源分组输出。默认获取未读文章，可指定时间范围。",
    {
      hours: z.number().default(24).describe("获取最近 N 小时内的文章，默认 24"),
      limit: z.number().default(200).describe("最多获取的文章数量"),
      view_mode: z
        .enum(["all_articles", "unread", "adaptive", "marked", "updated"])
        .default("all_articles")
        .describe("过滤模式"),
      include_content: z.boolean().default(false).describe("是否包含文章摘要"),
    },
    async (params) => {
      try {
        const cutoffTime = Math.floor(Date.now() / 1000) - params.hours * 3600;

        const headlines = await client.getHeadlines({
          feed_id: -4,
          limit: params.limit,
          view_mode: params.view_mode,
          show_excerpt: params.include_content,
          order_by: "feed_dates",
        });

        const filtered = headlines.filter((h) => h.updated >= cutoffTime);

        if (filtered.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: `过去 ${params.hours} 小时内没有${params.view_mode === "unread" ? "未读" : ""}文章。`,
            }],
          };
        }

        const grouped = groupByFeed(filtered);
        const report = formatReport(grouped, params.hours, params.include_content);
        return { content: [{ type: "text" as const, text: report }] };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `生成日报失败: ${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );
}

interface GroupedArticles {
  [feedTitle: string]: TtrssHeadline[];
}

function groupByFeed(headlines: TtrssHeadline[]): GroupedArticles {
  const groups: GroupedArticles = {};
  for (const h of headlines) {
    const key = h.feed_title || "未知来源";
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  }
  return groups;
}

function formatReport(
  grouped: GroupedArticles,
  hours: number,
  includeContent: boolean,
): string {
  const totalArticles = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const feedCount = Object.keys(grouped).length;

  const lines: string[] = [
    `# 日报 (过去 ${hours} 小时)`,
    "",
    `共 ${totalArticles} 篇文章，来自 ${feedCount} 个订阅源。`,
    "",
  ];

  const sortedFeeds = Object.entries(grouped).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  for (const [feedTitle, articles] of sortedFeeds) {
    lines.push(`## ${feedTitle} (${articles.length} 篇)`);
    lines.push("");

    const sorted = articles.sort((a, b) => b.updated - a.updated);

    for (const article of sorted) {
      const time = new Date(article.updated * 1000).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const flags = [
        article.unread ? "未读" : "",
        article.marked ? "⭐" : "",
      ]
        .filter(Boolean)
        .join(" ");

      lines.push(
        `- [${article.title}](${article.link}) | ${time}${flags ? " | " + flags : ""}`,
      );

      if (includeContent && article.excerpt) {
        lines.push(`  > ${article.excerpt.slice(0, 150).replace(/\n/g, " ")}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
