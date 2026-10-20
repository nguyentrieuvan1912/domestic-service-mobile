/** Only for preview/read calls. Never wrap booking creation or payment in an automatic retry. */
export async function retryBookingRead<T>(read: () => Promise<T>, signal: AbortSignal): Promise<T> {
  try { return await read(); }
  catch (error) {
    if (signal.aborted || !(error instanceof Error) || ('readRetried' in error && error.readRetried) || ![
      'Kết nối quá lâu. Vui lòng thử lại.',
      'Không kết nối được backend. Vui lòng thử lại.',
    ].includes(error.message)) throw error;
    await new Promise<void>((resolve, reject) => {
      const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(error); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 750);
      signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) cancel();
    });
    if (signal.aborted) throw error;
    return read();
  }
}
