import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { operationRequest } from './operations';
export type Reaction = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'SUPPORT';
export const REACTIONS: { id: Reaction; emoji: string; label: string }[] = [
  { id: 'LIKE', emoji: '👍', label: 'Thích' }, { id: 'LOVE', emoji: '❤️', label: 'Yêu thích' },
  { id: 'HAHA', emoji: '😆', label: 'Vui' }, { id: 'WOW', emoji: '😮', label: 'Ngạc nhiên' },
  { id: 'SAD', emoji: '😢', label: 'Buồn' }, { id: 'SUPPORT', emoji: '🤗', label: 'Ủng hộ' },
];
export type CommunityMedia = { id: number; uri: string; type: 'image' | 'video'; width?: number; height?: number };
export type CommunityPost = { id: number; author: string; avatar: string | null; content: string; status: string; createdAt: string; likes: number; myReaction: Reaction | null; reactions: Partial<Record<Reaction, number>>; commentCount: number; media: CommunityMedia[] };
export type CommunityComment = { id: number; author: string; userId: number; content: string; media: CommunityMedia[]; deleted: boolean; avatar: string | null; createdAt: string; parentId: number | null; parentAuthor: string | null; parentContent: string | null; myReaction: Reaction | null; reactions: Partial<Record<Reaction, number>> };
export type CommentPage = { items: CommunityComment[]; hasMore: boolean; nextBefore: number; deletedIds: number[] };
export const REPORT_REASONS = [{ id: 'SPAM', label: 'Spam / quảng cáo' }, { id: 'MISINFORMATION', label: 'Thông tin sai lệch' }, { id: 'ABUSE', label: 'Xúc phạm / nội dung không phù hợp' }, { id: 'OTHER', label: 'Lý do khác' }];
export function applyCommentDeletions(items: CommunityComment[], ids: number[] = []) {
  const removed = new Set(ids), text = 'Bình luận đã được quản trị viên xóa.';
  return items.map(item => ({ ...item, ...(removed.has(item.id) ? { deleted: true, content: text, media: [], reactions: {}, myReaction: null } : {}), ...(item.parentId && removed.has(item.parentId) ? { parentContent: text } : {}) }));
}
export type UploadTicket = { id: number; uploadUrl: string; apiKey: string; signature: string; params: Record<string, string> };
export const requestKey = () => 'community-' + Date.now() + '-' + Math.random().toString(36).slice(2);
export function validateAttachment(asset: ImagePickerAsset) {
  if (!['image', 'video'].includes(asset.type || '')) throw new Error('Chỉ hỗ trợ ảnh và video.');
  const max = asset.type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (asset.fileSize && asset.fileSize > max) throw new Error(asset.type === 'video' ? 'Video tối đa 50 MB.' : 'Ảnh tối đa 10 MB.');
  if (asset.type === 'video' && asset.duration && asset.duration > 120000) throw new Error('Video tối đa 2 phút.');
}
export async function uploadAttachment(asset: ImagePickerAsset, ticket: UploadTicket, progress: (value: number) => void, signal: AbortSignal): Promise<CommunityMedia> {
  validateAttachment(asset);
  const endpoint = new URL(ticket.uploadUrl);
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'api.cloudinary.com') throw new Error('Địa chỉ tải tệp không hợp lệ.');
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.params)) form.append(key, value);
  form.append('api_key', ticket.apiKey); form.append('signature', ticket.signature);
  if (Platform.OS === 'web' && asset.file) form.append('file', asset.file);
  else form.append('file', { uri: asset.uri, name: asset.fileName || (asset.type === 'video' ? 'video.mp4' : 'photo.jpg'), type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg') } as unknown as Blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      const clean = () => signal.removeEventListener('abort', abort);
      xhr.open('POST', ticket.uploadUrl); xhr.timeout = 120000;
      xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded * 100 / event.total)); };
      xhr.onload = () => { clean(); xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 403 ? 'Cloudinary từ chối tải tệp (403). Cần kiểm tra quyền Upload/Create của API Key.' : 'Cloudinary chưa nhận được tệp. Hãy thử lại.')); };
      xhr.onerror = xhr.ontimeout = () => { clean(); reject(new Error('Kết nối tải tệp bị gián đoạn. Giữ bản nháp và thử lại.')); };
      xhr.onabort = () => { clean(); reject(new Error('Đã dừng tải tệp.')); };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { clean(); reject(new Error('Đã dừng tải tệp.')); return; }
      xhr.send(form);
    });
  } catch (error) {
    if (signal.aborted) throw error;
    // Upload may have succeeded even if its response was lost. Only backend verification can accept it.
    try { return await operationRequest<CommunityMedia>('identity', '/community/media/' + ticket.id + '/complete', 'POST', undefined, signal); }
    catch { throw error; }
  }
  return operationRequest<CommunityMedia>('identity', '/community/media/' + ticket.id + '/complete', 'POST', undefined, signal);
}
export function mergeComments(current: CommunityComment[], incoming: CommunityComment[]) {
  const items = new Map(current.map(item => [item.id, item])); incoming.forEach(item => items.set(item.id, item));
  return [...items.values()].sort((a, b) => a.id - b.id);
}
