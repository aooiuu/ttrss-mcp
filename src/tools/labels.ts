import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TtrssClient } from "../ttrss-client.js";

export function registerLabelTools(server: McpServer, client: TtrssClient) {
  server.tool(
    "get_labels",
    "【仅操作用户的 tt-rss RSS 订阅源】获取所有已配置的标签列表。当用户明确需要查看 tt-rss 文章标签时使用。可传入 article_id 查看该文章是否有某标签。",
    {
      article_id: z
        .number()
        .optional()
        .describe("指定文章 ID 时，返回结果中 checked 表示该文章是否有此标签"),
    },
    async ({ article_id }) => {
      try {
        const labels = await client.getLabels(article_id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(labels, null, 2) }],
        };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `获取标签失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "set_article_label",
    "【仅操作用户的 tt-rss RSS 订阅源】为文章设置或移除标签。当用户明确需要为 tt-rss 文章添加或移除标签时使用。",
    {
      article_ids: z.string().describe("文章 ID 列表，逗号分隔 (如 '123,456')"),
      label_id: z.number().describe("标签 ID (从 get_labels 获取)"),
      assign: z.boolean().describe("true=添加标签，false=移除标签"),
    },
    async (params) => {
      try {
        const result = await client.setArticleLabel(params);
        const action = params.assign ? "添加" : "移除";
        return {
          content: [{ type: "text" as const, text: `${action}标签成功，更新了 ${result.updated} 篇文章` }],
        };
      } catch (e: unknown) {
        return {
          content: [{ type: "text" as const, text: `设置标签失败：${(e as Error).message}` }],
          isError: true,
        };
      }
    },
  );
}
