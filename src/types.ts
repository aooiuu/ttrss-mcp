export interface TtrssApiResponse<T = unknown> {
  seq: number;
  status: number;
  content: T;
}

export interface TtrssError {
  error: string;
}

export interface TtrssCategory {
  id: number;
  title: string;
  unread: number;
  order_id: number;
}

export interface TtrssFeed {
  id: number;
  title: string;
  unread: number;
  cat_id: number;
  feed_url: string;
  has_icon: boolean;
  last_updated: number;
  order_id: number;
  is_cat?: boolean;
  include_in_digest?: boolean;
}

export interface TtrssHeadline {
  id: number;
  guid: string;
  unread: boolean;
  marked: boolean;
  published: boolean;
  updated: number;
  is_updated: boolean;
  title: string;
  link: string;
  feed_id: number;
  tags: string[];
  excerpt?: string;
  content?: string;
  labels: Array<[number, string, string, string]>;
  feed_title: string;
  comments_count: number;
  comments_link: string;
  always_display_attachments: boolean;
  author: string;
  score: number;
  note: string | null;
  lang: string;
}

export interface TtrssArticle {
  id: number;
  guid: string;
  title: string;
  link: string;
  labels: Array<[number, string, string, string]>;
  unread: boolean;
  marked: boolean;
  published: boolean;
  comments: string;
  author: string;
  updated: number;
  content: string;
  feed_id: number;
  attachments: TtrssAttachment[];
  score: number;
  feed_title: string;
  note: string | null;
  lang: string;
}

export interface TtrssAttachment {
  id: number;
  content_url: string;
  content_type: string;
  title: string;
  duration: string;
  width: number;
  height: number;
  post_id: number;
}

export interface TtrssLabel {
  id: number;
  caption: string;
  fg_color: string;
  bg_color: string;
  checked: boolean;
}

export interface TtrssCounter {
  id: number | string;
  counter: number;
  auxcounter?: number;
  kind?: string;
  error?: string;
  updated?: string;
  description?: string;
  has_img?: boolean;
}

export interface TtrssConfig {
  icons_dir: string;
  icons_url: string;
  daemon_is_running: boolean;
  num_feeds: number;
  custom_sort_types?: Record<string, string>;
}

export interface TtrssFeedTreeItem {
  name: string;
  id: string;
  bare_id: number;
  icon: string | false;
  unread: number;
  type: string;
  auxcounter: number;
  error: string;
  updated: string;
  items?: TtrssFeedTreeItem[];
  param?: string;
  checkbox?: boolean;
}

export interface TtrssFeedTree {
  categories: {
    identifier: string;
    label: string;
    items: TtrssFeedTreeItem[];
  };
}
