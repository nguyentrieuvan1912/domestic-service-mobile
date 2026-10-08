import { Platform } from 'react-native';

// EXPO_PUBLIC_* values are public. Use the host LAN address on a real phone.
export const API_BASE_URL = ((Platform.OS === 'web' ? process.env.EXPO_PUBLIC_WEB_API_BASE_URL : '')
  || process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'web' ? 'http://localhost:8080' : '')).replace(/\/$/, '');
export const catalogMoney = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const catalogUnit = (unit: string) => ({ PACKAGE: 'gói', HOUR: 'giờ', SESSION: 'buổi', ITEM: 'đơn vị' }[unit] || unit);

export async function catalogGet<T>(path: string, signal: AbortSignal): Promise<T> {
  if (!API_BASE_URL) throw new Error('Kết nối dịch vụ chưa được thiết lập. Vui lòng liên hệ hỗ trợ.');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/catalog${path}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    // Native fetch can reject with Error (including a Java exception), not only TypeError.
    throw new Error('Chưa kết nối được hệ thống dịch vụ. Vui lòng thử lại sau.');
  }
  if (!response.ok) {
    if (response.status === 404) throw new Error('Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động.');
    if (response.status === 400) throw new Error('Thông tin tìm kiếm hoặc ID dịch vụ không hợp lệ.');
    throw new Error('Chưa tải được dịch vụ. Vui lòng thử lại sau.');
  }
  return response.json() as Promise<T>;
}
