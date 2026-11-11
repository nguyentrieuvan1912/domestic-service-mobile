import { API_BASE_URL } from './catalog';
import { readJsonResponse } from '@/utils/http-json';

export const blogCategories = {
  CLEANING_TIPS: 'Mẹo dọn dẹp',
  FAMILY_KNOWLEDGE: 'Kiến thức gia đình',
};

export interface BlogSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: keyof typeof blogCategories;
  coverUrl: string;
  authorName: string;
  publishedAt: string | null;
}

export interface BlogNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: BlogNode[];
}

export interface BlogArticle extends BlogSummary {
  document: BlogNode;
}

async function publicBlog<T>(path: string, signal: AbortSignal): Promise<T> {
  if (!API_BASE_URL) throw new Error('Chưa cấu hình kết nối blog.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/identity/blog${path}`, {
      signal: controller.signal,
    });
    if (response.status === 404) throw new Error('Bài viết không còn được xuất bản.');
    if (!response.ok) throw new Error('Chưa tải được bài viết.');
    return await readJsonResponse<T>(response);
  } catch (cause) {
    if (signal.aborted) throw cause;
    if (controller.signal.aborted) throw new Error('Tải bài viết quá lâu. Vui lòng thử lại.');
    if (cause instanceof TypeError) throw new Error('Chưa kết nối được hệ thống blog.');
    throw cause;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export const listPublishedBlog = (signal: AbortSignal) => publicBlog<BlogSummary[]>('', signal);
export const getPublishedArticle = (slug: string, signal: AbortSignal) =>
  publicBlog<BlogArticle>(`/${encodeURIComponent(slug)}`, signal);
