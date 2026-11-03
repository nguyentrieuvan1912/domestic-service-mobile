/** Never turn an empty/truncated API response into a successful save. */
export class InvalidJsonResponseError extends Error {
  constructor() { super('Phản hồi từ máy chủ bị thiếu hoặc không hợp lệ. Vui lòng thử lại.'); this.name = 'InvalidJsonResponseError'; }
}
export async function readJsonResponse<T>(response: Pick<Response, 'json'>): Promise<T> {
  try { return await response.json() as T; }
  catch (error) {
    if (error instanceof SyntaxError) throw new InvalidJsonResponseError();
    throw error;
  }
}
