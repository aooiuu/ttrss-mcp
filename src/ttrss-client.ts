import type {
  TtrssApiResponse,
  TtrssCategory,
  TtrssConfig,
  TtrssFeed,
  TtrssHeadline,
  TtrssArticle,
  TtrssLabel,
  TtrssCounter,
} from "./types.js";

const API_STATUS_OK = 0;

export class TtrssClientError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "TtrssClientError";
  }
}

export class TtrssClient {
  private apiUrl: string;
  private sid: string;

  constructor(baseUrl: string, sid: string) {
    this.apiUrl = baseUrl.replace(/\/+$/, "") + "/api/";
    this.sid = sid;
  }

  async request<T = unknown>(
    op: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const body = JSON.stringify({ sid: this.sid, op, ...params });

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      throw new TtrssClientError(
        `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TtrssApiResponse<T>;

    if (data.status !== API_STATUS_OK) {
      const content = data.content as Record<string, string> | undefined;
      const errorCode = content?.error ?? "UNKNOWN_ERROR";
      throw new TtrssClientError(
        `tt-rss API error: ${errorCode}`,
        errorCode,
      );
    }

    return data.content;
  }

  async getCategories(params: {
    unread_only?: boolean;
    enable_nested?: boolean;
    include_empty?: boolean;
  } = {}): Promise<TtrssCategory[]> {
    return this.request<TtrssCategory[]>("getCategories", params);
  }

  async getFeeds(params: {
    cat_id?: number;
    unread_only?: boolean;
    limit?: number;
    offset?: number;
    include_nested?: boolean;
  } = {}): Promise<TtrssFeed[]> {
    return this.request<TtrssFeed[]>("getFeeds", params);
  }

  async getHeadlines(params: {
    feed_id?: number;
    limit?: number;
    skip?: number;
    show_content?: boolean;
    show_excerpt?: boolean;
    view_mode?: string;
    is_cat?: boolean;
    include_nested?: boolean;
    include_attachments?: boolean;
    order_by?: string;
    since_id?: number;
    search?: string;
    search_mode?: string;
    include_header?: boolean;
    sanitize?: boolean;
  } = {}): Promise<TtrssHeadline[]> {
    return this.request<TtrssHeadline[]>("getHeadlines", params);
  }

  async getArticle(articleId: number | string): Promise<TtrssArticle[]> {
    return this.request<TtrssArticle[]>("getArticle", {
      article_id: String(articleId),
    });
  }

  async getUnread(): Promise<number> {
    const result = await this.request<{ unread: string }>("getUnread");
    return parseInt(result.unread, 10);
  }

  async updateArticle(params: {
    article_ids: string;
    mode: number;
    field: number;
    data?: string;
  }): Promise<{ status: string; updated: number }> {
    return this.request("updateArticle", params);
  }

  async catchupFeed(params: {
    feed_id: number;
    is_cat?: boolean;
    mode?: string;
  }): Promise<{ status: string }> {
    return this.request("catchupFeed", params);
  }

  async shareToPublished(params: {
    title: string;
    url: string;
    content: string;
  }): Promise<{ status: string }> {
    return this.request("shareToPublished", params);
  }

  async subscribeToFeed(params: {
    feed_url: string;
    category_id?: number;
    login?: string;
    password?: string;
  }): Promise<{ status: { code: number } }> {
    return this.request("subscribeToFeed", params);
  }

  async unsubscribeFeed(feedId: number): Promise<{ status: string }> {
    return this.request("unsubscribeFeed", { feed_id: feedId });
  }

  async getLabels(articleId?: number): Promise<TtrssLabel[]> {
    const params: Record<string, unknown> = {};
    if (articleId !== undefined) params.article_id = articleId;
    return this.request<TtrssLabel[]>("getLabels", params);
  }

  async setArticleLabel(params: {
    article_ids: string;
    label_id: number;
    assign: boolean;
  }): Promise<{ status: string; updated: number }> {
    return this.request("setArticleLabel", params);
  }

  async getConfig(): Promise<TtrssConfig> {
    return this.request<TtrssConfig>("getConfig");
  }

  async getCounters(
    outputMode?: string,
  ): Promise<TtrssCounter[]> {
    const params: Record<string, unknown> = {};
    if (outputMode) params.output_mode = outputMode;
    return this.request<TtrssCounter[]>("getCounters", params);
  }

  async getApiLevel(): Promise<number> {
    const result = await this.request<{ level: number }>("getApiLevel");
    return result.level;
  }
}
